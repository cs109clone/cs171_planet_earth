var count =-1;
var n = 5, // number of layers
    m = 11, // number of samples per layer
    stack = d3.layout.stack(),
    layers = stack(d3.range(n).map(function() { return bumpLayer(m, .1); })),
    yGroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y; }); }),
    yStackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });
    yGroupMin = d3.min(layers, function(layer) { return d3.min(layer, function(d) { return d.y; }); }),
    yStackMin = d3.min(layers, function(layer) { return d3.min(layer, function(d) { return d.y0 + d.y; }); });

    yStackMaxR = 106904;

    yGroupMaxR = d3.max(layers, function(layer) { return d3.max(layer, function(d) { var a = Math.exp(d.y);
      console.log("groupMaxR: "+a);
      return Math.exp(d.y); }); }),

    console.log("gmax: "+ yGroupMax+", gmin: "+ yGroupMin+ ", smax: "+ yStackMax+", smin: "+ yStackMin);

var color_domain=["#be324c", "#a32639", "#871926", "#6c0d13", "#500000"];



var margin = {top: 40, right: 10, bottom: 20, left: 10},
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.ordinal()
    .domain(d3.range(m))
    .rangeRoundBands([0, width], .08);

x_domain = [" ", " "," ", " ", " ",
, " ", " ", " ", " ", " "," "];


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
    .range(["#BE324C", "#500000"]);

console.log(color(0), color(1), color(2),color(3),color(4));    

var xAxis = d3.svg.axis()
    .scale(xR)
    .tickSize(1)
    .tickPadding(5)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(yR)
    .tickSize(1)
    .tickPadding(3)
    .orient("left");



    //console.log("y:"+y(yStackMax));

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right+100)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate( 0," + margin.top + ")");

//var tip = d3.tip()
//    .attr('class', 'd3-tip');

//svg.call(tip);



var legend = svg.selectAll("g.legend")
    .data(color_domain)
    .enter()
    .append("g")
    .attr("class", "legend");

var ls_w = 10, ls_h = 20;

legend.append("rect")
    .attr("x", width )
    .attr("y", function(d, i){
        return height - (i*ls_h) - 2*ls_h-350;
    })
    .attr("width", ls_w)
    .attr("height", ls_h)
    .attr("class", function(d, i){
        var i1 =4-i;
        return "q"+i1+"-8";
    });

legend.append("text")
            .attr("x", width-35)
            .attr("y", function(d, i){
                return height - (i*ls_h) - 2*ls_h-335;
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
    .attr("transform", "translate(35,0)")    ////////////
    .attr("width", x.rangeBand())
    .attr("height", 0)
    .on("mouseover", function(d){
      d3.select(this).style("opacity", 0.8);
      tip.show;
    })
    .on("mouseout", function(d){
      d3.select(this).style("opacity", 1);
      tip.hide;
    });

rect.transition()
    .delay(function(d, i) { return i * 10; })
    .attr("y", function(d) { return y(d.y0 + d.y); })
    .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); });

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(35," + (height) + ")")   
    .call(xAxis);


svg.append("g")
    .attr("class", "yaxis")
    .attr("transform", "translate(40,0)")    /////////
    .call(yAxis);

svg.append("text")
    .attr("x", 50)
    .attr("y", height+20 )
    .text("CARREFOUR");
svg.append("text")
    .attr("x", 140)
    .attr("y", height+20 )
    .text("CITE SOLEIL");
svg.append("text")
    .attr("x", 230)
    .attr("y", height+20 )
    .text("DELMAS");
svg.append("text")
    .attr("x", 320)
    .attr("y", height+18 )
    .text("GRAND-GOAVE");
svg.append("text")
    .attr("x", 410)
    .attr("y", height+18 )
    .text("GRESSIER");
svg.append("text")
    .attr("x", 500)
    .attr("y", height+18 )
    .text("JACMEL");
svg.append("text")
    .attr("x", 585)
    .attr("y", height+18 )
    .text("LEOGANE");
svg.append("text")
    .attr("x", 660)
    .attr("y", height+18 )
    .text("PETION-VILLE");
svg.append("text")
    .attr("x", 750)
    .attr("y", height+18 )
    .text("PETIT-GOAVE");
svg.append("text")
    .attr("x", 830)
    .attr("y", height+18 )
    .text("PORT-AU-PRINCE");
svg.append("text")
    .attr("x", 928)
    .attr("y", height+18 )
    .text("TABARRE");

svg.append("text")
    .attr("x", 0)
    .attr("y", -10 )
    .text("total number of damaged houses");
svg.append("text")
    .attr("x", width-35)
    .attr("y", 80 )
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
  //console.log(yGroupMaxR);
  yR.domain([0, yGroupMaxR]);


  svg.select(".yaxis")
  .transition().duration(1500)
    .call(yAxis); //////



  //console.log(y(yGroupMin));
  var k = d3.scale.linear()
          .domain([y(yGroupMin),y(yGroupMax)])
          .range([0, height]);

 // console.log(yGroupMin+"  change: "+groupLinear(yGroupMin));
  //console.log(yGroupMax+"  change: "+groupLinear(yGroupMax));


  rect.transition()
      .duration(500)
      .delay(function(d, i) { return i * 10; })
      .attr("x", function(d, i, j) { return x(d.x) + x.rangeBand() / n * j; })
      .attr("width", x.rangeBand() / n)
    .transition()
      .attr("y", function(d) { return height-groupLinear(d.y); })
      .attr("height", function(d) { return groupLinear(d.y); });
      //.attr("height", function(d) { return height - y(d.y); });



}

function groupLinear(x){
  return 68.72852*x-319.1752;
}

function transitionStacked() {
  y.domain([0, yStackMax]);
   //console.log(yStackMaxR);
  yR.domain([0, yStackMaxR]);


    svg.select(".yaxis")
      .transition().duration(1500)
    .call(yAxis);  ////

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

  a = [[35219, 6403, 29479, 2175, 3436, 8799, 24735, 10614, 770, 62694, 3914], [3220, 576, 2882, 277, 319, 857, 2360, 708, 116, 6700, 382], [5920, 1073, 5064, 422, 567, 1489, 4139, 1693, 167, 12351, 664], [5905, 549, 2814, 541, 289, 1785, 5985, 906, 104, 15257, 365], [2768, 1012, 5012, 148, 565, 214, 2220, 2027, 173, 9902, 532]];

//188238
//


  // console.log("a:"+a);
  // return a.map(function(d, i) { console.log("d:"+d); return {x: i, y: Math.max(0, d)}; });
  count = count+1;
  return a[count].map(function(d, i) { return {x: i, y: Math.log(d)}; });
}
