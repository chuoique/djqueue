(function() {
  // force new songs to play, even if one is already playing.
  // http://stackoverflow.com/questions/7775767/javascript-overriding-xmlhttprequest-open
  var proxied = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function() {
    var newArgs = [].slice.call(arguments);
    
    if(newArgs[1].indexOf('status.json') !== -1 && this.onload) {
      var onload = this.onload;
      this.onload = function() {
        onload.apply(this, [].slice.call(arguments));

        var data = JSON.parse(this.responseText);
        if(data.playing && data.playing === true) {
          setTimeout(function() {
            document.querySelector('#item-action').click();
            window.XMLHttpRequest.prototype.open = proxied;
          }, 0);
        }
      };
    }
    return proxied.apply(this, newArgs);
  };
})();
