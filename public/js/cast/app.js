var castApp = angular.module('castApp', [
  'ngRoute',
  'moduleControllerCast'
]);

castApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: '/partials/cast/cast.html',
        controller: 'controllerCast'
      }).
      otherwise({
        redirectTo: '/'
      });
  }]);