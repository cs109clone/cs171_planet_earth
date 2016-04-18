// TODO:
// Calculate the angle from the epicenter.
// Lookup table from country to death toll
// Color/size the circles by runup/deathtoll
// Tooltips 
// Zooming? http://bl.ocks.org/mbostock/4015254
// Log scale?
TsunamiRunup = function(_parentElement, _dataFile) {
    this.parentElement = _parentElement;
    this.dataFile = _dataFile;
    this.loadData();
}

function getTravelTime(d) {
    return ((+d.TRAVEL_TIME_MINUTES) + 60 * (+d.TRAVEL_TIME_HOURS))
}

TsunamiRunup.prototype.loadData = function() {
    var vis = this;
    d3.tsv(vis.dataFile, function (error, data) {
        vis.selectedData = [];
        for (var i = 0; i < data.length; i++) {
            data[i].LONGITUDE = +data[i].LONGITUDE;
            data[i].LATITUDE = +data[i].LATITUDE;
            if (data[i].TRAVEL_TIME_HOURS && data[i].TRAVEL_TIME_MINUTES) {
                data[i].TRAVEL_TIME_HOURS = +data[i].TRAVEL_TIME_HOURS;
                data[i].TRAVEL_TIME_MINUTES = +data[i].TRAVEL_TIME_MINUTES;
                data[i].travelTime = getTravelTime(data[i]);
                console.log(data[i].travelTime + " " + data[i].COUNTRY + " " + data[i].WATER_HT); 
                vis.selectedData.push(data[i]);
            }
        }
        vis.data = data
        vis.initVis();
    });
}

TsunamiRunup.prototype.initVis = function() {
    this.radius_pixels = 250;
    this.radius_minutes = 2500;
    this.n_radial_levels = 7;

    this.createSVG();
    this.setupScale();
    this.setupAxes();
    this.plotRunup();
}

TsunamiRunup.prototype.createSVG = function() {
    var vis = this;

    var width = 600;
    var height = 600;

    vis.svg = d3.select(this.parentElement).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
}

TsunamiRunup.prototype.setupScale = function() {
    this.rScale = d3.scale.linear()
        .domain([0, this.radius_minutes])
        .range([0, this.radius_pixels]);
}

TsunamiRunup.prototype.setupAxes = function() {
    var vis = this;

    var gr = vis.svg.append("g")
        .attr("class", "r axis")
        .selectAll("g")
        .data(vis.rScale.ticks(vis.n_radial_levels).slice(1))
        .enter().append("g");

    gr.append("circle")
        .attr("r", vis.rScale);

    gr.append("text")
        .attr("y", function(d) { return -vis.rScale(d) - 4; })
        .attr("transform", "rotate(25)")
        .style("text-anchor", "middle")
        .text(function(d) { 
            return d + " minutes"; 
        });

    var angles_group = vis.svg.append("g")
        .attr("class", "a axis")
        .selectAll("g")
        .data(d3.range(0, 360, 45))
        .enter().append("g")
        .attr("transform", function(d) { return "rotate(" + -d + ")"; });

    angles_group.append("text")
        .attr("x", vis.radius_pixels + 6)
        .attr("dy", ".35em")
        .style("text-anchor", function(d) { 
            return d < 270 && d > 90 ? "end" : null; 
        })
        .attr("transform", function(d) {
            return d < 270 && d > 90 
                ? 
                "rotate(180 " + (vis.radius_pixels + 6) + ",0)" 
                :
                null; 
        })
        .text(function(d) { return d + "°"; });

    angles_group.append("line")
        .attr("x2", vis.radius_pixels);
}

TsunamiRunup.prototype.plotRunup = function() {
    var vis = this;

    var runupCircles = this.svg.selectAll("circle")
        .data(this.selectedData);

    runupCircles.enter().append("circle")
        .attr("class", "runup-circle")
        .attr("r", 2)
        .attr("cx", function (d) {
            return vis.rScale(d.travelTime);
        })
        .attr("cy", 0)
        .attr("transform", function (d) {
            return "rotate(" + Math.round(Math.random() * 360) + ")";
        });
}
