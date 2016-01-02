(function(){

// borrowed from /src/queue.js, this could be automated by some sort of build system

var Queue = function() {
  this.users = {};
  this.list = [];
  this.nextUserId = 0;
  this.nextItemId = 0;
  this.playingItemId = null;
  this.timeout = null;
};

// exposed as async methods, thinking of using redis at some point instead
// of storing data in memory, to allow for multiple processes

// insert items after currently playing item, return newItems with ids
Queue.prototype.insertAfter = function(newItems, callback) {
  var queue = this;

  /*newItems.forEach(function(item) {
    item.itemId = queue.nextItemId++;
  });*/

  var itemResult = this.getItemById(this.playingItemId, 0);

  if(itemResult.item) {
    Array.prototype.splice.apply(this.list, [itemResult.index + 1, 0].concat(newItems));
  } else {
    // just append if the nowPlayingId doesn't work
    Array.prototype.push.apply(this.list, newItems);
  }

  callback(null, newItems);
};

// add items to end of the queue, give them ids and return them
Queue.prototype.append = function(newItems, callback) {
  var queue = this;

  /*newItems.forEach(function(item) {
    item.itemId = queue.nextItemId++;
  });*/

  Array.prototype.push.apply(this.list, newItems);

  callback(null, newItems);
}

// remove item with id
Queue.prototype.remove = function(itemId, callback) {
  var itemResult = this.getItemById(itemId, 0);

  if(itemResult.item) {
    this.list.splice(itemResult.index, 1);
  }

  callback(null, itemResult.item);
};

// get id of currently playing item
Queue.prototype.getPlayingItemId = function(callback) {
  callback(null, this.playingItemId);
};

// play the item indexOffset slots past itemId in the queue.
// returns the item that is playing, or null if it was an invalid id.
// callback will be called once, and handler will be called every time a track
// plays until queue.play() gets called again.
Queue.prototype.play = function(itemId, indexOffset, handler, callback) {
  var queue = this;

  itemId = itemId !== null ? itemId : this.playingItemId;
  var itemResult = this.getItemById(itemId, indexOffset);

  if(itemResult.item) {
    this.playingItemId = itemResult.item.itemId;
  } else {
    this.playingItemId = null;
  }

  // don't do anything when the old timeout ends
  /*if(this.timeout) {
    clearTimeout(this.timeout);
  }

  // skip to the next track when this one finishes
  if(itemResult.item) {
    this.timeout = setTimeout(function() {
      // use handler from now on so that callback is only called once
      queue.play(null, 1, handler, null);
    }, itemResult.item.length);
  }*/

  if(handler) {
    handler(null, itemResult.item);
  }

  if(callback) {
    callback(null, itemResult.item);
  }
};

// stop playing
Queue.prototype.stop = function(callback) {
  this.playingItemId = null;

  // don't do anything when the old timeout ends
  if(this.timeout) {
    clearTimeout(this.timeout);
  }
  
  callback(null, null);
}

// add a new user, give him a userId
Queue.prototype.addUser = function(user, callback) {
  //user.userId = '' + (this.nextUserId++);
  this.users[user.userId] = user;
  callback(null, user);
};

// remove a user by her userId
Queue.prototype.removeUser = function(userId, callback) {
  delete this.users[userId];
  callback(null);
};

// filtered-down JSON version
Queue.prototype.toJSON = function() {
  return {
    users: this.users,
    list: this.list,
    playingItemId: this.playingItemId
  };
};

// reset the queue and fill it in with data
Queue.prototype.reset = function(data) {
  this.users = data.users;
  this.list = data.list;
  this.playingItemId = data.playingItemId;
  this.nextUserId = 0;
  this.nextItemId = 0;
};

// private methods

// Returns the queue position and full item from an item id and an offset.
// for example, getItemById("abc", 2) will get the item two slots after item abc
Queue.prototype.getItemById = function(itemId, indexOffset) {
  var queue = this;

  var result = {
    index: -1,
    item: null
  };

  this.list.forEach(function(item, index) {
    if(item.itemId == itemId && index + indexOffset >= 0 && index + indexOffset < queue.list.length) {
      result.index = index + indexOffset;
      result.item = queue.list[result.index]
    }
  });

  return result;
};

// map the express-style (err, result) callbacks in Queue
// into a angular service with promises
angular.module('utilQueue', ['utilBootstrap'])
.service('queueService', ['$q', '_q', function($q, _q) {
  this.queue = new Queue();
  // fill in with the bootstrapped data
  this.queue.reset(_q.queue);
  // action('methodName', [arg1, arg2, ...]).then() to call queue.methodName
  this.action = function(name, args) {
    var defer = $q.defer();
    this.queue[name].apply(this.queue, args.concat([function(err, result) {
      if(err) {
        defer.reject(err);
      } else {
        defer.resolve(result);
      }
    }]));
    return defer.promise;
  };
  this.toJSON = function() {
    return this.queue.toJSON();
  };
  this.reset = function(data) {
    this.queue.reset(data);
  }
}]);

})();
