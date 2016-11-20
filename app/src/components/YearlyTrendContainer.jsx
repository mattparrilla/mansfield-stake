import React, { Component } from 'react';
import { csv, timeParse } from 'd3';
import YearlyTrend from './YearlyTrend';

// TODO: get data from backend shaped this way
const transformRow = (season) => {
  const parseTime = timeParse('%0m/%0d');
  return {
    season: season.year,
    values: Object.keys(season).slice(1).map(date => ({
      date: parseTime(date),
      snowDepth: season[date],
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
