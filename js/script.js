var margin = {top: 20, right: 200, bottom: 30,left: 50},
    width = $(".chart").width() - margin.left - margin.right,
    height = $(".chart").height() - margin.top - margin.bottom;

var parseDate = d3.time.format("%Y").parse;

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

//Got rid of the color scale because we don't want a rainbow of colors.
// var color = d3.scale.category10();
//Replaced the color scale with an ordinal scale to hold our state names
var theStates = d3.scale.ordinal();

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

//I added the defined() line here to account for our missing data
//This lets us draw partial lines with gaps for years without data
//More info here: http://stackoverflow.com/questions/15259444/drawing-non-continuous-lines-with-d3
var line = d3.svg.line()
    .defined(function(d) {
        return !isNaN(d.divorce)
    })
    .interpolate("basis")
    .x(function(d) {
        return x(d.date);
    })
    .y(function(d) {
        return y(d.divorce);
    });

var svg = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



//moveToFront and moveToBack:
//This is a bit of code that lets us move lines forward and backward in the view.
//If we don't do that, our lines look like they're under other lines when we mouse over them.
//These are called by adding ".moveToFront()" or ".moveToBack()" to the end of a selection.
//More info here: http://stackoverflow.com/questions/14167863/how-can-i-bring-a-circle-to-the-front-with-d3
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



d3.csv("js/divorce.csv", function(error, data) {
    //Mapped our states to the theStates scale instead of the color scale.
    //color.domain(d3.keys(data[0]).filter(function(key) { return key !== "year"; }));
    theStates.domain(d3.keys(data[0]).filter(function(key) {
        return key !== "year";
    }));

    data.forEach(function(d) {
        d.date = parseDate(d.year);
    });


    //Added a 'nameStr' property that replaces all of the spaces in state names.
    // replace(/ /g, "") replaces all spaces in a string with "", or no space.
    //More info: http://www.w3schools.com/jsref/jsref_replace.asp
    var states = theStates.domain().map(function(name) {
        return {
            name: name,
            nameStr: name.replace(/ /g, ""),
            values: data.map(function(d) {
                return {
                    date: d.date,
                    divorce: +d[name]
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
                return v.divorce;
            });
        }),
        d3.max(states, function(c) {
            return d3.max(c.values, function(v) {
                return v.divorce;
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
        // .append("text")
        //   .attr("transform", "rotate(-90)")
        //   .attr("y", 6)
        //   .attr("dy", ".71em")
        //   .style("text-anchor", "end")
        //   .text("divorces");

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


    //Added mouseover and mouseout to the lines
    //Mouseover brings a line group to the front
    //And colors in black
    //Mouseout sends all of the line groups to the back
    //And colors all of the lines grey
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
            return "translate(" + width + "," + y(d.value.divorce) + ")";
        })
        .attr("opacity", 0)
        .attr("x", 3)
        .attr("dy", ".35em")
        .text(function(d) {
            return d.name;
        });
});