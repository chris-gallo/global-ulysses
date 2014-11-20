(function() {
    'use strict';

    angular.module('myApp.map')
        .directive('localityMap', ['$filter', 'd3', 'topojson', 'uniqueLocalityFilter', function($filter, d3, topojson, uniqueLocality) {
            
            function link(scope, element, attrs) {

                // Set up svg dimensions
                var width = 1100,
                    height = 500;


                // Map projection
                var projection = d3.geo.mercator()
                    .center([0, 0])
                    .scale(175)
                    .rotate([20,0]);

                // Map rendering
                var svg = d3.select(element[0]).append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("class", "map");

                var path = d3.geo.path()
                     .projection(projection);

                var backdrop = svg.append("g");
                var baseLayer = svg.append("g");
                var cityLayer = svg.append("g");
                var legend = svg.append("g");
                var tooltip = d3.select("body")
                    .append("div")
                    .attr("class", "tooltip")
                    .text("a simple tooltip");

                backdrop.append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", width)
                    .attr("height", height)
                    .attr("fill", "#ecf0f1")
                    .attr("stroke-width", 1)
                    .attr("stroke", "black");

                var legendWidth = 150, 
                    legendHeight = 90,
                    legendMargin = 5;

                legend.append("rect")
                    .attr("x", width - legendWidth)
                    .attr("y", 0)
                    .attr("width", legendWidth)
                    .attr("height", legendHeight)
                    .attr("fill", "#34495e")
                    .attr("opacity", .8);

                var scalar; // Create a scalar variable for on-zoom resize

                // TODO feed json from an attribute
                d3.json("components/lib/world-110m2.json", function(error, topology) {
                    baseLayer.selectAll("path")
                          .data(topojson.object(topology, topology.objects.countries)
                              .geometries)
                        .enter()
                          .append("path")
                          .attr("d", path)
                          .style("fill", "#7f8c8d");
                });

                //set up the city scale
                // TODO Make domain responsive to data
                var cityScale = d3.scale.sqrt()
                    .domain([1, 233])
                    .range([3,28]);

                // The things that should change when we zoom
                var zoomers = [];
                
                // zoom, pan, and city resize
                var zoom = d3.behavior.zoom()
                    .scaleExtent([1, 60])
                    .on("zoom",function() {
                        for (var i = 0; i < zoomers.length; i++) {
                            zoomers[i]();
                        }
                    });

                legend.selectAll("circle")
                    .data([230, 70, 10])
                    .enter()
                    .append("circle")
                    .attr("cx", function(d, i){
                        return ( width - (legendWidth/3) * i ) - 30;
                    })
                    .attr("cy", function(d) {
                        return (legendHeight / 2);
                    })
                    .attr("r", function(d) {
                        return cityScale(d);    
                    })
                    .attr("fill", "#2980b9")
                    .attr("stroke", "black")
                    .attr("stroke-width", "1px");
                
                legend.selectAll("text")
                    .data([230, 70, 10])
                    .enter()
                    .append("text")
                    .attr("x", function(d, i){
                        return (width - (legendWidth/3) * i) - 30;
                    })
                    .attr("y", function(d) {
                        return legendHeight - legendMargin;
                    })
                    .attr("text-anchor", "middle")
                    .attr("fill", "white")
                    .text(function(d) {
                        return String(d);
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
                        return el.latitude === d.latitude && el.longitude === d.longitude;
                  })
                  .length ; 
                };

                // As of angular 1.3.1, watchGroup doesn't support deep watching 
                // in $watchGroup, so we have to settle for this solution. 
                scope.$watchGroup(['datafilter.episode_chr','datafilter.character', 'data'], function(newVal, oldVal) {
                    // Make sure the data is present
                    if(!newVal[2]){ return; }

                    var data = $filter('filter')(scope.data, scope.datafilter)
                    
                    // push the cities to change on zoom--depends on current data
                    zoomers.push(function() {
                        cityLayer.selectAll("circle")
                            .attr("d", path.projection(projection))
                            .attr("r", function(d) {
                                return cityScale(cityResize(d, data)) / d3.event.scale 
                            })
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
                        .style("fill", "#2980b9")
                        .on("mouseover", function(d) {
                            tooltip.transition()
                                .duration(500)
                                .style("opacity", .9);
                            tooltip.html(d.locality)
                                .style("left", (d3.event.pageX) + "px")
                                .style("top", (d3.event.pageY - 28) + "px");
                        })
                        .on("mouseout", function() {
                            console.log("moused out");
                            tooltip.transition()
                                .duration(500)
                                .style("opacity", 0);
                        })
                        .transition()
                        .duration(500)
                        .attr("cx", function(d) {
                            return projection([d.longitude, d.latitude])[0];
                        })
                        .attr("cy", function(d) {
                            return projection([d.longitude, d.latitude])[1];
                        })
                        .attr("r", function(d){
                            // Make sure we have or have not zoomed in yet
                            if (typeof(scalar) === "undefined") { 
                                return cityScale(cityResize(d, data));
                            // Resize correctly if already zoomed in
                            } else {
                                return cityScale(cityResize(d, data)) / scalar;
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
                    
                }); //scope.$watch for data
            } //link

            return {
                restrict: 'EA', 
                scope: {
                    data: '=',
                    datafilter: '=',
                    test: '='
                }, 
                link: link
            }
        }]);
}());
