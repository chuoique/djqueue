var queueApp = angular.module('queueApp', [
  'ngRoute',
  'moduleControllerNavigation',
  'moduleControllerQueue',
  'moduleControllerSearch'
]);

queueApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/search', {
        templateUrl: '/partials/queue/search.html',
        controller: 'controllerSearch'
      }).
      when('/', {
        templateUrl: '/partials/queue/queue.html',
        controller: 'controllerQueue'
      }).
      otherwise({
        redirectTo: '/'
      });
  }]);

