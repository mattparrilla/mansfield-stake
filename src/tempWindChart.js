/* global d3 */

const setMouseOverOpacity = opacity => {
  d3.select('.mouse-line').style('opacity', opacity);
  d3.selectAll('.mouse-per-line circle').style('opacity', opacity);
  d3.selectAll('.mouse-per-line text').style('opacity', opacity);
};

// TODO: make this more performant (maybe reverse and find, then slice)
// or consider slicing in lambda (better)
const filterToLast10 = data => {
  const today = new Date();
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return data
    // filter to last 10 days with temperatures above -100 (bad temp values are -9999
    .filter(({ timestamp, temperature }) => (
      (Math.round((today - timestamp) / millisecondsPerDay) < 10)
      && temperature > -100));
};

// Line chart with hover based on:
// https://bl.ocks.org/larsenmtl/e3b8b7c2ca4787f77d78f58d41c3da91
// http://www.d3noob.org/2014/07/my-favourite-tooltip-method-for-line.html
const initPrev10Charts = ({
  metrics, width, largeWidthThreshold, height, margin, fontSize
  }) => {
  const chartHeight = width > largeWidthThreshold
    ? 150
    : (height - margin.top - margin.bottom) / 3;
  const containerHeight = (chartHeight) * metrics.length;

  const x = d3.scaleTime()
    .range([0, width - margin.left - margin.right]);

  const y = d3.scaleLinear()
    .range([chartHeight, 0]);

  const line = d3.line()
    .x((d) => x(d.timestamp))
    .curve(d3.curveBasis);

  const xAxis = d3.axisBottom()
    .scale(x);

  const yAxis = d3.axisRight()
    .ticks(5)
    .scale(y);

  d3.select('#prev_10_charts')
    .attr('width', width + margin.left + margin.right)
    .attr('height', containerHeight + margin.top + margin.bottom);

  const transformDate = row => ({
    ...row,
    timestamp: new Date(row.timestamp),
    wind_direction: row.wind_direction >= 0 ? row.wind_direction : null,
  });

  const metricLabel = {
    temperature: 'Temperature',
    wind_direction: 'Wind Direction',
    wind_speed: 'Wind Speed',
  };

  const addChart = (data, key, order) => {
    const g = d3.select('#prev_10_charts')
      .select(`#${key}`)
        .attr('transform', `translate(${margin.left},${(chartHeight) * order + margin.top})`);

    const values = data.map(d => parseInt(d[key], 10));

    x.domain(d3.extent(data, (d) => d.timestamp));
    if (key === 'wind_direction') {
      y.domain([0, 380]);
    } else {
      y.domain([
        key === 'wind_speed' ? 0 : d3.min(values) - 2,
        d3.max(values) + 2,
      ]);
    }

    g.append('text')
      .text(metricLabel[key])
      .attr('class', `mini_chart_label ${key}`)
      .attr('y', chartHeight - (1.5 * margin.top))
      .attr('dy', '0.71em')
      .style('font-size', fontSize)
      .attr('x', 0);

    line
      .y((d) => y(d[key]))
      .defined(d => d[key] !== null);

    if (key === 'temperature') {
      g.append('path')
          .attr('class', 'line freezing')
          .attr('d', line(data.map(d => ({
            ...d,
            temperature: 32
          }))))
          .style('fill-opacity', 0)
          .style('stroke-width', 1.5);
    }

    g.append('g')
      .attr('class', 'y axis')
      .style('font-size', fontSize)
      .attr('transform', `translate(${width - margin.left - margin.right}, 0)`)
      .call(yAxis);

    g.append('path')
        .attr('class', `line prev_10_line ${key}`)
        .attr('d', line(data))
        .style('fill-opacity', 0)
        .style('stroke-width', 1.5);

    // Only show tick labels on last row
    if (order === metrics.length - 1) {
      xAxis.tickFormat(d3.timeFormat(width > 400 ? '%b %d' : '%m/%d'));
    } else {
      xAxis.tickFormat('');
    }
    g.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0,${chartHeight})`)
      .style('font-size', fontSize)
      .call(xAxis);
  };

  // Download data, filter it, and render chart
  d3.csv(
    'https://s3.amazonaws.com/matthewparrilla.com/mansfield_observations.csv',
    transformDate,
    unfilteredData => {
      const data = filterToLast10(unfilteredData);
      metrics.forEach((metric, i) => addChart(data, metric, i));

      ///////////////////////////////////////////////////
      //////////// BEGIN MOUSEOVER CODE /////////////////
      ///////////////////////////////////////////////////
      const mouseG = d3.select('#prev_10_charts')
        .append('g')
        .attr('class', 'mouse-over-effects')
        .attr('transform', `translate(0,${margin.top})`);

      mouseG.append('path') // this is the black vertical line to follow mouse
        .attr('class', 'mouse-line')
        .style('stroke', 'black')
        .style('stroke-width', '1px')
        .style('opacity', '0');

      const mousePerLine = mouseG.selectAll('.mouse-per-line')
        .data(metrics)
        .enter().append('g')
          .attr('class', 'mouse-per-line');

      mousePerLine.append('circle')
        .attr('r', 7)
        .style('stroke', 'black')
        .style('fill', 'none')
        .style('stroke-width', '1px')
        .style('opacity', '0');

      mousePerLine.append('text')
        .attr('class', 'shadow')
        .attr('transform', 'translate(10,3)');

      mousePerLine.append('text')
        .attr('class', 'fill')
        .attr('transform', 'translate(10,3)');

      // cache y(val) so we can calculate outside of addChart()
      const metricY = metrics.reduce((map, key) => {
        const fn = d3.scaleLinear()
          .range([chartHeight, 0]);
        if (key === 'wind_direction') {
          fn.domain([0, 380]);
        } else {
          fn.domain([
            key === 'wind_speed' ? 0 : d3.min(data, v => parseInt(v[key], 10)) - 2,
            d3.max(data, v => parseInt(v[key], 10)) + 2,
          ]);
        }
        return {
          ...map,
          [key]: fn,
        };
      }, {});

      mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
        .attr('width', width) // can't catch mouse events on a g element
        .attr('height', containerHeight)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseout', () => setMouseOverOpacity(0))
        .on('mouseover', () => setMouseOverOpacity(1))
        .on('mousemove', function onMouseMove() { // this usage necessitates non arrow func
          // our rect includes margins, which we want for usability
          let [mouseX] = d3.mouse(this);
          if (mouseX < margin.left) {
            mouseX = margin.left;
          } else if (mouseX > width - margin.right) {
            mouseX = width - margin.right;
          }

          // vertical line that follows mouse
          d3.select('.mouse-line')
            .attr('d', () => `M${mouseX},${containerHeight} ${mouseX},0`);

          // find intersection of x position and relevant line
          const xIntersect = x.invert(mouseX - margin.left); // our rect includes margins
          const bisect = d3.bisector(({ timestamp }) => timestamp).right;
          const index = bisect(data, xIntersect);
          const intersection = data[index] || data[index - 1]; // -1 for when at right edge

          // add circle and text label
          d3.selectAll('.mouse-per-line')
            .attr('transform', (key, i) => (
              `translate(${margin.left + x(intersection.timestamp)}, ${metricY[key](intersection[key]) + chartHeight * i})`
            ))
            .selectAll('text.shadow')
              .text(key => intersection[key]);

          d3.selectAll('.mouse-per-line')
            .attr('transform', (key, i) => (
              `translate(${margin.left + x(intersection.timestamp)}, ${metricY[key](intersection[key]) + chartHeight * i})`
            ))
            .selectAll('text.fill')
              .text(key => intersection[key]);
        });
      ///////////////////////////////////////////////////
      ////////////// END MOUSEOVER CODE /////////////////
      ///////////////////////////////////////////////////
    }
  );
};

export default initPrev10Charts;
