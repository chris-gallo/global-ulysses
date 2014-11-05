(function() {
    'use strict';

    angular.module('LocalityService')
        .factory('LocalityData', ['$http', function($http) {
            var promise = null;

            return function() {
                if (promise) {
                    return promise;
                } else {
                    promise = $http.get('components/lib/localities2.json');
                    return promise;
                }
            };
        }])
        // TODO Make this it's own service
        .factory('LocalityFilter', [function() {
            return { episode_chr: '', character: ''}
        }]);
}());

