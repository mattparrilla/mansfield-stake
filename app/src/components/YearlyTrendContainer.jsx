import React, { Component } from 'react';
import { csv } from 'd3';

const transformRow = (d) => {
  console.log(d);
  return d;
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
      <pre>
        {JSON.stringify(this.state.data, null, 2)}
      </pre>
    );
  }
}

export default YearlyTrendContainer;
