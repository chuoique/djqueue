var Queue = require('./queue');

module.exports = function() {
  return {
    queues: {},
    
    // exposed as async methods, thinking of using redis at some point instead
    // of storing data in memory, to allow for multiple processes.
    createQueue: function(id, callback) {
      if(this.queues[id] !== undefined) {
        callback(new Error('already exists'));
        return;
      }

      this.queues[id] = new Queue(id);
      callback(null, this.queues[id]);
    },

    getQueue: function(id, callback) {
      if(this.queues[id] === undefined) {
        callback(new Error('invalid id'));
        return;
      }

      callback(null, this.queues[id]);
    }
  }; 
};
