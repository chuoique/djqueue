angular.module('queue', [
  'ngRoute',
  'queueNavigation',
  'queueQueue',
  'queueSearch'
])
.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) { 
  $locationProvider.html5Mode(true); 
  $routeProvider.
    when('/search', {
      templateUrl: '/partials/queue/search.html',
      controller: 'SearchController as searchController'
    }).
    when('/', {
      templateUrl: '/partials/queue/queue.html',
      controller: 'QueueController as queueController'
    }).
    otherwise({
      redirectTo: '/'
    });
}]);
