/* global d3, document */

const transform = d => {
  const min = parseInt(d["MinT"]);
  const max = parseInt(d["MaxT"]);

  return {
    date: new Date(d["Date"]),
    min: isNaN(min) ? 0 : min,
    max: isNaN(max) ? 0 : max,
  };
};

document.addEventListener('DOMContentLoaded', () => {

  /* SET UP SVG ELEMENT AND D3 SHARED OBJECTS */
  const margin = {
    top: 10, right: 45, bottom: 30, left: 25,
  };
  const containerWidth = document.getElementById('visualization').clientWidth;
  const height = containerWidth > 800 ? 400 : containerWidth / 2;
  const width = containerWidth - margin.right;

  const g = d3.select("#temp_chart")
    .attr('width', containerWidth)
    .attr('height', height + margin.top + margin.bottom);

  const x = d3.scaleTime().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  // hard coded values
  x.domain([new Date(2018, 8, 1), new Date(2019, 5, 30)]);
  y.domain([-15, 85]);

  const xAxis = g.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(${margin.left},${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b')));

  const yAxis = g.append('g')
    .attr('class', 'axis axis--y')
    .attr('transform', `translate(${width}, 0)`)
    .call(d3.axisRight(y))
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -20)
      .attr('dy', '0.71em')
      .attr('x', -165)
      .attr('style', 'fill: #000')
      .html('Temperature &deg;F');

  xAxis.call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b')));
  yAxis.call(d3.axisRight(y));

  const area = d3.area()
    .x(d => x(d.date))
    .y0(d => y(d.min))
    .y1(d => y(d.max));
    
    // create grid lines for y-axis

  d3.csv('./just_temp.csv',
    transform,
    data => {

      g.append("path")
        .datum(data)
        .attr("class", "temp_area")
        .attr("fill", "steelblue")
        .attr("d", area);

      g.append('g')
        .attr('class', 'grid-lines')
          .selectAll('g.grid-line')
          .data([32])
          .enter()
            .append('line')
              .attr('class', 'fat-grid-line')
              .attr('x1', 0)
              .attr('x2', width)
              .attr('y1', d => y(d))
              .attr('y2', d => y(d));
    }

  );

});

