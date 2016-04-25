var margin = {top: 50, right: 40, bottom: 20, left: 200};

var width = 1200 - margin.left - margin.right,
		height = 600 - margin.top - margin.bottom;

var tip = d3.tip()
	.attr('class', 'd3-tip')

var svg = d3.select("#chart-area").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)

	svg.append("rect")
		.attr("width", "100%")
		.attr("height", "100%")
		.attr("fill", "#e0f3f8")

	svg = svg.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.call(tip)

var marginTimeline = {top: 10, right: 30, bottom: 50, left: 40};

var widthTimeline = 1100 - marginTimeline.left - marginTimeline.right,
	heightTimeline = 200 - marginTimeline.top - marginTimeline.bottom;

var svgTimeline = d3.select("#timeline-area").append("svg")
	.attr("width", widthTimeline + marginTimeline.left + marginTimeline.right)
	.attr("height", heightTimeline + marginTimeline.top + marginTimeline.bottom)
	.append("g")
	.attr("transform", "translate(" + marginTimeline.left + "," + marginTimeline.top + ")");

var xTimeline = d3.time.scale()
	.range([0, widthTimeline])
	.clamp(true);

var yTimeline = d3.scale.linear()
	.range([heightTimeline, 0]);

var xAxisTimeline = d3.svg.axis()
	.scale(xTimeline)
	.orient("bottom")
	.tickSize("0");

var yAxisTimeline = d3.svg.axis()
	.scale(yTimeline)
	.orient("left");

var marginLegend = {top: 50, right: 10, bottom: 10, left: 40};

var widthLegend = 300 - marginLegend.left - marginLegend.right,
	heightLegend = 200 - marginLegend.top - marginLegend.bottom;

var svgLegend = d3.select("#legend-area").append("svg")
	.attr("width", widthLegend + marginLegend.left + marginLegend.right)
	.attr("height", heightLegend + marginLegend.top + marginLegend.bottom)
	.append("g")
	.attr("transform", "translate(" + marginLegend.left + "," + marginLegend.top + ")");

var projection = d3.geo.naturalEarth() //orthographic().mercator()
	.translate([width / 2, height / 2])
	.center([40,0])
	.scale(200)
	.precision(1.0);

var path = d3.geo.path()
	.projection(projection);

var disasters = ["Earthquake", "Volcano", "Tsunami"]

// Scales
var x = d3.time.scale()
	.range([0, width]);

var y = d3.scale.linear()
	.range([height, 0]);

var color = d3.scale.ordinal()
	.range(["#2ca02c", "#d62728", "#1f77b4"])
	.domain(disasters)

var textDate = d3.time.format("%B %e, %Y")

var brush, rangeDates;
var value = "";
var radiusScale = {};


// Time formatting
var formatDate = d3.time.format("%Y");

// Transition time
var transition = 800;

var legendData, categories;


// Initialize data
//loadData();

// Earthquake
var allData, data, filteredData, selectedData, world, plates;


// Load CSV file
queue()
	.defer(d3.json, "data/world-50m.json")
	.defer(d3.json, "data/tectonic_plates.json")
	.defer(d3.csv, "data/natural_disasters.csv")
	.await(function(error, mapTopJson, platesTopJson, disastersCsvData){

		console.log(platesTopJson)
		world = topojson.feature(mapTopJson, mapTopJson.objects.countries).features;
		plates = platesTopJson.features

		disastersCsvData.forEach(function(d){
			d.LATITUDE = +d.LATITUDE;
			d.LONGITUDE = +d.LONGITUDE;
			d.MAGNITUDE = +d.MAGNITUDE;
			d.TIME = formatDate.parse(d.YEAR);
		});

		allData = disastersCsvData;

		// Draw the visualization for the first time
		initVisualization();

		d3.select("#map-data").on("change", updateHistogram);
		d3.select("#checkbox-plates").on("change", updatePlates);


	});

function updatePlates(){
	console.log("dadsa")
	var showPlates = d3.select("#checkbox-plates").property("checked");
	console.log(showPlates)
	d3.selectAll(".plates").classed("hidden", function(d){return !showPlates})
}

function initVisualization(){

	radiusScale["Earthquake"] = d3.scale.linear()
		.range([2, 30])
		.domain([6, d3.extent(allData.filter(function(d){ return d.CATEGORY == "Earthquake"}), function(d){
			return d.MAGNITUDE;
		})[1]]);

	radiusScale["Volcano"] = d3.scale.linear()
		.range([2, 30])
		.domain(d3.extent(allData.filter(function(d){ return d.CATEGORY == "Volcano"}), function(d){
			return d.MAGNITUDE;
		}));

	radiusScale["Tsunami"] = d3.scale.linear()
		.range([2, 30])
		.domain(d3.extent(allData.filter(function(d){ return d.CATEGORY == "Tsunami"}), function(d){
			return d.MAGNITUDE;
		}));

	svg.append("g").selectAll("path")
		.data(world)
		.enter().append("path")
		.attr("class", "path")
		.attr("d", path);

	svg.append("g").selectAll(".plates")
		.data(plates)
		.enter().append("path")
		.attr("class", "plates")
		.attr("d", path);

	svgTimeline.append("g")
		.attr("class", "x-axis axis");

	svgTimeline.append("g")
		.attr("class", "y-axis axis");

	svgTimeline.select(".x-axis")
		.attr("transform", "translate(0," + heightTimeline + ")")

	svgTimeline.select(".y-axis")
		.attr("transform", "translate(0,0)")


	// defines brush
	brush = d3.svg.brush()
		.x(xTimeline)
		.on("brush", brushed)
		.on("brushend", brushed);

	updateHistogram();
}


