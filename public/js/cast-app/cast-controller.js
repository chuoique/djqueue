angular.module('castCast', ['utilBootstrap', 'utilSocket'])
.controller('CastController', ['$scope', '$timeout', '_q', 'socketFactory',
  function($scope, $timeout, _q, socket) {
    var controller = this;

    var player = window.open("about:blank", 'window_name', 'height=200,width=200');
    var playerCancel = window.open("about:blank", 'window_name2', 'height=200,width=200');

    controller.shareUrl = _q.host + _q.queueId;

    var lastUrl = null;
    var openUrl = function(url) {
      // this stops the spotify client from playing by telling it pause the
      // last played song.
      if(url.indexOf('open.spotify.com') === -1 && lastUrl &&
          lastUrl.indexOf('open.spotify.com') !== -1) {
        playerCancel.location.href = lastUrl + '#pause';
      }
      player.location.href = url;
      lastUrl = url;
    }

    // number of songs left in the queue after the currently playing one
    controller.itemsLeft = function(list, playingItemId) {
      var index = -1;
      list.forEach(function(item, i) {
        if(item.itemId == playingItemId) {
          index = i;
        }
      });
      return list.length - index - 1;
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

    listen('queue-play', function(item) {
      openUrl(item.url);
    });

    listen('queue-stop', function() {
      openUrl("about:blank");
    });
  }
]);
