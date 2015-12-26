angular.module('queueNavigation', [])
.controller('NavigationController', ['$location',
  function($location) {
    var controller = this;

    controller.navigateSearch = function() {
      $location.path('/search');
    };
    controller.navigateQueue = function() {
      $location.path('/');
    };

    var firstConnect = true;
    if(!localStorage['queueUsername']) {
      window.location.href = _q.host + _q.id;
    }
    localStorage['queueId'] = _q.id;
    controller.socket = io(_q.host, {
      query: "queueId="+encodeURIComponent(_q.id)+"&queueIsUser=1&queueUsername="+encodeURIComponent(localStorage['queueUsername'])
    });
    controller.queue = _q.queue;
    controller.users = _q.users;
    controller.user = {username: ""};
    controller.nowPlayingId = _q.nowPlayingId;
    controller.socket.on('queue-reload', function(data) {
        controller.queue = data.queue;
        controller.users = data.users;
        controller.nowPlayingId = data.nowPlayingId;
        controller.$apply();
    });
    controller.reload = function() {
      controller.socket.emit('request-reload', {});
    }
    controller.socket.on('connect', function() {
      if(firstConnect){
        firstConnect = false;
      } else {
        controller.reload();
      }
    });

    controller.socket.on('username', function(user) {
      controller.users[user.id] = user;
      controller.$apply();
    });
    controller.socket.on('user-disconnect', function(id) {
      delete controller.users[id];
      controller.$apply();
    });
    controller.socket.on('add-queue', function(value) {

      var index = controller.queue.length - 1;
      $.each(controller.queue, function(i, item) {
        if(item.id == controller.nowPlayingId) {
          index = i;
        }
      });
      
      if(value.type == 'now') {
        Array.prototype.splice.apply(controller.queue, [index + 1, 0].concat(value.items));
      } else if(value.type == 'next') {
        Array.prototype.splice.apply(controller.queue, [index + 1, 0].concat(value.items));
      } else if(value.type == 'last') {
        Array.prototype.splice.apply(controller.queue, [controller.queue.length, 0].concat(value.items));
      }

      controller.$apply();
    });
    controller.socket.on('play-queue', function(value) {
      if(value.type == 'none') {
        controller.nowPlayingId = "";
      } else {
        controller.nowPlayingId = value.id;
      }
      controller.$apply();
    });
    controller.socket.on('remove-queue', function(value) {
      var index = -1;
      $.each(controller.queue, function(i, item) {
        if(item.id == value.id) {
          index = i;
        }
      });
      if(index != -1) {
        controller.queue.splice(index, 1);
      }
      controller.$apply();
    });

  }
]);