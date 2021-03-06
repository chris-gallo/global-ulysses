/* SVG DIMENSIONS */
var width = 1100,
    height = 500;


/* MAP PROJECTION */
var projection = d3.geo.mercator()
    .center([0, 0])
    .scale(175)
    .rotate([0, 0]);

var go = d3.select("body").select("button");

/* MAP RENDERING */
var svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("x", 50);

var path = d3.geo.path()
             .projection(projection);

var g = svg.append("g");

/*
Creates an array function 'unique' that returns
all unique entries for Character, Episode and 
Locality. These will be used to populate the 
dropdowns and plot localities.
*/
Array.prototype.unique = function (exp) {
    "use strict";
    var o = {}, l = [],
        i = 0, j = this.length;     /* o catches repeated localities and l collects the unique ones */
    for (i, j; i < j; i++) {
        switch (exp) {
        case "character":
            if (o.hasOwnProperty(this[i].CHARACTER)) {
                continue;
            }
            l.push(this[i]);
            o[this[i].CHARACTER] = 1;
            break;
        case "episode":
            if (o.hasOwnProperty(this[i].EPISODE)) {
                continue;
            }
            l.push(this[i]);
            o[this[i].EPISODE] = 1;
            break;
        case "locality":
            if (o.hasOwnProperty(this[i].LOCALITY) || this[i].LOCALITY === '') {
                continue;
            }
            l.push(this[i]);
            o[this[i].LOCALITY] = 1;
            break;
        }
    }
    return l;
};

/* The things that should change when we zoom. */
var zoomers = [];

console.log("Setting up zoom behavior");
var zoom = d3.behavior.zoom().on("zoom", function () {
  console.log("Calling zoom");
  for (var i = 0; i < zoomers.length; i++) {
    zoomers[i]();
  } // for
}); // on zoom
console.log("Done setting up zoom behavior");

