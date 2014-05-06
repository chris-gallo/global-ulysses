// SVG DIMENSIONS
var width = 1100 ,
    height = 500 ;


// MAP PROJECTION
var projection = d3.geo.mercator()
    .center([0, 0 ])
    .scale(175)
    .rotate([0,0]);

// CHARACTER AND EPISODE DROPDOWNS
var charSelect = d3.select("body").append("select")
                   .attr("style", "charDrop");
var epSelect = d3.select("body").append("select")
                 .attr("style", "epDrop");

// MAP RENDERING
var map = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var path = d3.geo.path()
             .projection(projection);

var g = map.append("g");

/*
Creates an array function 'unique' that returns
all unique entries for Character, Episode and 
Locality. These will be used to populate the 
dropdowns and plot localities.
*/
Array.prototype.unique = function(exp){
  var o = {}, l = [];     //o catches repeated localities and l collects the unique ones
  for (var i = 0, j = this.length ; i < j ; i++ ){
    switch(exp){  
      case "character":
        if (o.hasOwnProperty(this[i].CHARACTER)){
          continue;
        }
        l.push(this[i]);
        o[this[i].CHARACTER] = 1;
        break;
      case "episode":
        if (o.hasOwnProperty(this[i].EPISODE)){
          continue;
        }
        l.push(this[i]);
        o[this[i].EPISODE] = 1;
        break;
      case "locality":
        if (o.hasOwnProperty(this[i].LOCALITY) || this[i].LOCALITY === ''){
          continue;
        }
        l.push(this[i]);
        o[this[i].LOCALITY] = 1;
        break;
    }
  }
  return l;
}


// load and display the World
d3.json("world-110m2.json", function(error, topology) {

  // load and display the cities
  d3.csv("newest.csv", function(error, data) {

    var dat = { 
      full : data,
      currentTable: data,
      currentMap: data.unique("locality")
      }; 


    //set up the city scale
    var cityScale = d3.scale.linear()
                    .domain([d3.min(data, function(d) {return d.Locality_Count}), 
                             d3.max(data, function(d) {return d.Locality_Count})])
                    .range([3,6]);

    epSelect.selectAll("option")
            .data(data.unique("episode"))
            .enter()
            .append("option")
            .attr("value", function(d){return d.EPISODE})
            .text(function(d){return d.EPISODE});

    epSelect.on("change", function(){
      redraw(this.value);
      updateDropdown(this.value);
    });

    charSelect.selectAll("option")
              .data(data.unique("character"))
              .enter()
              .append("option")
              .text(function(d){return d.CHARACTER});


    //plot the cities
    g.selectAll("circle")
        .data(dat.currentMap)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
                 return projection([d.LONGITUDE, d.LATITUDE])[0];
        })
        .attr("cy", function(d) {
                 return projection([d.LONGITUDE, d.LATITUDE])[1];
        })
        .attr("r", function(d){return cityScale(d.Locality_Count)})
        .attr("stroke", "black")
        .attr("shape-rendering", "auto")
        .on("click", function(d){  //update the table with info about the clicked locality
          var filterTerm = d.LOCALITY; 
          console.log(filterTerm)
          updateTable(filterTerm)
        });

    // zoom, pan, and city resize
    var zoom = d3.behavior.zoom().on("zoom",function() {
            g.attr("transform","translate("+ 
                d3.event.translate.join(",")+")scale("+d3.event.scale+")");
            g.selectAll("circle")
                .data(dat.currentMap)
                .attr("d", path.projection(projection))
                .attr("r", function(d){return cityScale(d.Locality_Count) / d3.event.scale})
                .attr("stroke-width", 1/d3.event.scale);
            g.selectAll("path")  
                .attr("d", path.projection(projection)); 

            scalar = d3.event.scale;
        });



    //function to update the table beneath the map
    var  updateTable = function(filterTerm){
      var tableData = dat.currentTable.filter(function(el){return el.LOCALITY == filterTerm;});
      
      var rows = d3.select("tbody").selectAll("tr")
                   .data(tableData);

      rows.enter()
          .append("tr");

      var cells = rows.selectAll("td")
                      .data(function(row){
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

      cells.text(function(d) {return d.value;});

      cells.exit().remove();

      rows.exit().remove();
    };

    //function to redraw localities on episode
    var redraw = function(ep){

      // DATA FILTER
      dat.currentTable = dat.full.filter(function(el){return el.EPISODE === ep}); //data to complete the info
      dat.currentMap = dat.currentTable.unique("locality"); //data to plot localities

      // DATA JOIN
      var localities = g.selectAll("circle")
                         .data(dat.currentMap);

      //ENTER DATA
      localities.enter()
                .append("circle")
                .attr("cx", function(d){
                         return projection([d.LONGITUDE, d.LATITUDE])[0];
                })
                .attr("cy", function(d){
                         return projection([d.LONGITUDE, d.LATITUDE])[1];
                })
                .attr("r", function(d){
                  if (typeof(scalar) === "undefined"){ /*checks to see if the scalar global is defined
                    this prevents the visualization from erroring out if the user filters before zooming*/
                    return cityScale(d.Locality_Count);
                  }
                  else{
                    return cityScale(d.Locality_Count) / scalar;
                  }
                })
                .attr("stroke", "black")
                .attr("stroke-width", function(){
                  if (typeof(scalar) === "undefined"){
                    return 1;
                  }
                  else{
                    return 1/scalar;
                  }
                })
                .attr("shape-rendering", "auto");

      //UPDATE DATA
      localities.attr("cx", function(d){
                         return projection([d.LONGITUDE, d.LATITUDE])[0];
                })
                .attr("cy", function(d){
                         return projection([d.LONGITUDE, d.LATITUDE])[1];
                })
                .attr("r", function(d){
                  if (typeof(scalar) === "undefined"){ 
                    return cityScale(d.Locality_Count);
                  }
                  else{
                    return cityScale(d.Locality_Count) / scalar ;
                  }
                })
                .attr("stroke", "black")
                .attr("shape-rendering", "auto")
                .on("click", function(d){  
                  var filterTerm = d.LOCALITY; 
                  console.log(filterTerm)
                  updateTable(filterTerm);
                });

      //EXIT DATA
      localities.exit().remove();
    };

    var updateDropdown = function(ep){

      dat.currentTable = dat.full.filter(function(el){return el.EPISODE === ep});
      var dropData = dat.currentTable.unique("character");


      var charOptions = charSelect.selectAll("option")
                          .data(dropData);

      charOptions.enter()
                 .append("option")
                 .text(function(d){return d.CHARACTER});

      charOptions.text(function(d){return d.CHARACTER});

      charOptions.exit().remove();
    };

    map.call(zoom);

  });



    g.selectAll("path")
          .data(topojson.object(topology, topology.objects.countries)
              .geometries)
        .enter()
          .append("path")
          .attr("d", path);
});



