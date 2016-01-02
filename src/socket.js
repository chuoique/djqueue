var _ = require('underscore');
var async = require('async');

// creates handlers for accepting new connections
var setup = function(io, queues, config, apiKeys) {

  // validate new connections before letting them connect
  io.use(function(socket, next) {
    // verify usernames for queue management devices
    if(socket.handshake.query.queueIsUser == '1' && !socket.handshake.query.queueUsername) {
      next(new Error('bad username'));
      return;
    }

    // make sure that the queue exists
    queues.getQueue(socket.handshake.query.queueId, function(err, queue) {
      next(err); // pass the error on if there was one
    });
  });

  // on new connections, add a user to the queue and register listeners
  io.on('connection', function(socket) {
    var queueId = socket.handshake.query.queueId;

    // if it's just a casting device, it only needs to receive messages for this queue
    if(socket.handshake.query.queueIsUser != '1') {
      socket.join(queueId);
      return;
    }

    // otherwise, add the user
    async.waterfall([
      // get the queue
      function(done) {
        queues.getQueue(queueId, done);
      },

      // add the user
      function(queue, done) {
        var user = {
          name: socket.handshake.query.queueUsername
        };
        queue.addUser(user, function(err, user) {
          done(err, queue, user);
        });
      }
    ],
    function(err, queue, user) {
      if(err) {
        socket.disconnect();
        return;
      }

      // put the user in the room identified by the uri of the queue
      socket.join(queueId);
      // tell everyone a new user joined
      io.in(queueId).emit('user-add', user);

      // add event listeners for this socket
      addListeners(io, queues, socket, queueId, user.userId);
    });
  });
};

// setup handlers for messages from new connections
var addListeners = function(io, queues, socket, queueId, userId) {

  // utility emit function that will emit to the correct channel
  var emitChannel = function(eventName, data) {
    io.in(queueId).emit(eventName, data);
  };

  // utility function that adds things that are common to every handler
  // such as fetching the queue's data.
  // fn will be called with the queue's data and the event data and 
  // should return a list of functions to perform sequentially
  var createHandler = function(fn) {
    return function(data) {
      queues.getQueue(queueId, function(err, queue) {
        if(err) {
          return;
        }
        async.waterfall(fn(queue, data), function() {});
      });
    };
  };

  // utility function that emits a play event if queue.play was successful
  var emitPlay = function(err, item) {
    if(item) {
      // tell all clients what song is being played
      emitChannel('queue-play', item);
    } else {
      // tell all clients to stop playing
      emitChannel('queue-stop', {});
    }
  };

  // utility function that filters through new items and attaches the userId
  var mapItems = function(items) {
    return _.map(items, function(value) {
      return {
        userId: userId, // attach the user id
        url: value.url,
        name: value.name,
        length: value.length,
        artist: value.artist,
        icon: value.icon
      };
    });
  };
  
  // event listeners

  // user disconnect
  socket.on('disconnect', createHandler(function(queue, data) {
    return [function(done) {
      queue.removeUser(userId, done);
    }, function() {
      emitChannel('user-remove', {userId: userId});
    }];
  }));

  // request all queue data to be retransfered (e.g., phone has been
  // in its lock screen for a while and hasn't received messages)
  socket.on('queue-reload', createHandler(function(queue, data) {
    return [function() {
      socket.emit('queue-reload', queue);
    }];
  }));

  // add items to the queue
  // queue-add-now is a shortcut for queue-add-next followed by queue-play
  socket.on('queue-add-now', createHandler(function(queue, data) {
    return [function(done) {
      queue.insertAfter(mapItems(data.items), done);
    },
    function(items, done) {
      // send it to the other clients
      if(items && items[0]) {
        emitChannel('queue-add-next', {items: items});
        queue.play(items[0].itemId, 0, emitPlay);
      }
    }];
  }));

  socket.on('queue-add-next', createHandler(function(queue, data) {
    return [function(done) {
      queue.insertAfter(mapItems(data.items), done);
    },
    function(items) {
      emitChannel('queue-add-next', {items: items});
    }];
  }));

  socket.on('queue-add-last', createHandler(function(queue, data) {
    return [function(done) {      
      queue.append(mapItems(data.items), done);
    },
    function(items) {
      emitChannel('queue-add-last', {items: items});
    }];
  }));

  // play an item with an id
  socket.on('queue-play', createHandler(function(queue, data) {
    return [function(done) {
      queue.play(data.itemId, 0, emitPlay);
    }];
  }));

  socket.on('queue-stop', createHandler(function(queue, data) {
    return [function(done) {
      queue.stop(done);
    }, function() {
      emitChannel('queue-stop', {});
    }];
  }));

  // play the next or prev item from the current item (with -1 or 1 for index)
  socket.on('queue-play-index', createHandler(function(queue, data) {
    return [function(done) {
      queue.play(null, data.index, emitPlay);
    }];
  }));

  // remove an item from the queue by id
  socket.on('queue-remove', createHandler(function(queue, data) {
    return [function(done) {
      queue.getPlayingItemId(done)
    },
    function(playingItemId, done) {
      // skip to the next item if they are removing the playing item
      if(data.itemId == playingItemId) {
        queue.play(null, 1, emitPlay, done);
      } else {
        done(null, {});
      }
    },
    function(item, done) {
      queue.remove(data.itemId, done);
    },
    function(item) {
      emitChannel('queue-remove', {itemId: data.itemId});
    }];
  }));
};

module.exports.setup = setup;
