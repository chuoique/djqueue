var _ = require('underscore');

var setup = function(io, queues, config, apiKeys) {

  // validate the connection
  io.use(function(socket, next) {
    if(socket.handshake.query.queueIsUser && !socket.handshake.query.queueUsername) {
      next(new Error('bad username'));
      return;
    }

    queues.getQueue(socket.handshake.query.queueId, function(err, queue) {
      if(err) {
        next(err);
        return;
      }

      next();
    });
  });

  io.on('connection', function(socket) {
    queues.getQueue(socket.handshake.query.queueId, function(err, _q) {
      if(err) {
        socket.disconnect();
        return;
      }

      socket.join(_q.queueId);

      var user = {id: "u" + _q.nextUserId++, username: ""};
      if(socket.handshake.query.queueIsUser) {
        user.username = socket.handshake.query.queueUsername;
        _q.users[user.id] = user;
        io.in(_q.queueId).emit('username', user);
      }

      socket.on('disconnect', function() {
        delete _q.users[user.id];
        io.in(_q.queueId).emit('user-disconnect', user.id);
      });

      socket.on('queue-ping', function() {
        socket.emit('queue-pong', {num: Math.round(Math.random()*100)});
      });

      socket.on('request-reload', function() {
        socket.emit('queue-reload', {queue: _q.queue, users: _q.users, nowPlayingId: _q.nowPlayingId});
      });

      var addQueue = function(value, forceUsername) {
        adding = [];
        _.each(value.results, function(item) {
            newItem = {
                url: item.url,
                userId: user.id,
                username: forceUsername || user.username,
                id: "q" + _q.nextItemId++,
                name: item.name,
                length: item.length,
                artist: item.artist,
                icon: item.icon
            }
            adding.push(newItem);
            // validation here
        });

        var i = _q.getIndexById(_q.nowPlayingId);
        if(i == -1) {
            i = _q.queue.length - 1;
        }

        if(value.type == 'now') {
            Array.prototype.splice.apply(_q.queue, [i + 1, 0].concat(adding));
        } else if(value.type == 'next') {
            Array.prototype.splice.apply(_q.queue, [i + 1, 0].concat(adding));
        } else if(value.type == 'last') {
            Array.prototype.splice.apply(_q.queue, [_q.queue.length, 0].concat(adding));
        }

        io.in(_q.queueId).emit('add-queue', {
            type: value.type,
            items: adding
        });

        if(value.type == 'now') {
            _q.play('now', i + 1, io.in(_q.queueId));
        }
      };
      socket.on('add-queue', addQueue);

      var playQueue = function(value) {
        var index = _q.getIndexById(value.id);
        if(index == -1) {
            io.in(_q.queueId).emit('play-queue', {
                type: 'none'
            });
        }
        if(value.type == 'here') {
            _q.play(value.type, index, io.in(_q.queueId));
        } else if(value.type == 'now') {
            addQueue({type: 'now', results: [_q.queue[index]]});
            removeQueue({id: value.id});
        } else if(value.type == 'next') {
            addQueue({type: 'next', results: [_q.queue[index]]}, _q.queue[index].username);
            removeQueue({id: value.id});
        } 
      };
      socket.on('play-queue', playQueue);

      socket.on('play-index', function(value) {
        _q.play('here', _q.getIndexById(_q.nowPlayingId) + value.index, io.in(_q.queueId));
      });

      var removeQueue = function(value) {
        var i = _q.getIndexById(value.id);
        if(i == -1) {
            return;
        }
        if(_q.queue[i].id == _q.nowPlayingId) {
            _q.play('now', i + 1, io.in(_q.queueId));
        }

        _q.queue.splice(i, 1);

        io.in(_q.queueId).emit('remove-queue', {id: value.id});
      };
      socket.on('remove-queue', removeQueue);
    });
  });
};

module.exports.setup = setup;
