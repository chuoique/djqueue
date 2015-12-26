angular.module('utilQueueController', ['utilSocket', 'utilQueue'])
.controller('QueueController', 
  ['$location', 'socketFactory', 'queueService', function($location, socket, queue) {
    var controller = this;
    
    controller.model = queue.toJSON();
    var updateModel = function() {
      controller.model = queue.toJSON();
    };

    // reload all data if the connection gets lost, then re-connected
    var firstConnect = true;
    socket.on('queue-reload', function(data) {
        queue.reset(data);
        updateModel();
    });
    socket.on('connect', function() {
      if(firstConnect) {
        firstConnect = false;
      } else {
        socket.emit('request-reload', {});
      }
    });

    socket.on('username', function(user) {
      queue.action('addUser', [user]).then(updateModel);
    });

    socket.on('user-disconnect', function(data) {
      queue.action('removeUser', [data.id]).then(updateModel);
    });

    socket.on('add-queue', function(data) {
      if(data.type == 'last') {
        queue.action('append', [data.items]).then(updateModel);
      } else {
        queue.action('insertAfter', [data.items]).then(updateModel);
      }
    });

    socket.on('play-queue', function(data) {
      if(data.type == 'none') {
        queue.action('stop', []).then(updateModel);
      } else {
        queue.action('play', [data.id, 0]).then(updateModel);
      }
    });

    socket.on('remove-queue', function(data) {
      queue.action('remove', [data.id]).then(updateModel);
    });
  }
]);