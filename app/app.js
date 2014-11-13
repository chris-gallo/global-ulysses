'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'myApp.view1',
  'myApp.view2',
  'myApp.version',
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/view1'});
}]);

angular.module('d3', []);
angular.module('LocalityService', []);
angular.module('myApp.map', ['d3', 'LocalityService', 'uniqueLocalityFilter']);
angular.module('myApp.table', ['LocalityService', 'ngTable']);
