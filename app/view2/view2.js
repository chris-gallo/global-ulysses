'use strict';

angular.module('myApp.view2', ['ngRoute', 'myApp.map'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view2', {
    templateUrl: 'view2/view2.html',
    controller: 'View2Ctrl'
  });
}])

.controller('View2Ctrl', ['$scope', function($scope) {
    $scope.data = 'red';
    $scope.filter = {foo: "", bar: ""};
}])

.directive('test', [function() {
    return {
        restrict: 'EA',
        scope: {
            data: '=',
            filter: '=', 
        },
        link: function(scope, element, attrs) {
            scope.$watchGroup(['data', 'filter' ], function(data) {
                console.log("data changed!");
            })
        }
    }
}]);