// Render visualization
function updateHistogram() {

	selectedData = d3.select("#map-data").property("value");
	d3.selectAll(".brush").call(brush.clear())

	if (selectedData == "all"){
		data = allData;
	} else {
		data = allData.filter(function (d) {
			return d.CATEGORY == selectedData;
		})
	}
	filteredData = data;

	// TIMELINE
	xTimeline.domain(d3.extent(allData, function(d){
		return d.TIME;
	}));

	rangeDates = xTimeline.domain()


	var timelineData = [];
	var dateRange = d3.time.year.range(xTimeline.domain()[0], xTimeline.domain()[1]);

	dateRange.forEach(function(currentDate){
		if (selectedData == "all"){
			var y0 = 0;
			timelineData.push({
				date: currentDate,
				values: color.domain().map(function (disasterType) {
					return {
						type: disasterType,
						date: currentDate,
						y0: y0,
						y1: y0 += filteredData.filter(function (d) {
							return (formatDate(d.TIME) == formatDate(currentDate) && d.CATEGORY == disasterType);
						}).length
					}
				}),
				total: y0
			})
		} else {
			timelineData.push({
				date: currentDate,
				total: filteredData.filter(function (d) {
					return formatDate(d.TIME) == formatDate(currentDate);
				}).length
			})
		}
	})

	yTimeline.domain([0, d3.extent(timelineData, function(d){return d.total;})[1]])

	// Timeline
	d3.selectAll(".bar").remove()

	var bars = svgTimeline.append("g").attr("class", "bars")
		.selectAll(".bar")
		.data(timelineData)


	if (selectedData == "all") {

		bars.enter().append("g")
			.attr("class", "bar")

		rects = bars.selectAll("rect")
			.data(function(d) { return d.values; })

		rects.enter().append("rect")
			.attr("class", "rect")

		rects.attr("x", function (d) {
				return xTimeline(d.date);
			})
			.attr("width", widthTimeline / dateRange.length)
			.attr("y", function(d) { return yTimeline(d.y1); })
			.attr("height", function(d) { return yTimeline(d.y0) - yTimeline(d.y1); })
			.style("fill", function(d) { return color(d.type); })

	} else {

		bars.enter().append("rect")
			.attr("class", "bar")


		bars.attr("x", function (d) {
				return xTimeline(d.date);
			})
			.attr("width", widthTimeline / dateRange.length - 0.1)
			.attr("y", function (d) {
				return yTimeline(d.total);
			})
			.attr("height", function (d) {
				return heightTimeline - yTimeline(d.total);
			})
			.attr("fill", color(selectedData))
	}

	svgTimeline.select(".x-axis")
		.call(xAxisTimeline)
		.selectAll("text")
		.attr("transform", "translate(" + (widthTimeline / dateRange.length - 25) + ", 10) rotate(-25)" );

	svgTimeline.select(".y-axis")
		.call(yAxisTimeline);

	svgTimeline.append("g")
		.attr("class", "x brush")
		.call(brush)
		.selectAll("rect")
		.attr("y", 0)
		.attr("height", heightTimeline);

	updateLegend();
	updateMap();

}

function updateLegend(){

	legendData = [];

	if (selectedData == "all"){
		categories = disasters;
	} else {
		categories = [selectedData];
	}

	for (var idx in categories) {
		legendData.push({MAGNITUDE: radiusScale[categories[idx]].domain()[0],
						CATEGORY: categories[idx]})
		legendData.push({MAGNITUDE: (radiusScale[categories[idx]].domain()[0]+radiusScale[categories[idx]].domain()[1])/2,
						CATEGORY: categories[idx]})
		legendData.push({MAGNITUDE: radiusScale[categories[idx]].domain()[1],
						CATEGORY: categories[idx]})
	}

	var legend = svgLegend.selectAll("circle")
		.data(legendData)

	legend.enter()
		.append("circle");

	legend.exit()
		.remove();

	legend.attr("cx", function(d, i) {
			return Math.floor(i / 3) * (widthLegend / 3);
		})
		.attr("cy", function(d, i){
			return 50 - radius(d)
		})
		.style("fill", function(d){return color(d.CATEGORY);})
		.style("fill-opacity", 0.05)
		.style("stroke", function(d){return color(d.CATEGORY);})
		.style("stroke-width", "0.5px")
		.style("stroke-opacity", 1)
		.attr("r", function(d) {
			return radius(d);
		})

	var legendText = svgLegend.selectAll("text")
		.data(legendData)

	legendText.enter()
		.append("text");

	legendText.exit()
		.remove();

	legendText.attr("x", function(d, i) {
			return Math.floor(i / 3) * (widthLegend / 3);
		})
		.attr("y", function(d, i){
			return 50 - 2 * radius(d) - 5
		})
		.attr("font-size", "10px")
		.style("text-anchor", "middle")
		.text(function(d) {
			return "" + d.MAGNITUDE.toFixed(1)
		})

	var legendLabel = svgLegend.selectAll(".legendLabel")
		.data(categories)

	legendLabel.enter()
		.append("text");

	legendLabel.exit()
		.remove();

	legendLabel.each(function(d, i){
		var label, el = d3.select(this);
		if (d == "Earthquake"){
			label = "Earthquake Magnitude (Richter)"
		} else if (d == "Volcano"){
			label = "Volcanic Explosivity Index"
		} else if (d == "Tsunami"){
			label = "Tsunami Magnitude (Iida-Imamura)"
		}
		var words = label.split(' ');
		el.text('')
		for (var j = 0; j < words.length; j++) {
			var tspan = el.append('tspan').text(words[j]);
			tspan.attr("x", i * (widthLegend / 3))
				.attr("y", 60 + j * 11)
				.attr("font-size", "10px")
				.style("text-anchor", "middle")
		}

	})
}

