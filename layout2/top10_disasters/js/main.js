main();

var top10;

function main() {
    top10 = new Top10("#cluster-area", "top10_disasters/data/top10.csv");
}

function updateVis(){
    return top10.updateVis();
}