var module = angular.module('moduleControllerNavigation', [
]);

var firstConnect = true;

module.controller('controllerNavigation', ['$scope', '$http',
  function($scope, $http) {
    if(!localStorage['queueUsername']) {
      window.location.href = _q.host + _q.id;
    }
    localStorage['queueId'] = _q.id;
    $scope.socket = io(_q.host, {
      query: "queueId="+encodeURIComponent(_q.id)+"&queueIsUser=1&queueUsername="+encodeURIComponent(localStorage['queueUsername'])
    });
    $scope.queue = _q.queue;
    $scope.users = _q.users;
    $scope.user = {username: ""};
    $scope.nowPlayingId = _q.nowPlayingId;
    $scope.socket.on('queue-reload', function(data) {
        $scope.queue = data.queue;
        $scope.users = data.users;
        $scope.nowPlayingId = data.nowPlayingId;
        $scope.$apply();
    });
    $scope.reload = function() {
      $scope.socket.emit('request-reload', {});
    }
    $scope.socket.on('connect', function() {
      if(firstConnect){
        firstConnect = false;
      } else {
        $scope.reload();
      }
    });

    $scope.socket.on('username', function(user) {
      $scope.users[user.id] = user;
      $scope.$apply();
    });
    $scope.socket.on('user-disconnect', function(id) {
      delete $scope.users[id];
      $scope.$apply();
    });
    $scope.socket.on('add-queue', function(value) {

      var index = $scope.queue.length - 1;
      $.each($scope.queue, function(i, item) {
        if(item.id == $scope.nowPlayingId) {
          index = i;
        }
      });
      
      if(value.type == 'now') {
        Array.prototype.splice.apply($scope.queue, [index + 1, 0].concat(value.items));
      } else if(value.type == 'next') {
        Array.prototype.splice.apply($scope.queue, [index + 1, 0].concat(value.items));
      } else if(value.type == 'last') {
        Array.prototype.splice.apply($scope.queue, [$scope.queue.length, 0].concat(value.items));
      }

      $scope.$apply();
    });
    $scope.socket.on('play-queue', function(value) {
      if(value.type == 'none') {
        $scope.nowPlayingId = "";
      } else {
        $scope.nowPlayingId = value.id;
      }
      $scope.$apply();
    });
    $scope.socket.on('remove-queue', function(value) {
      var index = -1;
      $.each($scope.queue, function(i, item) {
        if(item.id == value.id) {
          index = i;
        }
      });
      if(index != -1) {
        $scope.queue.splice(index, 1);
      }
      $scope.$apply();
    });

  }
]);