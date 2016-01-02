angular.module('utilSocket', [])
// adapted from http://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
.factory('socketFactory', ['$rootScope', '_q', function ($rootScope, _q) {
  var socket = io.connect(_q.host, {
    query: "queueId=" + encodeURIComponent(_q.queueId) +
           "&queueIsUser=1" +
           "&queueUsername=" + encodeURIComponent(localStorage['queueUsername'])
  });
  return {
    on: function (eventName, callback) {
      var handler = function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      };

      socket.on(eventName, handler);

      return function() {
        socket.removeListener(eventName, handler);
      };
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
}]);
