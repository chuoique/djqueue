var _ = require('underscore');

var Queue = function(queueId) {
    this.users = {};
    this.queue = [];
    this.nextUserId = 0;
    this.nextItemId = 0;
    this.queueId = queueId;
    this.timeout = null;
    this.nowPlayingId = '';
};

Queue.prototype.play = function(type, index, io) {
    var q = this;
    if(index >= 0 && index < this.queue.length) {
        this.index = index;
        var item = this.queue[index];
        if(this.timeout != null) {
            clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(function() {
            q.timeout = null;
            q.nowPlayingId = "";
            q.play('now', q.getIndexById(item.id) + 1);
        }, this.queue[index].length);
        this.nowPlayingId = this.queue[index].id;
        io.emit('play-queue', {
            type: type,
            url: this.queue[index].url,
            id: this.queue[index].id
        });
        return this.queue[index];
    } else {
        this.nowPlayingId = "";
        io.emit('play-queue', {
            type: 'none'
        });
        return null;
    }
};

Queue.prototype.getIndexById = function(id) {
    var index = -1;
    _.each(this.queue, function(item, i) {
        if(item.id == id) {
            index = i;
        }
    });
    return index;
};

module.exports = Queue;
