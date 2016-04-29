
// SVG drawing area

var margin = {top: 10, right: 10, bottom: 10, left: 10};

var width = 1200 - margin.left - margin.right,
		height = 800 - margin.top - margin.bottom;

var svg = d3.select("#radar-area").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Scales
var x = d3.time.scale()
	.range([0, width]);

var y = d3.scale.linear()
	.range([height, 0]);


// Time formatting
var formatDate = d3.time.format("%Y-%m-%d");

// Transition time
var transition = 800;

// Initialize data
//loadData();

// Earthquake
var data, filteredData, world;

var mycfg = {
	maxValue: 0.6,
	levels: 6,
	ExtraWidthX: 300
}


// Load CSV file
d3.csv("data/significant_events.csv", function(csvData){

	//console.log(mapTopJson);
	console.log(csvData);

	csvData.forEach(function(d){
		d.Total_affected = +d.Total_affected;
		d.Total_damage = +d.Total_damage;
		d.Total_deaths = +d.Total_deaths;

	})

	var eventsByCategory = d3.nest()
		.key(function(d) { return d.category; })
		.entries(csvData);

	var data = {}
	console.log(eventsByCategory)

	var w = (width + margin.left + margin.right) / eventsByCategory.length,
		h = (width + margin.left + margin.right) / eventsByCategory.length;

	mycfg.w = w;
	mycfg.h = h;

	mycfg.maxValue = 0

	eventsByCategory.forEach(function(category, idx){
		console.log(category.key);
		data[category.key] = {}
		data[category.key].legend = []
		data[category.key].values = []
		category.values.forEach(function(d){
			data[category.key].legend.push(d.Country_name + " " + d.year)
			data[category.key].values.push([
				{axis:"Total Affected", value: Math.log10(d.Total_affected)},
				{axis:"Total Damage", value: Math.log10(d.Total_damage)},
				{axis:"Total Deaths", value: Math.log10(d.Total_deaths)}
			])
			mycfg.maxValue = Math.max(mycfg.maxValue, Math.log10(d.Total_affected), Math.log10(d.Total_damage), Math.log10(d.Total_deaths))
		})
		//Call function to draw the Radar chart
		//Will expect that data is in %'

	})
	eventsByCategory.forEach(function(category, idx) {
		mycfg.TranslateX = idx * w;
		RadarChart.draw(svg, data[category.key].values, mycfg);
	});

	console.log(data)

	// Draw the visualization for the first time
	//initVisualization();

	//d3.select("#chart-data").on("change", updateVisualization);

	//d3.select("#filter-dates").on("click", updateVisualization);

});

function initVisualization(){

}


// Render visualization
function updateVisualization() {


}

