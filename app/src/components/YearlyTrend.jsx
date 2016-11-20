import React, { Component, PropTypes } from 'react';
import * as d3 from 'd3';

import './YearlyTrend.css';

class YearlyTrend extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidUpdate() {
    const { data = [] } = this.props;
    const svg = d3.select(this.chart);
    const margin = {
      top: 20, right: 80, bottom: 30, left: 50,
    };
    const width = svg.attr('width') - margin.left - margin.right;
    const height = svg.attr('height') - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);
    const z = d3.scaleOrdinal(d3.schemeCategory10);

    const line = d3.line()
      .curve(d3.curveBasis)
      .x(d => x(d.date))
      .y(d => y(d.snowDepth));

    x.domain([
      d3.min(data, season => d3.min(season.values, date => date.date)),
      d3.max(data, season => d3.max(season.values, date => date.date)),
    ]);

    y.domain([
      d3.min(data, season => d3.min(season.values, date => date.snowDepth)),
      d3.max(data, season => d3.max(season.values, date => date.snowDepth)),
    ]);

    z.domain(data.map(c => c.season));

    g.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));

    g.append('g')
        .attr('class', 'axis axis--y')
        .call(d3.axisLeft(y))
      .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '0.71em')
        .attr('fill', '#000')
        .text('Snow Depth, inches');

    const season = g.selectAll('.season')
      .data(data)
      .enter().append('g')
        .attr('class', 'season');

    season.append('path')
      .attr('class', 'line')
      .attr('d', d => line(d.values))
      .style('stroke', d => z(d.season));

    season.append('text')
      .datum(d => ({ season: d.season, value: d.values[d.values.length - 1] }))
      .attr('transform', d => (
        `translate(${x(d.value.date)},${y(d.value.snowDepth) || 0})`
      ))
      .attr('x', 3)
      .attr('dy', '0.35em')
      .style('font', '10px sans-serif')
      .text(d => d.season);
  }

  render() {
    return (
      <svg
        className="yearly-trend"
        ref={(ref) => { this.chart = ref; }}
        width="960"
        height="500"
      />
    );
  }
}

YearlyTrend.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
};

export default YearlyTrend;
