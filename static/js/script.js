/* global d3 */

var margin = {
    top: 20,
    right: 50,
    bottom: 30,
    left: 50
};
var width = 960 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;

var parseDate = d3.time.format('%m/%d').parse;

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .tickFormat(d3.time.format('%B'))
    .orient('bottom');

var yAxis = d3.svg.axis()
    .scale(y)
    .orient('left');

var line = d3.svg.line()
    .interpolate('basis')
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.depth); })
    // ignore values that aren't numbers
    .defined(function(d) { return !isNaN(d.depth); });

var svg = d3.select('#chart').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
  .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

d3.csv('static/snowdepth.csv', function(error, data) {
    var mostRecentData;

    var seasonList = d3.keys(data[0])
        .filter(function(key) {
            return key !== 'date';
        });

    var latestYear = seasonList[seasonList.length - 1];

    data.forEach(function(d) {
        d.date = parseDate(d.date);

        // to get each season on same line, set second half of year to 1901
        if (d.date.getMonth() < 7) {
            d.date.setFullYear(1901);
        }

        if (d[latestYear] !== 'null') {
            mostRecentData = d;
        }
    });

    // for each season, create values object of date and depth
    var seasons = seasonList.map(function(season) {
        return {
            season: season,
            values: data.map(function(d) {
                return {date: d.date, depth: +d[season]};
            })
        };
    });

    var currentDepth = parseInt(mostRecentData[latestYear], 10);
    var latestReading = mostRecentData.date;
    var latestReadingDay = d3.time.format('%e')(latestReading);
    var latestReadingMonth = d3.time.format('%B')(latestReading);

    var sumOfDepths = 0;
    var snowierWinters = [];
    var lessSnowyWinters = [];
    var equalSnowyWinters = [];
    seasonList.forEach(function(season) {
        var depth = mostRecentData[season] !== 'null' ? parseInt(mostRecentData[season], 10) : 0;
        sumOfDepths += depth;
        if (depth > currentDepth) {
            snowierWinters.push(season);
        } else if (depth < currentDepth) {
            lessSnowyWinters.push(season);
        } else {
            equalSnowyWinters.push(season);
        }
    });

    console.log('Snowier Winters (' + snowierWinters.length + '): ' + snowierWinters);
    console.log('\nWinters With Less Snow (' + lessSnowyWinters.length + '): ' + lessSnowyWinters);

    // equalSnowyWinters array includes current season
    if (equalSnowyWinters.length > 1) {
        console.log('\nEqually Snowy Winters (' + (equalSnowyWinters.length - 1) + '): ' + equalSnowyWinters.filter(function(item) {
            return item !== latestYear;
        }));
    }

    var averageDepth = Math.round(sumOfDepths / seasonList.length);
    x.domain(d3.extent(data, function(d) { return d.date; }));

    var maxDepths = [];
    var maxDepthSum = 0;

    // ** Get maximum depth of dataset and each season **
    y.domain([0, d3.max(seasons, function(s) {
        var seasonMax = d3.max(s.values, function(v) { return v.depth; });
        maxDepthSum += seasonMax;
        maxDepths.push({'season': s.season, 'depth': seasonMax});
        return seasonMax;
    })]);

    // var maxDepthAvg = Math.round(maxDepthSum / Object.keys(maxDepths).length);

    // ** Create axes **
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text('Depth (inches)');

    // ** Draw season lines **
    var season = svg.selectAll('.season')
        .data(seasons)
        .enter().append('g')
            .attr('class', 'season');

    season.append('path')
       .attr('class', 'line')
        .attr('d', function(d) {
            // passing the line function an array of {date, depth} objects
            // that make up the lines for each season
            return line(d.values);
        });

    var avgDepthX = x(mostRecentData.date);
    var avgDepthY = y(averageDepth);

    svg.append('line')
        .attr('class', 'avg-depth-on-date')
        .attr('x1', avgDepthX - 3)
        .attr('x2', avgDepthX + 3)
        .attr('y1', avgDepthY - 3)
        .attr('y2', avgDepthY - 3)
        .attr('stroke-width', 2)
        .attr('stroke', '#353331');

    svg.append('text')
        .attr('class', 'avg-depth-on-date-text')
        .attr('x', avgDepthY < 400 ? avgDepthX + 10 : avgDepthX - 150)
        .attr('y', avgDepthY)
        .style('font-weight', 'bold')
        .text('Average Depth On ' + [latestReadingMonth, latestReadingDay].join(' '));

    updateChart(latestYear);

    document.getElementById('latest-measurement').textContent = 'Latest measurement: ' + latestReadingMonth + ' ' + latestReadingDay;
});

var updateChart = function(year) {
    var highlightedLine;

    document.getElementById('year').textContent = (year - 1) + '-' + year.toString().slice(2, 4);

    svg.selectAll('path.line')
        .style('stroke', function(d) {
            if (d.season === year) {
                highlightedLine = this.parentNode;
                return '#353331';
            }
            return '#d3d3d3';
        })
        .style('stroke-opacity', function(d) {
            if (d.season === year) {
                return 1;
            }
            return 0.5;
        })
        .style('stroke-width', function(d) {
            if (d.season === year) {
                return 2;
            }
            return 1.5;
        });

    svg.selectAll('.max-ticks')
        .style('stroke', function (d) {
            if (d.season === year) {
                return '#353331';
            } else {
                return '#d3d3d3';
            }
        });

    highlightedLine.parentNode.appendChild(highlightedLine);
};

var slider = document.getElementById('season-range');
slider.oninput = function() { updateChart(slider.value); };
