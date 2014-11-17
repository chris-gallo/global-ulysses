(function() {
    'use strict';

    angular.module('uniqueLocalityFilter', [])
        .filter('uniqueLocality', function() {
            return function(input) {
                var input = input || [], 
                    output = [],
                    seenLocalities = {};

                for (var i = 0; i < input.length; i++) {
                    if (seenLocalities.hasOwnProperty(String(input[i].latitude)+ "," + String(input[i].longitude))){
                        continue;
                    } 
                    output.push(input[i]);
                    seenLocalities[String(input[i].latitude)+ "," + String(input[i].longitude)] = 1;
                }

                return output;
            }
        });
}());
