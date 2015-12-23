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

// collection of queues, accessed by requesting example.com/queueId
var queues = require('./src/queue-collection')();

require('./src/route').setup(app, queues, config, apiKeys);
require('./src/socket').setup(io, queues, config, apiKeys);

http.listen(config.port, function() {});
