main();

var top10;

function main() {
    top10 = new Top10("#cluster-area", "data/top10.csv");
}

function updateVis(){
    return top10.updateVis();
}