function updateMap(){

	filteredData = filteredData.sort(function(a, b){return radius(b) - radius(a);})

	tip.html(function(d){
		var magLabel;
		if (d.CATEGORY == "Earthquake"){
			magLabel = "Richter magnitude"
		} else if (d.CATEGORY == "Tsunami"){
			magLabel = "Iida-Imamura magnitude"
		} else if (d.CATEGORY == "Volcano"){
			magLabel = "Volcanic Explosivity Index"
		}
		return "" + (d.CATEGORY == "Volcano" ? "Volcanic eruption" : d.CATEGORY) + "</br>" +
			"Date: " + textDate(new Date(d.YEAR, d.MONTH, d.DAY)) + "</br>" +
			"Location: " + d.COUNTRY.charAt(0).toUpperCase() + d.COUNTRY.slice(1).toLowerCase() + "</br>" +
			"Coordinates: (" + d.LATITUDE + ", " + d.LONGITUDE + ")" + "</br>" +
			magLabel + ": " + d.MAGNITUDE
	})


	var events = svg.selectAll("circle.circle-event")
		.data(filteredData);

	events.enter()
		.append("circle")

	events.attr("class", "circle-event")
		.attr("cx", function(d) {
			return projection([d.LONGITUDE, d.LATITUDE])[0];
		})
		.attr("cy", function(d) {
			return projection([d.LONGITUDE, d.LATITUDE])[1];
		})
		.style("fill", function(d){return color(d.CATEGORY);})
		.style("fill-opacity", 0.05)
		.style("stroke", function(d){return color(d.CATEGORY);})
		.style("stroke-width", "0.5px")
		.style("stroke-opacity", 1)
		.on("mouseover", function(d){
			tip.show(d);
			d3.select(this).style("fill-opacity", 1)
		})
		.on("mouseout", function(d){
			tip.hide(d);
			d3.select(this).style("fill-opacity", 0.05)
		})
		.attr("r", function(d) {
			return radius(d);
		})

	// remove circles for old earthquakes no longer in data
	events.exit()
		.transition()
		.attr("r", 0)
		.style("fill-opacity", 0)
		.remove();

	var legendMap = svg.selectAll("text")
		.data([rangeDates])

	legendMap.enter()
		.append("text")

	legendMap.exit()
		.remove()

	legendMap.attr("x", width / 2)
		.attr("y", - margin.top / 2)
		.attr("font-size", "18px")
		.style("text-anchor", "middle")
		.text(function(d) {
			var mapLabel;
			if (selectedData == "all"){
				mapLabel = "Natural disasters"
			} else if (selectedData == "Earthquake"){
				mapLabel = "Earthquakes"
			} else if (selectedData == "Tsunami"){
				mapLabel = "Tsunamis"
			} else if (selectedData == "Volcano"){
				mapLabel = "Volcanic eruptions"
			}
			return mapLabel + " from " + formatDate(d[0]) + " to " + formatDate(d[1])
		})
}


function brushed() {
	rangeDates = brush.empty() ? xTimeline.domain() : brush.extent();
	filteredData = data.filter(function(d){
		return formatDate(rangeDates[0]) <= formatDate(d.TIME) && formatDate(d.TIME) <= formatDate(rangeDates[1]);
	});
	if (selectedData == "all") {
		svgTimeline.selectAll(".rect").classed("hidden-bar", function (d) {
			return !(formatDate(rangeDates[0]) <= formatDate(d.date) && formatDate(d.date) <= formatDate(rangeDates[1]));
		});
	} else {
		svgTimeline.selectAll(".bar").classed("hidden-bar", function (d) {
			return !(formatDate(rangeDates[0]) <= formatDate(d.date) && formatDate(d.date) <= formatDate(rangeDates[1]));
		});
	}
	updateMap();
}


function radius(d) {
	return radiusScale[d.CATEGORY](d.MAGNITUDE);
}
