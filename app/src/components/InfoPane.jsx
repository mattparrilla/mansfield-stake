import React, { PropTypes } from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

const styles = {
  container: {
    padding: 10,
    fontWeight: 200,
    display: 'flex',
    flexWrap: 'wrap',
  },
  value: {
    fontWeight: 700,
    color: '#333',
  },
  select: {
    maxWidth: 300,
  },
  table: {
    fontSize: '18px',
    color: '#777',
  },
  header: {
    fontSize: '24px',
    marginBottom: '10px',
  },
  latestMeasurement: {
    color: '#777',
    fontSize: '12px',
  },
  section: {
    marginBottom: '30px',
    flex: '1 1 300px',
  },
};

// TODO: get these metrics
const InfoPane = ({ data = [], comparisonYear, updateComparisonYear }) => (
  <div style={styles.container}>
    <section style={styles.section}>
      <div style={styles.header}>Latest Measurement</div>
      <table style={styles.table}>
        <tbody>
          <tr>
            <td style={styles.value}>54&#34;</td>
            <td>at the stake</td>
          </tr>
          <tr>
            <td style={styles.value}>12&#34;</td>
            <td>above average</td>
          </tr>
          <tr>
            <td style={styles.value}>on</td>
            <td>December 15, 2016</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section style={styles.section}>
      <div style={styles.header}>Compare To Previous Winter</div>
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
    </section>
  </div>
);

InfoPane.propTypes = {
  comparisonYear: PropTypes.string,
  data: PropTypes.arrayOf(PropTypes.object),
  updateComparisonYear: PropTypes.func,
};

export default InfoPane;
