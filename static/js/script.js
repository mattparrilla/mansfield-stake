var margin = {top: 20, right: 50, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var parseDate = d3.time.format("%m/%d").parse;

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .tickFormat(d3.time.format("%B"))
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var line = d3.svg.line()
    .interpolate("basis")
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.depth); })
    // ignore values that aren't numbers
    .defined(function(d) { return !isNaN(d.depth); });

var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("static/snowdepth.csv", function(error, data) {
    var mostRecentData;

    var seasonList = d3.keys(data[0])
		.filter(function(key) {
			return key !== "date";
		});

    var latestYear = seasonList[seasonList.length - 1];

    data.forEach(function(d,i) {
        d.date = parseDate(d.date);

        // to get each season on same line, set second half of year to 1901
        if (d.date.getMonth() < 7) {
            d.date.setFullYear(1901)
        }

        if (d[latestYear] !== 'null') {
            mostRecentData = d;
        }
    });

    // for each season, create values object of date and depth
    var seasons = seasonList.map(function(season) {
        return {
            season: season,
            values : data.map(function(d) {
                return {date: d.date, depth: +d[season]};
            })
        };
    });

    var currentDepth = parseInt(mostRecentData[latestYear]),
        latestReading = mostRecentData.date,
        latestReadingDay = d3.time.format("%e")(latestReading),
        latestReadingMonth = d3.time.format("%B")(latestReading),
        sumOfDepths = 0;

    var snowierWinters = seasonList.filter(function(season) {
        var seasonDepth = mostRecentData[season] != 'null' ? parseInt(mostRecentData[season]): 0;
        sumOfDepths += seasonDepth;

        return seasonDepth > currentDepth;
    });

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
        })
    ]);

    var maxDepthAvg = Math.round(maxDepthSum / Object.keys(maxDepths).length);

    // ** Create axes **
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Depth (inches)");

    // ** Draw season lines **
    var season = svg.selectAll(".season")
        .data(seasons)
        .enter().append("g")
            .attr("class", "season");

    season.append("path")
        .attr("class", "line")
        .attr("d", function(d, i) {
            // passing the line function an array of {date, depth} objects
            // that make up the lines for each season
			return line(d.values);
		});

    /*
    // ** Tick marks for max depth **
    var maxTicks = svg.selectAll('.max-ticks')
        .data(maxDepths)
        .enter().append('line')
            .attr('class', 'max-ticks')
            .attr('x1', 0)
            .attr('x2', 15)
            .attr('y1', function (d) {
                return y(d.depth);
            })
            .attr('y2', function(d) {
                return y(d.depth);
            })
            .attr('stroke-width', 1)
            .attr('stroke', '#d3d3d3')
            .on('mouseover', function(d) {
                updateChart(d.season);
            });

    var maxTickLabels = svg.select('text.label')
        .append('text')
        .attr('class', 'label')
        .attr('x', width - 10)
        .attr('y', 100)
        .text('maximum depth by year');
    */

    updateChart(latestYear);

    // ** Write text **
    document.getElementById('current-depth').textContent = currentDepth;
    document.getElementById('avg-depth').textContent = averageDepth;
    document.getElementById('avg-depth-date').textContent = latestReadingMonth + " " + latestReadingDay;
    document.getElementById('latest-measurement').textContent = latestReadingMonth + " " + latestReadingDay;
})

var updateChart = function(year) {
    var highlightedLine;

    document.getElementById('year').textContent = year;

    svg.selectAll('path.line')
        .style("stroke", function(d) {
            if (d.season === year) {
                highlightedLine = this.parentNode;
                return "#353331";
            } else {
                return "#d3d3d3";
            }
        })
        .style("stroke-opacity", function(d) {
            if (d.season === year) {
                return 1;
            } else {
                return 0.5;
            }
        })
        .style("stroke-width", function(d) {
            if (d.season === year) {
                return 2;
            } else {
                return 1.5;
            }
        });

    /*
    svg.selectAll('.max-ticks')
        .style('stroke', function (d) {
            if (d.season === year) {
                return "#353331";
            } else {
                return "#d3d3d3";
            }
        });
        */

    highlightedLine.parentNode.appendChild(highlightedLine);
};

var slider = document.getElementById('season-range');
slider.oninput = function() { updateChart(slider.value) };