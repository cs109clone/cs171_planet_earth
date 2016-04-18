
// SVG drawing area

var margin = {top: 100, right: 40, bottom: 60, left: 200};

var width = 1200 - margin.left - margin.right,
		height = 800 - margin.top - margin.bottom;

var svg = d3.select("#chart-area").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var marginTimeline = {top: 10, right: 10, bottom: 50, left: 50};

var widthTimeline = 1200 - marginTimeline.left - marginTimeline.right,
	heightTimeline = 200 - marginTimeline.top - marginTimeline.bottom;

var svgTimeline = d3.select("#timeline-area").append("svg")
	.attr("width", widthTimeline + marginTimeline.left + marginTimeline.right)
	.attr("height", heightTimeline + marginTimeline.top + marginTimeline.bottom)
	.append("g")
	.attr("transform", "translate(" + marginTimeline.left + "," + marginTimeline.top + ")");
		//.call(tip);

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

var projection = d3.geo.naturalEarth() //orthographic().mercator()
	.translate([width / 2, height / 2])
	.center([40,0])
	.scale(200)
	.precision(1.0);

var path = d3.geo.path()
	.projection(projection);


// Scales
var x = d3.time.scale()
	.range([0, width]);

var y = d3.scale.linear()
	.range([height, 0]);

// Time formatting
var formatDate = d3.time.format("%Y");

// Transition time
var transition = 800;

// Initialize data
//loadData();

// Earthquake
var data, filteredData, world;


// Load CSV file
queue()
	.defer(d3.json, "data/world-50m.json")
	.defer(d3.csv, "data/earthquakes.csv")
	.defer(d3.csv, "data/tsunamis.csv")
	.defer(d3.csv, "data/volcanic.csv")
	.await(function(error, mapTopJson, earthquakeCsvData, tsunamiCsvData, volcanicCsvData){

		//console.log(mapTopJson);
		console.log(earthquakeCsvData);

		world = topojson.feature(mapTopJson, mapTopJson.objects.countries).features;

		earthquakeCsvData.forEach(function(d){
			d.FOCAL_DEPTH = +d.FOCAL_DEPTH;
			d.LATITUDE = +d.LATITUDE;
			d.LONGITUDE = +d.LONGITUDE;
			d.MAGNITUDE = +d.EQ_PRIMARY;
			d.TIME = formatDate.parse(d.YEAR);
		});

		tsunamiCsvData.forEach(function(d){
			d.LATITUDE = +d.LATITUDE;
			d.LONGITUDE = +d.LONGITUDE;
			d.MAGNITUDE = +d.MAXIMUM_HEIGHT;
			d.TIME = formatDate.parse(d.YEAR);
		});

		volcanicCsvData.forEach(function(d){
			d.LATITUDE = +d.LATITUDE;
			d.LONGITUDE = +d.LONGITUDE;
			d.MAGNITUDE = +d.VEI;
			d.TIME = formatDate.parse(d.YEAR);

		});

		// Store csv data in global variable
		data = earthquakeCsvData;
		filteredData = data;
		/*selectedValue = d3.select().get
		if (selectedValue == "all"){
			filteredData = data;
		} else {
			filteredData = data.filter(function (d) {
				return d.CATEGORY == selectedValue
			})
		}*/

		// Draw the visualization for the first time
		initVisualization();

		//d3.select("#chart-data").on("change", updateVisualization);

		//d3.select("#filter-dates").on("click", updateVisualization);

	});

