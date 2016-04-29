Top10 = function(_parentElement, _dataTop10) {
    this.parentElement = _parentElement;
    this.dataTop10 = _dataTop10;
    this.loadData();
};

Top10.prototype.loadData = function() {
    var vis = this;

    vis.initVis();

    d3.csv(vis.dataTop10, function(csvData) {

        csvData.forEach(function (d) {
            d.Total_affected = +d.Total_affected;
            d.Total_damage = +d.Total_damage;
            d.Total_deaths = +d.Total_deaths;

        });

        vis.allData = csvData;

        vis.tip.html(function (d) {
            return "" + (d.disaster == "Volcanic" ? "Volcanic eruption" : d.disaster) + "</br>" +
                "Location: " + d.country + "</br>" +
                "Year: " + d.year + "</br>" +
                "Total " + d.category + (d.category == "damage" ? " (in USD)" : "") + ": " + d.number
        });

        vis.updateVis();

        d3.select("#top10-data").on("change", updateVis);


    })

};

Top10.prototype.initVis = function() {

    this.padding = 1.5; // separation between same-color nodes
    this.clusterPadding = 6; // separation between different-color nodes
    this.maxRadius = 12;
    this.legendBoxWidth = 20;
    this.legendBoxHeight = 20;

    this.categories = ["Earthquake", "Volcanic", "Tsunami"];

    this.createSVG();
    this.setupScale();
};

Top10.prototype.createSVG = function() {
    var vis = this;

    vis.margin = {top: 10, right: 10, bottom: 310, left: 40};
    vis.marginLegend = {top: 680, right: 50, bottom: 10, left: 20};

    vis.width = 600 - vis.margin.left - vis.margin.right;
    vis.height = 900 - vis.margin.top - vis.margin.bottom;
    vis.widthLegend = 600 - vis.marginLegend.left - vis.marginLegend.right;
    vis.heightLegend = 900 - vis.marginLegend.top - vis.marginLegend.bottom;

    vis.tip = d3.tip()
        .attr('class', 'd3-tip');

    vis.svg = d3.select(vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom);

    vis.svgClusters = vis.svg.append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")")
        .call(vis.tip);

    vis.svgLegend = vis.svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + vis.marginLegend.left + "," + vis.marginLegend.top + ")")
};


Top10.prototype.setupScale = function() {
    var vis = this;

    vis.color = d3.scale.ordinal()
        .range(["#2ca02c", "#d62728", "#1f77b4"])
        .domain(vis.categories);

    vis.radius = {};

    vis.radius["deaths"] = d3.scale.linear()
        .range([2, 60]);

    vis.radius["affected"] = d3.scale.linear()
        .range([2, 100]);

    vis.radius["damage"] = d3.scale.linear()
        .range([2, 120]);

};


