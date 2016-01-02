angular.module('cast', [
  'ngRoute',
  'utilQueueController',
  'utilSocket',
  'utilQueue',
  'utilBootstrap',
  'castCast'
])
.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) { 
  $locationProvider.html5Mode(true); 
  $routeProvider.
    when('/', {
      templateUrl: '/partials/cast-app/cast.html',
      controller: 'CastController as cast'
    }).
    otherwise({
      redirectTo: '/'
    });
}]);
