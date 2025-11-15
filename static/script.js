"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* global d3 */
var AVERAGE_SEASON = "Average Season";

var getCurrentSeason = function getCurrentSeason() {
  var date = new Date();
  var month = date.getMonth() + 1;
  var year = date.getFullYear();
  return month < 9 ? "".concat(year - 1, "-").concat(year) : "".concat(year, "-").concat(year + 1);
};

var transformRow = function transformRow(season) {
  var parseTime = function parseTime(date) {
    var year = date.split("/")[0] > 7 ? 1900 : 1901;
    return d3.timeParse("%0m/%0d/%Y")("".concat(date, "/").concat(year));
  };

  return {
    season: season.year,
    values: Object.keys(season).slice(1) // remove header label
    .filter(function (date) {
      return season[date];
    }).map(function (date) {
      return {
        date: parseTime(date),
        snowDepth: parseInt(season[date], 10)
      };
    })
  };
};

function interpolateValueForDate(values, targetDate) {
  // First check if we have an exact match
  var exactMatch = values.find(function (d) {
    return d.date.getMonth() === targetDate.getMonth() && d.date.getDate() === targetDate.getDate();
  });

  if (exactMatch) {
    return exactMatch.snowDepth;
  } // If no exact match, find the closest dates before and after
  // First convert all dates to a standardized year for comparison


  var standardYear = 2000; // Arbitrary standard year

  var targetTime = new Date(standardYear, targetDate.getMonth(), targetDate.getDate()).getTime(); // Standardize all dates to the same year for comparison

  var standardizedValues = values.map(function (d) {
    return _objectSpread(_objectSpread({}, d), {}, {
      standardTime: new Date(standardYear, d.date.getMonth(), d.date.getDate()).getTime()
    });
  }); // Find the closest points before and after

  var before = _toConsumableArray(standardizedValues).filter(function (d) {
    return d.standardTime <= targetTime;
  }).sort(function (a, b) {
    return b.standardTime - a.standardTime;
  })[0];

  var after = _toConsumableArray(standardizedValues).filter(function (d) {
    return d.standardTime >= targetTime;
  }).sort(function (a, b) {
    return a.standardTime - b.standardTime;
  })[0]; // If we don't have points on both sides, return the one we have or 0


  if (!before) return after ? after.snowDepth : 0;
  if (!after) return before.snowDepth; // Linear interpolation

  var ratio = (targetTime - before.standardTime) / (after.standardTime - before.standardTime);
  return Math.round(before.snowDepth + ratio * (after.snowDepth - before.snowDepth));
}

function fetchNwsForecast() {
  var xhr = new XMLHttpRequest();

  xhr.onload = function () {
    var response = xhr.responseXML.documentElement;
    var forecast = response.querySelector("data[type='forecast']");
    var wordedForecastNode = forecast.querySelector("wordedForecast"); // this key is how we match the word forecast to the dates they represent

    var wordedForecastTimeLayoutKey = wordedForecastNode.getAttribute("time-layout"); // map over each forecast text node and grab the contents

    var wordedForecast = Array.from(wordedForecastNode.querySelectorAll("text")).map(function (textNode) {
      return textNode.innerHTML;
    }); // Numerous forecasts of varying time ranges are in the XML document, get
    // them all so we can find the desired match

    var timeLayouts = forecast.querySelectorAll("time-layout");
    var matchingTimeLayout = Array.from(timeLayouts).find(function (layout) {
      return layout.querySelector("layout-key").innerHTML === wordedForecastTimeLayoutKey;
    }); // Pull name of forecast time period from element attribute

    var forecastTimes = Array.from(matchingTimeLayout.querySelectorAll("start-valid-time")).map(function (period) {
      return period.getAttribute("period-name");
    }); // Generate HTML from the forecast data for our HTML

    var newForecastAsString = forecastTimes.slice(0, 7).reduce(function (string, time, i) {
      return string += "\n        <div>\n          <h5 class='forecast_period'>".concat(time, "</h5>\n          <p class='forecast_content'>").concat(wordedForecast[i], "</p>\n        </div>\n      ");
    }, ""); // Add our forecast to our HTML

    document.getElementById("nws_worded_forecast").innerHTML = newForecastAsString;
  };

  xhr.open("GET", "https://forecast.weather.gov/MapClick.php?lat=44.5437&lon=-72.8143&unit=0&lg=english&FcstType=dwml");
  xhr.responseType = "document";
  xhr.send();
}

var setMouseOverOpacity = function setMouseOverOpacity(opacity) {
  d3.select(".mouse-line").style("opacity", opacity);
  d3.selectAll(".mouse-per-line circle").style("opacity", opacity);
  d3.selectAll(".mouse-per-line text").style("opacity", opacity);
};

