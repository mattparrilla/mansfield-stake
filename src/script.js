/* global d3 */

const AVERAGE_SEASON = "Average Season";

const getCurrentSeason = () => {
  const date = new Date();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return month < 9 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
};

const transformRow = (season) => {
  const parseTime = (date) => {
    const year = date.split("/")[0] > 7 ? 1900 : 1901;
    return d3.timeParse("%0m/%0d/%Y")(`${date}/${year}`);
  };

  return {
    season: season.year,
    values: Object.keys(season)
      .slice(1) // remove header label
      .filter((date) => season[date])
      .map((date) => ({
        date: parseTime(date),
        snowDepth: parseInt(season[date], 10),
      })),
  };
};

function interpolateValueForDate(values, targetDate) {
  // First check if we have an exact match
  const exactMatch = values.find(
    d => d.date.getMonth() === targetDate.getMonth() && 
         d.date.getDate() === targetDate.getDate()
  );
  
  if (exactMatch) {
    return exactMatch.snowDepth;
  }
  
  // If no exact match, find the closest dates before and after
  // First convert all dates to a standardized year for comparison
  const standardYear = 2000; // Arbitrary standard year
  const targetTime = new Date(
    standardYear, 
    targetDate.getMonth(), 
    targetDate.getDate()
  ).getTime();
  
  // Standardize all dates to the same year for comparison
  const standardizedValues = values.map(d => ({
    ...d,
    standardTime: new Date(
      standardYear,
      d.date.getMonth(),
      d.date.getDate()
    ).getTime()
  }));
  
  // Find the closest points before and after
  const before = [...standardizedValues]
    .filter(d => d.standardTime <= targetTime)
    .sort((a, b) => b.standardTime - a.standardTime)[0];
    
  const after = [...standardizedValues]
    .filter(d => d.standardTime >= targetTime)
    .sort((a, b) => a.standardTime - b.standardTime)[0];
  
  // If we don't have points on both sides, return the one we have or 0
  if (!before) return after ? after.snowDepth : 0;
  if (!after) return before.snowDepth;
  
  // Linear interpolation
  const ratio = (targetTime - before.standardTime) / (after.standardTime - before.standardTime);
  return Math.round(before.snowDepth + ratio * (after.snowDepth - before.snowDepth));
}

function fetchNwsForecast() {
  const xhr = new XMLHttpRequest();

  xhr.onload = function () {
    const response = xhr.responseXML.documentElement;
    const forecast = response.querySelector("data[type='forecast']");
    const wordedForecastNode = forecast.querySelector("wordedForecast");

    // this key is how we match the word forecast to the dates they represent
    const wordedForecastTimeLayoutKey =
      wordedForecastNode.getAttribute("time-layout");

    // map over each forecast text node and grab the contents
    const wordedForecast = Array.from(
      wordedForecastNode.querySelectorAll("text")
    ).map((textNode) => textNode.innerHTML);

    // Numerous forecasts of varying time ranges are in the XML document, get
    // them all so we can find the desired match
    const timeLayouts = forecast.querySelectorAll("time-layout");

    const matchingTimeLayout = Array.from(timeLayouts).find((layout) => {
      return (
        layout.querySelector("layout-key").innerHTML ===
        wordedForecastTimeLayoutKey
      );
    });

    // Pull name of forecast time period from element attribute
    const forecastTimes = Array.from(
      matchingTimeLayout.querySelectorAll("start-valid-time")
    ).map((period) => period.getAttribute("period-name"));

    // Generate HTML from the forecast data for our HTML
    const newForecastAsString = forecastTimes
      .slice(0, 7)
      .reduce((string, time, i) => {
        return (string += `
        <div>
          <h5 class='forecast_period'>${time}</h5>
          <p class='forecast_content'>${wordedForecast[i]}</p>
        </div>
      `);
      }, "");

    // Add our forecast to our HTML
    document.getElementById("nws_worded_forecast").innerHTML =
      newForecastAsString;
  };

  xhr.open(
    "GET",
    "https://forecast.weather.gov/MapClick.php?lat=44.5437&lon=-72.8143&unit=0&lg=english&FcstType=dwml"
  );
  xhr.responseType = "document";
  xhr.send();
}