Top10.prototype.updateVis = function() {
    var vis = this;

    vis.selectedData = d3.select("#top10-data").property("value");

    vis.filteredData = vis.allData.filter(function (d) {
        return d.category == vis.selectedData;
    });

    // The largest node for each cluster.
    vis.clusters = new Array(3);

    vis.radius[vis.selectedData].domain(d3.extent(vis.filteredData, function (d) {
        return d["Total_"+vis.selectedData];
    }));

    vis.nodes = vis.filteredData.map(function (d) {
        var i = getIndex(d.disaster),
            r = vis.radius[vis.selectedData](d["Total_"+vis.selectedData]),
            c = {cluster: i, radius: r, year: d.year, country: d["Country name"],
                disaster: d.disaster, number: d["Total_"+vis.selectedData], category: vis.selectedData};
        if (!vis.clusters[i] || (r > vis.clusters[i].radius)) vis.clusters[i] = c;
        return c;
    });


    // Use the pack layout to initialize node positions.
    d3.layout.pack()
        .sort(null)
        .size([vis.width, vis.height])
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
                .entries(vis.nodes)
        });

    vis.force = d3.layout.force()
        .nodes(vis.nodes)
        .size([vis.width, vis.height])
        .gravity(.02)
        .charge(0)
        .on("tick", tick)
        .start();

    vis.node = vis.svgClusters.selectAll(".node")
        .data(vis.nodes);

    vis.node.enter().append("circle");

    vis.node.exit().remove();

    vis.node.attr("class", "node")
        .style("fill", function (d) {
            return vis.color(d.cluster);
        })
        .style("fill-opacity", 0.8)
        .style("stroke", function(d){
            return vis.color(d.cluster);
        })
        .style("stroke-width", "1px")
        .style("stroke-opacity", 1)
        .on("mouseover", function(d){
            vis.tip.show(d);
        })
        .on("mouseout", function(d){
            vis.tip.hide(d);
        });


    vis.node.transition()
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

    vis.legendData = [vis.radius[vis.selectedData].domain()[0],
        Math.floor((vis.radius[vis.selectedData].domain()[0] + vis.radius[vis.selectedData].domain()[1])/2), vis.radius[vis.selectedData].domain()[1]];


    vis.legendCircles = vis.svgLegend.selectAll(".legend")
        .data(vis.legendData);

    vis.legendCircles.enter()
        .append("circle");

    vis.legendCircles.exit()
        .remove();

    vis.legendCircles.attr("class", "legend")
        .attr("cx", vis.widthLegend / 3)
        .attr("cy", function(d){
            return 100 - vis.radius[vis.selectedData](d)
        })
        .style("fill", "none")
        .style("stroke", "darkgrey")
        .style("stroke-width", "0.5px")
        .style("stroke-opacity", 1)
        .attr("r", function(d) {
            return vis.radius[vis.selectedData](d);
        });

    vis.legendText = vis.svgLegend.selectAll("text")
        .data(vis.legendData);

    vis.legendText.enter()
        .append("text");

    vis.legendText.exit()
        .remove();

    vis.legendText.attr("x", vis.widthLegend / 3)
        .attr("y", function(d){
            return 100 - 2 * vis.radius[vis.selectedData](d) - 5
        })
        .attr("font-size", "10px")
        .style("text-anchor", "middle")
        .text(function(d) {
            return "" + d
        });


    vis.legendBoxes = vis.svgLegend.selectAll("rect")
        .data(vis.categories);

    vis.legendBoxes.enter()
        .append("rect");

    vis.legendBoxes.exit()
        .remove();

    vis.legendBoxes.attr("x", vis.widthLegend * 2 / 3)
        .attr("y", function(d, i){
            return i * vis.heightLegend / 4 - 2 * vis.legendBoxHeight;
        })
        .style("fill", function(d){
            return vis.color(d)
        })
        .attr("width", vis.legendBoxWidth)
        .attr("height", vis.legendBoxHeight)
        .style("opacity", 0.8);

    vis.legendLabel = vis.svgLegend.selectAll(".legendLabel")
        .data(vis.categories);

    vis.legendLabel.enter()
        .append("text");

    vis.legendLabel.exit()
        .remove();

    vis.legendLabel.attr("class", "legendLabel")
        .attr("x", vis.widthLegend * 2 / 3 + 30)
        .attr("y", function(d, i){
            return i * vis.heightLegend / 4 - 1.3 * vis.legendBoxHeight;
        })
        .attr("font-size", "10px")
        .style("text-anchor", "left")
        .text(function(d){
            if (d == "Earthquake"){
                return "Earthquakes"
            } else if (d == "Volcanic"){
                return "Volcano eruptions"
            } else if (d == "Tsunami"){
                return "Tsunamis"
            }
        });

    vis.legendTitle = vis.svgLegend.selectAll(".title")
        .data([vis.selectedData]);

    vis.legendTitle.enter()
        .append("text");

    vis.legendTitle.exit()
        .remove();

    vis.legendTitle.attr("class", "title")
        .attr("x", vis.widthLegend / 3)
        .attr("y", 120)
        .attr("font-size", "10px")
        .style("text-anchor", "middle")
        .text(function(d) {
            if (d == "damage"){
                return "Total " + d + " in USD";
            } else {
                return "Total " + d;
            }
        });


    function tick(e) {
        vis.node
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
            var cluster = vis.clusters[d.cluster];
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
        var quadtree = d3.geom.quadtree(vis.nodes);
        return function (d) {
            var r = d.radius + vis.maxRadius + Math.max(vis.padding, vis.clusterPadding),
                nx1 = d.x - r,
                nx2 = d.x + r,
                ny1 = d.y - r,
                ny2 = d.y + r;
            quadtree.visit(function (quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== d)) {
                    var x = d.x - quad.point.x,
                        y = d.y - quad.point.y,
                        l = Math.sqrt(x * x + y * y),
                        r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? vis.padding : vis.clusterPadding);
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

};

