"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* global d3 */
var getCurrentSeason = function getCurrentSeason() {
  var date = new Date();
  var month = date.getMonth() + 1;
  var year = date.getFullYear();
  return month < 9 ? "".concat(year - 1, "-").concat(year) : "".concat(year, "-").concat(year + 1);
};

var transformRow = function transformRow(season) {
  var parseTime = function parseTime(date) {
    var year = date.split('/')[0] > 7 ? 1900 : 1901;
    return d3.timeParse('%0m/%0d/%Y')("".concat(date, "/").concat(year));
  };

  return {
    season: season.year,
    values: Object.keys(season).slice(1) // remove header label
    .filter(function (date) {
      return season[date];
    }).map(function (date) {
      return {
        date: parseTime(date),
        snowDepth: parseInt(season[date], 10)
      };
    })
  };
};

var setMouseOverOpacity = function setMouseOverOpacity(opacity) {
  d3.select('.mouse-line').style('opacity', opacity);
  d3.selectAll('.mouse-per-line circle').style('opacity', opacity);
  d3.selectAll('.mouse-per-line text').style('opacity', opacity);
};

document.addEventListener('DOMContentLoaded', function () {
  ///////////////////////////////////////////////////
  ///////// GLOBALS FOR USE BY CHARTS ///////////////
  ///////////////////////////////////////////////////
  var margin = {
    top: 10,
    right: 60,
    bottom: 30,
    left: 15
  };
  var largeWidthThreshold = 600;
  var width = document.getElementById('legend_container').clientWidth;
  var height = width > largeWidthThreshold ? 490 : width / 2;
  var fontSize = "".concat(width > largeWidthThreshold ? 14 : 10, "px"); ///////////////////////////////////////////////////
  //////////////// END GLOBALS //////////////////////
  ///////////////////////////////////////////////////

  var updateSnowDepthChart = function updateSnowDepthChart(_ref) {
    var data = _ref.data,
        _ref$comparisonYear = _ref.comparisonYear,
        comparisonYear = _ref$comparisonYear === void 0 ? 'Average Season' : _ref$comparisonYear,
        line = _ref.line,
        seasonContainer = _ref.seasonContainer;
    d3.select('.comparison-label').text(comparisonYear);
    var season = seasonContainer.selectAll('.season').data(data.filter(function (d) {
      return d.season !== comparisonYear;
    }), function (d) {
      return d.season;
    });
    season.enter().append('g').merge(season).attr('class', function (d) {
      return "season x".concat(d.season);
    }).select('path').attr('class', 'line').attr('d', function (d) {
      return line(d.values);
    });
    var currentSeason = seasonContainer.select(".x".concat(getCurrentSeason())).attr('class', 'season current');
    var comparisonSeason = season.exit();
    comparisonSeason.attr('class', 'season comparison').raise(); // if we have data, update legend and last updated

    if (currentSeason.data().length > 0) {
      // update legend with current snow depth
      var currentSeasonData = currentSeason.data()[0].values;
      var latestData = currentSeasonData[currentSeasonData.length - 1];
      var latestDepth = latestData.snowDepth;
      d3.select('#currentDepth').text(latestDepth); // upate last updated

      var lastUpdated = new Date(latestData.date);
      lastUpdated.setYear(new Date().getFullYear());
      d3.select('#last_updated').text(lastUpdated.toLocaleDateString()); // update legend with comparison season

      var comparisonData = comparisonSeason.data()[0];
      var comparisonDay = comparisonData.values.find(function (d) {
        return d.date.getMonth() === lastUpdated.getMonth() && d.date.getDate() === lastUpdated.getDate();
      }) || {
        snowDepth: 0
      };
      d3.select('#comparisonDepth').text(comparisonDay.snowDepth);
      d3.select('#comparisonLabel').text("This date in ".concat(comparisonData.season)); // need to call raise after raising comparison season

      currentSeason.raise();
    } else {
      d3.select('#currentDepth').text(0);
      d3.select('#last_updated').text('No data yet for season!');
    }
  };

  var initSnowDepthChart = function initSnowDepthChart() {
    /* SET UP SVG ELEMENT AND D3 SHARED OBJECTS */
    var seasonSelect = document.getElementById('select-season');
    var g = d3.select('#snow_depth_chart').attr('width', width).attr('height', height);
    var seasonContainer = g.append('g').attr('class', 'season-container');
    var x = d3.scaleTime().range([margin.left, width - margin.right - margin.left]);
    var y = d3.scaleLinear().range([height - margin.bottom, margin.top]); // hard coded values

    x.domain([new Date(2000, 8, 1), new Date(2001, 5, 30)]);
    y.domain([0, 150]);
    var line = d3.line().curve(d3.curveBasis).x(function (d) {
      return x(d.date);
    }).y(function (d) {
      return y(d.snowDepth);
    });
    var xAxis = g.append('g').attr('class', 'axis axis--x').attr('transform', "translate(0,".concat(height - margin.bottom, ")")).style('font-size', fontSize).call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b')));
    var yAxis = g.append('g').attr('class', 'axis axis--y').attr('transform', "translate(".concat(width - margin.right - margin.left, ", 0)")).style('font-size', fontSize).call(d3.axisRight(y)).append('text').attr('transform', 'rotate(-90)').attr('y', -20).attr('dy', '0.71em').attr('x', width > 400 ? -165 : -120).style('fill', '#000').style('font-size', width > 400 ? '14px' : '10px').text('Snow Depth, inches');
    /* REQUEST DATA, DRAW CHART AND AXIS */

    d3.csv('https://s3.amazonaws.com/matthewparrilla.com/snowDepth.csv', transformRow, function (csv) {
      var data = csv.filter(function (season) {
        return season.season !== '';
      }); // update axes values with actual data

      x.domain([d3.min(data, function (season) {
        return d3.min(season.values, function (date) {
          return date.date;
        });
      }), d3.max(data, function (season) {
        return d3.max(season.values, function (date) {
          return date.date;
        });
      })]);
      y.domain([0, d3.max(data, function (season) {
        return d3.max(season.values, function (date) {
          return date.snowDepth;
        });
      })]);
      xAxis.call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b')));
      yAxis.call(d3.axisRight(y)); // create grid lines for y-axis

      seasonContainer.append('g').attr('class', 'grid-lines').selectAll('g.grid-line').data([20, 40, 60, 80, 100, 120, 140]).enter().append('line').attr('class', 'grid-line').attr('x1', 0).attr('x2', width).attr('y1', function (d) {
        return y(d);
      }).attr('y2', function (d) {
        return y(d);
      });
      seasonContainer.selectAll('.season').data(data, function (d) {
        return d.season;
      }).enter().append('g').attr('class', function (d) {
        return "season x".concat(d.season);
      }).append('path').attr('class', 'line').attr('d', function (d) {
        return line(d.values);
      });
      updateSnowDepthChart({
        data: data,
        line: line,
        seasonContainer: seasonContainer
      }); // Add seasons to dropdown options

      data.map(function (_ref2) {
        var season = _ref2.season;
        return season;
      }).filter(function (season) {
        return season && season !== getCurrentSeason();
      }).sort(function (a, b) {
        return a < b;
      }) // reverse order, so alphabet then reverse 9, 8 etc
      .map(function (season) {
        return {
          value: season,
          label: season
        };
      }).forEach(function (season) {
        var option = document.createElement('option');
        option.value = season.value;
        option.text = season.label;
        seasonSelect.add(option, null);
      }); // add event listener to select season

      seasonSelect.onchange = function (_ref3) {
        var comparisonYear = _ref3.target.value;
        updateSnowDepthChart({
          data: data,
          line: line,
          seasonContainer: seasonContainer,
          comparisonYear: comparisonYear
        });
      };
    });
  }; // TODO: make this more performant (maybe reverse and find, then slice)
  // or consider slicing in lambda (better)


  var filterToLast10 = function filterToLast10(data) {
    var today = new Date();
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    return data // filter to last 10 days with temperatures above -100 (bad temp values are -9999
    .filter(function (_ref4) {
      var timestamp = _ref4.timestamp,
          temperature = _ref4.temperature;
      return Math.round((today - timestamp) / millisecondsPerDay) < 10 && temperature > -100;
    }).map(function (entry) {
      return _objectSpread({}, entry, {
        // bad values are -9999, but lets always throw out < 0
        wind_speed: entry.wind_direction < 0 ? null : entry.wind_speed,
        wind_gust: entry.wind_direction < 0 ? null : entry.wind_gust
      });
    });
  }; // Line chart with hover based on:
  // https://bl.ocks.org/larsenmtl/e3b8b7c2ca4787f77d78f58d41c3da91
  // http://www.d3noob.org/2014/07/my-favourite-tooltip-method-for-line.html


  var initPrev10Charts = function initPrev10Charts(metrics) {
    var chartHeight = width > largeWidthThreshold ? 150 : (height - margin.top - margin.bottom) / metrics.length;
    var containerHeight = chartHeight * metrics.length;
    var x = d3.scaleTime().range([0, width - margin.left - margin.right]);
    var y = d3.scaleLinear().range([chartHeight, 0]);
    var line = d3.line().x(function (d) {
      return x(d.timestamp);
    }).curve(d3.curveBasis);
    var xAxis = d3.axisBottom().scale(x);
    var yAxis = d3.axisRight().ticks(5).scale(y);
    d3.select('#prev_10_charts').attr('width', width + margin.left + margin.right).attr('height', containerHeight + margin.top + margin.bottom);

    var transformDate = function transformDate(row) {
      return _objectSpread({}, row, {
        timestamp: new Date(row.timestamp),
        // "no data" for wind is identified by wind direction -9999
        wind_direction: row.wind_direction < 0 ? null : row.wind_direction,
        wind_speed: row.wind_direction < 0 ? null : row.wind_speed,
        wind_gust: row.wind_direction < 0 ? null : row.wind_gust
      });
    };

    var metricLabel = {
      temperature: 'Temperature',
      wind_direction: 'Wind Direction',
      wind_speed: 'Wind Speed',
      wind_gust: 'Wind Gust'
    };

    var addChart = function addChart(data, key, order) {
      var g = d3.select('#prev_10_charts').select("#".concat(key)).attr('transform', "translate(".concat(margin.left, ",").concat(chartHeight * order + margin.top, ")"));
      var values = data.map(function (d) {
        return parseInt(d[key], 10);
      });
      x.domain(d3.extent(data, function (d) {
        return d.timestamp;
      }));

      if (key === 'wind_direction') {
        y.domain([0, 380]);
      } else {
        y.domain([key === 'wind_speed' || key === 'wind_gust' ? 0 : d3.min(values) - 2, d3.max(values) + 2]);
      }

      g.append('text').text(metricLabel[key]).attr('class', "mini_chart_label ".concat(key)).attr('y', chartHeight - 1.5 * margin.top).attr('dy', '0.71em').style('font-size', fontSize).attr('x', 0);
      line.y(function (d) {
        return y(d[key]);
      }).defined(function (d) {
        return d[key] !== null;
      });

      if (key === 'temperature') {
        g.append('path').attr('class', 'line freezing').attr('d', line(data.map(function (d) {
          return _objectSpread({}, d, {
            temperature: 32
          });
        }))).style('fill-opacity', 0).style('stroke-width', 1.5);
      }

      g.append('g').attr('class', 'y axis').style('font-size', fontSize).attr('transform', "translate(".concat(width - margin.left - margin.right, ", 0)")).call(yAxis);
      g.append('path').attr('class', "line prev_10_line ".concat(key)).attr('d', line(data)).style('fill-opacity', 0).style('stroke-width', 1.5); // Only show tick labels on last row

      if (order === metrics.length - 1) {
        xAxis.tickFormat(d3.timeFormat(width > 400 ? '%b %d' : '%m/%d'));
      } else {
        xAxis.tickFormat('');
      }

      g.append('g').attr('class', 'x axis').attr('transform', "translate(0,".concat(chartHeight, ")")).style('font-size', fontSize).call(xAxis);
    }; // Download data, filter it, and render chart


    d3.csv('https://s3.amazonaws.com/matthewparrilla.com/mansfield_observations.csv', transformDate, function (unfilteredData) {
      var data = filterToLast10(unfilteredData);
      metrics.forEach(function (metric, i) {
        return addChart(data, metric, i);
      }); // TODO: add wind gust to wind_speed
      ///////////////////////////////////////////////////
      //////////// BEGIN MOUSEOVER CODE /////////////////
      ///////////////////////////////////////////////////

      var mouseG = d3.select('#prev_10_charts').append('g').attr('class', 'mouse-over-effects').attr('transform', "translate(0,".concat(margin.top, ")"));
      mouseG.append('path') // this is the black vertical line to follow mouse
      .attr('class', 'mouse-line').style('stroke', 'black').style('stroke-width', '1px').style('opacity', '0');
      var mousePerLine = mouseG.selectAll('.mouse-per-line').data(metrics).enter().append('g').attr('class', 'mouse-per-line');
      mousePerLine.append('circle').attr('r', 7).style('stroke', 'black').style('fill', 'none').style('stroke-width', '1px').style('opacity', '0');
      mousePerLine.append('text').attr('class', 'shadow').attr('transform', 'translate(10,3)');
      mousePerLine.append('text').attr('class', 'fill').attr('transform', 'translate(10,3)'); // cache y(val) so we can calculate outside of addChart()

      var metricY = metrics.reduce(function (map, key) {
        var fn = d3.scaleLinear().range([chartHeight, 0]);

        if (key === 'wind_direction') {
          fn.domain([0, 380]);
        } else {
          fn.domain([key === 'wind_speed' || key === 'wind_gust' ? 0 : d3.min(data, function (v) {
            return parseInt(v[key], 10);
          }) - 2, d3.max(data, function (v) {
            return parseInt(v[key], 10);
          }) + 2]);
        }

        return _objectSpread({}, map, _defineProperty({}, key, fn));
      }, {});
      mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
      .attr('width', width) // can't catch mouse events on a g element
      .attr('height', containerHeight).attr('fill', 'none').attr('pointer-events', 'all').on('mouseout', function () {
        return setMouseOverOpacity(0);
      }).on('mouseover', function () {
        return setMouseOverOpacity(1);
      }).on('mousemove', function onMouseMove() {
        // this usage necessitates non arrow func
        // our rect includes margins, which we want for usability
        var _d3$mouse = d3.mouse(this),
            _d3$mouse2 = _slicedToArray(_d3$mouse, 1),
            mouseX = _d3$mouse2[0];

        if (mouseX < margin.left) {
          mouseX = margin.left;
        } else if (mouseX > width - margin.right) {
          mouseX = width - margin.right;
        } // vertical line that follows mouse


        d3.select('.mouse-line').attr('d', function () {
          return "M".concat(mouseX, ",").concat(containerHeight, " ").concat(mouseX, ",0");
        }); // find intersection of x position and relevant line

        var xIntersect = x.invert(mouseX - margin.left); // our rect includes margins

        var bisect = d3.bisector(function (_ref5) {
          var timestamp = _ref5.timestamp;
          return timestamp;
        }).right;
        var index = bisect(data, xIntersect);
        var intersection = data[index] || data[index - 1]; // -1 for when at right edge
        // add circle and text label

        d3.selectAll('.mouse-per-line').attr('transform', function (key, i) {
          return "translate(".concat(margin.left + x(intersection.timestamp), ", ").concat(metricY[key](intersection[key]) + chartHeight * i, ")");
        }).selectAll('text.shadow').text(function (key) {
          return intersection[key];
        });
        d3.selectAll('.mouse-per-line').attr('transform', function (key, i) {
          return "translate(".concat(margin.left + x(intersection.timestamp), ", ").concat(metricY[key](intersection[key]) + chartHeight * i, ")");
        }).selectAll('text.fill').text(function (key) {
          return intersection[key];
        });
      }); ///////////////////////////////////////////////////
      ////////////// END MOUSEOVER CODE /////////////////
      ///////////////////////////////////////////////////
    });
  };

  initSnowDepthChart();
  initPrev10Charts(['temperature', 'wind_gust', 'wind_direction']);
});
