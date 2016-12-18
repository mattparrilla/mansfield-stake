import React, { Component, PropTypes } from 'react';
import * as d3 from 'd3';

import './YearlyTrend.css';

class YearlyTrend extends Component {
  componentDidMount() {
    const { data } = this.props;
    const margin = {
      top: 10, right: 40, bottom: 20, left: 25,
    };
    const width = this.props.width - margin.left - margin.right;
    const height = this.props.height - margin.top - margin.bottom;

    const g = d3.select(this.chart)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);
    const z = d3.scaleOrdinal(d3.schemeCategory10);

    this.line = d3.line()
      .curve(d3.curveBasis)
      .x(d => x(d.date))
      .y(d => y(d.snowDepth));

    x.domain([
      d3.min(data, season => d3.min(season.values, date => date.date)),
      d3.max(data, season => d3.max(season.values, date => date.date)),
    ]);

    y.domain([
      0,
      d3.max(data, season => d3.max(season.values, date => date.snowDepth)),
    ]);

    z.domain(data.map(c => c.season));

    // exposing this to componentDidUpdate, not exposing g directly in case
    // I want to go back to putting seasons in their own container
    this.seasonContainer = g;

    // create grid lines for y-axis
    g.append('g')
      .attr('class', 'grid-lines')
        .selectAll('g.grid-line')
        .data([20, 40, 60, 80, 100, 120, 140])
        .enter()
          .append('line')
            .attr('class', 'grid-line')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', d => y(d))
            .attr('y2', d => y(d));

    g.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%B')));

    // needs to be after grid lines are created so axis label isn't cut off
    // by grid line
    g.append('g')
      .attr('class', 'axis axis--y')
      .attr('transform', `translate(${width}, 0)`)
      .call(d3.axisRight(y))
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -15)
      .attr('dy', '0.71em')
      .attr('x', -90)
      .attr('fill', '#000')
      .text('Snow Depth, inches');


    this.updateChart();
  }

  componentDidUpdate() {
    this.updateChart();
  }

  updateChart() {
    const { data = [], comparisonYear } = this.props;

    const season = this.seasonContainer.selectAll('.season')
      .data(
        data.filter(d => d.season !== comparisonYear),
        d => d.season,
      );

    season
      .enter().append('g')
      .merge(season)
        .attr('class', d => `season ${d.season}`)
        .append('path')
          .attr('class', 'line')
          .attr('d', d => this.line(d.values));

    const currentSeason = this.seasonContainer.select('.season:last-child')
      .attr('class', 'season current');

    // put gridlines on top of all provious years, behind comparison and current
    this.seasonContainer.select('.grid-lines').raise();

    // comparison season
    season.exit()
      .attr('class', 'season comparison')
      .raise();

    // need to call raise after raising comparison season
    currentSeason.raise();
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
  comparisonYear: PropTypes.string,
};

export default YearlyTrend;
