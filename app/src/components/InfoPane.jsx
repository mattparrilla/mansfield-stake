import React, { PropTypes } from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

const styles = {
  container: {
    padding: 10,
  },
  value: {
    fontWeight: 700,
    fontSize: '18px',
  },
  select: {
    maxWidth: 300,
  },
};

// TODO: get these metrics
const InfoPane = ({ data = [], comparisonYear, updateComparisonYear }) => (
  <div style={styles.container}>
    <h3>Latest Measurement</h3>
    <p>Taken on: December 15, 2016</p>
    <div>
      <span style={styles.value}>54</span>
      <span style={styles.label}>at the stake</span>
    </div>
    <div>
      <span style={styles.value}>12</span>
      <span style={styles.label}>above average</span>
    </div>
    <h3>Compare To Season</h3>
    <div style={styles.select}>
      <Select
        name="select-comparison-year"
        value={comparisonYear}
        options={data.map(({ season }) => ({ value: season, label: season }))}
        onChange={updateComparisonYear}
        placeholder="Select season to compare..."
        simpleValue
      />
    </div>
  </div>
);

InfoPane.propTypes = {
  comparisonYear: PropTypes.string,
  data: PropTypes.arrayOf(PropTypes.object),
  updateComparisonYear: PropTypes.func,
};

export default InfoPane;
