import React, { PropTypes } from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

const styles = {
  container: {
    backgroundColor: '#f1f1f1',
    padding: 10,
    fontWeight: 200,
    display: 'flex',
    flexWrap: 'wrap',
    border: '1px solid #ddd',
  },
  value: {
    fontWeight: 700,
    color: '#333',
  },
  select: {
    maxWidth: 300,
    marginBottom: '20px',
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
    flex: '1 1 320px',
    padding: '10px',
  },
};

// TODO: get these metrics
const InfoPane = ({ data = [], comparisonYear, updateComparisonYear }) => {
  const currentSeason = data[data.length - 1];
  const { snowDepth, date } = currentSeason
    ? currentSeason.values[currentSeason.values.length - 1]
    : {};

  const properDate = currentSeason
    ? new Date(
        date.getUTCMonth() > 7
          ? currentSeason.season.split('-')[0]
          : currentSeason.season.split('-')[1],
        date.getUTCMonth(),
        date.getDate(),
    )
    : new Date();

  return (
    <div style={styles.container}>
      <section style={styles.section}>
        <div style={styles.header}>Compare To Previous Winter</div>
        <div style={styles.select}>
          <Select
            name="select-comparison-year"
            value={comparisonYear}
            options={data.map(({ season }) => ({
              value: season,
              label: season,
            })).reverse().slice(1)}
            onChange={updateComparisonYear}
            placeholder="Select season to compare..."
            simpleValue
          />
        </div>
      </section>
      <section style={styles.section}>
        <div style={styles.header}>Latest Measurement</div>
        {currentSeason
          ? <p>{snowDepth}&#34; on {properDate.toLocaleDateString()}</p>
          : <p>&nbsp;</p>
        }
      </section>
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
  );
};

InfoPane.propTypes = {
  comparisonYear: PropTypes.string,
  data: PropTypes.arrayOf(PropTypes.object),
  updateComparisonYear: PropTypes.func,
};

export default InfoPane;
