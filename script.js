/* global d3 */

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

const updateChart = ({ data, comparisonYear = '', seasonContainer, line }) => {
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

const init = (data) => {
  const margin = {
    top: 10, right: 40, bottom: 30, left: 25,
  };
  // TODO: get height + width dynamically
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const g = d3.select("#chart")
    .attr('width', width)
    .attr('height', height)
    .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  const line = d3.line()
    .curve(d3.curveBasis)
    .x(d => x(d.date))
    .y(d => y(d.snowDepth));

  x.domain([
    d3.min(data, season => d3.min(season.values, date => date.date)),
    d3.max(data, season => d3.max(season.values, date => date.date)),
  ]);

  y.domain([
    0,
    d3.max(data, season => d3.max(season.values, date => date.snowDepth)),
  ]);

  const seasonContainer = g.append('g').attr('class', 'season-container');

  g.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b')));

  g.append('g')
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

  updateChart({ data, seasonContainer, line });
};

d3.csv('https://s3.amazonaws.com/matthewparrilla.com/snowDepth.csv', transformRow, d => {
  const data = d.filter(season => season['season'] !== "");
  init(data);
});








