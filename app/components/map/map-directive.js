(function() {
    'use strict';

    angular.module('myApp.map')
        .directive('localityMap', ['d3', 'topojson', 'uniqueLocalityFilter', function(d3, topojson, uniqueLocality) {
            
            function link(scope, element, attrs) {

                // Set up svg dimensions
                var width = 1100,
                    height = 500;


                // MAP PROJECTION
                var projection = d3.geo.mercator()
                    .center([0, 0])
                    .scale(175)
                    .rotate([20,0]);

                // MAP RENDERING
                var svg = d3.select(element[0]).append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("class", "map");

                var path = d3.geo.path()
                     .projection(projection);

                var baseLayer = svg.append("g");
                var cityLayer = svg.append("g");

                var scalar; // Create a scalar variable for on-zoom resize

                // TODO feed json from an attribute
                d3.json("components/lib/world-110m2.json", function(error, topology) {
                    baseLayer.selectAll("path")
                          .data(topojson.object(topology, topology.objects.countries)
                              .geometries)
                        .enter()
                          .append("path")
                          .attr("d", path)
                          .style("fill", "grey");
                });

                //set up the city scale
                // TODO Make domain responsive to data
                var cityScale = d3.scale.linear()
                    .domain([1, 30])
                    .range([3,8]);

                // The things that should change when we zoom
                var zoomers = [];
                
                // zoom, pan, and city resize
                var zoom = d3.behavior.zoom()
                    .scaleExtent([.7, 20])
                    .on("zoom",function() {
                        for (var i = 0; i < zoomers.length; i++) {
                            zoomers[i]();
                        }
                    });

                // push the country outlines to change on zoom
                // this should be independent of $watch
                zoomers.push(function() {
                    cityLayer.attr("transform","translate("+ 
                        d3.event.translate.join(",")+")scale("+d3.event.scale+")");
                    baseLayer.attr("transform","translate("+ 
                        d3.event.translate.join(",")+")scale("+d3.event.scale+")");
                    baseLayer.selectAll("path")  
                        .attr("d", path.projection(projection)); 
                });

                var cityResize = function(d, data){
                  return data.filter(function(el){
                    return el.latitude === d.latitude ;
                  })
                  .length ; 
                };

                scope.$watch('data()', function(data) {
                    if(!data){ return; }

                    var sizeData = data;
                    
                    // push the cities to change on zoom--depends on current data
                    zoomers.push(function() {
                        cityLayer.selectAll("circle")
                            .attr("d", path.projection(projection))
                            .attr("r", function(d) {return cityScale(cityResize(d, sizeData)) / d3.event.scale })
                            .attr("stroke-width", 1 / d3.event.scale)

                        scalar = d3.event.scale;
                    });
                    


                    // TODO make this remove as a transition
                    cityLayer.selectAll('circle')
                        .remove();

                    //plot the cities
                    cityLayer.selectAll("circle")
                        .data(uniqueLocality(data))
                        .enter()
                        .append("circle")
                        .attr("r", 0)
                        .attr("class", "city")
                        .style("fill", "red")
                        .transition()
                        .attr("cx", function(d) {
                            return projection([d.longitude, d.latitude])[0];
                        })
                        .attr("cy", function(d) {
                            return projection([d.longitude, d.latitude])[1];
                        })
                        .attr("r", function(d){
                            // Make sure we have or have not zoomed in yet
                            if (typeof(scalar) === "undefined") { 
                                return cityScale(cityResize(d, sizeData));
                            // Resize correctly if already zoomed in
                            } else {
                                return cityScale(cityResize(d, sizeData)) / scalar;
                            }
                        })
                        .attr("stroke", "black")
                        .attr("stroke-width", function(d) {
                            if (typeof(scalar) === "undefined") {
                                return 1; 
                            } else {
                                return 1 / scalar;
                            }
                        })
                        .attr("shape-rendering", "auto")
                        .attr("opacity", ".7");

                        svg.call(zoom);
                    
                    }, true); //scope.$watch for data
                

            } //link

            return {
                restrict: 'EA', 
                scope: {
                    data: '&',
                    fullData: '@'
                }, 
                link: link
            }
        }]);
}());
