var width = 960 ,
    height = 500 ;

var projection = d3.geo.mercator()
    .center([0, 0 ])
    .scale(175)
    .rotate([0,0]);

var map = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var path = d3.geo.path()
             .projection(projection);

var g = map.append("g");

//declare episode data
var episodeNumbers = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]


// load and display the World
d3.json("world-110m2.json", function(error, topology) {


  // load and display the cities
  d3.csv("newest.csv", function(error, data) {

    //set up the city scale
    var cityScale = d3.scale.linear()
                    .domain([d3.min(data, function(d) {return d.Locality_Count}), 
                             d3.max(data, function(d) {return d.Locality_Count})])
                    .range([2,5]);


    //plot the cities
    g.selectAll("circle")
        .data(data)
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
          updateTable()
        });

    // zoom, pan, and city resize
    var zoom = d3.behavior.zoom().on("zoom",function() {
            g.attr("transform","translate("+ 
                d3.event.translate.join(",")+")scale("+d3.event.scale+")");
            g.selectAll("circle")
                .data(data)
                .attr("d", path.projection(projection))
                .attr("r", function(d){return cityScale(d.Locality_Count) / d3.event.scale})
                .attr("stroke-width", 1/d3.event.scale);
            g.selectAll("path")  
                .attr("d", path.projection(projection)); 
        });

    var  updateTable = function(){
      var rows =  d3.select("tbody").selectAll("tr")
                    .data(data);
                    //.filter(function(d, i){return d.LOCALITY === this.LOCALITY});

      rows.enter()
          .append("tr")
          .text(d.LOCALITY);
      }


      
        

    map.call(zoom)
  });



    g.selectAll("path")
          .data(topojson.object(topology, topology.objects.countries)
              .geometries)
        .enter()
          .append("path")
          .attr("d", path);
});



