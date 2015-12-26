angular.module('queueQueue', [])
.controller('QueueController',
  function() {
    var controller = this;
    controller.playQueue = function(type, item) {
        controller.socket.emit('play-queue', {type: type, id: item.id});
    };
    controller.removeQueue = function(item) {
        controller.socket.emit('remove-queue', {id: item.id});
    };
    controller.nextTrack = function() {
        controller.socket.emit('play-index', {index: 1});
    };
    controller.prevTrack = function() {
        controller.socket.emit('play-index', {index: -1});
    };
  }
);