
var width = 300,
    height = 700,
    radius = Math.min(width, height) / 2.5,
    color = d3.scale.category20();

var svg4 = d3.select("#vis4").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height * .4 + ")");

var partition4 = d3.layout.partition()
    .sort(null)
    .size([2 * Math.PI, radius * radius]);
   // .value(function(d) { return 1; });

var arc4 = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx; })
    .innerRadius(function(d) { return Math.sqrt(d.y); })
    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

d3.json("assets/vis4_Haiti/productionSector.json", function(error, root) {
  if (error) throw error;

  var path4 = svg4.datum(root).selectAll("path3")
      .data(partition4.nodes)
      .enter().append("path")
      .attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
      .attr("d", arc4)
      .style("stroke", "#fff")
      .style("fill", function(d) { return color((d.children ? d : d.parent).name); })
      .style("fill-rule", "evenodd")
      .each(stash);

  // d3.selectAll("input").on("change", function change() {
  //   var value = this.value === "count"
  //       ? function() { return 1; }
  //       : function(d) { 
  //         console.log(d.size);
  //         return d.size; };

    path4
        .data(partition4.value(function(d){
          return d.size;}).nodes)
      .transition()
        .duration(1500)
        .attrTween("d", arcTween);
  // });
});




// Stash the old values for transition.
function stash(d) {
  d.x0 = d.x;
  d.dx0 = d.dx;
}

// Interpolate the arcs in data space.
function arcTween(a) {
  var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
  return function(t) {
    var b = i(t);
    a.x0 = b.x;
    a.dx0 = b.dx;
    return arc4(b);
  };
}

d3.select(self.frameElement).style("height", height + "px");