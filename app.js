(function () {
  "use strict";

  // Vibrant color palette for selected countries
  const COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
    "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6",
    "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
    "#f43f5e", "#10b981", "#0891b2", "#7c3aed", "#e11d48",
  ];

  // Track which countries are selected and their assigned colors
  const selectedCountries = new Map();

  // Deterministic color assignment based on country id
  function getColorForCountry(id) {
    let hash = 0;
    const str = String(id);
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
  }

  // SVG dimensions
  const container = document.getElementById("map-container");
  const width = container.clientWidth;
  const height = container.clientHeight;

  const svg = d3.select("#map")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Define the glow filter
  const defs = svg.append("defs");

  const glowFilter = defs.append("filter")
    .attr("id", "glow")
    .attr("x", "-50%")
    .attr("y", "-50%")
    .attr("width", "200%")
    .attr("height", "200%");

  glowFilter.append("feGaussianBlur")
    .attr("stdDeviation", "2.5")
    .attr("result", "coloredBlur");

  const feMerge = glowFilter.append("feMerge");
  feMerge.append("feMergeNode").attr("in", "coloredBlur");
  feMerge.append("feMergeNode").attr("in", "SourceGraphic");

  // Map projection
  const projection = d3.geoNaturalEarth1()
    .scale(width / 5.5)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  // Draw ocean background
  svg.append("path")
    .datum({ type: "Sphere" })
    .attr("class", "ocean")
    .attr("d", path);

  // Draw graticule
  const graticule = d3.geoGraticule();
  svg.append("path")
    .datum(graticule())
    .attr("class", "graticule")
    .attr("d", path);

  // Tooltip element
  const tooltip = document.getElementById("tooltip");

  // Country name lookup (ISO 3166-1 numeric → name) for common countries
  const countryNames = {
    "004": "Afghanistan", "008": "Albania", "012": "Algeria", "024": "Angola",
    "032": "Argentina", "036": "Australia", "040": "Austria", "050": "Bangladesh",
    "056": "Belgium", "064": "Bhutan", "068": "Bolivia", "070": "Bosnia & Herz.",
    "072": "Botswana", "076": "Brazil", "100": "Bulgaria", "104": "Myanmar",
    "108": "Burundi", "112": "Belarus", "116": "Cambodia", "120": "Cameroon",
    "124": "Canada", "140": "Central African Rep.", "144": "Sri Lanka",
    "148": "Chad", "152": "Chile", "156": "China", "170": "Colombia",
    "178": "Congo", "180": "Dem. Rep. Congo", "188": "Costa Rica",
    "191": "Croatia", "192": "Cuba", "196": "Cyprus", "203": "Czechia",
    "204": "Benin", "208": "Denmark", "214": "Dominican Rep.",
    "218": "Ecuador", "222": "El Salvador", "226": "Eq. Guinea",
    "231": "Ethiopia", "232": "Eritrea", "233": "Estonia",
    "242": "Fiji", "246": "Finland", "250": "France",
    "262": "Djibouti", "266": "Gabon", "268": "Georgia", "270": "Gambia",
    "275": "Palestine", "276": "Germany", "288": "Ghana",
    "300": "Greece", "320": "Guatemala", "324": "Guinea",
    "328": "Guyana", "332": "Haiti", "340": "Honduras",
    "348": "Hungary", "352": "Iceland", "356": "India",
    "360": "Indonesia", "364": "Iran", "368": "Iraq",
    "372": "Ireland", "376": "Israel", "380": "Italy",
    "384": "Ivory Coast", "388": "Jamaica",
    "392": "Japan", "398": "Kazakhstan", "400": "Jordan",
    "404": "Kenya", "408": "North Korea", "410": "South Korea",
    "414": "Kuwait", "417": "Kyrgyzstan", "418": "Laos",
    "422": "Lebanon", "426": "Lesotho", "428": "Latvia",
    "430": "Liberia", "434": "Libya", "440": "Lithuania",
    "442": "Luxembourg", "450": "Madagascar", "454": "Malawi",
    "458": "Malaysia", "466": "Mali", "478": "Mauritania",
    "484": "Mexico", "496": "Mongolia", "498": "Moldova",
    "504": "Morocco", "508": "Mozambique", "512": "Oman",
    "516": "Namibia", "524": "Nepal", "528": "Netherlands",
    "540": "New Caledonia", "548": "Vanuatu",
    "554": "New Zealand", "558": "Nicaragua", "562": "Niger",
    "566": "Nigeria", "578": "Norway", "586": "Pakistan",
    "591": "Panama", "598": "Papua New Guinea",
    "600": "Paraguay", "604": "Peru", "608": "Philippines",
    "616": "Poland", "620": "Portugal", "630": "Puerto Rico",
    "634": "Qatar", "642": "Romania", "643": "Russia",
    "646": "Rwanda", "682": "Saudi Arabia", "686": "Senegal",
    "688": "Serbia", "694": "Sierra Leone", "702": "Singapore",
    "703": "Slovakia", "704": "Vietnam", "705": "Slovenia",
    "706": "Somalia", "710": "South Africa", "716": "Zimbabwe",
    "724": "Spain", "728": "South Sudan", "729": "Sudan",
    "732": "W. Sahara", "740": "Suriname",
    "748": "Eswatini", "752": "Sweden", "756": "Switzerland",
    "760": "Syria", "762": "Tajikistan", "764": "Thailand",
    "768": "Togo", "780": "Trinidad & Tobago",
    "784": "UAE", "788": "Tunisia", "792": "Turkey",
    "795": "Turkmenistan", "800": "Uganda", "804": "Ukraine",
    "807": "N. Macedonia", "818": "Egypt", "826": "United Kingdom",
    "834": "Tanzania", "840": "United States", "854": "Burkina Faso",
    "858": "Uruguay", "860": "Uzbekistan", "862": "Venezuela",
    "887": "Yemen", "894": "Zambia",
    "-99": "N. Cyprus", "010": "Antarctica",
  };

  // Large countries that get bigger labels
  const largeCountries = new Set([
    "840", "124", "643", "156", "076", "036", "356", "032", "398", "012"
  ]);

  // Small countries that get smaller labels (or hidden)
  const smallCountries = new Set([
    "442", "196", "070", "191", "705", "703", "233", "428", "440",
    "268", "040", "756", "208", "300", "348", "203", "056",
    "528", "372", "376", "400", "422", "275", "634", "414",
    "784", "270", "262", "630", "332", "214", "388", "780",
    "328", "740", "702", "064"
  ]);

  // Load world topology data
  const worldDataUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  d3.json(worldDataUrl).then(function (world) {
    const countries = topojson.feature(world, world.objects.countries);

    // Create a group for countries
    const countriesGroup = svg.append("g").attr("class", "countries-group");

    // Draw country paths
    countriesGroup.selectAll(".country")
      .data(countries.features)
      .join("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("data-id", function (d) { return d.id; })
      .on("click", function (event, d) {
        handleCountryClick(this, d);
      })
      .on("mouseenter", function (event, d) {
        const name = countryNames[d.id] || d.properties.name || "Unknown";
        tooltip.textContent = name;
        tooltip.style.opacity = "1";
      })
      .on("mousemove", function (event) {
        tooltip.style.left = (event.pageX + 14) + "px";
        tooltip.style.top = (event.pageY - 14) + "px";
      })
      .on("mouseleave", function () {
        tooltip.style.opacity = "0";
      });

    // Add country labels
    const labelsGroup = svg.append("g").attr("class", "labels-group");

    labelsGroup.selectAll(".country-label")
      .data(countries.features)
      .join("text")
      .attr("class", function (d) {
        let cls = "country-label";
        if (largeCountries.has(d.id)) cls += " large";
        else if (smallCountries.has(d.id)) cls += " small";
        return cls;
      })
      .attr("x", function (d) { return path.centroid(d)[0]; })
      .attr("y", function (d) { return path.centroid(d)[1]; })
      .text(function (d) {
        return countryNames[d.id] || "";
      })
      // Hide labels for very small countries where they'd overlap
      .attr("display", function (d) {
        const centroid = path.centroid(d);
        if (isNaN(centroid[0]) || isNaN(centroid[1])) return "none";
        // Calculate approximate area on screen to decide visibility
        const bounds = path.bounds(d);
        const bw = bounds[1][0] - bounds[0][0];
        const bh = bounds[1][1] - bounds[0][1];
        if (bw < 12 || bh < 10) return "none";
        return null;
      });

    // Zoom and pan
    const zoom = d3.zoom()
      .scaleExtent([1, 12])
      .on("zoom", function (event) {
        countriesGroup.attr("transform", event.transform);
        labelsGroup.attr("transform", event.transform);

        // Scale labels inversely so they stay readable when zoomed
        const k = event.transform.k;
        labelsGroup.selectAll(".country-label")
          .style("font-size", function () {
            const base = this.classList.contains("large") ? 4 :
                         this.classList.contains("small") ? 2 : 3;
            return (base / k) + "px";
          });

        // Scale stroke width inversely
        countriesGroup.selectAll(".country")
          .style("stroke-width", function () {
            return this.classList.contains("selected") ? (2 / k) + "px" : (0.5 / k) + "px";
          });

        // Show more labels when zoomed in
        labelsGroup.selectAll(".country-label")
          .attr("display", function (d) {
            const centroid = path.centroid(d);
            if (isNaN(centroid[0]) || isNaN(centroid[1])) return "none";
            const bounds = path.bounds(d);
            const bw = (bounds[1][0] - bounds[0][0]) * k;
            const bh = (bounds[1][1] - bounds[0][1]) * k;
            if (bw < 12 || bh < 10) return "none";
            return null;
          });
      });

    svg.call(zoom);

  }).catch(function (err) {
    console.error("Failed to load world map data:", err);
    document.getElementById("header").insertAdjacentHTML(
      "beforeend",
      '<p style="color:#ef4444;margin-top:8px;">Failed to load map data. Please check your internet connection.</p>'
    );
  });

  // Handle country click
  function handleCountryClick(element, d) {
    const el = d3.select(element);
    const id = d.id;

    if (selectedCountries.has(id)) {
      // Deselect
      selectedCountries.delete(id);
      el.classed("selected", false)
        .style("fill", null)
        .style("stroke", null);
    } else {
      // Select with a color
      const color = getColorForCountry(id);
      selectedCountries.set(id, color);
      el.classed("selected", true)
        .style("fill", color)
        .style("stroke", d3.color(color).brighter(1).toString());
    }
  }

  // Reset button
  document.getElementById("reset-btn").addEventListener("click", function () {
    selectedCountries.clear();
    d3.selectAll(".country")
      .classed("selected", false)
      .style("fill", null)
      .style("stroke", null);
  });

})();
