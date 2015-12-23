var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ejs = require('ejs');

var config = require('./config');
var apiKeys = require('./api-keys');

app.set('views', __dirname + '/views');
app.engine('html', ejs.renderFile);
app.use(express.static(__dirname + '/public'));

var Queue = require('./src/queue');

// collection of queues, accessed by requesting example.com/queueId
var queues = {
  queues: {},
  // exposed as async methods, thinking of using redis at some point instead
  // of storing data in memory, to allow for multiple processes.
  getQueue: function(id, callback) {
    if(this.queues[id] === undefined) {
      this.queues[id] = new Queue();
    }

    callback(null, this.queues[id]);
  }
};

require('./src/route').setup(app, queues, config, apiKeys);
require('./src/socket').setup(io, queues, config, apiKeys);

http.listen(config.port, function() {});
