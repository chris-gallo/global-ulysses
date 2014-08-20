function chart(initEp, initChar){
    if(typeof(initEp) === 'undefined') initEp = null;
    if(typeof(initChar) === 'undefined') initChar = null

    console.log(initEp)
    console.log(initChar)

    /* SVG DIMENSIONS */
    var width = 1100,
        height = 500;


    /* MAP PROJECTION */
    var projection = d3.geo.mercator()
        .center([0, 0])
        .scale(175)
        .rotate([0, 0]);

    /* CHARACTER AND EPISODE DROPDOWNS */
    var charSelect = d3.select("p").append("select")
                       .attr("id", "charDrop");

    var epSelect = d3.select("p").append("select")
                     .attr("id", "epDrop");

    var go = d3.select("p").append("button")
               .text("Go!");

    /* MAP RENDERING */
    var svg = d3.select("#map").append("svg")
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
            i = 0, j = this.length;     //o catches repeated localities and l collects the unique ones
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
                if (o.hasOwnProperty(this[i].LCC) || this[i].LCC === '') {
                    continue;
                }
                l.push(this[i]);
                o[this[i].LCC] = 1;
                break;
            }
        }
        return l;
    };


    /* load and display the World */
    d3.json("world-110m2.json", function (error, topology) {

        /* load data and display the cities */
        d3.csv("newest.csv", function (error, data) {
            "use strict";

            /* define a bunch of variables and functions
            we need to create the visualization */
            var dat = {
                full : data,
                currentTable : data,
                currentMap : data.unique("locality")
            },

                /* sorts characters alphabetically */
                charList = function (data) {
                    var x = [],
                        i;
                    for (i = 0; i < data.length; i++) {
                        x.push(data[i].CHARACTER);
                    }
                    return x.sort();
                },

                scalar, /* declare a scalar variables */

                /* set up the city scale */
                cityScale = d3.scale.sqrt()
                .domain([d3.min(data, function (d) {return d.LCC_Count; }),
                    d3.max(data, function (d) {return d.LCC_Count; })])
                .range([3, 8]),

                /* resize city given selection */
                cityResize = function (d) {
                    return dat.currentTable.filter(function (el) {
                        return el.LCC === d.LCC;
                    }).length;
                },

                /* function to update the table beneath the map */
                updateTable = function (filterTerm) {
                    /* DATA FILTER */
                    var tableData = dat.currentTable.filter(function (el) {return el.LCC === filterTerm; });

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
                },

                /* function to redraw localities on episode and character filter */
                redraw = function (ep, character) {

                    /* DATA FILTER */
                    if (!ep === true && !character === true) {
                        dat.currentTable = dat.full; 
                    }
                    else if (!ep === true) {
                        dat.currentTable = dat.full.filter(function (el) {return el.CHARACTER === character; });
                    }
                    else if (!character === true) {
                        dat.currentTable = dat.full.filter(function (el) {return el.EPISODE === ep; });
                    }
                    else{
                        dat.currentTable = dat.full.filter(function (el) {return el.EPISODE === ep && el.CHARACTER === character; });
                    }
                      
                    dat.currentMap = dat.currentTable.unique("locality"); /* data to plot localities */

                    /* DATA JOIN */
                    var localities = g.selectAll("circle")
                                      .data(dat.currentMap);

                    /* ENTER DATA */
                    localities.enter()
                            .append("circle")
                            .attr("cx", function (d) {
                                     return projection([d.LONGITUDE, d.LATITUDE])[0];
                            })
                            .attr("cy", function (d) {
                                     return projection([d.LONGITUDE, d.LATITUDE])[1];
                            })
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
                    localities.attr("cx", function (d) {
                            return projection([d.LONGITUDE, d.LATITUDE])[0];
                        })
                        .attr("cy", function (d) {
                            return projection([d.LONGITUDE, d.LATITUDE])[1];
                        })
                        .attr("r", function (d) {
                            if (typeof(scalar) === "undefined") { 
                                return cityScale(cityResize(d));
                            }
                            else{
                                return cityScale(cityResize(d)) / scalar;
                            }
                        })
                        .attr("stroke", "black")
                        .attr("shape-rendering", "auto")
                        .on("click", function (d) {  
                            var filterTerm = d.LCC;
                            console.log(filterTerm); 
                            updateTable(filterTerm);
                        });

                    /* EXIT DATA */
                    localities.exit().remove();
                },

                /*function to dynamically update dropdown menu.
                Helps to reduce choices in character dropdown*/
                updateDropdown = function (ep) {
                    if (!ep === true) {
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
                },

                /* zoom, pan, and city resize */
                zoom = d3.behavior.zoom().on("zoom", function () {
                    g.attr("transform", "translate("+ 
                        d3.event.translate.join(",")+")scale("+d3.event.scale+")");
                    g.selectAll("circle")
                        .data(dat.currentMap)
                        .attr("d", path.projection(projection))
                        .attr("r", function (d) {return cityScale(cityResize(d)) / d3.event.scale; })
                        .attr("stroke-width", 1 / d3.event.scale);
                    g.selectAll("path")
                        .attr("d", path.projection(projection));

                    scalar = d3.event.scale; 
                });

            /* start creating the visualization here */

            /* DATA FILTER */
            if (!initEp === true && !initChar === true) {
                dat.currentTable = dat.full; 
            }
            else if (!initEp === true) {
                dat.currentTable = dat.full.filter(function (el) {return el.CHARACTER === initChar; });
            }
            else if (!initChar === true) {
                dat.currentTable = dat.full.filter(function (el) {return el.EPISODE === initEp; });
            }
            else{
                dat.currentTable = dat.full.filter(function (el) {return el.EPISODE === initEp && el.CHARACTER === initChar; });
            }
            
            dat.currentMap = dat.currentTable.unique("locality");

            /* give episode a default option */
            d3.select("#epDrop")
              .append("option")
              .attr("value", null);

            epSelect.selectAll(".newEpisodes")
                    .data(dat.full.unique("episode"))
                    .enter()
                    .append("option")
                    .attr("class", "newEpisodes")
                    .attr("value", function (d) {return d.EPISODE; })
                    .text(function (d) {return d.EPISODE; });

            epSelect.on("change", function () {
                updateDropdown(this.value);
            });

            /* give character a default option */
            d3.select("#charDrop")
              .append("option")
              .attr("value", null);

            charSelect.selectAll(".newCharacters")
                      .data(charList(dat.full.unique("character")))
                      .enter()
                      .append("option")
                      .attr("class", "newCharacters")
                      .text(function (d) {return d; });

            go.on("click", function () {

                /* Collect character and episode information */
                var epElem = document.getElementById("epDrop"),
                    strEpisode = epElem.options[epElem.selectedIndex].value,

                    charElem = document.getElementById("charDrop"),
                    strCharacter = charElem.options[charElem.selectedIndex].value;

                redraw(strEpisode, strCharacter);
            });

            /* plot the cities */
            g.selectAll("circle")
                .data(dat.currentMap.unique("locality"))
                .enter()
                .append("circle")
                .attr("cx", function (d) {
                    return projection([d.LONGITUDE, d.LATITUDE])[0];
                })
                .attr("cy", function (d) {
                    return projection([d.LONGITUDE, d.LATITUDE])[1];
                })
                .attr("r", function (d) {return cityScale(cityResize(d)); })
                .attr("stroke", "black")
                .attr("shape-rendering", "auto")
                .on("click", function (d) {  
                    var filterTerm = d.LCC; 
                    console.log(d.LCC);
                    console.log(d.LATITUDE);
                    updateTable(filterTerm);
                });

            svg.call(zoom);

        });

        g.selectAll("path")
              .data(topojson.object(topology, topology.objects.countries)
                  .geometries)
            .enter()
              .append("path")
              .attr("class", "land")
              .attr("d", path);
    });
}
