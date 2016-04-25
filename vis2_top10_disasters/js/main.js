// SVG drawing area

var margin = {top: 10, right: 10, bottom: 10, left: 40},
    marginLegend = {top: 80, right: 50, bottom: 10, left: 20};

var width = 600 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom,
    widthLegend = 600 - marginLegend.left - marginLegend.right,
    heightLegend = 300 - marginLegend.top - marginLegend.bottom;

var tip = d3.tip()
    .attr('class', 'd3-tip')

var svg = d3.select("#cluster-area").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(tip);

var svgLegend = d3.select("#legend-area").append("svg")
    .attr("width", widthLegend + marginLegend.left + marginLegend.right)
    .attr("height", heightLegend + marginLegend.top + marginLegend.bottom).append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + marginLegend.left + "," + marginLegend.top + ")")

var w = 1200 / 3,
    h = 800,
    padding = 1.5, // separation between same-color nodes
    clusterPadding = 6, // separation between different-color nodes
    maxRadius = 12;

var categories = ["Earthquake", "Volcanic", "Tsunami"];

var color = d3.scale.ordinal()
    .range(["#2ca02c", "#d62728", "#1f77b4"])
    .domain(categories)
var radius = d3.scale.linear()
    .range([2,80]);

var filteredData, allData;

d3.csv("data/top10.csv", function(csvData) {


    csvData.forEach(function (d) {
        d.Total_affected = +d.Total_affected;
        d.Total_damage = +d.Total_damage;
        d.Total_deaths = +d.Total_deaths;

    })

    allData = csvData;

    var categories = d3.nest()
        .key(function (d) {
            return d.category;
        })
        .entries(csvData);

    tip.html(function (d) {
        return "" + (d.disaster == "Volcanic" ? "Volcanic eruption" : d.disaster) + "</br>" +
            "Location: " + d.country + "</br>" +
            "Year: " + d.year + "</br>" +
            "Total " + d.category + (d.category == "damage" ? " (in USD)" : "") + ": " + d.number
    })


    updateVis();

    d3.select("#top10-data").on("change", updateVis);


})

