var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ejs = require('ejs');
var _ = require('underscore');

var apiKeys = require('./api-keys');
var config = require('./config');

app.set('views', __dirname + '/views');
app.engine('html', ejs.renderFile);

var _q = {
    users: {},
    queue: [],
    uid: 0,
    qid: 0,
    id: null,
    timeout: null,
    nowPlayingId: "",
    backupUrl: "",
    play: function(type, index) {
        var q = this;
        if(index >= 0 && index < this.queue.length) {
            this.index = index;
            var item = this.queue[index];
            if(this.timeout != null) {
                clearTimeout(this.timeout);
            }
            this.timeout = setTimeout(function() {
                q.timeout = null;
                q.nowPlayingId = "";
                q.play('now', q.getIndexById(item.id) + 1);
            }, this.queue[index].length);
            this.nowPlayingId = this.queue[index].id;
            io.emit('play-queue', {
                type: type,
                url: this.queue[index].url,
                id: this.queue[index].id
            });
            return this.queue[index];
        } else {
            this.nowPlayingId = "";
            io.emit('play-queue', {
                type: 'none'
            });
            return null;
        }
    },
    getIndexById: function(id) {
        var index = -1;
        _.each(this.queue, function(item, i) {
            if(item.id == id) {
                index = i;
            }
        });
        return index;
    }
}


io.use(function(socket, next){
  if(!_q.id || socket.handshake.query.queueId != _q.id || (socket.handshake.query.queueIsUser && !socket.handshake.query.queueUsername)) {
    next(new Error("bad connection"));
  } else {
    next();
  }
});

io.on('connection', function(socket, next){
  var user = {id: "u" + _q.uid++, username: ""};
  if(socket.handshake.query.queueIsUser) {
    user.username = socket.handshake.query.queueUsername;
    _q.users[user.id] = user;
    io.emit('username', user);
  }

  socket.on('disconnect', function() {
    delete _q.users[user.id];
    io.emit('user-disconnect', user.id);
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
            id: "q" + _q.qid++,
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

    io.emit('add-queue', {
        type: value.type,
        items: adding
    });

    if(value.type == 'now') {
        _q.play('now', i + 1);
    }
  };
  socket.on('add-queue', addQueue);

  var playQueue = function(value) {
    var index = _q.getIndexById(value.id);
    if(index == -1) {
        io.emit('play-queue', {
            type: 'none'
        });
    }
    if(value.type == 'here') {
        _q.play(value.type, index);
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
    _q.play('here', _q.getIndexById(_q.nowPlayingId) + value.index);
  });

  var removeQueue = function(value) {
    var i = _q.getIndexById(value.id);
    if(i == -1) {
        return;
    }
    if(_q.queue[i].id == _q.nowPlayingId) {
        _q.play('now', i + 1);
    }

    _q.queue.splice(i, 1);

    io.emit('remove-queue', {id: value.id});
  };
  socket.on('remove-queue', removeQueue);
});

app.param('id', function(req, res, next, id){
  if(_q.id === null || id != _q.id) {
    res.status(404);
    res.send();
  } else {
    next();
  }
});

app.get('/', function(req, res) {
    res.status(404);
    res.send();
});

app.get('/set-url', function(req, res) {
    if(req.query.p != config.passwd || req.query.u === undefined) {
        res.status(404);
        res.send();
    } else {
        _q.users = {};
        _q.queue = [];
        _q.uid = 0;
        _q.qid = 0;
        _q.id = null;
        _q.timeout = null;
        _q.id = req.query.u;
        res.status(404);
        res.send();
    }
});

app.get('/spotify', function (req, res) {
    res.locals.host = JSON.stringify(config.host);
    res.render('spotify.html');
});

app.get('/keep-alive', function (req, res) {
    res.json({num: Math.round(Math.random()*100)});
});


app.get('/:id/cast', function (req, res) {
    res.locals.users = JSON.stringify(_q.users);
    res.locals.queue = JSON.stringify(_q.queue);
    res.locals.nowPlayingId = JSON.stringify(_q.nowPlayingId);
    res.locals.id = JSON.stringify(_q.id);
    res.locals.host = JSON.stringify(config.host);
    res.locals.spotify = JSON.stringify(apiKeys.spotify);
    res.locals.soundcloud = JSON.stringify(apiKeys.soundcloud);
    res.locals.youtube = JSON.stringify(apiKeys.youtube);
    res.render('cast.html');
});

app.get('/:id/queue', function (req, res) {
    res.locals.users = JSON.stringify(_q.users);
    res.locals.queue = JSON.stringify(_q.queue);
    res.locals.nowPlayingId = JSON.stringify(_q.nowPlayingId);
    res.locals.id = JSON.stringify(_q.id);
    res.locals.host = JSON.stringify(config.host);
    res.locals.spotify = JSON.stringify(apiKeys.spotify);
    res.locals.soundcloud = JSON.stringify(apiKeys.soundcloud);
    res.locals.google = JSON.stringify(apiKeys.google);
    res.render('queue.html');
});

app.get('/:id/reload', function (req, res) {
    res.json({queue: _q.queue, users: _q.users, nowPlayingId: _q.nowPlayingId});
});

app.get('/:id', function (req, res) {
    res.locals.id =  JSON.stringify(_q.id);
    res.locals.host = JSON.stringify(config.host);
    res.locals.spotify = JSON.stringify(apiKeys.spotify);
    res.locals.soundcloud = JSON.stringify(apiKeys.soundcloud);
    res.locals.google = JSON.stringify(apiKeys.google);
    res.render('login.html');
});

app.use(express.static(__dirname + '/public'));

app.use(function(req, res) {
    res.status(404);
    res.send();
});

http.listen(config.port, function () {

});
