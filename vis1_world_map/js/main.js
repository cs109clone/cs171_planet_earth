main();

var worldMap;

function main() {
    worldMap = new WorldMap("#world-map", "data/world-50m.json", "data/tectonic_plates.json", "data/natural_disasters.csv");
}

function brushed() {
    worldMap.rangeDates = worldMap.brush.empty() ? worldMap.xTimeline.domain() : worldMap.brush.extent();
    worldMap.filteredData = worldMap.data.filter(function(d){
        return worldMap.formatDate(worldMap.rangeDates[0]) <= worldMap.formatDate(d.TIME) && worldMap.formatDate(d.TIME) <= worldMap.formatDate(worldMap.rangeDates[1]);
    });
    if (worldMap.selectedData == "all") {
        worldMap.svgTimeline.selectAll(".rect").classed("hidden-bar", function (d) {
            return !(worldMap.formatDate(worldMap.rangeDates[0]) <= worldMap.formatDate(d.date) && worldMap.formatDate(d.date) <= worldMap.formatDate(worldMap.rangeDates[1]));
        });
    } else {
        worldMap.svgTimeline.selectAll(".bar").classed("hidden-bar", function (d) {
            return !(worldMap.formatDate(worldMap.rangeDates[0]) <= worldMap.formatDate(d.date) && worldMap.formatDate(d.date) <= worldMap.formatDate(worldMap.rangeDates[1]));
        });
    }
    worldMap.updateMap();
}

function brushMapClear() {
    return worldMap.brush.clear();
}

function updateHistogram() {
    return worldMap.updateHistogram();
}

function updatePlates(){
    return worldMap.updatePlates();
}