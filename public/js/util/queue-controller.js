angular.module('utilQueueController', ['utilSocket', 'utilQueue'])
.controller('QueueController', 
  ['$scope', '$location', 'socketFactory', 'queueService',
  function($scope, $location, socket, queue) {
    var controller = this;
    
    // update the model when the queue gets changed
    controller.model = queue.toJSON();
    var updateModel = function() {
      controller.model = queue.toJSON();
    };

    // unsubscribe from all socket events when controller is destroyed.
    var listenerRemovers = [];
    var listen = function(eventName, callback) {
      listenerRemovers.push(socket.on(eventName, callback));
    };
    $scope.$on('$destroy', function() {
      listenerRemovers.forEach(function(off) {
        off();
      });
    });

    // reload all data if the connection gets lost, then re-connected
    var firstConnect = true;
    listen('queue-reload', function(data) {
        queue.reset(data);
        updateModel();
    });
    listen('connect', function() {
      if(firstConnect) {
        firstConnect = false;
      } else {
        socket.emit('queue-reload', {});
        // the back-end will response with a queue-reload containing all data
      }
    });

    listen('user-add', function(user) {
      queue.action('addUser', [user]).then(updateModel);
    });

    listen('user-remove', function(user) {
      queue.action('removeUser', [user.userId]).then(updateModel);
    });

    listen('queue-add-next', function(data) {
      queue.action('insertAfter', [data.items]).then(updateModel);
    });

    listen('queue-add-last', function(data) {
      queue.action('append', [data.items]).then(updateModel);
    });

    listen('queue-play', function(item) {
      queue.action('play', [item.itemId, 0, null]).then(updateModel);
    });

    listen('queue-stop', function() {
      queue.action('stop', []).then(updateModel);
    });

    listen('queue-remove', function(item) {
      queue.action('remove', [item.itemId]).then(updateModel);
    });
  }
]);
