var module = angular.module('moduleControllerCast', [
]);

var firstConnect = true;

module.controller('controllerCast', ['$scope', '$timeout', '$http',
  function($scope, $timeout, $http) {
    $scope.player = window.open("about:blank", 'window_name', 'height=200,width=200');
    $scope.playerCancel = window.open("about:blank", 'window_name2', 'height=200,width=200');
    $scope._q = _q;

    $scope.openUrl = function(url) {
      if(url.indexOf('open.spotify.com') == -1) {
        $scope.playerCancel.location.href = "https://open.spotify.com/user/danielj41/playlist/7nFbH7n0I2AbdsghpPGn14";
      }
      $scope.player.location.href = url;
    }

    $scope.socket = io(_q.host, {
      query: "queueId="+encodeURIComponent(_q.id)
    });
    $scope.queue = _q.queue;
    $scope.users = _q.users;
    $scope.user = {username: ""};
    $scope.nowPlayingId = _q.nowPlayingId;
    $scope.songsLeft = function() {
      var index = -1;
      $.each($scope.queue, function(i, item) {
        if(item.id == $scope.nowPlayingId) {
          index = i;
        }
      });
      return $scope.queue.length - index - 1;
    };
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
        $scope.openUrl("about:blank");
      } else {
        $scope.nowPlayingId = value.id;
        $scope.openUrl(value.url);
      }
      $scope.$apply();
      $
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

    $scope.socket.on('queue-pong', function() {
      console.log('pong');
    });
    setInterval(function() {
      $scope.socket.emit('queue-ping', {num: Math.round(Math.random()*100)});
    }, 90000);
  }
]);