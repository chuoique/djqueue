(function(){

// borrowed from /src/queue.js, this could be automated by some sort of build system

var Queue = function() {
  this.users = {};
  this.queue = [];
  this.nextUserId = 0;
  this.nextItemId = 0;
  this.playingItemId = '';
};

// exposed as async methods, thinking of using redis at some point instead
// of storing data in memory, to allow for multiple processes

// insert items after currently playing item, return newItems with ids
Queue.prototype.insertAfter = function(newItems, callback) {
  var queue = this;

  newItems.forEach(function(item) {
    item.id = queue.nextItemId++;
  });

  var itemResult = this.getItemById(this.playingItemId, 0);

  if(itemResult.item) {
    Array.prototype.splice.apply(this.queue, [itemResult.index + 1, 0].concat(newItems));
  } else {
    // just append if the nowPlayingId doesn't work
    Array.prototype.push.apply(this.queue, newItems);
  }

  callback(null, newItems);
};

// add items to end of the queue, give them ids and return them
Queue.prototype.append = function(newItems, callback) {
  var queue = this;

  newItems.forEach(function(item) {
    item.id = queue.nextItemId++;
  });

  Array.prototype.push.apply(this.queue, newItems);

  callback(null, newItems);
}

// remove item with id
Queue.prototype.remove = function(itemId, callback) {
  var itemResult = this.getItemById(itemId, 0);

  if(itemResult.item) {
    this.queue.splice(itemResult.index, 1);
  }

  callback(null, itemResult.item);
};

// remove item with id and re-insert it after the current playing item
Queue.prototype.moveAfter = function(itemId, callback) {
  var queue = this;
  queue.remove(itemId, function(err, item) {
    if(item) {
      queue.insertAfter([item], callback);
    }
  });
};

// get id of currently playing item
Queue.prototype.getPlayingItemId = function(callback) {
  callback(null, this.playingItemId);
};

// play the item indexOffset slots past itemId in the queue.
// returns the item that is playing, or null if it was an invalid id
Queue.prototype.play = function(itemId, indexOffset, callback) {
  itemId = itemId || this.playingItemId;
  var itemResult = this.getItemById(itemId, indexOffset);

  if(itemResult.item) {
    this.playingItemId = itemResult.item.id;
  } else {
    this.playingItemId = '';
  };

  callback(null, itemResult.item);
};

// stop playing
Queue.prototype.stop = function(callback) {
  this.playingItemId = '';
  callback(null, null);
}

// add a new user, give him a userId
Queue.prototype.addUser = function(user, callback) {
  user.id = this.nextUserId++;
  this.users[user.id] = user;
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
    queue: this.queue,
    nowPlayingId: this.playingItemId
  };
};

// reset the queue and fill it in with data
Queue.prototype.reset = function(data) {
  this.users = data.users;
  this.queue = data.queue;
  this.playingItemId = data.nowPlayingId; // refactor these names to be the same
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

  this.queue.forEach(function(item, index) {
    if(item.id == itemId && index + indexOffset >= 0 && index + indexOffset < queue.queue.length) {
      result.index = index + indexOffset;
      result.item = queue.queue[result.index]
    }
  });

  return result;
};

// map the express-style (err, result) callbacks in Queue
// into a angular service with promises
angular.module('utilQueue', [])
.service('queueService', ['$q', function($q) {
  this.queue = new Queue();
  // fill in with the bootstrapped data
  this.queue.reset(_q);
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
