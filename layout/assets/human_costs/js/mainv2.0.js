// SVG drawing area

var margin = {top: 10, right: 10, bottom: 10, left: 10};

var width = 400 - margin.left - margin.right,
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
var data, filteredData;

var iconSize = 16;


// Load CSV file
d3.csv("data/significant_events.csv", function(csvData) {

    //console.log(mapTopJson);
    console.log(csvData);

    csvData.forEach(function (d) {
        d.Total_affected = +d.Total_affected;
        d.Total_damage = +d.Total_damage;
        d.Total_deaths = +d.Total_deaths;

    })

    var color = d3.scale.ordinal()
        .domain(["error", "nominal", "unknown"])
        .range(["#bc1919", "#428bca", "#777070"]);

    data = [].concat(
        d3.range(5000).map(maker("error"))
    );


    var icon;

    var grid = d3.layout.grid()
        .bands()
        .size([width, height]);


    d3.xml("./img/person.svg",  "image/svg+xml", function(error, frag) {
        var node = frag.getElementsByTagName("g")[0];
        icon = function(){
            return node.cloneNode(true);
        }
        //use plain Javascript to extract the node
        update();
    });

    function update(){

        data.sort(function(a, b){
            return a.state.localeCompare(b.state) ||  a.id - b.id;
        });

        grid(data);
        console.log(data)

        var dot = svg.selectAll(".icon")
            .data(data, function(d){ return d.id; });

        dot.enter()
            .append('text')
            .attr('font-family', 'FontAwesome')
            .attr('font-size', "12px" )
            .text(function(d) { return '\uf183' });
        /*.append(icon)
        .attr({
            "class": "icon",
            transform: tx_xy
        })
        .style({opacity: 1e-6})
        .each(colorize);*/

        dot.transition()
            .delay(function(d, i){ return i / 10; })
            .attr({
                transform: tx_xy
            })
            .style({opacity: 1})
            .each(colorize);

        dot.exit().transition()
            .style({opacity: 1e-6})
            .remove();
    }

    function colorize(d){
        d3.select(this).selectAll("*")
            .style({fill: function(){return color(d.state);}});
    }

    function tx_xy(d){
        var scale = Math.min.apply(null,
            grid.nodeSize().map(function(d){ return d/iconSize; }));
        var tx = "translate(" + d.x + "," + d.y + ")" + " scale(" + scale + ") ";
        return tx;
    }

    function maker(state){
        maker._ID = maker._ID ? maker._ID : 1;
        return function(){
            return {state: state, id: maker._ID++};
        }
    }

})