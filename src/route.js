// stringify and escape any </script> tags
var bootstrapString = function(json) {
  return JSON.stringify(json).replace("/", "\\/");
};

// get all data associated with a queueId in a json string
var getQueueData = function(queues, config, apiKeys, queueId, callback) {
  queues.getQueue(queueId, function(err, queue) {
    if(err) {
      callback(err);
      return;
    }

    callback(null, bootstrapString({
      users: queue.users,
      queue: queue.queue,
      nowPlayingId: queue.nowPlayingId,
      id: queueId,
      host: config.host,
      soundcloudClientId: apiKeys.soundcloud,
      spotifyClientId: apiKeys.spotify,
      googleKey: apiKeys.google
    }));
  });
};

// setup endpoints for the app
var setup = function(app, queues, config, apiKeys) {
  app.param('id', function(req, res, next, id) {
    req.queueId = id;
    next();
  });

  app.get('/', function(req, res) {
    res.send('go to /queue-name to start your own queue!');
  });

  // spotify login api, redirect url
  app.get('/spotify', function(req, res) {
    res.locals.bootstrap = bootstrapString({host: config.host});
    res.render('spotify.html');
  });

  // for the casting device
  app.get('/:id/cast', function(req, res) {
    getQueueData(queues, config, apiKeys, req.queueId, function(err, bootstrapData) {
      if(err) {
        next(err);
        return;
      }

      res.locals.bootstrap = bootstrapData;
      res.render('cast.html');
    });
  });

  // for the queue management devices
  app.get('/:id/queue', function(req, res) {
    getQueueData(queues, config, apiKeys, req.queueId, function(err, bootstrapData) {
      if(err) {
        next(err);
        return;
      }

      res.locals.bootstrap = bootstrapData;
      res.render('queue.html');
    });
  });

  // reloads all data, in case a device missed some of the socket data
  app.get('/:id/reload', function (req, res) {
    queues.getQueue(req.queueId, function(err, queue) {
      res.json({queue: queue.queue, users: queue.users, nowPlayingId: queue.nowPlayingId});
    });
  });

  // login page where queue management devices can enter their name
  app.get('/:id', function (req, res) {
    getQueueData(queues, config, apiKeys, req.queueId, function(err, bootstrapData) {
      if(err) {
        next(err);
        return;
      }

      res.locals.bootstrap = bootstrapData;
      res.render('login.html');
    });
  });

  // 404 handler
  app.use(function(req, res) {
    res.status(404);
    res.send();
  });

  // 500 handler
  app.use(function(req, res, err) {
    res.status(500);
    res.send();
  });
}

module.exports.setup = setup;
