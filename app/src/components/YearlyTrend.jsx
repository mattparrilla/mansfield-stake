import React, { Component, PropTypes } from 'react';
import * as d3 from 'd3';

import './YearlyTrend.css';

class YearlyTrend extends Component {
  componentDidMount() {
    const svg = d3.select(this.chart);
    const margin = {
      top: 20, right: 80, bottom: 30, left: 50,
    };

    const width = this.props.width - margin.left - margin.right;
    const height = this.props.height - margin.top - margin.bottom;

    this.g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    this.x = d3.scaleTime().range([0, width]);
    this.y = d3.scaleLinear().range([height, 0]);
    this.z = d3.scaleOrdinal(d3.schemeCategory10);

    this.line = d3.line()
      .curve(d3.curveBasis)
      .x(d => this.x(d.date))
      .y(d => this.y(d.snowDepth));

    this.g.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(this.x).tickFormat(d3.timeFormat('%B')));

    this.g.append('g')
      .attr('class', 'axis axis--y')
      .call(d3.axisLeft(this.y))
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '0.71em')
      .attr('fill', '#000')
      .text('Snow Depth, inches');
  }

  componentDidUpdate() {
    const { data = [] } = this.props;
    this.x.domain([
      d3.min(data, season => d3.min(season.values, date => date.date)),
      d3.max(data, season => d3.max(season.values, date => date.date)),
    ]);

    this.y.domain([
      d3.min(data, season => d3.min(season.values, date => date.snowDepth)),
      d3.max(data, season => d3.max(season.values, date => date.snowDepth)),
    ]);

    this.z.domain(data.map(c => c.season));

    const season = this.g.selectAll('.season')
      .data(data)
      .enter().append('g')
        .attr('class', 'season');

    d3.select('.season:last-child').attr('class', 'season highlight');

    season.append('path')
      .attr('class', 'line')
      .attr('d', d => this.line(d.values));
  }

  render() {
    const { width, height } = this.props;
    return (
      <svg
        className="yearly-trend"
        ref={(ref) => { this.chart = ref; }}
        width={width}
        height={height}
      />
    );
  }
}

YearlyTrend.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  width: PropTypes.number,
  height: PropTypes.number,
};

export default YearlyTrend;
