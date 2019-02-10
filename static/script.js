/* global d3, window, document */

const getCurrentSeason = () => {
    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return month < 9 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
}

const transformRow = (season) => {
  const parseTime = (date) => {
    const year = date.split('/')[0] > 7 ? 1900 : 1901;
    return d3.timeParse('%0m/%0d/%Y')(`${date}/${year}`);
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

const updateChart = ({ data, comparisonYear = '', line, seasonContainer }) => {
  d3.select('.comparison-label')
    .text(comparisonYear);

  const season = seasonContainer.selectAll('.season')
    .data(
      data.filter(d => d.season !== comparisonYear),
      d => d.season,
    );

  season
    .enter().append('g')
    .merge(season)
      .attr('class', d => `season x${d.season}`)
      .append('path')
        .attr('class', 'line')
        .attr('d', d => line(d.values));

  // TODO: need to remove and append current season to get it to be on top
  const currentSeason = seasonContainer.select(`.x${getCurrentSeason()}`)
    .attr('class', 'season current');

  // put gridlines on top of all provious years, but behind comparison and current
  seasonContainer.select('.grid-lines').raise();

  // comparison season
  season.exit()
    .attr('class', 'season comparison')
    .raise();

  // need to call raise after raising comparison season
  currentSeason.raise();
}

const chartDimensions = (width, height) => {
  // if width is more than double height, restrict width
  if (width > 2 * height) {
    return {
      width: height * 2,
      height
    };
  }
  // otherwise height should be half of width
  return {
    width,
    height: width / 2
  };
};

document.addEventListener('DOMContentLoaded', () => {

  /* SET UP SVG ELEMENT AND D3 SHARED OBJECTS */
  const seasonSelect = document.getElementById('select-season');

  const margin = {
    top: 10, right: 40, bottom: 30, left: 25,
  };
  // TODO: get height + width dynamically
  const { height, width } = chartDimensions(
    document.getElementById('visualization').offsetWidth - 100,
    window.innerHeight - 100
  );

  const g = d3.select("#chart")
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

  const seasonContainer = g.append('g').attr('class', 'season-container');

  const x = d3.scaleTime().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  // hard coded values
  x.domain([new Date(2000, 8, 1), new Date(2001, 5, 30)]);
  y.domain([0, 149]);

  const line = d3.line()
    .curve(d3.curveBasis)
    .x(d => x(d.date))
    .y(d => y(d.snowDepth));

  const xAxis = g.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b')));

  const yAxis = g.append('g')
    .attr('class', 'axis axis--y')
    .attr('transform', `translate(${width}, 0)`)
    .call(d3.axisRight(y))
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -20)
      .attr('dy', '0.71em')
      .attr('x', -150)
      .attr('fill', '#000')
      .text('Snow Depth, inches');

  // add label for current year
  g.append('text')
    .attr('class', 'year-label')
    .attr('fill', '#000')
    .attr('dy', '1em')
    .attr('font-weight', 200)
    .attr('font-size', '24px')
    .text(getCurrentSeason);

  /* REQUEST DATA, DRAW CHART AND AXIS */
  d3.csv('https://s3.amazonaws.com/matthewparrilla.com/snowDepth.csv', transformRow, d => {
    const data = d.filter(season => season['season'] !== "");

    // update axes values with actual data
    x.domain([
      d3.min(data, season => d3.min(season.values, date => date.date)),
      d3.max(data, season => d3.max(season.values, date => date.date)),
    ]);
    y.domain([
      0,
      d3.max(data, season => d3.max(season.values, date => date.snowDepth)),
    ]);
    xAxis.call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b')));
    yAxis.call(d3.axisRight(y));

    // add label for comparison year
    g.append('text')
      .attr('class', 'year-label comparison-label')
      .attr('fill', '#e3624f')
      .attr('y', '35px')
      .attr('dy', '1em');

    // create grid lines for y-axis
    seasonContainer.append('g')
      .attr('class', 'grid-lines')
        .selectAll('g.grid-line')
        .data([20, 40, 60, 80, 100, 120, 140])
        .enter()
          .append('line')
            .attr('class', 'grid-line')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', d => y(d))
            .attr('y2', d => y(d));

    updateChart({ data, line, seasonContainer });

    // Add seasons to dropdown options
    data
      .map(({ season }) => season)
      .filter(season => season && season !== getCurrentSeason())
      .map(season => ({
        value: season,
        label: season,
      })).reverse()
      .forEach(season => {
        const option = document.createElement('option');
        option.value = season.value;
        option.text = season.label;
        seasonSelect.add(option, null);
      })

    // add event listener to select season
    seasonSelect.onchange = ({ target: { value: comparisonYear } }) => {
      updateChart({ data, line, seasonContainer, comparisonYear });
    };
  });

});
