"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* global d3 */
const getCurrentSeason = () => {
  const date = new Date();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return month < 9 ? "".concat(year - 1, "-").concat(year) : "".concat(year, "-").concat(year + 1);
};

const transformRow = season => {
  const parseTime = date => {
    const year = date.split('/')[0] > 7 ? 1900 : 1901;
    return d3.timeParse('%0m/%0d/%Y')("".concat(date, "/").concat(year));
  };

  return {
    season: season.year,
    values: Object.keys(season).slice(1) // remove header label
    .filter(date => season[date]).map(date => ({
      date: parseTime(date),
      snowDepth: parseInt(season[date], 10)
    }))
  };
};

const setMouseOverOpacity = opacity => {
  d3.select('.mouse-line').style('opacity', opacity);
  d3.selectAll('.mouse-per-line circle').style('opacity', opacity);
  d3.selectAll('.mouse-per-line text').style('opacity', opacity);
};

document.addEventListener('DOMContentLoaded', () => {
  ///////////////////////////////////////////////////
  ///////// GLOBALS FOR USE BY CHARTS ///////////////
  ///////////////////////////////////////////////////
  const margin = {
    top: 10,
    right: 60,
    bottom: 30,
    left: 15
  };
  const largeWidthThreshold = 600;
  const width = document.getElementById('legend_container').clientWidth;
  const height = width > largeWidthThreshold ? 490 : width / 2;
  const fontSize = "".concat(width > largeWidthThreshold ? 14 : 10, "px"); ///////////////////////////////////////////////////
  //////////////// END GLOBALS //////////////////////
  ///////////////////////////////////////////////////

  const updateSnowDepthChart = (_ref) => {
    let {
      data,
      comparisonYear = 'Average Season',
      line,
      seasonContainer
    } = _ref;
    d3.select('.comparison-label').text(comparisonYear);
    const season = seasonContainer.selectAll('.season').data(data.filter(d => d.season !== comparisonYear), d => d.season);
    season.enter().append('g').merge(season).attr('class', d => "season x".concat(d.season)).select('path').attr('class', 'line').attr('d', d => line(d.values));
    const currentSeason = seasonContainer.select(".x".concat(getCurrentSeason())).attr('class', 'season current');
    const comparisonSeason = season.exit();
    comparisonSeason.attr('class', 'season comparison').raise(); // if we have data, update legend and last updated

    if (currentSeason.data().length > 0) {
      // update legend with current snow depth
      const currentSeasonData = currentSeason.data()[0].values;
      const latestData = currentSeasonData[currentSeasonData.length - 1];
      const latestDepth = latestData.snowDepth;
      d3.select('#currentDepth').text(latestDepth); // upate last updated

      const lastUpdated = new Date(latestData.date);
      lastUpdated.setYear(new Date().getFullYear());
      d3.select('#last_updated').text(lastUpdated.toLocaleDateString()); // update legend with comparison season

      const comparisonData = comparisonSeason.data()[0];
      const comparisonDay = comparisonData.values.find(d => d.date.getMonth() === lastUpdated.getMonth() && d.date.getDate() === lastUpdated.getDate()) || {
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

  const initSnowDepthChart = () => {
    /* SET UP SVG ELEMENT AND D3 SHARED OBJECTS */
    const seasonSelect = document.getElementById('select-season');
    const g = d3.select('#snow_depth_chart').attr('width', width).attr('height', height);
    const seasonContainer = g.append('g').attr('class', 'season-container');
    const x = d3.scaleTime().range([margin.left, width - margin.right - margin.left]);
    const y = d3.scaleLinear().range([height - margin.bottom, margin.top]); // hard coded values

    x.domain([new Date(2000, 8, 1), new Date(2001, 5, 30)]);
    y.domain([0, 150]);
    const line = d3.line().curve(d3.curveBasis).x(d => x(d.date)).y(d => y(d.snowDepth));
    const xAxis = g.append('g').attr('class', 'axis axis--x').attr('transform', "translate(0,".concat(height - margin.bottom, ")")).style('font-size', fontSize).call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b')));
    const yAxis = g.append('g').attr('class', 'axis axis--y').attr('transform', "translate(".concat(width - margin.right - margin.left, ", 0)")).style('font-size', fontSize).call(d3.axisRight(y)).append('text').attr('transform', 'rotate(-90)').attr('y', -20).attr('dy', '0.71em').attr('x', width > 400 ? -165 : -120).style('fill', '#000').style('font-size', width > 400 ? '14px' : '10px').text('Snow Depth, inches');
    /* REQUEST DATA, DRAW CHART AND AXIS */

    d3.csv('https://s3.amazonaws.com/matthewparrilla.com/snowDepth.csv', transformRow, csv => {
      const data = csv.filter(season => season.season !== ''); // update axes values with actual data

      x.domain([d3.min(data, season => d3.min(season.values, date => date.date)), d3.max(data, season => d3.max(season.values, date => date.date))]);
      y.domain([0, d3.max(data, season => d3.max(season.values, date => date.snowDepth))]);
      xAxis.call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b')));
      yAxis.call(d3.axisRight(y)); // create grid lines for y-axis

      seasonContainer.append('g').attr('class', 'grid-lines').selectAll('g.grid-line').data([20, 40, 60, 80, 100, 120, 140]).enter().append('line').attr('class', 'grid-line').attr('x1', 0).attr('x2', width).attr('y1', d => y(d)).attr('y2', d => y(d));
      seasonContainer.selectAll('.season').data(data, d => d.season).enter().append('g').attr('class', d => "season x".concat(d.season)).append('path').attr('class', 'line').attr('d', d => line(d.values));
      updateSnowDepthChart({
        data,
        line,
        seasonContainer
      }); // Add seasons to dropdown options

      data.map((_ref2) => {
        let {
          season
        } = _ref2;
        return season;
      }).filter(season => season && season !== getCurrentSeason()).sort((a, b) => a < b) // reverse order, so alphabet then reverse 9, 8 etc
      .map(season => ({
        value: season,
        label: season
      })).forEach(season => {
        const option = document.createElement('option');
        option.value = season.value;
        option.text = season.label;
        seasonSelect.add(option, null);
      }); // add event listener to select season

      seasonSelect.onchange = (_ref3) => {
        let {
          target: {
            value: comparisonYear
          }
        } = _ref3;
        updateSnowDepthChart({
          data,
          line,
          seasonContainer,
          comparisonYear
        });
      };
    });
  }; // TODO: make this more performant (maybe reverse and find, then slice)
  // or consider slicing in lambda (better)


  const filterToLast10 = data => {
    const today = new Date();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return data // filter to last 10 days with temperatures above -100 (bad temp values are -9999
    .filter((_ref4) => {
      let {
        timestamp,
        temperature
      } = _ref4;
      return Math.round((today - timestamp) / millisecondsPerDay) < 10 && temperature > -100;
    });
  }; // Line chart with hover based on:
  // https://bl.ocks.org/larsenmtl/e3b8b7c2ca4787f77d78f58d41c3da91
  // http://www.d3noob.org/2014/07/my-favourite-tooltip-method-for-line.html


  const initPrev10Charts = metrics => {
    const chartHeight = width > largeWidthThreshold ? 150 : (height - margin.top - margin.bottom) / 3;
    const containerHeight = chartHeight * metrics.length;
    const x = d3.scaleTime().range([0, width - margin.left - margin.right]);
    const y = d3.scaleLinear().range([chartHeight, 0]);
    const line = d3.line().x(d => x(d.timestamp)).curve(d3.curveBasis);
    const xAxis = d3.axisBottom().scale(x);
    const yAxis = d3.axisRight().ticks(5).scale(y);
    d3.select('#prev_10_charts').attr('width', width + margin.left + margin.right).attr('height', containerHeight + margin.top + margin.bottom);

    const transformDate = row => _objectSpread({}, row, {
      timestamp: new Date(row.timestamp),
      wind_direction: row.wind_direction >= 0 ? row.wind_direction : null
    });

    const metricLabel = {
      temperature: 'Temperature',
      wind_direction: 'Wind Direction',
      wind_speed: 'Wind Speed'
    };

    const addChart = (data, key, order) => {
      const g = d3.select('#prev_10_charts').select("#".concat(key)).attr('transform', "translate(".concat(margin.left, ",").concat(chartHeight * order + margin.top, ")"));
      const values = data.map(d => parseInt(d[key], 10));
      x.domain(d3.extent(data, d => d.timestamp));

      if (key === 'wind_direction') {
        y.domain([0, 380]);
      } else {
        y.domain([key === 'wind_speed' ? 0 : d3.min(values) - 2, d3.max(values) + 2]);
      }

      g.append('text').text(metricLabel[key]).attr('class', "mini_chart_label ".concat(key)).attr('y', chartHeight - 1.5 * margin.top).attr('dy', '0.71em').style('font-size', fontSize).attr('x', 0);
      line.y(d => y(d[key])).defined(d => d[key] !== null);

      if (key === 'temperature') {
        g.append('path').attr('class', 'line freezing').attr('d', line(data.map(d => _objectSpread({}, d, {
          temperature: 32
        })))).style('fill-opacity', 0).style('stroke-width', 1.5);
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


    d3.csv('https://s3.amazonaws.com/matthewparrilla.com/mansfield_observations.csv', transformDate, unfilteredData => {
      const data = filterToLast10(unfilteredData);
      metrics.forEach((metric, i) => addChart(data, metric, i)); ///////////////////////////////////////////////////
      //////////// BEGIN MOUSEOVER CODE /////////////////
      ///////////////////////////////////////////////////

      const mouseG = d3.select('#prev_10_charts').append('g').attr('class', 'mouse-over-effects').attr('transform', "translate(0,".concat(margin.top, ")"));
      mouseG.append('path') // this is the black vertical line to follow mouse
      .attr('class', 'mouse-line').style('stroke', 'black').style('stroke-width', '1px').style('opacity', '0');
      const mousePerLine = mouseG.selectAll('.mouse-per-line').data(metrics).enter().append('g').attr('class', 'mouse-per-line');
      mousePerLine.append('circle').attr('r', 7).style('stroke', 'black').style('fill', 'none').style('stroke-width', '1px').style('opacity', '0');
      mousePerLine.append('text').attr('class', 'shadow').attr('transform', 'translate(10,3)');
      mousePerLine.append('text').attr('class', 'fill').attr('transform', 'translate(10,3)'); // cache y(val) so we can calculate outside of addChart()

      const metricY = metrics.reduce((map, key) => {
        const fn = d3.scaleLinear().range([chartHeight, 0]);

        if (key === 'wind_direction') {
          fn.domain([0, 380]);
        } else {
          fn.domain([key === 'wind_speed' ? 0 : d3.min(data, v => parseInt(v[key], 10)) - 2, d3.max(data, v => parseInt(v[key], 10)) + 2]);
        }

        return _objectSpread({}, map, {
          [key]: fn
        });
      }, {});
      mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
      .attr('width', width) // can't catch mouse events on a g element
      .attr('height', containerHeight).attr('fill', 'none').attr('pointer-events', 'all').on('mouseout', () => setMouseOverOpacity(0)).on('mouseover', () => setMouseOverOpacity(1)).on('mousemove', function onMouseMove() {
        // this usage necessitates non arrow func
        // our rect includes margins, which we want for usability
        let [mouseX] = d3.mouse(this);

        if (mouseX < margin.left) {
          mouseX = margin.left;
        } else if (mouseX > width - margin.right) {
          mouseX = width - margin.right;
        } // vertical line that follows mouse


        d3.select('.mouse-line').attr('d', () => "M".concat(mouseX, ",").concat(containerHeight, " ").concat(mouseX, ",0")); // find intersection of x position and relevant line

        const xIntersect = x.invert(mouseX - margin.left); // our rect includes margins

        const bisect = d3.bisector((_ref5) => {
          let {
            timestamp
          } = _ref5;
          return timestamp;
        }).right;
        const index = bisect(data, xIntersect);
        const intersection = data[index] || data[index - 1]; // -1 for when at right edge
        // add circle and text label

        d3.selectAll('.mouse-per-line').attr('transform', (key, i) => "translate(".concat(margin.left + x(intersection.timestamp), ", ").concat(metricY[key](intersection[key]) + chartHeight * i, ")")).selectAll('text.shadow').text(key => intersection[key]);
        d3.selectAll('.mouse-per-line').attr('transform', (key, i) => "translate(".concat(margin.left + x(intersection.timestamp), ", ").concat(metricY[key](intersection[key]) + chartHeight * i, ")")).selectAll('text.fill').text(key => intersection[key]);
      }); ///////////////////////////////////////////////////
      ////////////// END MOUSEOVER CODE /////////////////
      ///////////////////////////////////////////////////
    });
  };

  initSnowDepthChart();
  initPrev10Charts(['temperature', 'wind_speed', 'wind_direction']);
});
