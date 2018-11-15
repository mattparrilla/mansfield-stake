import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import getCurrentSeason from '../utilities/getCurrentSeason';

const styles = {
  container: {
    display: 'flex',
  },
  notes: {
    display: 'flex',
    maxWidth: '1000px',
    margin: '0 auto',
    flexWrap: 'wrap',
  },
  comparison: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  comparisonLabel: {
    fontSize: '18px',
    padding: '6px 15px',
    display: 'inline-block',
    verticalAlign: 'top',
    fontWeight: 200,
  },
  value: {
    fontWeight: 700,
    color: '#333',
  },
  select: {
    width: '250px',
    display: 'inline-block',
    textAlign: 'left',
    fontWeight: 200,
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
    flex: '1 0 320px',
    padding: '10px',
    fontWeight: 200,
  },
};

// TODO: get these metrics
const InfoPane = ({ data = [], comparisonYear, updateComparisonYear }) => (
  <div>
    <div style={styles.comparison}>
      <div style={styles.comparisonLabel}>Compare to a historical winter:</div>
      <div style={styles.select}>
        <Select
          name="select-comparison-year"
          value={comparisonYear}
          options={data
            .map(({ season }) => season)
            .filter(season => season !== getCurrentSeason())
            .map(season => ({
              value: season,
              label: season,
            })).reverse()
          }
          onChange={updateComparisonYear}
          placeholder="Select season to compare..."
          simpleValue
        />
      </div>
    </div>
    <div style={styles.notes}>
      <section style={styles.section}>
        <div style={styles.header}>About The Data</div>
        <p>
          This data is provided by the Burlington EcoInfo project at the University of Vermont.
          The source data can be found on the
          &nbsp;<a href="http://www.uvm.edu/skivt-l/?Page=depths.php">SkiVt-L website</a>.
        </p>
        <p>
          Many thanks to the dedicated folks who maintain that page and collect the measurements!
        </p>
      </section>
      <section style={styles.section}>
        <div style={styles.header}>A Note On Methods</div>
        <p>
          Due to the complexities around measuring snow depth on the top of a mountain
          during the winter, there are some inconsistencies in the source data.
          This data has been cleaned in an effort to reduce such inaccuracies.
        </p>
      </section>
    </div>
  </div>
);

InfoPane.propTypes = {
  comparisonYear: PropTypes.string,
  data: PropTypes.arrayOf(PropTypes.object),
  updateComparisonYear: PropTypes.func,
};

InfoPane.defaultProps = {
  data: [],
};

export default InfoPane;
