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
    values: Object.keys(season).slice(1).map(date => ({
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

  componentWillMount() {
    csv('snowdepth.csv', transformRow, data => this.setState({ data }));
  }

  render() {
    return (
      <div>
        <YearlyTrend key="snowDepth" data={this.state.data} />
        <pre>
          {JSON.stringify(this.state.data, null, 2)}
        </pre>
      </div>
    );
  }
}

export default YearlyTrendContainer;
