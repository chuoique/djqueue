var _ = require('underscore');
var async = require('async');

// setup handlers for accepting new connections
var setup = function(io, queues, config, apiKeys) {

  // validate new connections before letting them connect
  io.use(function(socket, next) {
    // verify usernames for queue management devices
    if(socket.handshake.query.queueIsUser && !socket.handshake.query.queueUsername) {
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
    async.waterfall([
      // get the queue
      function(done) {
        queues.getQueue(socket.handshake.query.queueId, done);
      },

      // add the user
      function(queue, done) {
        var user = {username: socket.handshake.query.queryUsername};
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

      // tell everyone a new user joined
      io.in(queue.queueId).emit('username', user);
      // put the user in the room identified by the url of the queue
      socket.join(queue.queueId);

      // add event listeners for this socket
      addListeners(io, queues, socket, queue.queueId, user.id);
    });
  });
};

// setup handlers for messages from new connections
var addListeners = function(io, queues, socket, queueId, userId) {

  // # utility functions
  // utility emit function that will emit to the correct channel
  var emitChannel = function(eventName, data) {
    io.in(queueId).emit(eventName, data);
  };

  // utility function, adds things that are common to every handler
  // (for now, fetching the queue's data by queueId)
  var createHandler = function(fn) {
    return function(data) {
      queues.getQueue(queueId, function(err, queue) {
        if(err) {return;}
        async.waterfall(fn(queue, data), function(){});
      });
    };
  };

  // # event listeners
  // user disconnect
  socket.on('disconnect', createHandler(function(queue, data) {
    return [function(done) {
      queue.removeUser(userId, done);
    }, function() {
      emitChannel('user-disconnect', userId);
    }];
  }));

  // request all queue data to be retransfered (e.g., phone has been
  // in its lock screen for a while and hasn't received messages)
  socket.on('request-reload', createHandler(function(queue, data) {
    return [function() {
      socket.emit('queue-reload', queue);
    }];
  }));

  // add items to the queue
  socket.on('add-queue', createHandler(function(queue, data) {
    return [function(done) {
      // filter out any unnecessary data
      var items = _.map(data.results, function(value) {
        return {
          userId: userId, // attach the user id
          url: value.url,
          name: value.name,
          length: value.length,
          artist: value.artist,
          icon: value.icon
        };
      });
      
      if(data.type == 'now' || data.type == 'next') {
        queue.insertAfter(items, done);
      } else {
        queue.append(items, done);
      }
    },
    function(items, done) {
      // send it to the other clients
      emitChannel('add-queue', {
        type: data.type,
        items: items
      });
    }];
  }));

  // play an item with an id
  socket.on('play-queue', createHandler(function(queue, data) {
    return [function(done) {
      if(data.type == 'none') {
        queue.stop(done);
      } else {
        queue.play(data.id, 0, done);
      }
    },
    function(item) {
      if(item) {
        emitChannel('play-queue', {
          type: 'now',
          url: item.url,
          id: item.id
        });
      } else {
        emitChannel('play-queue', {
          type: 'none'
        });
      }
    }];
  }));

  // play the next or prev item from the current item (with -1 or 1 for index)
  socket.on('play-index', createHandler(function(queue, data) {
    return [function(done) {
      queue.play(null, data.index, done);
    },
    function(item) {
      if(item) {
        emitChannel('play-queue', {
          type: 'now',
          url: item.url,
          id: item.id
        });
      } else {
        emitChannel('play-queue', {
          type: 'none'
        });
      }
    }];
  }));

  // remove an item from the queue by id
  socket.on('remove-queue', createHandler(function(queue, data) {
    return [function(done) {
      queue.remove(data.id, done);
    },
    function(item) {
      emitChannel('remove-queue', {id: data.id});
    }];
  }));
};

module.exports.setup = setup;
