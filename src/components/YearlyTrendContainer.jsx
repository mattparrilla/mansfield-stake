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

const defineWidth = (width, height) => {
  if (width > 1500) {
    return {
      width: 1200,
      height: 800,
    };
  } else if (width < height) {
    return {
      width: width - 50,
      height: width * 0.5,
    };
  }
  return {
    width: 0.75 * width,
    height: 0.35 * width,
  };
};

class YearlyTrendContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 800,
      height: 400,
    };
    this.updateComparisonYear = this.updateComparisonYear.bind(this);
    this.calculateWidth = this.calculateWidth.bind(this);
  }

  componentDidMount() {
    // TODO: add average season
    csv('snowdepth.csv', transformRow, data => this.setState({ data }));
    this.calculateWidth();
  }

  calculateWidth() {
    const { innerWidth, innerHeight } = window;
    this.setState(defineWidth(innerWidth, innerHeight));
  }

  updateComparisonYear(comparisonYear) {
    this.setState({ comparisonYear });
  }

  render() {
    const { data, comparisonYear, width, height } = this.state;
    const styles = {
      chartContainer: {
        margin: '0 auto 20px',
      },
      infoPane: {
        margin: '0 auto',
        maxWidth: `${width - 20}px`,
      },
    };

    // const currentSeason = data[data.length - 1];
    // const { snowDepth, date } = currentSeason
    //   ? currentSeason.values[currentSeason.values.length - 1]
    //   : {};

    // const properDate = currentSeason
    //   ? new Date(
    //       date.getUTCMonth() > 7
    //         ? currentSeason.season.split('-')[0]
    //         : currentSeason.season.split('-')[1],
    //       date.getUTCMonth(),
    //       date.getDate(),
    //   )
    //   : new Date();

    return (
      <div style={styles.container}>
        <div style={styles.chartContainer}>
          {data &&
            <YearlyTrend
              key="snowDepth"
              data={data}
              width={width}
              height={height}
              comparisonYear={comparisonYear}
            />
          }
        </div>
        <div style={styles.infoPane}>
          <InfoPane
            data={data}
            comparisonYear={comparisonYear}
            updateComparisonYear={this.updateComparisonYear}
          />
        </div>
      </div>
    );
  }
}

export default YearlyTrendContainer;
