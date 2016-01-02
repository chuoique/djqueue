angular.module('queueList', ['utilSocket'])
.controller('ListController', ['$location', 'socketFactory',
  function($location, socket) {
    var controller = this;

    controller.navigateSearch = function() {
      $location.path('/search');
    };

    controller.play = function(item) {
      socket.emit('queue-play', {itemId: item.itemId});
    };

    controller.remove = function(item) {
      socket.emit('queue-remove', {itemId: item.itemId});
    };

    controller.move = function(item) {
      socket.emit('queue-add-next', {items: [{
        name: item.name, // copy the item to after the current playing item
        artist: item.artist,
        url: item.url,
        length: item.length,
        icon: item.icon
      }]});
      // then delete the other item
      socket.emit('queue-remove', {itemId: item.itemId});
    };

    controller.next = function() {
      socket.emit('queue-play-index', {index: 1});
    };

    controller.prev = function() {
      socket.emit('queue-play-index', {index: 1});
    };
  }
]);