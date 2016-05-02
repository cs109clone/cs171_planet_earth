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
    this.radius_pixels = 400;
    this.max_radius_minutes = 2500;
    this.radius_minutes = this.max_radius_minutes;
    this.n_radial_levels = 7;

    this.createSVG();
    this.setupScales();
    this.updateLegend();
    this.setupAxes();
    this.setupTooltips();
    this.setupZoom();
    this.update();
}

TsunamiRunup.prototype.createSVG = function() {
    var vis = this;

    this.width = 900;
    this.height = 900;

    this.realSVG = d3.select(this.parentElement).append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
    this.svg = this.realSVG
        .append("g")
        .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");
}

TsunamiRunup.prototype.setupScales = function() {
    this.zoom_scale = 1.0;
    this.rScale = d3.scale.linear()
        .range([0, this.radius_pixels]);

    this.minCircleR = 2;
    this.maxCircleR = 7;

    this.minDeaths = d3.min(this.data, function(d) {
        return d.DEATHS; 
    }) + 1;
    this.maxDeaths = d3.max(this.data, function(d) {
        return d.DEATHS; 
    });
    this.deathScale = d3.scale.log()
        .range([this.minCircleR, this.maxCircleR])
        .domain([this.minDeaths, this.maxDeaths])

    this.minRunup = d3.min(this.data, function(d) {
        return d.WATER_HT;
    }) + 0.1;
    this.maxRunup = d3.max(this.data, function(d) {
        return d.WATER_HT;
    });
    this.runupScale = d3.scale.log()
        .range(["blue", "red"])
        .domain([this.minRunup, this.maxRunup])
}

TsunamiRunup.prototype.updateLegend = function() {
    var legend = this.svg.append("g");

    var l = -450;
    var t = 390;
    var step = 35;

    legend.append("text")
        .attr("x", l + 50)
        .attr("y", -t - 10)
        .attr("class", "zoom-comment")
        .text("Zoom with two fingers or the mouse wheel")

    legend.append("text")
        .attr("x", l + 10)
        .attr("y", t + 13)
        .attr("class", "legend")
        .text("Deaths: ")

    var superscript = "⁰¹²³⁴⁵⁶⁷⁸⁹";
    var formatPower = function(d) { return (d + "").split("").map(function(c) { return superscript[c]; }).join(""); };
        
    for (var i = this.minCircleR; i <= this.maxCircleR; i++) {
        legend.append("circle")
            .attr("cx", l + step * i)
            .attr("cy", t + 10)
            .attr("r", i);

        var label = "10" + formatPower(Math.round(Math.log10(this.deathScale.invert(i))));
        legend.append("text")
            .attr("x", l - 10 + step * i)
            .attr("y", t + 30)
            .attr("class", "deaths-legend")
            .text(label);
    }

    legend.append("text")
        .attr("x", -l - 305)
        .attr("y", t + 15)
        .attr("class", "legend")
        .text("Tsunami Runup: ")
    colorbar = Colorbar()
        .barlength(170)
        .thickness(25)
        .scale(this.runupScale)
        .orient("horizontal")

    var colorbar_g = this.svg.append("g")
        .attr("transform", "translate(" + (-l - 200) + "," + t + ")");
    colorbarObject = colorbar_g.call(colorbar);

    var n_steps = 4;
    for (var i = 0; i < n_steps; i++) {
        colorbar_g.append("text")
            .attr("x", 50 * i)
            .attr("y", 35)
            .text(Math.pow(10, i - 1) + "m")
    }

    var dist = 400;
    this.svg.append("text")
        .attr("x", dist + 2)
        .attr("y", 4)
        .text("E");

    this.svg.append("text")
        .attr("x", -4)
        .attr("y", -dist - 2)
        .text("N");

    this.svg.append("text")
        .attr("x", -dist - 13)
        .attr("y", 4)
        .text("W");

    this.svg.append("text")
        .attr("x", -4)
        .attr("y", dist + 12)
        .text("S");
}

TsunamiRunup.prototype.setupAxes = function() {
    var vis = this;

    rAxis = vis.svg.append("g")
        .attr("class", "r axis")

    this.rAxisCircles = rAxis.selectAll("circle")
        .data(vis.rScale.ticks(vis.n_radial_levels).slice(1))
        .enter()
        .append("circle")

    this.rAxisText = rAxis.selectAll("g")
        .data(vis.rScale.ticks(vis.n_radial_levels).slice(1))
        .enter()
        .append("text")

    vis.svg.append("g")
        .attr("class", "a axis")
        .selectAll("g")
        .data(d3.range(0, 360, 45))
        .enter().append("g")
        .attr("transform", function(d) { return "rotate(" + -d + ")"; })
        .append("line")
        .attr("x2", vis.radius_pixels)
}

TsunamiRunup.prototype.setupTooltips = function() {
    var vis = this;
    this.tip = d3.tip().attr("class", "d3-tip");
    this.tip.html(function (d) {
        return '<div id="tooltip-title">' + 
            d.COUNTRY +
            '</div>' +
            '<div id="tooltip-data">' + 
            "Location: (" + d.LATITUDE + ", " + d.LONGITUDE + ")" +
            "<br/>Deaths (total for country): " + vis.deathToll[d.COUNTRY] + 
            "<br/>Run-up: " + vis.maxRunupByCountry[d.COUNTRY] + "m" +
            '</div>';
    });
    this.svg.call(this.tip);
}

TsunamiRunup.prototype.setupZoom = function() {
    var vis = this;
    this.zoom = d3.behavior.zoom()
    this.zoom.on("zoom", function (d) {
        vis.zoom_scale = 1.0 / d3.event.scale;
        vis.update();
    });

    this.realSVG.call(this.zoom);
}

TsunamiRunup.prototype.update = function() {
    var vis = this;

    var rDomainMax = this.radius_minutes * this.zoom_scale;
    this.rScale.domain([0, rDomainMax])
    this.rAxisCircles
        .attr("r", function (d) {
            return vis.rScale(d * rDomainMax);
        });

    this.rAxisText
        .attr("y", function(d) {
            return -vis.rScale(d * rDomainMax) - 4; 
        })
        .attr("transform", "rotate(25)")
        .style("text-anchor", "middle")
        .text(function(d) { 
            return Math.round((d * rDomainMax) / 10) * 10 + " minutes"; 
        });

    var runupCircles = this.svg.selectAll("circle").filter(".runup-circle")
        .data(this.selectedData);

    runupCircles.enter().append("circle")
        .attr("class", "runup-circle")
        .attr("r", function (d) {
            if (d.COUNTRY in vis.deathToll) {
                return vis.deathScale(vis.deathToll[d.COUNTRY] + 1);
            }
            return 2;
        })
        .attr("transform", function (d) {
            return "rotate(" + (d.angleFromEpicenter - 90) + ")";
        })
        .on('mouseover', this.tip.show)
        .on('mouseout', this.tip.hide)
        .attr("stroke-width", "1.5px")
        .attr("opacity", 0.7);

    var xFunc = function (d) {
        return vis.rScale(d.travelTime);
    };

    runupCircles
        .attr("cx", xFunc)
        .attr("cy", 0)
        .attr("fill", function (d) {
            if (d.travelTime > rDomainMax) {
                return "none";
            }
            return vis.runupScale(vis.maxRunupByCountry[d.COUNTRY]); 
        })
        .attr("stroke", function (d) {
            if (d.travelTime > rDomainMax) {
                return "none";
            }
            return "black";
        });
}
