from flask import render_template
from main import app

import requests
import csv
import json
from StringIO import StringIO


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/data')
def data():
    r = requests.get("http://www.uvm.edu/~empact/data/gendateplot.php3?table=SummitStation&title=Mount+Mansfield+Summit+Station&xskip=7&xparam=Date&yparam=Depth&year%5B%5D=1954&year%5B%5D=1955&year%5B%5D=1956&year%5B%5D=1957&year%5B%5D=1958&year%5B%5D=1959&year%5B%5D=1960&year%5B%5D=1961&year%5B%5D=1962&year%5B%5D=1963&year%5B%5D=1964&year%5B%5D=1965&year%5B%5D=1966&year%5B%5D=1967&year%5B%5D=1968&year%5B%5D=1969&year%5B%5D=1970&year%5B%5D=1971&year%5B%5D=1972&year%5B%5D=1973&year%5B%5D=1974&year%5B%5D=1975&year%5B%5D=1976&year%5B%5D=1977&year%5B%5D=1978&year%5B%5D=1979&year%5B%5D=1980&year%5B%5D=1981&year%5B%5D=1982&year%5B%5D=1983&year%5B%5D=1984&year%5B%5D=1985&year%5B%5D=1986&year%5B%5D=1987&year%5B%5D=1988&year%5B%5D=1989&year%5B%5D=1990&year%5B%5D=1991&year%5B%5D=1992&year%5B%5D=1993&year%5B%5D=1994&year%5B%5D=1995&year%5B%5D=1996&year%5B%5D=1997&year%5B%5D=1998&year%5B%5D=1999&year%5B%5D=2000&year%5B%5D=2001&year%5B%5D=2002&year%5B%5D=2003&year%5B%5D=2004&year%5B%5D=2005&year%5B%5D=2006&year%5B%5D=2007&year%5B%5D=2008&year%5B%5D=2009&year%5B%5D=2010&year%5B%5D=2011&year%5B%5D=2012&year%5B%5D=2013&year%5B%5D=2014&year%5B%5D=2015&width=800&height=600&smooth=0&csv=1&totals=0")

    data = csv.reader(StringIO(r.text), delimiter=',')
    snow_csv = [l for l in data]

    snow_dict = {}
    last_depth = 0.0
    for row in snow_csv[1:-1]:
        year, month, day = row[0].split('-')
        depth = row[1]

        if not depth:
            depth = last_depth

        last_depth = depth

        date = "%s-%s" % (month, day)
        if date not in snow_dict:
            snow_dict[date] = [{year: depth}]
        else:
            snow_dict[date].append({year: depth})

    snow_json = json.dumps(snow_dict)

    return snow_json
