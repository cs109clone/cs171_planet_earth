// TODO:
// Zooming? http://bl.ocks.org/mbostock/4015254
// Need a color bar and a size scale.
TsunamiRunup = function(_parentElement, _dataFile) {
    this.parentElement = _parentElement;
    this.dataFile = _dataFile;
    this.loadData();
}

function getTravelTime(d) {
    return ((+d.TRAVEL_TIME_MINUTES) + 60 * (+d.TRAVEL_TIME_HOURS))
}

if (typeof(Number.prototype.toRadians) === "undefined") {
    Number.prototype.toRadians = function() {
        return this * Math.PI / 180;
    }
}
if (typeof(Number.prototype.toDegrees) === "undefined") {
    Number.prototype.toDegrees = function() {
        return this * 180 / Math.PI;
    }
}

function getAngle(d) {
    var R = 6371000; // metres

    var lat1 = 3.316;
    var lon1 = 95.854;
    var lat2 = d.LATITUDE;
    var lon2 = d.LONGITUDE;

    var phi1 = lat1.toRadians();
    var phi2 = lat2.toRadians();
    var dphi = (lat2-lat1).toRadians();
    var dlambda = (lon2-lon1).toRadians();

    var y = Math.sin(dlambda) * Math.cos(phi2);
    var x = Math.cos(phi1)*Math.sin(phi2) -
            Math.sin(phi1)*Math.cos(phi2)*Math.cos(dlambda);
    var brng = Math.atan2(y, x).toDegrees();
    return brng;
}

TsunamiRunup.prototype.loadData = function() {
    var vis = this;
    d3.tsv(vis.dataFile, function (error, data) {
        vis.selectedData = [];
        vis.deathToll = {};
        vis.maxRunupByCountry = {}
        for (var i = 0; i < data.length; i++) {
            data[i].LONGITUDE = +data[i].LONGITUDE;
            data[i].LATITUDE = +data[i].LATITUDE;
            data[i].DEATHS = +data[i].DEATHS;
            data[i].WATER_HT = +data[i].WATER_HT;
            if (data[i].TRAVEL_TIME_HOURS && data[i].TRAVEL_TIME_MINUTES) {
                data[i].TRAVEL_TIME_HOURS = +data[i].TRAVEL_TIME_HOURS;
                data[i].TRAVEL_TIME_MINUTES = +data[i].TRAVEL_TIME_MINUTES;
                data[i].travelTime = getTravelTime(data[i]);
                data[i].angleFromEpicenter = getAngle(data[i]);
                vis.selectedData.push(data[i]);
            }
            if (!(data[i].COUNTRY in vis.deathToll)) {
                vis.deathToll[data[i].COUNTRY] = 0
            }
            if (data[i].DEATHS) {
                vis.deathToll[data[i].COUNTRY] += data[i].DEATHS;
            }
            if (!(data[i].COUNTRY in vis.maxRunupByCountry)) {
                vis.maxRunupByCountry[data[i].COUNTRY] = 0
            }
            if (data[i].WATER_HT) {
                vis.maxRunupByCountry[data[i].COUNTRY] = Math.max(
                    data[i].WATER_HT, vis.maxRunupByCountry[data[i].COUNTRY]
                );
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

    var zoom = d3.behavior.zoom()
        .on("zoom", this.);
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

    var maxDeaths = d3.max(this.data, function(d) {
        return d.DEATHS; 
    });
    this.deathScale = d3.scale.log()
        .domain([1, maxDeaths])
        .range([2, 7]);

    var maxRunup = d3.max(this.data, function(d) {
        return d.WATER_HT;
    });
    console.log(maxRunup);
    console.log(this.maxRunupByCountry);
    this.runupScale = d3.scale.log()
        .domain([1.0, maxRunup])
        .range(["blue", "red"]);
    console.log(this.runupScale(5));
    console.log(this.runupScale(45));
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

    var tip = d3.tip().attr("class", "d3-tip");
    tip.html(function (d) {
        return '<div id="tooltip-title">' + 
            d.COUNTRY +
            '</div>' +
            '<div id="tooltip-data">' + 
            d.LATITUDE + " : " + 
            d.LONGITUDE + " : " +
            vis.deathToll[d.COUNTRY]
            '</div>';
    });
    vis.svg.call(tip);

    var runupCircles = this.svg.selectAll("circle")
        .data(this.selectedData);

    runupCircles.enter().append("circle")
        .attr("class", "runup-circle")
        .attr("r", function (d) {
            if (d.COUNTRY in vis.deathToll) {
                return vis.deathScale(vis.deathToll[d.COUNTRY] + 1);
            }
            return 2;
        })
        .attr("cx", function (d) {
            return vis.rScale(d.travelTime);
        })
        .attr("cy", 0)
        .attr("fill", function (d) {
            console.log(vis.maxRunupByCountry[d.COUNTRY]);
            return vis.runupScale(vis.maxRunupByCountry[d.COUNTRY]); 
        })
        .attr("transform", function (d) {
            return "rotate(" + (d.angleFromEpicenter - 90) + ")";
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
}
