var margin = { top: 50, right: 0, bottom: 100, left: 30 },
    width = 960 - margin.left - margin.right,
    height = 430 - margin.top - margin.bottom,
    gridSize = Math.floor(width / 24),
    legendElementWidth = gridSize*2,
    buckets = 9,
    datasets = ["iceland/data.csv"],
    colors = ["#2166ac","#4393c3","#92c5de","#d1e5f0","#f7f7f7","#fddbc7","#f4a582","#d6604d","#b2182b"],
    days = ["April 15", "April 16", "April 17", "April 18", "April 19", "April 20", "April 21", "April 22"],
    airports = ["PARIS CH DE GAULLE", "FRANKFURT MAIN", "MADRID BARAJAS", "LONDON/HEATHROW", "MUENCHEN", "SCHIPHOL AMSTERDAM", "ROME FIUMICINO",
        "WIEN SCHWECHAT", "OSLO/GARDERMOEN", "COPENHAGEN KASTRUP", "ZURICH", "DUESSELDORF", "ISTANBUL-ATATURK", "BARCELONA",
        "STOCKHOLM-ARLANDAATHINAI E. VENIZELOS", "BRUSSELS NATIONAL", "PARIS ORLY", "MILANO MALPENSA", "TEGEL-BERLIN", "HELSINKI-VANTAA",
        "GENEVE COINTRIN", "LONDON/GATWICK", "HAMBURG", "KOELN-BONN", "MILANO LINATE", "PALMA DE MALLORCA", "STUTTGARTWARSZAWA/OKECIE",
        "PRAHA RUZYNE", "DUBLIN", "LISBOA", "MANCHESTER", "NICE", "BERGEN/FLESLAND", "LAS PALMAS", "LONDON/CITY", "FERIHEGY-BUDAPEST",
        "MARSEILLE PROVENCE", "EDINBURGH"];

var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", "900")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var airportLabels = svg.selectAll(".dayLabel")
    .data(airports)
    .enter().append("text")
    .text(function (d) { return d; })
    .attr("x", 0)
    .attr("y", function (d, i) { return i * 20; })
    .style("text-anchor", "end")
    .attr("transform", "translate (100, 50)")
    .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

var dayLabels = svg.selectAll(".timeLabel")
    .data(days)
    .enter().append("text")
    .text(function(d) { return d; })
    .attr("x", function(d, i) { return i * 80; })
    .attr("y", 0)
    .style("text-anchor", "middle")
    .attr("transform", "translate( 175, -6)")
    .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

var heatmapChart = function(csvFile) {
    d3.csv(csvFile,
        function(d) {
            return {
                day: +d.day,
                num: +d.num,
                value: +d.value
            };
        },
        function(error, data) {
            var colorScale = d3.scale.quantile()
                .domain([0, buckets - 1, d3.max(data, function (d) { return d.value; })])
                .range(colors);

            var cards = svg.selectAll(".hour")
                .data(data, function(d) {return d.day+':'+d.num;});

            cards.append("title");

            cards.enter().append("rect")
                .attr("x", function(d) { return (d.day - 7) * 80; })
                .attr("y", function(d) { return (d.num - 1) * 19; })
                .attr("rx", 0)
                .attr("ry", 0)
                .attr("class", "hour bordered")
                .attr("width", 80)
                .attr("height", 20)
                .attr("transform", "translate(-500, 35)")
                .style("fill", colors[0]);

            cards.transition().duration(1000)
                .style("fill", function(d) { return colorScale(d.value); });

            cards.select("title").text(function(d) { return d.value; });

            cards.exit().remove();

            var legend = svg.selectAll(".legend")
                .data([0].concat(colorScale.quantiles()), function(d) { return d; });

            legend.enter().append("g")
                .attr("class", "legend");

            legend.append("rect")
                .attr("x", function(d, i) { return legendElementWidth * i; })
                .attr("y", 820)
                .attr("width", legendElementWidth)
                .attr("height", gridSize / 2)
                .style("fill", function(d, i) { return colors[i]; });

            legend.append("text")
                .attr("class", "mono")
                .text(function(d) { return "≥ " + Math.round(d); })
                .attr("x", function(d, i) { return legendElementWidth * i; })
                .attr("y", 850);

            legend.exit().remove();

        });
};

heatmapChart(datasets[0]);

var datasetpicker = d3.select("#dataset-picker").selectAll(".dataset-button")
    .data(datasets);

datasetpicker.enter()
    .append("input")
    .attr("value", function(d){ return "Dataset " + d })
    .attr("type", "button")
    .attr("class", "dataset-button")
    .on("click", function(d) {
        heatmapChart(d);
    });