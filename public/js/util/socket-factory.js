angular.module('utilSocket', [])
// adapted from http://www.html5rocks.com/en/tutorials/frameworks/angular-websockets/
.factory('socketFactory', ['$rootScope', function ($rootScope) {
  var socket = io.connect(_q.host, {
    query: "queueId=" + encodeURIComponent(_q.id) +
           "&queueIsUser=1" +
           "&queueUsername=" + encodeURIComponent(localStorage['queueUsername'])
  });
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
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
