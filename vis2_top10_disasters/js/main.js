// SVG drawing area

var margin = {top: 10, right: 10, bottom: 10, left: 10};

var width = 1200 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

var svg = d3.select("#cluster-area").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var w = 1200 / 3,
    h = 800,
    padding = 1.5, // separation between same-color nodes
    clusterPadding = 6, // separation between different-color nodes
    maxRadius = 12;

var color = d3.scale.category10()

var radius = d3.scale.linear()
    .range([5,50]);

var filteredData;


d3.csv("data/top10_deaths.csv", function(csvData) {

    console.log(csvData)

    csvData.forEach(function (d) {
        d.Total_affected = +d.Total_affected;
        d.Total_damage = +d.Total_damage;
        d.Total_deaths = +d.Total_deaths;

    })

    var categories = d3.nest()
        .key(function(d) { return d.category; })
        .entries(csvData);


    categories.forEach(function(category, idx) {

        filteredData = csvData.filter(function(d){ return d.category == category.key;})

        // The largest node for each cluster.
        var clusters = new Array(3);

        radius.domain(d3.extent(filteredData, function (d) {
            return d["Total_"+category.key];
        }))

        var svgCluster = svg.append("g")
            .attr("transform", "translate(" + ((idx - 1) * w) + ",0)")

        svgCluster.append("text")
            .attr("x", (width / 2))
            .attr("y", margin.top)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("text-decoration", "underline")
            .text(category.key);

        var nodes = filteredData.map(function (d) {
            var i = getIndex(d.disaster),
                r = radius(d["Total_"+category.key]),
                d = {cluster: i, radius: r};
            if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
            return d;
        });

        console.log(nodes)
        console.log(clusters)

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

        var node = svgCluster.selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .style("fill", function (d) {
                return color(d.cluster);
            })
        //.call(force.drag);

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

    })


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

})

