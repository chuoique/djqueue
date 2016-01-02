// setup endpoints for the app
var setup = function(app, queues, config, apiKeys) {

  // stringify and escape any </script> tags
  var bootstrapString = function(json) {
    return JSON.stringify(json).replace("/", "\\/");
  };

  // returns a handler that will render all queue data to the specified template
  var renderQueue = function(template, base) {
    return function(req, res, next) {
      queues.getQueue(req.queueId, function(err, queue) {
        if(err) {
          next(err);
          return;
        }

        // data available to front-end app
        res.locals.bootstrap = bootstrapString({
          host: config.host,
          apiKeys: apiKeys,
          queueId: req.queueId,
          base: base,
          queue: queue.toJSON()
        });

        // <base> tag for HTML5 pushState
        res.locals.base = config.host + req.queueId + '/' + base + '/';

        res.render(template);
      });
    }
  };

  // routes

  // extract the id from the path
  app.param('queueId', function(req, res, next, queueId) {
    // alphanumeric- urls only
    if(/[a-z0-9\-]+$/i.test(queueId)) {
      req.queueId = queueId;
      next();
    } else {
      res.status(404);
      res.send();
    }
  });

  // don't include a front page (hacky way to avoid some spam)
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
  app.post('/create/:queueId', function(req, res, next) {
    queues.createQueue(req.queueId, function(err) {
      if(err) {
        next(err);
        return;
      }
      // redirect to the queue after creation
      res.redirect('/' + req.queueId);
    });
  });

  // for the casting device
  app.get('/:queueId/cast', renderQueue('cast.html', 'cast'));

  // for the queue management devices

  // login page where queue management devices can enter their name
  app.get('/:queueId', renderQueue('login.html', 'queue'));

  // root of the queue management front-end app
  app.get('/:queueId/queue', renderQueue('queue.html', 'queue'));

  // /search is handled by HTML5 pushState, but we still need to serve a page
  app.get('/:queueId/queue/search', renderQueue('queue.html', 'queue'));


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
