(function() {
    'use strict';
    
    angular.module('myApp.table')
        .controller('TableCtrl', ['$scope', 
            '$filter',
            'LocalityData', 
            'LocalityFilter', 
            'ngTableParams',
            function($scope, $filter, LocalityData, LocalityFilter, ngTableParams) {
                LocalityData().success(function(data) {
                    var data = data;

                    $scope.filter = LocalityFilter;

                    $scope.tableParams = new ngTableParams({
                        // Set default settings
                        page: 1, 
                        count: 10,
                        filter: $scope.filter
                    }, {
                        total: data.length, 
                        getData: function($defer, params) {

                            var filteredData = params.filter() ? 
                                $filter('filter')(data, params.filter()) : 
                                data;

                            params.total(filteredData.length);
                            $defer.resolve(filteredData.slice((params.page() - 1) * params.count(), params.page() * params.count()));

                        }
                    });
                });
            }
        ]);
}());
