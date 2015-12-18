import os
from StringIO import StringIO
import requests
import csv
import calendar


def update_data():
    r = requests.get("http://www.uvm.edu/~empact/data/gendateplot.php3?table=SummitStation&title=Mount+Mansfield+Summit+Station&xskip=7&xparam=Date&yparam=Depth&year%5B%5D=1954&year%5B%5D=1955&year%5B%5D=1956&year%5B%5D=1957&year%5B%5D=1958&year%5B%5D=1959&year%5B%5D=1960&year%5B%5D=1961&year%5B%5D=1962&year%5B%5D=1963&year%5B%5D=1964&year%5B%5D=1965&year%5B%5D=1966&year%5B%5D=1967&year%5B%5D=1968&year%5B%5D=1969&year%5B%5D=1970&year%5B%5D=1971&year%5B%5D=1972&year%5B%5D=1973&year%5B%5D=1974&year%5B%5D=1975&year%5B%5D=1976&year%5B%5D=1977&year%5B%5D=1978&year%5B%5D=1979&year%5B%5D=1980&year%5B%5D=1981&year%5B%5D=1982&year%5B%5D=1983&year%5B%5D=1984&year%5B%5D=1985&year%5B%5D=1986&year%5B%5D=1987&year%5B%5D=1988&year%5B%5D=1989&year%5B%5D=1990&year%5B%5D=1991&year%5B%5D=1992&year%5B%5D=1993&year%5B%5D=1994&year%5B%5D=1995&year%5B%5D=1996&year%5B%5D=1997&year%5B%5D=1998&year%5B%5D=1999&year%5B%5D=2000&year%5B%5D=2001&year%5B%5D=2002&year%5B%5D=2003&year%5B%5D=2004&year%5B%5D=2005&year%5B%5D=2006&year%5B%5D=2007&year%5B%5D=2008&year%5B%5D=2009&year%5B%5D=2010&year%5B%5D=2011&year%5B%5D=2012&year%5B%5D=2013&year%5B%5D=2014&year%5B%5D=2015&width=800&height=600&smooth=0&csv=1&totals=0")

    data = csv.reader(StringIO(r.text), delimiter=',')
    snow_csv = [l for l in data]

    # create header row of all dates
    header_row = ['date']
    for month in [9, 10, 11, 12, 1, 2, 3, 4, 5, 6]:
        number_of_days = calendar.monthrange(2012, month)[1]
        for date in range(number_of_days):
            header_row.append("%d/%d" % (month, date + 1))

    # snowdepth table will populate our csv
    snowdepth_table = [header_row]
    season_list = []

    # parse CSV input
    for row in snow_csv[1:-1]:
        year, month, day = [int(i) for i in row[0].split('-')]
        date = "%d/%d" % (month, day)

        # Seasons will be defined by the year of the latter half of winter
        if month < 7:
            season = year
        else:
            season = year + 1

        # If season doesn't exist yet
        if not season_list or season not in season_list:
            season_list.append(season)

            # create array for current year
            season_data = [0] * len(header_row)

            # first entry in row is season label
            season_data[0] = season
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
        if not i:
            continue

        # each year begins with a depth of 0
        last_depth = 0

        for j, depth in enumerate(year):

            # Skip first iteration (since it's a label)
            if not j:
                continue

            month, day = [int(x) for x in snowdepth_table[0][j].split('/')]

            # null depth only happens at end of year, so if last depth is null
            # next depth will be as well
            if last_depth == 'null':
                snowdepth_table[i][j] = 'null'

            # the source data is ugly, sometimes large blocks of dates get
            # skipped, sometimes there are 0s where there should be no
            # measurement, sometimes there are impossible measurements
            # like a 5" reading between a 50" and 55" readings.
            # The below code tries to eliminate this bad data
            elif ((depth < 5 and last_depth > 10 or last_depth - depth > 20) and
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
                        depth = 'null'
                        snowdepth_table[i][j] = depth
                        break

                # take last depth and next good measurement and the number of
                # steps in between and assign current depth
                if depth != 'null':
                    delta = (depth - last_depth) / (steps + 1)
                    depth = last_depth + delta
                    snowdepth_table[i][j] = depth

            # In 1956 there's an extra zero (120 instead of 12) for depth
            elif depth - last_depth > 100:
                snowdepth_table[i][j] = last_depth

            # set last_depth for next loop
            last_depth = snowdepth_table[i][j]

    safe_path = os.path.join(os.path.dirname(__file__),
        'static/snowdepth.csv')
    with open(safe_path, 'wb') as f:
        write_csv = csv.writer(f)
        write_csv.writerows(zip(*snowdepth_table))

update_data()
