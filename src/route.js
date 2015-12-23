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

  // don't include a front page
  app.get('/', function(req, res, next) {
    res.status(404);
    res.send();
  });

  // spotify login api, redirect url
  app.get('/spotify', function(req, res, next) {
    res.locals.bootstrap = bootstrapString({host: config.host});
    res.render('spotify.html');
  });

  // create a new queue with /create/id.
  // todo: change this to a POST, link from main page
  app.get('/create/:id', function(req, res, next) {
    if(/[a-z0-9\-]+$/i.test(req.queueId)) {
      queues.createQueue(req.queueId, function(err) {
        if(err) {
          next(err);
          return;
        }
        res.redirect('/' + req.queueId);
      });
    } else {
      next(new Error('invalid id'));
    }
  });

  // for the casting device
  app.get('/:id/cast', function(req, res, next) {
    getQueueData(queues, config, apiKeys, req.queueId, function(err, bootstrapData) {
      if(err) {
        next(); // 404
        return;
      }

      res.locals.bootstrap = bootstrapData;
      res.render('cast.html');
    });
  });

  // for the queue management devices
  app.get('/:id/queue', function(req, res, next) {
    getQueueData(queues, config, apiKeys, req.queueId, function(err, bootstrapData) {
      if(err) {
        next(); // 404
        return;
      }

      res.locals.bootstrap = bootstrapData;
      res.render('queue.html');
    });
  });

  // login page where queue management devices can enter their name
  app.get('/:id', function (req, res, next) {
    getQueueData(queues, config, apiKeys, req.queueId, function(err, bootstrapData) {
      if(err) {
        next(); // 404
        return;
      }

      res.locals.bootstrap = bootstrapData;
      res.render('login.html');
    });
  });

  // 404 handler
  app.use(function(req, res, next) {
    res.status(404);
    res.send();
  });

  // 500 handler
  app.use(function(err, req, res, next) {
    res.status(500);
    res.send();
  });
}

module.exports.setup = setup;
