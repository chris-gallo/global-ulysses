(function() {
    angular.module('myApp.map')
        .controller('MapCtrl', ['$scope', 'LocalityData', 'LocalityFilter', function($scope, LocalityData, LocalityFilter) {
            LocalityData().then(function(response) {
                $scope.data = response.data;
            }, function(error) {
                throw error;
            });

            // Should probably make this name more meaninful
            $scope.filter = LocalityFilter;

        }]);
}());
