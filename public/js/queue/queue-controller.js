var module = angular.module('moduleControllerQueue', [
]);

module.controller('controllerQueue', ['$scope', '$location',
  function($scope, $location) {
    $scope.playQueue = function(type, item) {
        $scope.socket.emit('play-queue', {type: type, id: item.id});
    };
    $scope.removeQueue = function(item) {
        $scope.socket.emit('remove-queue', {id: item.id});
    };
    $scope.nextTrack = function() {
        $scope.socket.emit('play-index', {index: 1});
    };
    $scope.prevTrack = function() {
        $scope.socket.emit('play-index', {index: -1});
    };
  }
]);