function initVisualization(){

	// Draw map
	svg.append("g").selectAll("path")
		.data(world)
		.enter().append("path")
		.attr("class", "path")
		.attr("d", path);


	// TIMELINE
	xTimeline.domain(d3.extent(data, function(d){
		return d.TIME;
	}));

	var timelineData = [];

	var dateRange = d3.time.year.range(xTimeline.domain()[0], xTimeline.domain()[1]);
	dateRange.forEach(function(currentDate){
		timelineData.push({date: currentDate,
			number: data.filter(function(d){return formatDate(d.TIME) == formatDate(currentDate);}).length})
	})

	yTimeline.domain([0, d3.extent(timelineData, function(d){return d.number;})[1]])

	// Timeline
	svgTimeline.append("g")
		.attr("class", "x-axis axis");

	svgTimeline.append("g")
		.attr("class", "y-axis axis");

	svgTimeline.selectAll(".bar")
		.data(timelineData)
		.enter().append("rect")
		.attr("class", "bar")
		.attr("x", function(d) { return xTimeline(d.date); })
		.attr("width", widthTimeline / dateRange.length - 0.1 )
		.attr("y", function(d) { return yTimeline(d.number); })
		.attr("height", function(d) { return heightTimeline - yTimeline(d.number); })
	//.on('mouseover', tip.show)
	//.on('mouseout', tip.hide);

	svgTimeline.select(".x-axis")
		.attr("transform", "translate(0," + heightTimeline + ")")
		.call(xAxisTimeline)
		.selectAll("text")
		.attr("dx", "-2.5em")
		.attr("dy", ".5em")
		.attr("transform", "translate(" + (widthTimeline / dateRange.length - 5) + ", 0) rotate(-25)" );;

	svgTimeline.select(".y-axis")
		.attr("transform", "translate(0,0)")
		.call(yAxisTimeline);

	// SLIDER

	var startValue = xTimeline.domain()[0]

	// defines brush
	var brush = d3.svg.brush()
		.x(xTimeline)
		.extent([startValue, startValue])
		.on("brush", brushed);

	var slider = svgTimeline.append("g")
		.attr("class", "slider")
		.call(brush);

	slider.selectAll(".extent,.resize")
		.remove();

	slider.select(".background")
		.attr("height", "10px");

	var handle = slider.append("g")
		.attr("class", "handle")

	handle.append("circle")
		.attr("transform", "translate(0," + heightTimeline + ")")
		.attr("r", 5)
		.attr("fill", "#fff")
		.attr("stroke", "#000")
		.attr("cursor", "ew-resize");

	handle.append('text')
		.text(startValue)
		.attr("transform", "translate(0,0)");

	slider
		.call(brush.event)

	function brushed() {
		var value = brush.extent()[0];

		if (d3.event.sourceEvent) { // not a programmatic event
			value = xTimeline.invert(d3.mouse(this)[0]);
			brush.extent([value, value]);
		}

		handle.attr("transform", "translate(" + xTimeline(value) + ",0)");
		handle.select('text').text(formatDate(value));
		svgTimeline.selectAll(".bar").classed("hidden-bar", function (d) {
			return formatDate(d.date) !== formatDate(value);
		});
		filteredData = data.filter(function(d){ return formatDate(d.TIME) == formatDate(value);});
		updateVisualization();
	}


}


// Render visualization
function updateVisualization() {

	// Circles
	var quakes = svg.selectAll("circle.circle-quake")
		.data(filteredData);

	var radius = d3.scale.pow()
		.range([2, 30])
		.domain(d3.extent(data, function(d){
			return d.MAGNITUDE;
		}));

	quakes.enter()
		.append("circle")

	// remove circles for old earthquakes no longer in data
	quakes.exit()
		.transition()
		.attr("r", 0)
		.style("fill-opacity", 0)
		.remove();

	quakes.attr("class", "circle-quake")
		.attr("cx", function(d) {
			return projection([d.LONGITUDE, d.LATITUDE])[0];
		})
		.attr("cy", function(d) {
			return projection([d.LONGITUDE, d.LATITUDE])[1];
		})
		.attr("r", function(d) {
			return 0;
		})
		.style("fill", "red")
		.style("fill-opacity", 0)
		.style("stroke", "red")
		.style("stroke-width", "0.5px")
		.style("stroke-opacity", 1)
		/*.transition()
		.delay(function(d, i) {
			return i / data.length * 1000;
		})
		.duration(1000)*/
		.attr("r", function(d) {
			return radius(d.MAGNITUDE);
		})
		.style("fill-opacity", 0.25);



}