const setMouseOverOpacity = (opacity) => {
  d3.select(".mouse-line").style("opacity", opacity);
  d3.selectAll(".mouse-per-line circle").style("opacity", opacity);
  d3.selectAll(".mouse-per-line text").style("opacity", opacity);
};

document.addEventListener("DOMContentLoaded", () => {
  ///////////////////////////////////////////////////
  ///////// GLOBALS FOR USE BY CHARTS ///////////////
  ///////////////////////////////////////////////////
  const margin = {
    top: 10,
    right: 30,
    bottom: 30,
    left: 15,
  };
  const largeWidthThreshold = 600;
  const width = document.getElementById("chart_container").clientWidth;
  const height = width / 2;
  const fontSize = `${width > largeWidthThreshold ? 16 : 10}px`;
  ///////////////////////////////////////////////////
  //////////////// END GLOBALS //////////////////////
  ///////////////////////////////////////////////////

  const updateSnowDepthChart = ({
    data,
    comparisonYear = AVERAGE_SEASON,
    line,
    seasonContainer,
  }) => {
    d3.select(".comparison-label").text(comparisonYear);

    const season = seasonContainer.selectAll(".season").data(
      data.filter((d) => d.season !== comparisonYear),
      (d) => d.season
    );

    season
      .enter()
      .append("g")
      .merge(season)
      .attr("class", (d) => `season x${d.season}`)
      .select("path")
      .attr("class", "line")
      .attr("d", (d) => line(d.values));

    const currentSeason = seasonContainer
      .select(`.x${getCurrentSeason()}`)
      .attr("class", "season current");

    const comparisonSeason = season.exit();
    comparisonSeason.attr("class", "season comparison").raise();

    // if we have data, update legend and last updated
    if (currentSeason.data().length > 0) {
      // update legend with current snow depth
      const currentSeasonData = currentSeason.data()[0].values;
      const latestData = currentSeasonData[currentSeasonData.length - 1];
      const latestDepth = latestData.snowDepth;
      d3.select("#currentDepth").text(latestDepth);

      // upate last updated
      const lastUpdated = new Date(latestData.date);
      lastUpdated.setYear(new Date().getFullYear());
      d3.select("#last_updated").text(lastUpdated.toLocaleDateString());

      // update legend with comparison season
      const comparisonData = comparisonSeason.data()[0];
      const interpolatedComparisonDepth = interpolateValueForDate(comparisonData.values, lastUpdated);
      d3.select("#comparisonDepth").text(interpolatedComparisonDepth);
      d3.select("#comparisonLabel").text(`${comparisonData.season}`);

      // need to call raise after raising comparison season
      currentSeason.raise();
    } else {
      d3.select("#currentDepth").text(0);
      d3.select("#last_updated").text("No data yet for season!");
    }
  };

  const calculateSeasonReview = (data) => {
    // Get the CURRENT season (the one we're in now)
    const currentSeasonName = getCurrentSeason();

    console.log('Looking for current season:', currentSeasonName);

    // Find the season data
    const seasonData = data.find(s => s.season === currentSeasonName);
    console.log('Found season data:', seasonData ? 'yes' : 'no', seasonData?.values?.length || 0, 'values');

    if (!seasonData || seasonData.values.length === 0) {
      console.log('Hiding season review - no data for', currentSeasonName);
      document.getElementById('season-review').style.display = 'none';
      return;
    }
    
    // Calculate max depth and date
    const maxEntry = seasonData.values.reduce((max, entry) => 
      entry.snowDepth > max.snowDepth ? entry : max
    );
    
    const maxDepth = maxEntry.snowDepth;
    const maxDate = maxEntry.date;
    
    // Get all historical seasons (excluding average season and current season)
    const historicalSeasons = data.filter(s =>
      s.season !== AVERAGE_SEASON &&
      s.season !== currentSeasonName &&
      s.values.length > 0
    );
    
    // Calculate max depths for all seasons for ranking
    const allMaxDepths = historicalSeasons.map(season => {
      const seasonMax = season.values.reduce((max, entry) => 
        entry.snowDepth > max.snowDepth ? entry : max
      );
      return {
        season: season.season,
        maxDepth: seasonMax.snowDepth
      };
    });
    
    // Add current season to the list for ranking
    allMaxDepths.push({ season: currentSeasonName, maxDepth });

    // Sort by max depth (descending) and find ranking
    allMaxDepths.sort((a, b) => b.maxDepth - a.maxDepth);
    const ranking = allMaxDepths.findIndex(s => s.season === currentSeasonName) + 1;
    
    // Calculate average max depth
    const averageMaxDepth = Math.round(
      allMaxDepths.reduce((sum, s) => sum + s.maxDepth, 0) / allMaxDepths.length
    );
    
    // Find last (most recent) snowier season
    // Get all seasons with higher max depth than current season
    const snowierSeasons = allMaxDepths.filter(s =>
      s.maxDepth > maxDepth && s.season !== currentSeasonName
    );

    // Sort by season year (descending) to get most recent first
    // Season format is "YYYY-YYYY", so we can sort as strings
    snowierSeasons.sort((a, b) => b.season.localeCompare(a.season));

    const lastSnowierSeason = snowierSeasons.length > 0 ? snowierSeasons[0] : null;
    
    // Helper function for ranking suffix
    const getRankingSuffix = (rank) => {
      if (rank % 10 === 1 && rank % 100 !== 11) return 'st';
      if (rank % 10 === 2 && rank % 100 !== 12) return 'nd';
      if (rank % 10 === 3 && rank % 100 !== 13) return 'rd';
      return 'th';
    };
    
    // Format date
    const formatDate = (date) => {
      const options = { month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    };
    
    // Update the DOM - New structure
    const rankingEl = document.getElementById('season-review-ranking');
    rankingEl.textContent = `${ranking}${getRankingSuffix(ranking)} Snowiest`;
    rankingEl.classList.add('visible');

    const depthEl = document.getElementById('season-review-depth');
    depthEl.textContent = maxDepth;
    depthEl.classList.add('visible');

    const difference = maxDepth - averageMaxDepth;
    const differenceEl = document.getElementById('season-review-difference');
    differenceEl.textContent = `${difference >= 0 ? '+' : ''}${difference}"`;
    differenceEl.classList.add('visible');

    const dateEl = document.getElementById('season-review-date');
    dateEl.textContent = formatDate(maxDate);
    dateEl.classList.add('visible');

    const lastSnowierEl = document.getElementById('season-review-last-snowier');
    if (lastSnowierSeason) {
      lastSnowierEl.textContent = lastSnowierSeason.season;
    } else {
      lastSnowierEl.textContent = 'None';
    }
    lastSnowierEl.classList.add('visible');

    // Show the section
    console.log('Showing season review for', currentSeasonName, 'with max depth', maxDepth);
    document.getElementById('season-review').style.display = 'block';
  };

  const updateMetricsGrid = (currentDepth, historicalData, comparisonSeasonName = AVERAGE_SEASON) => {
    // Find latest measurement date from current season
    const currentSeason = historicalData.find((s) => s.season === getCurrentSeason());
    const lastMeasurement = currentSeason?.values[currentSeason.values.length - 1];

    if (!lastMeasurement) {
      return; // No data yet for current season
    }

    const month = lastMeasurement.date.getMonth() + 1;
    const day = lastMeasurement.date.getDate();

    // Get the comparison season data for this date
    const comparisonSeason = historicalData.find(s => s.season === comparisonSeasonName);
    const interpolatedComparison = interpolateValueForDate(comparisonSeason.values, lastMeasurement.date);
    const average = interpolatedComparison;

    // Get historical values for this date using interpolation (excluding average season)
    const historicalValues = historicalData
      .filter((season) => season.season !== getCurrentSeason() && season.season !== AVERAGE_SEASON)
      .map((season) => interpolateValueForDate(season.values, lastMeasurement.date))
      .filter((depth) => depth !== null);
      
        // Calculate difference from average
        const difference = currentDepth - average;
      
        // Count snowier and less snowy winters
        const snowierWinters = historicalValues.filter(
          (depth) => depth > currentDepth
        ).length;
        const lessSnowyWinters = historicalValues.filter(
          (depth) => depth < currentDepth
        ).length;
  
    // Find last snowier winter
    const lastSnowierWinter =
      historicalData
        .filter((season) => {
          // Skip current season and average season
          if (season.season === getCurrentSeason() || season.season === AVERAGE_SEASON) {
            return false;
          }
          // Use interpolation to compare snow depths
          const interpolatedDepth = interpolateValueForDate(season.values, lastMeasurement.date);
          return interpolatedDepth > currentDepth;
        })
        .map((season) => {
          const year = season.season.split("-")[0];
          return `${year}-${(parseInt(year) + 1).toString().slice(-2)}`;
        })
        .pop() || "None";
  
    // Update DOM - New structure
    const metrics = {
      ".hero-value": currentDepth,
      "#average-depth": `${average}"`,
      "#difference": `${difference > 0 ? "+" : ""}${difference}"`,
      "#last-snowier": lastSnowierWinter,
      "#snowier-count": snowierWinters,
      "#less-snowy-count": lessSnowyWinters,
    };

    Object.entries(metrics).forEach(([selector, value]) => {
      const element = document.querySelector(selector);
      if (element) {
        element.textContent = value;
        element.classList.add("visible");
      }
    });

    // Update comparison label
    const comparisonLabel = document.querySelector('.comparison-bar .comparison-item:first-child .comparison-label');
    if (comparisonLabel) {
      const labelText = comparisonSeasonName === AVERAGE_SEASON
        ? 'Average'
        : comparisonSeasonName;
      comparisonLabel.textContent = labelText;
    }

    // Add/remove positive/negative classes for difference
    const differenceEl = document.querySelector("#difference");
    if (differenceEl) {
      differenceEl.classList.remove("difference-positive", "difference-negative");
      differenceEl.classList.add(
        difference > 0 ? "difference-positive" : "difference-negative"
      );
    }
  };

  const addMouseoverFunctionality = ({ data, seasonContainer, x, y, line, width, height, margin, getSelectedSeason, setSelectedSeason }) => {
    // Find the closest season to a given mouse position
    const findClosestSeason = (mouseX, mouseY) => {
      const xDate = x.invert(mouseX);
      let closestSeason = null;
      let minDistance = Infinity;
      let directHitSeason = null;

      // Get all seasons except current season (since it's always highlighted)
      const availableSeasons = data.filter(s => s.season !== getCurrentSeason());

      availableSeasons.forEach(season => {
        // Find the closest data point to the mouse x position
        if (season.values.length === 0) return;

        const bisect = d3.bisector(d => d.date).left;
        const index = bisect(season.values, xDate);
        
        // Check both surrounding points
        const candidates = [
          season.values[index - 1],
          season.values[index]
        ].filter(Boolean);

        candidates.forEach(point => {
          const pointX = x(point.date);
          const pointY = y(point.snowDepth);
          const distance = Math.sqrt(
            Math.pow(mouseX - pointX, 2) + Math.pow(mouseY - pointY, 2)
          );

          // Check for very close proximity to actual line points (direct hit)
          if (distance <= 5) { // 5 pixel tolerance for direct hits
            directHitSeason = season.season;
          }

          if (distance < minDistance) {
            minDistance = distance;
            closestSeason = season.season;
          }
        });

        // Also check distance to line segments between points for better accuracy
        if (candidates.length === 2) {
          const [point1, point2] = candidates;
          const x1 = x(point1.date);
          const y1 = y(point1.snowDepth);
          const x2 = x(point2.date);
          const y2 = y(point2.snowDepth);
          
          // Calculate distance from mouse to line segment
          const A = mouseX - x1;
          const B = mouseY - y1;
          const C = x2 - x1;
          const D = y2 - y1;
          
          const dot = A * C + B * D;
          const lenSq = C * C + D * D;
          
          if (lenSq !== 0) {
            const param = dot / lenSq;
            let xx, yy;
            
            if (param < 0) {
              xx = x1;
              yy = y1;
            } else if (param > 1) {
              xx = x2;
              yy = y2;
            } else {
              xx = x1 + param * C;
              yy = y1 + param * D;
            }
            
            const segmentDistance = Math.sqrt(Math.pow(mouseX - xx, 2) + Math.pow(mouseY - yy, 2));
            
            // Check for very close proximity to line segment (direct hit)
            if (segmentDistance <= 3) { // 3 pixel tolerance for direct line hits
              directHitSeason = season.season;
            }
            
            if (segmentDistance < minDistance) {
              minDistance = segmentDistance;
              closestSeason = season.season;
            }
          }
        }
      });

      // If we have a direct hit, always return that
      if (directHitSeason) {
        return directHitSeason;
      }

      // Otherwise, only return if reasonably close (within 20 pixels)
      return minDistance < 20 ? closestSeason : null;
    };

    // Create invisible overlay for mouse events
    const mouseOverlay = seasonContainer
      .append("rect")
      .attr("class", "mouse-overlay")
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("x", margin.left)
      .attr("y", margin.top)
      .style("fill", "none")
      .style("pointer-events", "all")
      .style("cursor", "pointer");

    mouseOverlay
      .on("mousemove", function() {
        const [mouseX, mouseY] = d3.mouse(this);
        const hoveredSeason = findClosestSeason(mouseX, mouseY);
        
        // Remove previous hover highlighting
        seasonContainer.selectAll(".season").classed("hovered", false);
        
        // Add hover highlighting to the hovered line
        if (hoveredSeason) {
          seasonContainer.selectAll(`.season.x${hoveredSeason}`)
            .classed("hovered", true);
        }
      })
      .on("mouseleave", function() {
        // Remove all hover highlighting when mouse leaves the chart area
        seasonContainer.selectAll(".season").classed("hovered", false);
      })
      .on("click", function() {
        const [mouseX, mouseY] = d3.mouse(this);
        const clickedSeason = findClosestSeason(mouseX, mouseY);
        
        if (clickedSeason) {
          // Update dropdown (which will trigger chart update)
          const seasonSelect = document.getElementById("select-season");
          seasonSelect.value = clickedSeason;
          seasonSelect.dispatchEvent(new Event('change'));
        }
      });
  };

  const initSnowDepthChart = () => {
    /* SET UP SVG ELEMENT AND D3 SHARED OBJECTS */
    const seasonSelect = document.getElementById("select-season");
    let selectedSeason = AVERAGE_SEASON; // Track persisted selection for mouseover

    const g = d3
      .select("#snow_depth_chart")
      .attr("width", width)
      .attr("height", height);

    const seasonContainer = g.append("g").attr("class", "season-container");

    const x = d3
      .scaleTime()
      .range([margin.left, width - margin.right - margin.left]);
    const y = d3.scaleLinear().range([height - margin.bottom, margin.top]);

    // hard coded values
    x.domain([new Date(2000, 8, 1), new Date(2001, 5, 30)]);
    y.domain([0, 150]);

    const line = d3
      .line()
      .curve(d3.curveBasis)
      .x((d) => x(d.date))
      .y((d) => y(d.snowDepth));

    const xAxis = g
      .append("g")
      .attr("class", "axis axis--x")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .style("font-size", fontSize)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b")));

    const yAxis = g
      .append("g")
      .attr("class", "axis axis--y")
      .attr("transform", `translate(${width - margin.right - margin.left}, 0)`)
      .style("font-size", fontSize)
      .call(d3.axisRight(y))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -20)
      .attr("dy", "0.71em")
      .attr("x", width > 400 ? -165 : -120)
      .style("fill", "#000")
      .style("font-size", width > 400 ? "16px" : "12px")
      .text("Snow Depth, inches");

    /* REQUEST DATA, DRAW CHART AND AXIS */
    d3.csv(
      "https://s3.amazonaws.com/matthewparrilla.com/snow-depth.csv",
      transformRow,
      (csv) => {
        const data = csv.filter((season) => season.season !== "");

        // update axes values with actual data
        x.domain([
          d3.min(data, (season) => d3.min(season.values, (date) => date.date)),
          d3.max(data, (season) => d3.max(season.values, (date) => date.date)),
        ]);
        y.domain([
          0,
          d3.max(data, (season) =>
            d3.max(season.values, (date) => date.snowDepth)
          ),
        ]);
        xAxis.call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b")));
        yAxis.call(d3.axisRight(y));

        seasonContainer
          .selectAll(".season")
          .data(data, (d) => d.season)
          .enter()
          .append("g")
          .attr("class", (d) => `season x${d.season}`)
          .append("path")
          .attr("class", "line")
          .attr("d", (d) => line(d.values));

        // create grid lines for y-axis
        seasonContainer
          .append("g")
          .attr("class", "grid-lines")
          .selectAll("g.grid-line")
          .data([20, 40, 60, 80, 100, 120, 140])
          .enter()
          .append("line")
          .attr("class", "grid-line")
          .attr("x1", 0)
          .attr("x2", width)
          .attr("y1", (d) => y(d))
          .attr("y2", (d) => y(d));

        updateSnowDepthChart({ data, line, seasonContainer });

        // Get current season's latest depth
        const currentSeason = data.find((s) => s.season === getCurrentSeason());
        const currentDepth = currentSeason
          ? currentSeason.values[currentSeason.values.length - 1].snowDepth
          : 0;

        // Update metrics grid
        updateMetricsGrid(currentDepth, data);

        // Calculate and display season review (April-September only)
        calculateSeasonReview(data);

        // Add mouseover functionality
        addMouseoverFunctionality({ 
          data, 
          seasonContainer, 
          x, 
          y, 
          line, 
          width, 
          height, 
          margin, 
          getSelectedSeason: () => selectedSeason,
          setSelectedSeason: (season) => { 
            selectedSeason = season; 
          }
        });

        // Add seasons to dropdown options
        data
          .map(({ season }) => season)
          .filter((season) => season && season !== getCurrentSeason() && season !== AVERAGE_SEASON) // Add AVERAGE_SEASON to filter
          .reverse()
          .forEach((season) => {
            const option = document.createElement("option");
            option.value = season;
            option.text = season;
            seasonSelect.add(option, null);
          });

        seasonSelect.value = AVERAGE_SEASON;

        // add event listener to select season
        seasonSelect.onchange = ({ target: { value: comparisonYear } }) => {
          selectedSeason = comparisonYear; // Update the tracked selection
          updateSnowDepthChart({
            data,
            line,
            seasonContainer,
            comparisonYear,
          });
          // Update metrics to compare with selected season
          updateMetricsGrid(currentDepth, data, comparisonYear);
        };
      }
    );
  };

  // TODO: make this more performant (maybe reverse and find, then slice)
  // or consider slicing in lambda (better)
  const filterToLast10 = (data) => {
    const today = new Date();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    return (
      data
        // filter to last 10 days with temperatures above -100 (bad temp values are -9999
        .filter(
          ({ timestamp, temperature }) =>
            Math.round((today - timestamp) / millisecondsPerDay) < 10 &&
            temperature > -100
        )
        .map((entry) => ({
          ...entry,
          // bad values are -9999, but lets always throw out < 0
          wind_speed: entry.wind_direction < 0 ? null : entry.wind_speed,
          wind_gust: entry.wind_direction < 0 ? null : entry.wind_gust,
        }))
    );
  };

  // Line chart with hover based on:
  // https://bl.ocks.org/larsenmtl/e3b8b7c2ca4787f77d78f58d41c3da91
  // http://www.d3noob.org/2014/07/my-favourite-tooltip-method-for-line.html
  const initPrev10Charts = (metrics) => {
    const chartHeight =
      width > largeWidthThreshold
        ? 150
        : (height - margin.top - margin.bottom) / metrics.length;
    const containerHeight = chartHeight * metrics.length;

    const x = d3.scaleTime().range([0, width - margin.left - margin.right]);

    const y = d3.scaleLinear().range([chartHeight, 0]);

    const line = d3
      .line()
      .x((d) => x(d.timestamp))
      .curve(d3.curveBasis);

    const xAxis = d3.axisBottom().scale(x);

    const yAxis = d3.axisRight().ticks(5).scale(y);

    d3.select("#prev_10_charts")
      .attr("width", width + margin.left + margin.right)
      .attr("height", containerHeight + margin.top + margin.bottom);

    const transformDate = (row) => ({
      ...row,
      timestamp: new Date(row.timestamp),
      // "no data" for wind is identified by wind direction -9999
      wind_direction: row.wind_direction < 0 ? null : row.wind_direction,
      wind_speed: row.wind_direction < 0 ? null : row.wind_speed,
      wind_gust: row.wind_direction < 0 ? null : row.wind_gust,
    });

    const metricLabel = {
      temperature: "Temperature",
      wind_direction: "Wind Direction",
      wind_speed: "Wind Speed",
      wind_gust: "Wind Gust",
    };

    const addChart = (data, key, order) => {
      const g = d3
        .select("#prev_10_charts")
        .select(`#${key}`)
        .attr(
          "transform",
          `translate(${margin.left},${chartHeight * order + margin.top})`
        );

      const values = data.map((d) => parseInt(d[key], 10));

      x.domain(d3.extent(data, (d) => d.timestamp));
      if (key === "wind_direction") {
        y.domain([0, 380]);
      } else {
        y.domain([
          key === "wind_speed" || key === "wind_gust" ? 0 : d3.min(values) - 2,
          d3.max(values) + 2,
        ]);
      }

      g.append("text")
        .text(metricLabel[key])
        .attr("class", `mini_chart_label ${key}`)
        .attr("y", chartHeight - 1.5 * margin.top)
        .attr("dy", "0.71em")
        .style("font-size", fontSize)
        .attr("x", 0);

      line.y((d) => y(d[key])).defined((d) => d[key] !== null);

      if (key === "temperature") {
        g.append("path")
          .attr("class", "line freezing")
          .attr(
            "d",
            line(
              data.map((d) => ({
                ...d,
                temperature: 32,
              }))
            )
          )
          .style("fill-opacity", 0)
          .style("stroke-width", 1.5);
      }

      g.append("g")
        .attr("class", "y axis")
        .style("font-size", fontSize)
        .attr(
          "transform",
          `translate(${width - margin.left - margin.right}, 0)`
        )
        .call(yAxis);

      g.append("path")
        .attr("class", `line prev_10_line ${key}`)
        .attr("d", line(data))
        .style("fill-opacity", 0)
        .style("stroke-width", 1.5);

      // Only show tick labels on last row
      if (order === metrics.length - 1) {
        xAxis.tickFormat(d3.timeFormat(width > 400 ? "%b %d" : "%m/%d"));
      } else {
        xAxis.tickFormat("");
      }
      g.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${chartHeight})`)
        .style("font-size", fontSize)
        .call(xAxis);
    };

    // Download data, filter it, and render chart
    d3.csv(
      "https://s3.amazonaws.com/matthewparrilla.com/mansfield_observations.csv",
      transformDate,
      (unfilteredData) => {
        const data = filterToLast10(unfilteredData);
        metrics.forEach((metric, i) => addChart(data, metric, i));
        // TODO: add wind gust to wind_speed

        ///////////////////////////////////////////////////
        //////////// BEGIN MOUSEOVER CODE /////////////////
        ///////////////////////////////////////////////////
        const mouseG = d3
          .select("#prev_10_charts")
          .append("g")
          .attr("class", "mouse-over-effects")
          .attr("transform", `translate(0,${margin.top})`);

        mouseG
          .append("path") // this is the black vertical line to follow mouse
          .attr("class", "mouse-line")
          .style("stroke", "black")
          .style("stroke-width", "1px")
          .style("opacity", "0");

        const mousePerLine = mouseG
          .selectAll(".mouse-per-line")
          .data(metrics)
          .enter()
          .append("g")
          .attr("class", "mouse-per-line");

        mousePerLine
          .append("circle")
          .attr("r", 7)
          .style("stroke", "black")
          .style("fill", "none")
          .style("stroke-width", "1px")
          .style("opacity", "0");

        mousePerLine
          .append("text")
          .attr("class", "shadow")
          .attr("transform", "translate(10,3)");

        mousePerLine
          .append("text")
          .attr("class", "fill")
          .attr("transform", "translate(10,3)");

        // cache y(val) so we can calculate outside of addChart()
        const metricY = metrics.reduce((map, key) => {
          const fn = d3.scaleLinear().range([chartHeight, 0]);
          if (key === "wind_direction") {
            fn.domain([0, 380]);
          } else {
            fn.domain([
              key === "wind_speed" || key === "wind_gust"
                ? 0
                : d3.min(data, (v) => parseInt(v[key], 10)) - 2,
              d3.max(data, (v) => parseInt(v[key], 10)) + 2,
            ]);
          }
          return {
            ...map,
            [key]: fn,
          };
        }, {});

        mouseG
          .append("svg:rect") // append a rect to catch mouse movements on canvas
          .attr("width", width) // can't catch mouse events on a g element
          .attr("height", containerHeight)
          .attr("fill", "none")
          .attr("pointer-events", "all")
          .on("mouseout", () => setMouseOverOpacity(0))
          .on("mouseover", () => setMouseOverOpacity(1))
          .on("mousemove", function onMouseMove() {
            // this usage necessitates non arrow func
            // our rect includes margins, which we want for usability
            let [mouseX] = d3.mouse(this);
            if (mouseX < margin.left) {
              mouseX = margin.left;
            } else if (mouseX > width - margin.right) {
              mouseX = width - margin.right;
            }

            // vertical line that follows mouse
            d3.select(".mouse-line").attr(
              "d",
              () => `M${mouseX},${containerHeight} ${mouseX},0`
            );

            // find intersection of x position and relevant line
            const xIntersect = x.invert(mouseX - margin.left); // our rect includes margins
            const bisect = d3.bisector(({ timestamp }) => timestamp).right;
            const index = bisect(data, xIntersect);
            const intersection = data[index] || data[index - 1]; // -1 for when at right edge

            // add circle and text label
            d3.selectAll(".mouse-per-line")
              .attr(
                "transform",
                (key, i) =>
                  `translate(${margin.left + x(intersection.timestamp)}, ${
                    metricY[key](intersection[key]) + chartHeight * i
                  })`
              )
              .selectAll("text.shadow")
              .text((key) => intersection[key]);

            d3.selectAll(".mouse-per-line")
              .attr(
                "transform",
                (key, i) =>
                  `translate(${margin.left + x(intersection.timestamp)}, ${
                    metricY[key](intersection[key]) + chartHeight * i
                  })`
              )
              .selectAll("text.fill")
              .text((key) => intersection[key]);
          });
        ///////////////////////////////////////////////////
        ////////////// END MOUSEOVER CODE /////////////////
        ///////////////////////////////////////////////////
      }
    );
  };

  initSnowDepthChart();
  // initPrev10Charts(['temperature', 'wind_gust', 'wind_direction']);
  fetchNwsForecast();
});