function updateVis(){

    selectedData = d3.select("#top10-data").property("value");

    filteredData = allData.filter(function (d) {
        return d.category == selectedData;
    })

    // The largest node for each cluster.
    var clusters = new Array(3);

    radius.domain(d3.extent(filteredData, function (d) {
        return d["Total_"+selectedData];
    }))

    var nodes = filteredData.map(function (d) {
        var i = getIndex(d.disaster),
            r = radius(d["Total_"+selectedData]),
            d = {cluster: i, radius: r, year: d.year, country: d["Country name"],
                disaster: d.disaster, number: d["Total_"+selectedData], category: selectedData};
        if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
        return d;
    });


    // Use the pack layout to initialize node positions.
    d3.layout.pack()
        .sort(null)
        .size([width, height])
        .children(function (d) {
            return d.values;
        })
        .value(function (d) {
            return d.radius * d.radius;
        })
        .nodes({
            values: d3.nest()
                .key(function (d) {
                    return d.cluster;
                })
                .entries(nodes)
        });

    var force = d3.layout.force()
        .nodes(nodes)
        .size([width, height])
        .gravity(.02)
        .charge(0)
        .on("tick", tick)
        .start();

    var node = svg.selectAll(".node")
        .data(nodes)

    node.enter().append("circle")

    node.exit().remove();

    node.attr("class", "node")
        .style("fill", function (d) {
            return color(d.cluster);
        })
        .style("fill-opacity", 0.8)
        .style("stroke", function(d){
            return color(d.cluster);
        })
        .style("stroke-width", "1px")
        .style("stroke-opacity", 1)
        .on("mouseover", function(d){
            tip.show(d);
        })
        .on("mouseout", function(d){
            tip.hide(d);
        })


    node.transition()
        .duration(750)
        .delay(function (d, i) {
            return i * 5;
        })
        .attrTween("r", function (d) {
            var i = d3.interpolate(0, d.radius);
            return function (t) {
                return d.radius = i(t);
            };
        });

    // Legend

    legendData = [radius.domain()[0], Math.floor((radius.domain()[0] + radius.domain()[1])/2), radius.domain()[1]]


    var legendCircles = svgLegend.selectAll(".legend")
        .data(legendData)

    legendCircles.enter()
        .append("circle");

    legendCircles.exit()
        .remove();

    legendCircles.attr("class", "legend")
        .attr("cx", widthLegend / 3)
        .attr("cy", function(d, i){
            return 100 - radius(d)
        })
        .style("fill", "none")
        .style("stroke", "darkgrey")
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

    legendText.attr("x", widthLegend / 3)
        .attr("y", function(d, i){
            return 100 - 2 * radius(d) - 5
        })
        .attr("font-size", "10px")
        .style("text-anchor", "middle")
        .text(function(d) {
            return "" + d
        })

    var legendBoxWidth = 20,
        legendBoxHeight = 20;

    var legendBoxes = svgLegend.selectAll("rect")
        .data(categories)

    legendBoxes.enter()
        .append("rect");

    legendBoxes.exit()
        .remove();

    legendBoxes.attr("x", widthLegend * 2 / 3)
        .attr("y", function(d, i){
            return i * heightLegend / 4 - 2 * legendBoxHeight;
        })
        .style("fill", function(d){
            return color(d)
        })
        .attr("width", legendBoxWidth)
        .attr("height", legendBoxHeight)
        .style("opacity", 0.8);

    var legendLabel = svgLegend.selectAll(".legendLabel")
        .data(categories)

    legendLabel.enter()
        .append("text");

    legendLabel.exit()
        .remove();

    legendLabel.attr("class", "legendLabel")
        .attr("x", widthLegend * 2 / 3 + 30)
        .attr("y", function(d, i){
            return i * heightLegend / 4 - 1.3 * legendBoxHeight;
        })
        .attr("font-size", "10px")
        .style("text-anchor", "left")
        .text(function(d, i){
            if (d == "Earthquake"){
                return "Earthquakes"
            } else if (d == "Volcanic"){
                return "Volcano eruptions"
            } else if (d == "Tsunami"){
                return "Tsunamis"
            }
        })

    var legendTitle = svgLegend.selectAll(".title")
        .data([selectedData])

    console.log(selectedData)

    legendTitle.enter()
        .append("text");

    legendTitle.exit()
        .remove();

    legendTitle.attr("class", "title")
        .attr("x", widthLegend / 3)
        .attr("y", 120)
        .attr("font-size", "10px")
        .style("text-anchor", "middle")
        .text(function(d) {
            if (d == "damage"){
                return "Total " + d + " in USD";
            } else {
                return "Total " + d;
            }
        })

    //console.log(clusters)

    /*var textCluster = svg.selectAll(".text")
            .data(clusters.slice(1));

    console.log(textCluster)

    textCluster.enter().append("text");

    textCluster.exit().remove();

    textCluster.attr("class", "text")
        .attr("x", function(d){ console.log(d); return d.x})
        .attr("y", function(d){ return d.y})
        .attr("font-size", "18px")
        .style("text-anchor", "middle")
        .text(function(d){
            if (d.radius == 80) {
                return d.category.charAt(0).toUpperCase() + d.category.slice(1) + ": " + d.number
            }
        })*/

    /*textCluster.each(function(d){
            if (d.radius == 80) {
                var el = d3.select(this);
                el.text('')
                var words = [d.country + ", " + d.year, (d.category == "damage" ? "$" : "") + d.number + " "  + d.category ]
                for (var j = 0; j < words.length; j++) {
                    var tspan = el.append('tspan').text(words[j]);
                    tspan.attr("x", d.x)
                        .attr("y", d.y + j * 11)
                        .attr("font-size", "12px")
                        .style("text-anchor", "middle")
                }
                // return d.category.charAt(0).toUpperCase() + d.category.slice(1) + ": " + d.number
            }
    })*/

    function tick(e) {
        node
            .each(cluster(10 * e.alpha * e.alpha))
            .each(collide(.5))
            .attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            });
    }


    // Move d to be adjacent to the cluster node.
    function cluster(alpha) {
        return function (d) {
            var cluster = clusters[d.cluster];
            if (cluster === d) return;
            var x = d.x - cluster.x,
                y = d.y - cluster.y,
                l = Math.sqrt(x * x + y * y),
                r = d.radius + cluster.radius;
            if (l != r) {
                l = (l - r) / l * alpha;
                d.x -= x *= l;
                d.y -= y *= l;
                cluster.x += x;
                cluster.y += y;
            }
        };
    }

    // Resolves collisions between d and all other circles.
    function collide(alpha) {
        var quadtree = d3.geom.quadtree(nodes);
        return function (d) {
            var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
                nx1 = d.x - r,
                nx2 = d.x + r,
                ny1 = d.y - r,
                ny2 = d.y + r;
            quadtree.visit(function (quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== d)) {
                    var x = d.x - quad.point.x,
                        y = d.y - quad.point.y,
                        l = Math.sqrt(x * x + y * y),
                        r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
                    if (l < r) {
                        l = (l - r) / l * alpha;
                        d.x -= x *= l;
                        d.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
        };
    }


    function getIndex(disaster){
        switch(disaster) {
            case "Earthquake":
                return 1;
            case "Volcanic":
                return 2;
            case "Tsunami":
                return 3;
        }
    }

}

