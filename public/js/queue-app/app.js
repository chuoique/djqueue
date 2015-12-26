angular.module('queue', [
  'ngRoute',
  'utilQueueController',
  'queueList',
  'queueSearch',
  'utilSocket',
  'utilQueue'
])
.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) { 
  $locationProvider.html5Mode(true); 
  $routeProvider.
    when('/search', {
      templateUrl: '/partials/queue-app/search.html',
      controller: 'SearchController as search'
    }).
    when('/', {
      templateUrl: '/partials/queue-app/list.html',
      controller: 'ListController as list'
    }).
    otherwise({
      redirectTo: '/'
    });
}]);
