angular.module('queueApiAdapter', [])
.factory('apiAdapter', ['$q', '$http', function($q, $http) {

  // interface format

  /*{
    streamingServiceIdentifer: {
      // api key sent to the "get" method
      apiKey: '' 

      // class name added to <i> tag for these items
      icon: '' 

      // different types of items within the same service (e.g., song, playlist)
      itemTypes: { 
        'itemTypeIdentifier': {

          // visible category name that will appear on the search page
          // (leave blank to have it not show up on the search page)
          name: '',

          // if this is a collection (e.g., 'playlist'), this specifies what
          // itemType it is a collection of (e.g., 'playlist-item'). (leave
          // blank if not a collection).
          collectionOf: ''

          // retrieves items and returns a promise
          // all parameters may be null
          get: function(text, // user's search text,
                        view, // identifier for viewing an item in a collection
                        page, // pagination identifier
                        key)  // api key
                        {
            ...
            return (through a promise) {
              items: [{
                name: '', // visible item title displayed to user
                artist: '', // visible artist name displayed to user

                // items only:
                url: '', // url that will autoplay the item in a web browser
                length: 200000 // length of item in milliseconds

                // collections only:
                view: '', // if the user views this collection, this identifier
                          // will be passed to collectionOf's "get" method
                
              }, ...],

              // if the user presses the next page button, "get" will be called
              // again with this as the "page" parameter
              nextPage: ''
            }
          }
        },
        ...
      }
    },
    ...
  }*/

  return {

    spotify: {
      apiKey: _q.spotifyClientId,
      icon: 'fa-spotify',
      itemTypes: {

        'song': {
          name: 'Song',
          get: function(text, view, page, key) {
            return $http({
              method: 'GET',
              url: page || 'https://api.spotify.com/v1/search',
              params: page ? undefined : {
                type: 'track',
                q: text,
                limit: 50,
                offset: 0
              }
            }).then(function(data) {
              return {
                items: data.tracks.items.map(function(value) {
                  return {
                    name: value.name,
                    artist: value.artists[0].name,
                    url: value.external_urls.spotify,
                    length: value.duration_ms
                  };
                }),
                nextPage: data.tracks.next
              }
            });
          }
        },

        'playlist-song': {
          get: function(text, view, page, key) {
            return $http({
              method: 'GET',
              url: page || view,
              params: page ? undefined : {
                limit: 50,
                offset: 0
              }, headers: {
                'Authorization': 'Bearer ' + localStorage['spotifyToken']
              }
            }).then(function(data) {
              return {
                items: data.items.map(function(value) {
                  return {
                    name: value.name,
                    artist: value.artists[0].name,
                    url: value.external_urls.spotify,
                    length: value.duration_ms
                  };
                }),
                nextPage: data.next
              }
            });
          }
        },

        'album-song': {
          get: function(text, view, page, key) {
            return $http({
              method: 'GET',
              url: page || view,
              params: page ? undefined : {
                limit: 50,
                offset: 0
              }
            }).then(function(data) {
              return {
                items: data.items.map(function(value) {
                  return {
                    name: value.name,
                    artist: value.artists[0].name,
                    url: value.external_urls.spotify,
                    length: value.duration_ms
                  };
                }),
                nextPage: data.next
              }
            });
          }
        },

        'playlist': {
          name: 'Playlist',
          collectionOf: 'playlist-song',
          get: function(text, view, page, key) {
            // get a token
            if(!localStorage['spotifyToken'] || new Date() >= Date.parse(localStorage['spotifyExpire'])) {
              localStorage['queueId'] = _q.id;
              localStorage['spotifyState'] = Math.random().toString(36).slice(2);

              window.location.href = 
               "https://accounts.spotify.com/authorize?client_id=" + encodeURIComponent(key) +
               "&redirect_uri=" + encodeURIComponent(_q.host + "spotify") +
               "&scope=playlist-read-private" + 
               "&response_type=token&state=" + encodeURIComponent(localStorage['spotifyState']);

              return;
            }

            // get user id
            var defer;
            if(!localStorage['spotifyUserId']) {
              defer = $http({
                url: 'https://api.spotify.com/v1/me',
                method: 'GET',
                params: {},
                headers: {
                  'Authorization': 'Bearer ' + localStorage['spotifyToken']
                }
              }).then(function(data) {
                localStorage['spotifyUserId'] = data.id;
                return data.id;
              });
            } else {
              defer = $q.resolve(localStorage['spotifyUserId']);
            }

            // get user's playlists
            return defer.then(function(userId) {
              return $http({
                url: page || 'https://api.spotify.com/v1/users/' + userId + '/playlists',
                method: 'GET',
                params: page ? undefined : {
                  "public": "null",
                  limit: 50,
                  offset: 0
                },
                headers: {
                  'Authorization': 'Bearer ' + localStorage['spotifyToken']
                }
              }).then(function(data) {
                return {
                  items: data.items.map(function(value) {
                    return {
                      name: value.name,
                      view: value.tracks.href
                    };
                  }),
                  nextPage: data.next
                }
              });
            });
          }
        },

        'album', {
          name: 'Album',
          collectionOf: 'album-song',
          get: function(text, view, page, key) {
            return $http({
              method: 'GET',
              url: page || 'https://api.spotify.com/v1/search',
              params: page ? undefined : {
                type: 'album',
                q: text,
                limit: 50,
                offset: 0
              }
            }).then(function(data) {
              return {
                items: data.albums.items.map(function(value) {
                  return {
                    name: value.name,
                    view: value.href
                  };
                }),
                nextPage: data.albums.next
              }
            });
          }
        }
      }
    },
    soundcloud: {
      apiKey: _q.soundcloudClientId,
      icon: 'fa-soundcloud',
    },
    youtube: {
      apiKey: _q.googleKey,
      icon: 'fa-youtube-play',
    }
  };

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