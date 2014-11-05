(function() {
    'use strict';

    // TODO filter by latitude and longitude
    angular.module('uniqueLocalityFilter', [])
        .filter('uniqueLocality', function() {
            return function(input) {
                var input = input || [], 
                    output = [],
                    seenLocalities = {};

                for (var i = 0; i < input.length; i++) {
                    if (seenLocalities.hasOwnProperty(input[i].latitude)){
                        continue;
                    } 
                    output.push(input[i]);
                    seenLocalities[input[i].latitude] = 1;
                }

                return output;
            }
        });
}());
