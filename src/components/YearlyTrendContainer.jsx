import React, { Component } from 'react';
import { csv, timeParse } from 'd3';
import YearlyTrend from './YearlyTrend';
import InfoPane from './InfoPane';

// TODO: get data from backend shaped this way

const maxWidth = (width, height) => {
  if (width > 1500) {
    return 1200;
  } else if (width < height) {
    return width - 50;
  }
  return width * 0.75;
};

const defineWidth = (width, height) => {
  const svgWidth = maxWidth(width, height);
  return {
    width: svgWidth,
    height: svgWidth / 2,
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
    csv('https://s3.amazonaws.com/matthewparrilla.com/snowDepth.csv', transformRow, data => this.setState({ data: data.filter(season => season['season'] !== "") }));
    this.calculateWidth();
  }

  calculateWidth() {
    const { innerWidth, innerHeight } = window;
    const headerHeight = document.getElementsByTagName('h1')[0].clientHeight;
    this.setState(defineWidth(innerWidth, innerHeight - headerHeight));
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
