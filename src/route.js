
// setup endpoints for the app
var setup = function(app, queues, config, apiKeys) {
  // # utility functions
  // stringify and escape any </script> tags
  var bootstrapString = function(json) {
    return JSON.stringify(json).replace("/", "\\/");
  };

  // returns a handler that will render all queue data to the specified template
  var renderQueue = function(template) {
    return function(req, res, next) {
      queues.getQueue(req.queueId, function(err, queue) {
        if(err) {
          next(err);
          return;
        }

        // data available to front-end app
        res.locals.bootstrap = bootstrapString({
          users: queue.users,
          queue: queue.queue,
          nowPlayingId: queue.nowPlayingId,
          id: req.queueId,
          host: config.host,
          soundcloudClientId: apiKeys.soundcloud,
          spotifyClientId: apiKeys.spotify,
          googleKey: apiKeys.google
        });

        // <base> tag
        res.locals.base = config.host + req.queueId + '/queue/';

        res.render(template);
      });
    }
  };

  // # route setup
  // extract the id from the path
  app.param('id', function(req, res, next, id) {
    req.queueId = id;
    next();
  });

  // don't include a front page
  app.get('/', function(req, res, next) {
    res.status(404);
    res.send();
  });

  // spotify login api redirect url
  app.get('/spotify', function(req, res, next) {
    res.locals.bootstrap = bootstrapString({host: config.host});
    res.render('spotify.html');
  });

  // create a new queue with POST /create/id
  app.post('/create/:id', function(req, res, next) {
    // alphanumeric- urls only
    if(/[a-z0-9\-]+$/i.test(req.queueId)) {
      queues.createQueue(req.queueId, function(err) {
        if(err) {
          next(err);
          return;
        }
        // redirect to the queue after creation
        res.redirect('/' + req.queueId);
      });
    } else {
      next(new Error('invalid id'));
    }
  });

  // for the casting device
  app.get('/:id/cast', renderQueue('cast.html'));

  // for the queue management devices
  app.get('/:id/queue', renderQueue('queue.html'));
  app.get('/:id/queue/search', renderQueue('queue.html'));

  // login page where queue management devices can enter their name
  app.get('/:id', renderQueue('login.html'));

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
};

module.exports.setup = setup;