/* load and display the World */
d3.json("world-110m2.json", function (error, topology) {

    viz = function(chardrop, epdrop, city_class, button_id){

        /* CHARACTER AND EPISODE DROPDOWNS */
        var charSelect = d3.select(chardrop);

        var epSelect = d3.select(epdrop);

        /* load data and display the cities */
        d3.csv("newest.csv", function (error, data) {
            "use strict";

            /* define a bunch of variables and functions
            we need to create the visualization */
            var dat = {
                full : data,
                currentTable : data,
                currentMap : data.unique("locality")
            };

                /* sorts characters alphabetically */
            var charList = function (data) {
                    var x = [],
                        i;
                    for (i = 0; i < data.length; i++) {
                        x.push(data[i].CHARACTER);
                    }
                    return x.sort();
                };

            var scalar; /* declare a scalar variable */

                /* set up the city scale */
            var cityScale = d3.scale.linear()
                .domain([d3.min(data, function (d) {return d.Locality_Count; }),
                    d3.max(data, function (d) {return d.Locality_Count; })])
                .range([3, 8]);

                /* resize city given selection */
            var cityResize = function (d) {
                    return dat.currentTable.filter(function (el) {
                        return el.LOCALITY === d.LOCALITY;
                    }).length;
                };

                /* function to update the table beneath the map */
            var updateTable = function (filterTerm) {
                    /* DATA FILTER */
                    var tableData = dat.currentTable.filter(function (el) {return el.LOCALITY === filterTerm; });

                    /* DATA JOIN */
                    var rows = d3.select("tbody").selectAll("tr")
                                 .data(tableData);

                    /* ENTER DATA */
                    rows.enter()
                        .append("tr");

                    var cells = rows.selectAll("td")
                                    .data(function (row) {
                                        return [{column: 'Locality', value: row.LOCALITY},
                                                {column: 'Country', value: row.COUNTRY},
                                                {column: 'Continent', value: row.CONTINENT},
                                                {column: 'Character', value: row.CHARACTER},
                                                {column: 'Episode', value: row.EPISODE},
                                                {column: 'Line', value: row.LINE},
                                                {column: 'Context', value: row.CONTEXT}];
                            });

                    cells.enter()
                         .append("td");
                    /* UPDATE DATA */
                    cells.text(function (d) {return d.value; });

                    /* EXIT DATA */
                    cells.exit().remove();

                    rows.exit().remove();
                };

                /* function to redraw localities on episode and character filter */
            var redraw = function (ep, character) {

                    /* DATA FILTER */
                    if (ep === '' && character === '') {
                        dat.currentTable = dat.full; 
                    }
                    else if (ep === '') {
                        dat.currentTable = dat.full.filter(function (el) {return el.CHARACTER === character; });
                    }
                    else if (character === '') {
                        dat.currentTable = dat.full.filter(function (el) {return el.EPISODE === ep; });
                    }
                    else{
                        dat.currentTable = dat.full.filter(function (el) {return el.EPISODE === ep && el.CHARACTER === character; });
                    }
                      
                    dat.currentMap = dat.currentTable.unique("locality"); /* data to plot localities */

                    /* DATA JOIN */
                    var localities = g.selectAll(city_class)
                                      .data(dat.currentMap);

                    /* ENTER DATA */
                    localities.enter()
                            .append("circle")
                            .attr("r", 0)
                            .attr("class", city_class.substring(1))
                            .attr("cx", function (d) {
                                     return projection([d.LONGITUDE, d.LATITUDE])[0];
                            })
                            .attr("cy", function (d) {
                                     return projection([d.LONGITUDE, d.LATITUDE])[1];
                            })
//                            .transition()
//                            .duration(2000)
                            .attr("r", function (d) {
                                if (typeof(scalar) === "undefined") { /*checks to see if the scalar global is defined
                                    this prevents the visualization from erroring out if the user filters before zooming*/
                                    return cityScale(cityResize(d));
                                }
                                else{
                                    return cityScale(cityResize(d)) / scalar;
                                }
                            })
                            .attr("stroke", "black")
                            .attr("stroke-width", function () {
                                if (typeof(scalar) === "undefined") {
                                    return 1;
                                }
                                else{
                                    return 1 / scalar;
                                }
                            })
                            .attr("shape-rendering", "auto");

                    /* UPDATE DATA */
                    localities
//                        .transition()
//                        .duration(1500)
                        .attr("r", 0)
                        .attr("cx", function (d) {
                            return projection([d.LONGITUDE, d.LATITUDE])[0];
                        })
                        .attr("cy", function (d) {
                            return projection([d.LONGITUDE, d.LATITUDE])[1];
                        })
//                        .transition()
//                        .duration(3000)
                        .attr("r", function (d) {
                            if (typeof(scalar) === "undefined") { 
                                return cityScale(cityResize(d));
                            }
                            else{
                                return cityScale(cityResize(d)) / scalar;
                            }
                        })
                        .attr("stroke", "black")
                        .attr("shape-rendering", "auto");


                    localities.on("click", function (d) {  
                            var filterTerm = d.LOCALITY;
                            console.log(filterTerm); 
                            updateTable(filterTerm);
                        });

                    /* EXIT DATA */
                    localities.exit()
//                    .transition().duration(2000)
                    .attr("r", 0)
                    .remove();

                };

                /*function to dynamically update dropdown menu.
                Helps to reduce choices in character dropdown*/
            var updateDropdown = function (ep) {
                    if (ep === '') {
                        charSelect.selectAll(".newCharacters")
                            .data(charList(dat.full.unique("character")))
                            .enter()
                            .append("option")
                            .attr("class", "newCharacters")
                            .text(function (d) {return d; });
                    }
                    else {
                        /* DATA FILTER */
                        dat.currentTable = dat.full.filter(function (el) {return el.EPISODE === ep; });
                        var dropData = dat.currentTable.unique("character");

                        /* DATA JOIN */
                        var charOptions = charSelect.selectAll(".newCharacters")
                                            .data(charList(dropData));

                        /* ENTER */
                        charOptions.enter()
                                   .append("option")
                                   .attr("class", "newCharacters")
                                   .text(function (d) {return d; });

                        /* UPDATE */
                        charOptions.text(function (d) {return d; });

                        /* EXIT */
                        charOptions.exit().remove();
                    }
                };

                /* zoom, pan, and city resize */
                console.log("Pushing zoomer for", city_class);
                zoomers.push(function() {
                    console.log("zooming in ", city_class);
                    g.attr("transform", "translate("+ 
                        d3.event.translate.join(",")+")scale("+d3.event.scale+")");
                    g.selectAll(city_class)
                        .data(dat.currentMap)
                        .attr("d", path.projection(projection))
                        .attr("r", function (d) {return cityScale(cityResize(d)) / d3.event.scale; })
                        .attr("stroke-width", 1 / d3.event.scale);
                    g.selectAll("path")
                        .attr("d", path.projection(projection));

                    scalar = d3.event.scale; 
                });
                console.log("Done");
/*
            var zoom = d3.behavior.zoom().on("zoom", function () {
                    console.log("zooming in ", chardrop);
                    g.attr("transform", "translate("+ 
                        d3.event.translate.join(",")+")scale("+d3.event.scale+")");
                    g.selectAll(city_class)
                        .data(dat.currentMap)
                        .attr("d", path.projection(projection))
                        .attr("r", function (d) {return cityScale(cityResize(d)) / d3.event.scale; })
                        .attr("stroke-width", 1 / d3.event.scale);
                    g.selectAll("path")
                        .attr("d", path.projection(projection));

                    scalar = d3.event.scale; 
                });
 */

            /* start creating the visualization here */

            /* give episode a default option */
            d3.selectAll(".epDrop")
              .append("option")
              .attr("value", '')
              .text("(Select Episode)");

            d3.selectAll(".epDrop").selectAll(".newEpisodes")
                    .data(dat.full.unique("episode"))
                    .enter()
                    .append("option")
                    .attr("class", "newEpisodes")
                    .attr("value", function (d) {return d.EPISODE; })
                    .text(function (d) {return d.EPISODE; });

            epSelect.on("change", function () {
                updateDropdown(this.value);
                console.log(this.value);
            });

            /* give character a default option */
            d3.selectAll(".charDrop")
              .append("option")
              .attr("value", '')
              .text("(Select Character)");

            d3.selectAll(".charDrop").selectAll(".newCharacters")
                      .data(charList(dat.full.unique("character")))
                      .enter()
                      .append("option")
                      .attr("class", "newCharacters")
                      .text(function (d) {return d; });

            d3.select(button_id).on("click", function () {

                /* Collect character and episode information */
                var epElem = document.getElementById(epdrop.substring(1)),
                    strEpisode = epElem.options[epElem.selectedIndex].value,

                    charElem = document.getElementById(chardrop.substring(1)),
                    strCharacter = charElem.options[charElem.selectedIndex].value;

                console.log(strEpisode);
                console.log(strCharacter);

                redraw(strEpisode, strCharacter);
            });

            /* plot the cities */
            g.selectAll(city_class)
                .data(dat.currentMap)
                .enter()
                .append("circle")
                .attr("class", city_class.substring(1))
                .attr("cx", function (d) {
                    return projection([d.LONGITUDE, d.LATITUDE])[0];
                })
                .attr("cy", function (d) {
                    return projection([d.LONGITUDE, d.LATITUDE])[1];
                })
                .attr("r", function (d) {return cityScale(d.Locality_Count); })
                .attr("stroke", "black")
                .attr("shape-rendering", "auto")
                .on("click", function (d) {  
                    var filterTerm = d.LOCALITY; 
                    console.log(filterTerm);
                    updateTable(filterTerm);
                });

            svg.call(zoom);

        });
    }

    viz("#cd1", "#ed1", ".city1", "#go1");
    viz("#cd2", "#ed2", ".city2", "#go2");

    g.selectAll("path")
          .data(topojson.object(topology, topology.objects.countries)
              .geometries)
        .enter()
          .append("path")
          .attr("d", path);
});



