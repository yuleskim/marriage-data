var margin = {top: 20, right: 200, bottom: 30,left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var parseDate = d3.time.format("%Y").parse;

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var theStates = d3.scale.ordinal();

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var line = d3.svg.line()
    .defined(function(d) {
        return !isNaN(d.marriage)
    })
    .interpolate("basis")
    .x(function(d) {
        return x(d.date);
    })
    .y(function(d) {
        return y(d.marriage);
    });

var svg = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
        this.parentNode.appendChild(this);
    });
};

d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};



d3.csv("js/marriage.csv", function(error, data) {
    theStates.domain(d3.keys(data[0]).filter(function(key) {
        return key !== "year";
    }));

    data.forEach(function(d) {
        d.date = parseDate(d.year);
    });


     var states = theStates.domain().map(function(name) {
        return {
            name: name,
            nameStr: name.replace(/ /g, ""),
            values: data.map(function(d) {
                return {
                    date: d.date,
                    marriage: +d[name]
                };
            })
        };
    });


    x.domain(d3.extent(data, function(d) {
        return d.date;
    }));

    y.domain([
        d3.min(states, function(c) {
            return d3.min(c.values, function(v) {
                return v.marriage;
            });
        }),
        d3.max(states, function(c) {
            return d3.max(c.values, function(v) {
                return v.marriage;
            });
        })
    ]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
    

    var state = svg.selectAll(".state")
        .data(states)
        .enter().append("g")
        .attr("class", function(d) {
            return "state " + d.nameStr;
        });

    state.append("path")
        .attr("class", "line")
        .attr("d", function(d) {
            return line(d.values);
        })
        .style("stroke", function(d) {
            "#CCC"
        })

    d3.selectAll(".line")
        .on("mouseover", function(d) {
            d3.select(this)
                .style("stroke", function(d) {
                    return "#333";
                });

            d3.select("g.state." + d.nameStr)
                .moveToFront();

            d3.select(".state-lbl." + d.nameStr)
                .attr("opacity", 1);

        })
        .on("mouseout", function(d) {
            d3.selectAll(".line")
                .style("stroke", function(d) {
                    return "#CCC";
                })

            d3.select("g.state")
                .moveToBack();

            d3.selectAll(".state-lbl")
                .attr("opacity", 0);

        })


    state.append("text")
        .datum(function(d) {
            return {
                name: d.name,
                nameStr: d.name.replace(/ /g, ""),
                value: d.values[d.values.length - 1]
            };
        })
        .attr("class", function(d) {
            console.log(d)
            return "state-lbl " + d.nameStr;
        })
        .attr("transform", function(d) {
            console.log(d);
            return "translate(" + width + "," + y(d.value.marriage) + ")";
        })
        .attr("opacity", 0)
        .attr("x", 3)
        .attr("dy", ".35em")
        .text(function(d) {
            return d.name;
        });
});