document.addEventListener("DOMContentLoaded", function () {
  ///////////////////////////////////////////////////
  ///////// GLOBALS FOR USE BY CHARTS ///////////////
  ///////////////////////////////////////////////////
  var margin = {
    top: 10,
    right: 30,
    bottom: 30,
    left: 15
  };
  var largeWidthThreshold = 600;
  var width = document.getElementById("chart_container").clientWidth;
  var height = width / 2;
  var fontSize = "".concat(width > largeWidthThreshold ? 16 : 10, "px"); ///////////////////////////////////////////////////
  //////////////// END GLOBALS //////////////////////
  ///////////////////////////////////////////////////

  var updateSnowDepthChart = function updateSnowDepthChart(_ref) {
    var data = _ref.data,
        _ref$comparisonYear = _ref.comparisonYear,
        comparisonYear = _ref$comparisonYear === void 0 ? AVERAGE_SEASON : _ref$comparisonYear,
        line = _ref.line,
        seasonContainer = _ref.seasonContainer;
    var season = seasonContainer.selectAll(".season").data(data.filter(function (d) {
      return d.season !== comparisonYear;
    }), function (d) {
      return d.season;
    });
    season.enter().append("g").merge(season).attr("class", function (d) {
      return "season x".concat(d.season);
    }).select("path").attr("class", "line").attr("d", function (d) {
      return line(d.values);
    });
    var currentSeason = seasonContainer.select(".x".concat(getCurrentSeason())).attr("class", "season current");
    var comparisonSeason = season.exit();
    comparisonSeason.attr("class", "season comparison").raise(); // if we have data, update legend and last updated

    if (currentSeason.data().length > 0) {
      // update legend with current snow depth
      var currentSeasonData = currentSeason.data()[0].values;
      var latestData = currentSeasonData[currentSeasonData.length - 1];
      var latestDepth = latestData.snowDepth;
      d3.select("#currentDepth").text(latestDepth); // upate last updated

      var lastUpdated = new Date(latestData.date);
      lastUpdated.setYear(new Date().getFullYear());
      d3.select("#last_updated").text(lastUpdated.toLocaleDateString()); // update legend with comparison season

      var comparisonData = comparisonSeason.data()[0];
      var interpolatedComparisonDepth = interpolateValueForDate(comparisonData.values, lastUpdated);
      d3.select("#comparisonDepth").text(interpolatedComparisonDepth);
      d3.select("#comparisonLabel").text("".concat(comparisonData.season)); // need to call raise after raising comparison season

      currentSeason.raise();
    } else {
      d3.select("#currentDepth").text(0);
      d3.select("#last_updated").text("No data yet for season!");
    }
  };

  var calculateSeasonReview = function calculateSeasonReview(data) {
    var _seasonData$values;

    // Get the CURRENT season (the one we're in now)
    var currentSeasonName = getCurrentSeason();
    console.log('Looking for current season:', currentSeasonName); // Find the season data

    var seasonData = data.find(function (s) {
      return s.season === currentSeasonName;
    });
    console.log('Found season data:', seasonData ? 'yes' : 'no', (seasonData === null || seasonData === void 0 ? void 0 : (_seasonData$values = seasonData.values) === null || _seasonData$values === void 0 ? void 0 : _seasonData$values.length) || 0, 'values');

    if (!seasonData || seasonData.values.length === 0) {
      console.log('No data for', currentSeasonName);
      return;
    } // Calculate max depth and date


    var maxEntry = seasonData.values.reduce(function (max, entry) {
      return entry.snowDepth > max.snowDepth ? entry : max;
    });
    var maxDepth = maxEntry.snowDepth;
    var maxDate = maxEntry.date; // Get all historical seasons (excluding average season and current season)

    var historicalSeasons = data.filter(function (s) {
      return s.season !== AVERAGE_SEASON && s.season !== currentSeasonName && s.values.length > 0;
    }); // Calculate max depths for all seasons for ranking

    var allMaxDepths = historicalSeasons.map(function (season) {
      var seasonMax = season.values.reduce(function (max, entry) {
        return entry.snowDepth > max.snowDepth ? entry : max;
      });
      return {
        season: season.season,
        maxDepth: seasonMax.snowDepth
      };
    }); // Add current season to the list for ranking

    allMaxDepths.push({
      season: currentSeasonName,
      maxDepth: maxDepth
    }); // Sort by max depth (descending) and find ranking

    allMaxDepths.sort(function (a, b) {
      return b.maxDepth - a.maxDepth;
    });
    var ranking = allMaxDepths.findIndex(function (s) {
      return s.season === currentSeasonName;
    }) + 1; // Calculate average max depth

    var averageMaxDepth = Math.round(allMaxDepths.reduce(function (sum, s) {
      return sum + s.maxDepth;
    }, 0) / allMaxDepths.length); // Find last (most recent) snowier season
    // Get all seasons with higher max depth than current season

    var snowierSeasons = allMaxDepths.filter(function (s) {
      return s.maxDepth > maxDepth && s.season !== currentSeasonName;
    }); // Sort by season year (descending) to get most recent first
    // Season format is "YYYY-YYYY", so we can sort as strings

    snowierSeasons.sort(function (a, b) {
      return b.season.localeCompare(a.season);
    });
    var lastSnowierSeason = snowierSeasons.length > 0 ? snowierSeasons[0] : null; // Helper function for ranking suffix

    var getRankingSuffix = function getRankingSuffix(rank) {
      if (rank % 10 === 1 && rank % 100 !== 11) return 'st';
      if (rank % 10 === 2 && rank % 100 !== 12) return 'nd';
      if (rank % 10 === 3 && rank % 100 !== 13) return 'rd';
      return 'th';
    }; // Format date


    var formatDate = function formatDate(date) {
      var options = {
        month: 'short',
        day: 'numeric'
      };
      return date.toLocaleDateString('en-US', options);
    }; // Update the DOM - New structure


    var depthEl = document.getElementById('season-review-depth');
    depthEl.textContent = maxDepth;
    depthEl.classList.add('visible'); // Update average

    var averageEl = document.getElementById('season-review-average');
    averageEl.textContent = "".concat(averageMaxDepth, "\"");
    averageEl.classList.add('visible'); // Update difference

    var difference = maxDepth - averageMaxDepth;
    var differenceEl = document.getElementById('season-review-difference');
    differenceEl.textContent = "".concat(difference >= 0 ? '+' : '').concat(difference, "\"");
    differenceEl.classList.add('visible');
    differenceEl.classList.remove('difference-positive', 'difference-negative');
    differenceEl.classList.add(difference >= 0 ? 'difference-positive' : 'difference-negative');
    var dateEl = document.getElementById('season-review-date');
    dateEl.textContent = formatDate(maxDate);
    dateEl.classList.add('visible'); // Update winter ranking

    var rankingEl = document.getElementById('season-review-ranking');
    rankingEl.textContent = "#".concat(ranking);
    rankingEl.classList.add('visible');
    var lastSnowierEl = document.getElementById('season-review-last-snowier');

    if (lastSnowierSeason) {
      lastSnowierEl.textContent = lastSnowierSeason.season;
      lastSnowierEl.classList.add("clickable");

      lastSnowierEl.onclick = function () {
        var seasonSelect = document.getElementById("select-season");
        seasonSelect.value = lastSnowierSeason.season;
        seasonSelect.dispatchEvent(new Event('change'));
      };
    } else {
      lastSnowierEl.textContent = 'None';
    }

    lastSnowierEl.classList.add('visible');
    console.log('Updated season review for', currentSeasonName, 'with max depth', maxDepth);
  };

  var updateMetricsGrid = function updateMetricsGrid(currentDepth, historicalData) {
    // Find latest measurement date from current season
    var currentSeason = historicalData.find(function (s) {
      return s.season === getCurrentSeason();
    });
    var lastMeasurement = currentSeason === null || currentSeason === void 0 ? void 0 : currentSeason.values[currentSeason.values.length - 1];

    if (!lastMeasurement) {
      return; // No data yet for current season
    } // Format date


    var formatDate = function formatDate(date) {
      var options = {
        month: 'short',
        day: 'numeric'
      };
      return date.toLocaleDateString('en-US', options);
    }; // Get the comparison season data for this date (always use AVERAGE_SEASON)


    var comparisonSeason = historicalData.find(function (s) {
      return s.season === AVERAGE_SEASON;
    });
    var interpolatedComparison = interpolateValueForDate(comparisonSeason.values, lastMeasurement.date);
    var average = interpolatedComparison; // Get historical values for this date using interpolation (excluding average season)

    var historicalValues = historicalData.filter(function (season) {
      return season.season !== getCurrentSeason() && season.season !== AVERAGE_SEASON;
    }).map(function (season) {
      return interpolateValueForDate(season.values, lastMeasurement.date);
    }).filter(function (depth) {
      return depth !== null;
    }); // Calculate difference from average

    var difference = currentDepth - average; // Count snowier winters

    var snowierWinters = historicalValues.filter(function (depth) {
      return depth > currentDepth;
    }).length; // Find last snowier winter

    var lastSnowierWinterData = historicalData.filter(function (season) {
      // Skip current season and average season
      if (season.season === getCurrentSeason() || season.season === AVERAGE_SEASON) {
        return false;
      } // Use interpolation to compare snow depths


      var interpolatedDepth = interpolateValueForDate(season.values, lastMeasurement.date);
      return interpolatedDepth > currentDepth;
    }).pop();
    var lastSnowierWinter = lastSnowierWinterData ? function () {
      var year = lastSnowierWinterData.season.split("-")[0];
      return "".concat(year, "-").concat((parseInt(year) + 1).toString().slice(-2));
    }() : "None"; // Update DOM - New structure

    var metrics = {
      ".hero-value": currentDepth,
      "#average-depth": "".concat(average, "\""),
      "#difference": "".concat(difference > 0 ? "+" : "").concat(difference, "\""),
      "#last-snowier": lastSnowierWinter,
      "#snowier-count": "#".concat(snowierWinters + 1),
      "#last-update-date": formatDate(lastMeasurement.date)
    };
    Object.entries(metrics).forEach(function (_ref2) {
      var _ref3 = _slicedToArray(_ref2, 2),
          selector = _ref3[0],
          value = _ref3[1];

      var element = document.querySelector(selector);

      if (element) {
        element.textContent = value;
        element.classList.add("visible");
      }
    }); // Add/remove positive/negative classes for difference

    var differenceEl = document.querySelector("#difference");

    if (differenceEl) {
      differenceEl.classList.remove("difference-positive", "difference-negative");
      differenceEl.classList.add(difference > 0 ? "difference-positive" : "difference-negative");
    } // Make last snowier winter clickable


    var lastSnowierEl = document.querySelector("#last-snowier");

    if (lastSnowierEl && lastSnowierWinterData) {
      lastSnowierEl.classList.add("clickable");

      lastSnowierEl.onclick = function () {
        var seasonSelect = document.getElementById("select-season");
        seasonSelect.value = lastSnowierWinterData.season;
        seasonSelect.dispatchEvent(new Event('change'));
      };
    }
  };

  var addMouseoverFunctionality = function addMouseoverFunctionality(_ref4) {
    var data = _ref4.data,
        seasonContainer = _ref4.seasonContainer,
        x = _ref4.x,
        y = _ref4.y,
        line = _ref4.line,
        width = _ref4.width,
        height = _ref4.height,
        margin = _ref4.margin,
        getSelectedSeason = _ref4.getSelectedSeason,
        setSelectedSeason = _ref4.setSelectedSeason;

    // Find the closest season to a given mouse position
    var findClosestSeason = function findClosestSeason(mouseX, mouseY) {
      var xDate = x.invert(mouseX);
      var closestSeason = null;
      var minDistance = Infinity;
      var directHitSeason = null; // Get all seasons except current season (since it's always highlighted)

      var availableSeasons = data.filter(function (s) {
        return s.season !== getCurrentSeason();
      });
      availableSeasons.forEach(function (season) {
        // Find the closest data point to the mouse x position
        if (season.values.length === 0) return;
        var bisect = d3.bisector(function (d) {
          return d.date;
        }).left;
        var index = bisect(season.values, xDate); // Check both surrounding points

        var candidates = [season.values[index - 1], season.values[index]].filter(Boolean);
        candidates.forEach(function (point) {
          var pointX = x(point.date);
          var pointY = y(point.snowDepth);
          var distance = Math.sqrt(Math.pow(mouseX - pointX, 2) + Math.pow(mouseY - pointY, 2)); // Check for very close proximity to actual line points (direct hit)

          if (distance <= 5) {
            // 5 pixel tolerance for direct hits
            directHitSeason = season.season;
          }

          if (distance < minDistance) {
            minDistance = distance;
            closestSeason = season.season;
          }
        }); // Also check distance to line segments between points for better accuracy

        if (candidates.length === 2) {
          var _candidates = _slicedToArray(candidates, 2),
              point1 = _candidates[0],
              point2 = _candidates[1];

          var x1 = x(point1.date);
          var y1 = y(point1.snowDepth);
          var x2 = x(point2.date);
          var y2 = y(point2.snowDepth); // Calculate distance from mouse to line segment

          var A = mouseX - x1;
          var B = mouseY - y1;
          var C = x2 - x1;
          var D = y2 - y1;
          var dot = A * C + B * D;
          var lenSq = C * C + D * D;

          if (lenSq !== 0) {
            var param = dot / lenSq;
            var xx, yy;

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

            var segmentDistance = Math.sqrt(Math.pow(mouseX - xx, 2) + Math.pow(mouseY - yy, 2)); // Check for very close proximity to line segment (direct hit)

            if (segmentDistance <= 3) {
              // 3 pixel tolerance for direct line hits
              directHitSeason = season.season;
            }

            if (segmentDistance < minDistance) {
              minDistance = segmentDistance;
              closestSeason = season.season;
            }
          }
        }
      }); // If we have a direct hit, always return that

      if (directHitSeason) {
        return directHitSeason;
      } // Otherwise, only return if reasonably close (within 20 pixels)


      return minDistance < 20 ? closestSeason : null;
    }; // Create invisible overlay for mouse events


    var mouseOverlay = seasonContainer.append("rect").attr("class", "mouse-overlay").attr("width", width - margin.left - margin.right).attr("height", height - margin.top - margin.bottom).attr("x", margin.left).attr("y", margin.top).style("fill", "none").style("pointer-events", "all").style("cursor", "pointer");
    mouseOverlay.on("mousemove", function () {
      var _d3$mouse = d3.mouse(this),
          _d3$mouse2 = _slicedToArray(_d3$mouse, 2),
          mouseX = _d3$mouse2[0],
          mouseY = _d3$mouse2[1];

      var hoveredSeason = findClosestSeason(mouseX, mouseY); // Remove previous hover highlighting

      seasonContainer.selectAll(".season").classed("hovered", false); // Add hover highlighting to the hovered line

      if (hoveredSeason) {
        seasonContainer.selectAll(".season.x".concat(hoveredSeason)).classed("hovered", true);
      }
    }).on("mouseleave", function () {
      // Remove all hover highlighting when mouse leaves the chart area
      seasonContainer.selectAll(".season").classed("hovered", false);
    }).on("click", function () {
      var _d3$mouse3 = d3.mouse(this),
          _d3$mouse4 = _slicedToArray(_d3$mouse3, 2),
          mouseX = _d3$mouse4[0],
          mouseY = _d3$mouse4[1];

      var clickedSeason = findClosestSeason(mouseX, mouseY);

      if (clickedSeason) {
        // Update dropdown (which will trigger chart update)
        var seasonSelect = document.getElementById("select-season");
        seasonSelect.value = clickedSeason;
        seasonSelect.dispatchEvent(new Event('change'));
      }
    });
  };

  var initSnowDepthChart = function initSnowDepthChart() {
    /* SET UP SVG ELEMENT AND D3 SHARED OBJECTS */
    var seasonSelect = document.getElementById("select-season");
    var selectedSeason = AVERAGE_SEASON; // Track persisted selection for mouseover

    var g = d3.select("#snow_depth_chart").attr("width", width).attr("height", height);
    var seasonContainer = g.append("g").attr("class", "season-container");
    var x = d3.scaleTime().range([margin.left, width - margin.right - margin.left]);
    var y = d3.scaleLinear().range([height - margin.bottom, margin.top]); // hard coded values

    x.domain([new Date(2000, 8, 1), new Date(2001, 5, 30)]);
    y.domain([0, 150]);
    var line = d3.line().curve(d3.curveBasis).x(function (d) {
      return x(d.date);
    }).y(function (d) {
      return y(d.snowDepth);
    });
    var xAxis = g.append("g").attr("class", "axis axis--x").attr("transform", "translate(0,".concat(height - margin.bottom, ")")).style("font-size", fontSize).call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b")));
    var yAxis = g.append("g").attr("class", "axis axis--y").attr("transform", "translate(".concat(width - margin.right - margin.left, ", 0)")).style("font-size", fontSize).call(d3.axisRight(y)).append("text").attr("transform", "rotate(-90)").attr("y", -20).attr("dy", "0.71em").attr("x", width > 400 ? -165 : -120).style("fill", "#000").style("font-size", width > 400 ? "16px" : "12px").text("Snow Depth, inches");
    /* REQUEST DATA, DRAW CHART AND AXIS */

    d3.csv("https://s3.amazonaws.com/matthewparrilla.com/snow-depth.csv", transformRow, function (csv) {
      var data = csv.filter(function (season) {
        return season.season !== "";
      }); // update axes values with actual data

      x.domain([d3.min(data, function (season) {
        return d3.min(season.values, function (date) {
          return date.date;
        });
      }), d3.max(data, function (season) {
        return d3.max(season.values, function (date) {
          return date.date;
        });
      })]);
      y.domain([0, d3.max(data, function (season) {
        return d3.max(season.values, function (date) {
          return date.snowDepth;
        });
      })]);
      xAxis.call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b")));
      yAxis.call(d3.axisRight(y));
      seasonContainer.selectAll(".season").data(data, function (d) {
        return d.season;
      }).enter().append("g").attr("class", function (d) {
        return "season x".concat(d.season);
      }).append("path").attr("class", "line").attr("d", function (d) {
        return line(d.values);
      }); // create grid lines for y-axis

      seasonContainer.append("g").attr("class", "grid-lines").selectAll("g.grid-line").data([20, 40, 60, 80, 100, 120, 140]).enter().append("line").attr("class", "grid-line").attr("x1", 0).attr("x2", width).attr("y1", function (d) {
        return y(d);
      }).attr("y2", function (d) {
        return y(d);
      });
      updateSnowDepthChart({
        data: data,
        line: line,
        seasonContainer: seasonContainer
      }); // Get current season's latest depth

      var currentSeason = data.find(function (s) {
        return s.season === getCurrentSeason();
      });
      var currentDepth = currentSeason ? currentSeason.values[currentSeason.values.length - 1].snowDepth : 0; // Update metrics grid

      updateMetricsGrid(currentDepth, data); // Calculate and display season review (April-September only)

      calculateSeasonReview(data); // Add mouseover functionality

      addMouseoverFunctionality({
        data: data,
        seasonContainer: seasonContainer,
        x: x,
        y: y,
        line: line,
        width: width,
        height: height,
        margin: margin,
        getSelectedSeason: function getSelectedSeason() {
          return selectedSeason;
        },
        setSelectedSeason: function setSelectedSeason(season) {
          selectedSeason = season;
        }
      }); // Add seasons to dropdown options

      data.map(function (_ref5) {
        var season = _ref5.season;
        return season;
      }).filter(function (season) {
        return season && season !== getCurrentSeason() && season !== AVERAGE_SEASON;
      }) // Add AVERAGE_SEASON to filter
      .reverse().forEach(function (season) {
        var option = document.createElement("option");
        option.value = season;
        option.text = season;
        seasonSelect.add(option, null);
      });
      seasonSelect.value = AVERAGE_SEASON; // add event listener to select season

      seasonSelect.onchange = function (_ref6) {
        var comparisonYear = _ref6.target.value;
        selectedSeason = comparisonYear; // Update the tracked selection

        updateSnowDepthChart({
          data: data,
          line: line,
          seasonContainer: seasonContainer,
          comparisonYear: comparisonYear
        });
      };
    });
  }; // TODO: make this more performant (maybe reverse and find, then slice)
  // or consider slicing in lambda (better)


  var filterToLast10 = function filterToLast10(data) {
    var today = new Date();
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    return data // filter to last 10 days with temperatures above -100 (bad temp values are -9999
    .filter(function (_ref7) {
      var timestamp = _ref7.timestamp,
          temperature = _ref7.temperature;
      return Math.round((today - timestamp) / millisecondsPerDay) < 10 && temperature > -100;
    }).map(function (entry) {
      return _objectSpread(_objectSpread({}, entry), {}, {
        // bad values are -9999, but lets always throw out < 0
        wind_speed: entry.wind_direction < 0 ? null : entry.wind_speed,
        wind_gust: entry.wind_direction < 0 ? null : entry.wind_gust
      });
    });
  }; // Line chart with hover based on:
  // https://bl.ocks.org/larsenmtl/e3b8b7c2ca4787f77d78f58d41c3da91
  // http://www.d3noob.org/2014/07/my-favourite-tooltip-method-for-line.html


  var initPrev10Charts = function initPrev10Charts(metrics) {
    var chartHeight = width > largeWidthThreshold ? 150 : (height - margin.top - margin.bottom) / metrics.length;
    var containerHeight = chartHeight * metrics.length;
    var x = d3.scaleTime().range([0, width - margin.left - margin.right]);
    var y = d3.scaleLinear().range([chartHeight, 0]);
    var line = d3.line().x(function (d) {
      return x(d.timestamp);
    }).curve(d3.curveBasis);
    var xAxis = d3.axisBottom().scale(x);
    var yAxis = d3.axisRight().ticks(5).scale(y);
    d3.select("#prev_10_charts").attr("width", width + margin.left + margin.right).attr("height", containerHeight + margin.top + margin.bottom);

    var transformDate = function transformDate(row) {
      return _objectSpread(_objectSpread({}, row), {}, {
        timestamp: new Date(row.timestamp),
        // "no data" for wind is identified by wind direction -9999
        wind_direction: row.wind_direction < 0 ? null : row.wind_direction,
        wind_speed: row.wind_direction < 0 ? null : row.wind_speed,
        wind_gust: row.wind_direction < 0 ? null : row.wind_gust
      });
    };

    var metricLabel = {
      temperature: "Temperature",
      wind_direction: "Wind Direction",
      wind_speed: "Wind Speed",
      wind_gust: "Wind Gust"
    };

    var addChart = function addChart(data, key, order) {
      var g = d3.select("#prev_10_charts").select("#".concat(key)).attr("transform", "translate(".concat(margin.left, ",").concat(chartHeight * order + margin.top, ")"));
      var values = data.map(function (d) {
        return parseInt(d[key], 10);
      });
      x.domain(d3.extent(data, function (d) {
        return d.timestamp;
      }));

      if (key === "wind_direction") {
        y.domain([0, 380]);
      } else {
        y.domain([key === "wind_speed" || key === "wind_gust" ? 0 : d3.min(values) - 2, d3.max(values) + 2]);
      }

      g.append("text").text(metricLabel[key]).attr("class", "mini_chart_label ".concat(key)).attr("y", chartHeight - 1.5 * margin.top).attr("dy", "0.71em").style("font-size", fontSize).attr("x", 0);
      line.y(function (d) {
        return y(d[key]);
      }).defined(function (d) {
        return d[key] !== null;
      });

      if (key === "temperature") {
        g.append("path").attr("class", "line freezing").attr("d", line(data.map(function (d) {
          return _objectSpread(_objectSpread({}, d), {}, {
            temperature: 32
          });
        }))).style("fill-opacity", 0).style("stroke-width", 1.5);
      }

      g.append("g").attr("class", "y axis").style("font-size", fontSize).attr("transform", "translate(".concat(width - margin.left - margin.right, ", 0)")).call(yAxis);
      g.append("path").attr("class", "line prev_10_line ".concat(key)).attr("d", line(data)).style("fill-opacity", 0).style("stroke-width", 1.5); // Only show tick labels on last row

      if (order === metrics.length - 1) {
        xAxis.tickFormat(d3.timeFormat(width > 400 ? "%b %d" : "%m/%d"));
      } else {
        xAxis.tickFormat("");
      }

      g.append("g").attr("class", "x axis").attr("transform", "translate(0,".concat(chartHeight, ")")).style("font-size", fontSize).call(xAxis);
    }; // Download data, filter it, and render chart


    d3.csv("https://s3.amazonaws.com/matthewparrilla.com/mansfield_observations.csv", transformDate, function (unfilteredData) {
      var data = filterToLast10(unfilteredData);
      metrics.forEach(function (metric, i) {
        return addChart(data, metric, i);
      }); // TODO: add wind gust to wind_speed
      ///////////////////////////////////////////////////
      //////////// BEGIN MOUSEOVER CODE /////////////////
      ///////////////////////////////////////////////////

      var mouseG = d3.select("#prev_10_charts").append("g").attr("class", "mouse-over-effects").attr("transform", "translate(0,".concat(margin.top, ")"));
      mouseG.append("path") // this is the black vertical line to follow mouse
      .attr("class", "mouse-line").style("stroke", "black").style("stroke-width", "1px").style("opacity", "0");
      var mousePerLine = mouseG.selectAll(".mouse-per-line").data(metrics).enter().append("g").attr("class", "mouse-per-line");
      mousePerLine.append("circle").attr("r", 7).style("stroke", "black").style("fill", "none").style("stroke-width", "1px").style("opacity", "0");
      mousePerLine.append("text").attr("class", "shadow").attr("transform", "translate(10,3)");
      mousePerLine.append("text").attr("class", "fill").attr("transform", "translate(10,3)"); // cache y(val) so we can calculate outside of addChart()

      var metricY = metrics.reduce(function (map, key) {
        var fn = d3.scaleLinear().range([chartHeight, 0]);

        if (key === "wind_direction") {
          fn.domain([0, 380]);
        } else {
          fn.domain([key === "wind_speed" || key === "wind_gust" ? 0 : d3.min(data, function (v) {
            return parseInt(v[key], 10);
          }) - 2, d3.max(data, function (v) {
            return parseInt(v[key], 10);
          }) + 2]);
        }

        return _objectSpread(_objectSpread({}, map), {}, _defineProperty({}, key, fn));
      }, {});
      mouseG.append("svg:rect") // append a rect to catch mouse movements on canvas
      .attr("width", width) // can't catch mouse events on a g element
      .attr("height", containerHeight).attr("fill", "none").attr("pointer-events", "all").on("mouseout", function () {
        return setMouseOverOpacity(0);
      }).on("mouseover", function () {
        return setMouseOverOpacity(1);
      }).on("mousemove", function onMouseMove() {
        // this usage necessitates non arrow func
        // our rect includes margins, which we want for usability
        var _d3$mouse5 = d3.mouse(this),
            _d3$mouse6 = _slicedToArray(_d3$mouse5, 1),
            mouseX = _d3$mouse6[0];

        if (mouseX < margin.left) {
          mouseX = margin.left;
        } else if (mouseX > width - margin.right) {
          mouseX = width - margin.right;
        } // vertical line that follows mouse


        d3.select(".mouse-line").attr("d", function () {
          return "M".concat(mouseX, ",").concat(containerHeight, " ").concat(mouseX, ",0");
        }); // find intersection of x position and relevant line

        var xIntersect = x.invert(mouseX - margin.left); // our rect includes margins

        var bisect = d3.bisector(function (_ref8) {
          var timestamp = _ref8.timestamp;
          return timestamp;
        }).right;
        var index = bisect(data, xIntersect);
        var intersection = data[index] || data[index - 1]; // -1 for when at right edge
        // add circle and text label

        d3.selectAll(".mouse-per-line").attr("transform", function (key, i) {
          return "translate(".concat(margin.left + x(intersection.timestamp), ", ").concat(metricY[key](intersection[key]) + chartHeight * i, ")");
        }).selectAll("text.shadow").text(function (key) {
          return intersection[key];
        });
        d3.selectAll(".mouse-per-line").attr("transform", function (key, i) {
          return "translate(".concat(margin.left + x(intersection.timestamp), ", ").concat(metricY[key](intersection[key]) + chartHeight * i, ")");
        }).selectAll("text.fill").text(function (key) {
          return intersection[key];
        });
      }); ///////////////////////////////////////////////////
      ////////////// END MOUSEOVER CODE /////////////////
      ///////////////////////////////////////////////////
    });
  };

  var initWeatherCharts = function initWeatherCharts() {
    fetch('https://s3.amazonaws.com/matthewparrilla.com/mansfield-observations.json').then(function (response) {
      return response.json();
    }).then(function (data) {
      var observations = data.observations.map(function (obs) {
        return _objectSpread(_objectSpread({}, obs), {}, {
          timestamp: new Date(obs.timestamp)
        });
      }); // Temperature Chart - keep all observations, nulls will create gaps

      createWeatherChart({
        containerId: 'temperature_chart',
        data: observations,
        valueKey: 'temperature_f',
        yLabel: 'Temperature (°F)',
        color: '#e3624f',
        showFreezingLine: true
      }); // Wind Speed Chart - keep all observations, nulls will create gaps

      createWeatherChart({
        containerId: 'wind_chart',
        data: observations,
        valueKey: 'wind_speed_mph',
        yLabel: 'Wind Speed (mph)',
        color: '#1E88E5',
        showFreezingLine: false
      });
    });
  };

  var createWeatherChart = function createWeatherChart(_ref9) {
    var containerId = _ref9.containerId,
        data = _ref9.data,
        valueKey = _ref9.valueKey,
        yLabel = _ref9.yLabel,
        color = _ref9.color,
        showFreezingLine = _ref9.showFreezingLine;
    var container = document.getElementById(containerId);
    var containerWidth = container.parentElement.clientWidth;
    var chartWidth = containerWidth;
    var chartHeight = containerWidth / 3;
    var chartMargin = {
      top: 20,
      right: 60,
      bottom: 40,
      left: 60
    };
    var svg = d3.select("#".concat(containerId)).attr('width', chartWidth).attr('height', chartHeight); // Filter data for domain calculation (exclude nulls)

    var validData = data.filter(function (d) {
      return d[valueKey] !== null;
    });
    var x = d3.scaleTime().domain(d3.extent(data, function (d) {
      return d.timestamp;
    })).range([chartMargin.left, chartWidth - chartMargin.right]);
    var y = d3.scaleLinear().domain([d3.min(validData, function (d) {
      return d[valueKey];
    }) - 5, d3.max(validData, function (d) {
      return d[valueKey];
    }) + 5]).range([chartHeight - chartMargin.bottom, chartMargin.top]);
    var line = d3.line().defined(function (d) {
      return d[valueKey] !== null;
    }) // Skip null values
    .x(function (d) {
      return x(d.timestamp);
    }).y(function (d) {
      return y(d[valueKey]);
    }).curve(d3.curveMonotoneX); // Add grid lines at ticks

    var yTicks = y.ticks(5);
    yTicks.forEach(function (tickValue) {
      svg.append('line').attr('class', 'weather-grid-line').attr('x1', chartMargin.left).attr('x2', chartWidth - chartMargin.right).attr('y1', y(tickValue)).attr('y2', y(tickValue)).attr('stroke', '#cccccc').attr('stroke-width', 1).attr('opacity', 0.5);
    }); // Add freezing line at 32°F if requested

    if (showFreezingLine) {
      svg.append('line').attr('class', 'freezing-line').attr('x1', chartMargin.left).attr('x2', chartWidth - chartMargin.right).attr('y1', y(32)).attr('y2', y(32)).attr('stroke', '#000000').attr('stroke-width', 2);
    } // Add the line


    svg.append('path').datum(data).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2).attr('d', line); // Add x-axis

    svg.append('g').attr('transform', "translate(0,".concat(chartHeight - chartMargin.bottom, ")")).call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%b %d'))).style('font-size', '12px'); // Add y-axis

    svg.append('g').attr('transform', "translate(".concat(chartWidth - chartMargin.right, ", 0)")).call(d3.axisRight(y).ticks(5)).style('font-size', '12px'); // Add y-axis label

    svg.append('text').attr('transform', 'rotate(-90)').attr('y', chartWidth - chartMargin.right + 45).attr('x', -(chartHeight / 2)).attr('text-anchor', 'middle').style('font-size', '14px').style('fill', '#374151').text(yLabel);
  };

  initSnowDepthChart();
  initWeatherCharts();
  fetchNwsForecast();
});
