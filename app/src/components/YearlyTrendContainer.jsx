import React, { Component } from 'react';
import { csv, timeParse } from 'd3';
import YearlyTrend from './YearlyTrend';
import InfoPane from './InfoPane';

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
    this.updateComparisonYear = this.updateComparisonYear.bind(this);
  }

  componentDidMount() {
    // TODO: add average season
    csv('snowdepth.csv', transformRow, data => this.setState({ data }));
  }

  updateComparisonYear(comparisonYear) {
    this.setState({ comparisonYear });
  }

  render() {
    const { data, comparisonYear } = this.state;
    const styles = {
      container: {
        display: 'flex',
        flexDirection: 'row',
      },
      infoPane: {
        flex: '1 0 400px',
        margin: '0 auto',
      },
      chartContainer: {
        flex: '0 0 800px',
      },
    };
    return (
      <div style={styles.container}>
        <div style={styles.infoPane}>
          <InfoPane
            data={data}
            comparisonYear={comparisonYear}
            updateComparisonYear={this.updateComparisonYear}
          />
        </div>
        <div style={styles.chartContainer}>
          {data &&
            <YearlyTrend
              key="snowDepth"
              data={data}
              width={800}
              height={400}
              comparisonYear={comparisonYear}
            />
          }
        </div>
      </div>
    );
  }
}

export default YearlyTrendContainer;
