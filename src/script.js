import snowDepthChart from "./snowDepth";
import prev10Charts from "./tempWindChart";

document.addEventListener('DOMContentLoaded', () => {
  const margin = {
    top: 10, right: 60, bottom: 30, left: 15,
  };
  const largeWidthThreshold = 600;
  const width = document.getElementById('legend_container').clientWidth;
  const height = width > largeWidthThreshold ? 490 : width / 2;
  const fontSize = `${width > largeWidthThreshold ? 14 : 10}px`;
  const chartGlobals = {
    margin, width, height, fontSize, largeWidthThreshold,
  };

  const prev10Metrics = ['temperature', 'wind_speed', 'wind_gust', 'wind_direction'];

  snowDepthChart(chartGlobals);
  prev10Charts({ ...chartGlobals, metrics: prev10Metrics });
});
