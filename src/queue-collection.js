var Queue = require('./queue');

var QueueCollection = function() {
  this.queues = {};
}

// exposed as async methods, thinking of using redis at some point instead
// of storing data in memory, to allow for multiple processes.
QueueCollection.prototype.createQueue = function(id, callback) {
  if(this.queues[id] !== undefined) {
    callback(new Error('already exists'));
    return;
  }

  this.queues[id] = new Queue(id);
  callback(null, this.queues[id]);
};

QueueCollection.prototype.getQueue = function(id, callback) {
  if(this.queues[id] === undefined) {
    callback(new Error('invalid id'));
    return;
  }

  callback(null, this.queues[id]);
};

module.exports = QueueCollection;
