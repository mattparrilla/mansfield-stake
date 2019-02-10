import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import getCurrentSeason from '../utilities/getCurrentSeason';

import './YearlyTrend.css';

class YearlyTrend extends Component {

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
