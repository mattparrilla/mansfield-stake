import os
from StringIO import StringIO
import requests
import csv
import calendar
from datetime import datetime


def update_data():
    # build URL
    base_url = ["http://www.uvm.edu/~empact/data/gendateplot.php3?",
                "table=SummitStation&title=Mount+Mansfield+Summit+Station&",
                "xskip=7&xparam=Date&yparam=Depth&smooth=0&csv=1&totals=0"]
    current_year = datetime.now().year
    included_years = ["&year%5B%5D=" + str(year)
        for year in range(1954, current_year + 1)]
    data_url = "".join(base_url + included_years)

    r = requests.get(data_url)

    data = csv.reader(StringIO(r.text), delimiter=',')
    snow_csv = [l for l in data]

    # create header row of all dates
    header_row = ['year']
    for month in [9, 10, 11, 12, 1, 2, 3, 4, 5, 6]:
        number_of_days = calendar.monthrange(2012, month)[1]
        for date in range(number_of_days):
            header_row.append("%d/%d" % (month, date + 1))

    # snowdepth table will populate our csv
    snowdepth_table = [header_row]
    season_list = []
    last_reading = snow_csv[-2][0].split('-')
    last_reading_year, last_reading_month, last_reading_day = last_reading

    def is_later_in_calendar(month, day):
        return (
            # if day in current month > today
            (month == int(last_reading_month) and day > int(last_reading_day))
            # if first day of next month
            or month > int(last_reading_month)
        )

    # parse CSV input
    for row in snow_csv[1:-1]:
        year, month, day = [int(i) for i in row[0].split('-')]
        date = "%d/%d" % (month, day)

        # Seasons will be defined by the year of the latter half of winter
        # example 10/23/2016 is 2017
        if month < 10:
            season = year
        else:
            season = year + 1

        # If season doesn't exist yet
        if not season_list or season not in season_list:
            season_list.append(season)

            # create array for current year
            season_data = [0] * len(header_row)

            # first entry in row is season label (ex. 54-55)
            season_data[0] = "%s-%s" % (str(season - 1), str(season))
            snowdepth_table.append(season_data)

        if month > 8 or month < 7:
            year_idx = season_list.index(season) + 1
            date_idx = header_row.index(date)

        # row[1] is a depth measurement, sometimes it's an empty string or
        # a decimal point: "."
        if row[1]:
            try:
                snowdepth_table[year_idx][date_idx] = int(float(row[1]))
            # ignore non-numeric values
            except ValueError:
                continue

    # parse every date in every year, even if no measurement
    for i, year in enumerate(snowdepth_table):
        # Skip first row (headers)
        if i == 0:
            continue

        # each year begins with a depth of 0
        last_depth = 0

        for j, depth in enumerate(year):

            # Skip first iteration (since it's a label)
            if j == 0:
                continue

            month, day = [int(x) for x in snowdepth_table[0][j].split('/')]

            # if future date
            if ((i == len(snowdepth_table) - 1) and is_later_in_calendar(month, day)):
                snowdepth_table[i][j] = None

            # null depth only happens at end of year, so if last depth is null
            # next depth will be as well
            elif last_depth is None:
                snowdepth_table[i][j] = None

            # the source data is ugly, sometimes large blocks of dates get
            # skipped, sometimes there are 0s where there should be no
            # measurement, sometimes there are impossible measurements
            # like a 5" reading between a 50" and 55" readings.
            # The below code tries to eliminate this bad data
            elif (
                (depth < 5 and last_depth >= 10 or last_depth - depth > 20) and
                    (month > 9 or month < 6)):

                # setting depth = 0 allows us to throw away bad measurements
                depth = 0

                # if a bad measurment, find the next good measurement
                steps = 0
                while not depth:
                    steps += 1
                    try:
                        depth = snowdepth_table[i][j + steps]
                    # IndexError occurs when end of year
                    except IndexError:
                        depth = 0
                        snowdepth_table[i][j] = depth
                        break

                # take last depth and next good measurement and the number of
                # steps in between and assign current depth
                if depth is not None:
                    delta = (depth - last_depth) / (steps + 1)
                    depth = last_depth + delta
                    snowdepth_table[i][j] = depth

            # In 1956 there's an extra zero (120 instead of 12) for depth
            elif depth - last_depth > 100:
                snowdepth_table[i][j] = last_depth

            # Make all future dates null
            elif ((i == len(snowdepth_table) - 1)     # if last row in table
                    and snowdepth_table[i][j] == 0):  # and no snow

                # if current month and greater than day or greater than month
                if is_later_in_calendar(month, day):
                    snowdepth_table[i][j] = None
                else:
                    print '%s/%s (%s season) Not accounted for!' % (month, day, year[0])

            # else:
            #     print '- - - - \n'
            #     print month, day, snowdepth_table[i][j]
            #     print i, len(snowdepth_table) - 1
            #     print i == len(snowdepth_table) - 1
            #     print month, last_reading_month
            #     print month >= int(last_reading_month)
            #     print day, last_reading_day
            #     print day >= int(last_reading_day)
            #     print year[0]
            #     print last_reading
            #     print snowdepth_table[i][j]

            # set last_depth for next loop
            last_depth = snowdepth_table[i][j]

    safe_path = os.path.join(os.path.dirname(__file__),
        'app/public/snowdepth.csv')
    with open(safe_path, 'w') as f:
        write_csv = csv.writer(f)
        write_csv.writerows(snowdepth_table)

update_data()
