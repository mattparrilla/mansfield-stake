import React, { Component } from 'react';
import { csv, timeParse } from 'd3';
import YearlyTrend from './YearlyTrend';

// TODO: get data from backend shaped this way
const transformRow = (season) => {
  const parseTime = (date) => {
    const year = date.split('/')[0] > 7 ? 1900 : 1901;
    return timeParse('%0m/%0d/%Y')(`${date}/${year}`);
  };

  return {
    season: season.year,
    values: Object.keys(season)
      .slice(1) // remove header label
      .filter(date => season[date])
      .map(date => ({
        date: parseTime(date),
        snowDepth: parseInt(season[date], 10),
      })),
  };
};

class YearlyTrendContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    // TODO: add average season
    csv('snowdepth.csv', transformRow, data => this.setState({ data }));
  }

  render() {
    const { data, comparisonYear } = this.state;
    return (
      <div>
        <YearlyTrend
          key="snowDepth"
          data={data}
          width={900}
          height={500}
          comparisonYear={comparisonYear}
        />
        <select
          value={comparisonYear}
          onChange={(e) => { this.setState({ comparisonYear: e.target.value }); }}
        >
          {data && data.map(({ season }) => (
            <option key={season} value={season}>{season}</option>
          ))}
        </select>
      </div>
    );
  }
}

export default YearlyTrendContainer;
