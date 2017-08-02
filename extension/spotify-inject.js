(function() {
  // wait for `status.json`'s response before attempting to autoplay the song.
  // http://stackoverflow.com/questions/7775767/javascript-overriding-xmlhttprequest-open
  var clicked = false;
  var proxied = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function() {
    var newArgs = [].slice.call(arguments);

    if(newArgs[1].indexOf('status.json') !== -1 && this.onload) {
      var onload = this.onload;
      this.onload = function() {
        onload.apply(this, [].slice.call(arguments));

        setTimeout(function() {
          if (clicked) {
            return;
          }
          document.querySelector('#play-button').click();
          clicked = true;
        }, 0);

        window.XMLHttpRequest.prototype.open = proxied;
      };
    }
    return proxied.apply(this, newArgs);
  };
})();
