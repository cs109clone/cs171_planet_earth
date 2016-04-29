var count =-1;
var n = 5, // number of layers
    m = 7, // number of samples per layer
    stack = d3.layout.stack(),
    layers = stack(d3.range(n).map(function() { return bumpLayer(m, .1); })),
    yGroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y; }); }),
    yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });

    yStackMaxR = 166945;

    yGroupMaxR = d3.max(layers, function(layer) { return d3.max(layer, function(d) {return Math.exp(d.y); }); });

var margin = {top: 40, right: 10, bottom: 20, left: 10},
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.ordinal()
    .domain(d3.range(m))
    .rangeRoundBands([0, width], .08);

var x_domain = [" ", " ", " ", " ", " ", " ", " "];
var xR = d3.scale.ordinal()
    .domain(x_domain)
    .rangeRoundBands([0, width], 0);

var y = d3.scale.linear()
    .domain([0, yStackMax])
    .range([height, 0]);

var yR = d3.scale.linear()
    .domain([0, yStackMaxR])
    .range([height, 0]);

var color = d3.scale.linear()
    .domain([0, n - 1])
    .range(["#aad", "#556"]);

console.log(color(0), color(1), color(2),color(3),color(4));    

var xAxis = d3.svg.axis()
    .scale(xR)
    .tickSize(0)
    .tickPadding(6)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(yR)
    .tickSize(1)
    .tickPadding(3)
    .orient("left");

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right+100)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


var color_domain=["#aaaadd", "#9595bf", "#8080a2", "#6a6a84", "#555566"];

var legend = svg.selectAll("g.legend")
    .data(color_domain)
    .enter()
    .append("g")
    .attr("class", "legend");

var ls_w = 10, ls_h = 20;

legend.append("rect")
    .attr("x", 50 )
    .attr("y", function(d, i){
        return height - (i*ls_h) - 2*ls_h-300;
    })
    .attr("width", ls_w)
    .attr("height", ls_h)
    .attr("class", function(d, i){
        var i1 =4-i;
        return "q"+i1+"-8";
    });

legend.append("text")
            .attr("x", 65)
            .attr("y", function(d, i){
                return height - (i*ls_h) - 2*ls_h-285;
            })
            .text(function(d, i){

                return "Class" +(5-i)+"";
            })
            .attr("font-size", "10px");   

var layer = svg.selectAll(".layer")
    .data(layers)
  .enter().append("g")
    .attr("class", "layer")
    .style("fill", function(d, i) { return color(i); });

var rect = layer.selectAll("rect")
    .data(function(d) { return d; })
  .enter().append("rect")
    .attr("x", function(d) { return x(d.x); })
    .attr("y", height)
    .attr("width", x.rangeBand())
    .attr("height", 0)
    .attr("transform", "translate(25,0)")
    .on("mouseover", function(d){
      d3.select(this).style("opacity", 0.8);
    })
    .on("mouseout", function(d){
      d3.select(this).style("opacity", 1);
    });

rect.transition()
    .delay(function(d, i) { return i * 10; })
    .attr("y", function(d) { return y(d.y0 + d.y); })
    .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); });

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(25," + height + ")")
    .call(xAxis);

svg.append("g")
    .attr("class", "yaxis")
    .attr("transform", "translate(30,0)")
    .call(yAxis);


svg.append("text")
    .attr("x", 70)
    .attr("y", height+20 )
    .text("Agricultural");
svg.append("text")
    .attr("x", 200)
    .attr("y", height+20 )
    .text("Commercial");
svg.append("text")
    .attr("x", 350)
    .attr("y", height+20 )
    .text("Downtown");
svg.append("text")
    .attr("x", 490)
    .attr("y", height+18 )
    .text("Industrial");
svg.append("text")
    .attr("x", 600)
    .attr("y", height+18 )
    .text("Residential high density");
svg.append("text")
    .attr("x", 740)
    .attr("y", height+18 )
    .text("Residential low density");
svg.append("text")
    .attr("x", 910)
    .attr("y", height+18 )
    .text("Shanty");


svg.append("text")
    .attr("x", -5)
    .attr("y", -10 )
    .text("total number of damaged houses");

svg.append("text")
    .attr("x", 45)
    .attr("y", 130 )
    .text("EMS-98 Damage Class");

d3.selectAll("input").on("change", change);

var timeout = setTimeout(function() {
  d3.select("input[value=\"grouped\"]").property("checked", true).each(change);
}, 2000);

function change() {
  clearTimeout(timeout);
  if (this.value === "grouped") transitionGrouped();
  else transitionStacked();
}

function transitionGrouped() {
  y.domain([0, yGroupMax]);
  yR.domain([0, yGroupMaxR]);


  svg.select(".yaxis")
  .transition().duration(1500)
    .call(yAxis); //////

  rect.transition()
      .duration(500)
      .delay(function(d, i) { return i * 10; })
      .attr("x", function(d, i, j) { return x(d.x) + x.rangeBand() / n * j; })
      .attr("width", x.rangeBand() / n)
    .transition()
      .attr("y", function(d) { return y(d.y); })
      .attr("height", function(d) { return height - y(d.y); });

}

function transitionStacked() {
  y.domain([0, yStackMax]);
   //console.log(yStackMaxR);
   

  rect.transition()
      .duration(500)
      .delay(function(d, i) { return i * 10; })
      .attr("y", function(d) { return y(d.y0 + d.y); })
      .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
    .transition()
      .attr("x", function(d) { return x(d.x); })
      .attr("width", x.rangeBand());
}

// Inspired by Lee Byron's test data generator.
function bumpLayer(n, o) {

  // function bump(a) {
  //   var x = 1 / (.1 + Math.random()),
  //       y = 2 * Math.random() - .5,
  //       z = 10 / (.1 + Math.random());
  //   for (var i = 0; i < n; i++) {
  //     var w = (i / n - y) * z;
  //     a[i] += x * Math.exp(-w * w);
  //   }
  // }

  // var a = [], i;
  // for (i = 0; i < n; ++i) a[i] = o + o * Math.random();
  // for (i = 0; i < 5; ++i) bump(a);

  a = [[1.000001, 637, 110, 129, 35452, 115191, 36719], [1.000001, 2336, 405, 471, 4003, 10017, 1165], [1.00001, 2230, 386, 449, 6290, 18365, 5829], [2008, 3258, 487, 535, 5884, 13947, 8381], [811, 2156, 451, 555, 4980, 9425, 6190]];

  // console.log("a:"+a);
  // return a.map(function(d, i) { console.log("d:"+d); return {x: i, y: Math.max(0, d)}; });
  count = count+1;
  return a[count].map(function(d, i) { return {x: i, y: Math.log(d)}; });
}

function dataLayer(){

  var agricultural = [0, 0, 0, 2008, 811];
  var commercial = [637, 2336, 2230, 3258, 2156];
  var downtown = [110, 405, 386, 487, 451];
  var industrial = [129, 471, 449, 535, 555];
  var residentialHighDensity = [35452, 4003, 6290, 5884, 4980];
  var residentialLowDensity = [115191, 10017, 18365, 13947, 9425];
  var shanty = [36719, 1165, 5829, 8381, 6190];



}