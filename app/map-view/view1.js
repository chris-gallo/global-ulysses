'use strict';

angular.module('myApp.view1', ['ngRoute', 'myApp.table', 'LocalityService', 'ui.unique'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'map-view/view1.html',
    controller: 'View1Ctrl'
  });
}])

.controller('View1Ctrl', ['$scope', '$filter', 'LocalityData', 'LocalityFilter', 'uniqueFilter', function($scope, $filter, LocalityData, LocalityFilter, uniqueFilter) {
    LocalityData().then(function(response) {
        $scope.data = response.data;

        // Filter dropdown lists in controller avoid unnecessary computations.
        $scope.episodes = uniqueFilter($scope.data, 'episode');

        $scope.characters = $filter('orderBy')(uniqueFilter($scope.data, 'character'), 'character');
    }, function(error) {
        throw error;
    });

    $scope.filter = LocalityFilter;

    // TODO Can the following functions be generalized?
    $scope.clearEpisode = function() {
        if(!$scope.filter.episode_chr) {
            $scope.filter.episode_chr = '';
        }
    }

    $scope.clearCharacter = function() {
        if(!$scope.filter.character) {
            $scope.filter.character = '';
        }
    }



}]);
