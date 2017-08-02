angular.module('queueApiAdapter', ['utilBootstrap'])
.factory('apiAdapter', ['$q', '$http', '_q', '_g',
function($q, $http, _q, _g) {

  // common interface for different external apis
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
          },

          // optional: returns a promise that fills in data on a specified item
          // (e.g., youtube api doesn't return video duration, so you have to
          // make another api call after the user selects a video from the
          // search results)
          add: function(item) {
            // default behavior is
            return $q.resolve(item);
          }
        },
        ...
      }
    },
    ...
  }*/

  var adapters = {

    'spotify': {
      apiKey: _q.apiKeys.spotify,
      icon: 'fa-spotify',
      itemTypes: {

        'song': {
          get: function(text, view, page, key) {

            // get auth token
            var spotifyToken = getSpotifyToken(key);
            if (!spotifyToken) {
              return;
            }

            return $http({
              method: 'GET',
              url: page || 'https://api.spotify.com/v1/search',
              params: page ? undefined : {
                type: 'track',
                q: text,
                limit: 50,
                offset: 0
              },
              headers: {
                'Authorization': 'Bearer ' + spotifyToken
              }
            }).then(function(response) {
              return {
                items: response.data.tracks.items.map(function(value) {
                  return {
                    name: value.name,
                    artist: value.artists[0].name,
                    url: 'https://open.spotify.com/embed/track/' + value.id,
                    length: value.duration_ms
                  };
                }),
                nextPage: response.data.tracks.next
              }
            });
          }
        },

        'playlist-song': {
          get: function(text, view, page, key) {

            // get auth token
            var spotifyToken = getSpotifyToken(key);
            if (!spotifyToken) {
              return;
            }

            return $http({
              method: 'GET',
              url: page || view,
              params: page ? undefined : {
                limit: 50,
                offset: 0
              },
              headers: {
                'Authorization': 'Bearer ' + spotifyToken
              }
            }).then(function(response) {
              return {
                items: response.data.items.map(function(value) {
                  return {
                    name: value.track.name,
                    artist: value.track.artists[0].name,
                    url: 'https://open.spotify.com/embed/track/' + value.track.id,
                    length: value.track.duration_ms
                  };
                }),
                nextPage: response.data.next
              }
            });
          }
        },

        'album-song': {
          get: function(text, view, page, key) {

            // get auth token
            var spotifyToken = getSpotifyToken(key);
            if (!spotifyToken) {
              return;
            }

            return $http({
              method: 'GET',
              url: page || view,
              params: page ? undefined : {
                limit: 50,
                offset: 0
              },
              headers: {
                'Authorization': 'Bearer ' + spotifyToken
              }
            }).then(function(response) {
              return {
                items: response.data.items.map(function(value) {
                  return {
                    name: value.name,
                    artist: value.artists[0].name,
                    url: 'https://open.spotify.com/embed/track/' + value.id,
                    length: value.duration_ms
                  };
                }),
                nextPage: response.data.next
              }
            });
          }
        },

        'playlist': {
          collectionOf: 'playlist-song',
          ignoreText: true, // allow spotify login if search box is empty
          get: function(text, view, page, key) {

            // get auth token
            var spotifyToken = getSpotifyToken(key);
            if (!spotifyToken) {
              return;
            }

            // get user id
            var promise;
            if(!localStorage['spotifyUserId']) {
              promise = $http({
                url: 'https://api.spotify.com/v1/me',
                method: 'GET',
                params: {},
                headers: {
                  'Authorization': 'Bearer ' + spotifyToken
                }
              }).then(function(response) {
                localStorage['spotifyUserId'] = response.data.id;
                return response.data.id;
              });
            } else {
              promise = $q.resolve(localStorage['spotifyUserId']);
            }

            // get user's playlists
            return promise.then(function(userId) {
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
              }).then(function(response) {
                return {
                  items: response.data.items.map(function(value) {
                    return {
                      name: value.name,
                      view: value.tracks.href
                    };
                  }),
                  nextPage: response.data.next
                }
              });
            });
          }
        },

        'album': {
          collectionOf: 'album-song',
          get: function(text, view, page, key) {

            // get auth token
            var spotifyToken = getSpotifyToken(key);
            if (!spotifyToken) {
              return;
            }

            return $http({
              method: 'GET',
              url: page || 'https://api.spotify.com/v1/search',
              params: page ? undefined : {
                type: 'album',
                q: text,
                limit: 50,
                offset: 0
              },
              headers: {
                'Authorization': 'Bearer ' + localStorage['spotifyToken']
              }
            }).then(function(response) {
              return {
                items: response.data.albums.items.map(function(value) {
                  return {
                    name: value.name,
                    view: value.href + '/tracks'
                  };
                }),
                nextPage: response.data.albums.next
              }
            });
          }
        }
      }
    },


    'soundcloud': {
      apiKey: _q.apiKeys.soundcloud,
      icon: 'fa-soundcloud',
      itemTypes: {

        'song': {
          get: function(text, view, page, key) {
            return $http({
              method: 'GET',
              url: page || 'http://api.soundcloud.com/tracks',
              params: page ? undefined : {
                q: text,
                client_id: key,
                limit: 50,
                linked_partitioning: 1
              }
            }).then(function(response) {
              return {
                items: response.data.collection.map(function(value) {
                  return {
                    name: value.title,
                    artist: value.user.username,
                    url: value.permalink_url,
                    length: value.duration
                  };
                }),
                nextPage: response.data.next_href
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
                client_id: key,
                limit: 50,
                linked_partitioning: 1
              }
            }).then(function(response) {
              return {
                items: response.data.collection.map(function(value) {
                  return {
                    name: value.title,
                    artist: value.user.username,
                    url: value.permalink_url,
                    length: value.duration
                  };
                }),
                nextPage: response.data.next_href
              }
            });
          }
        },

        'playlist': {
          collectionOf: 'playlist-song',
          get: function(text, view, page, key) {
            return $http({
              method: 'GET',
              url: page || 'http://api.soundcloud.com/playlists',
              params: page ? undefined : {
                q: text,
                client_id: key,
                limit: 50,
                linked_partitioning: 1
              }
            }).then(function(response) {
              return {
                items: response.data.collection.map(function(value) {
                  return {
                    name: value.title,
                    artist: value.user.username,
                    view: value.uri + '/tracks'
                  };
                }),
                nextPage: response.data.next_href
              }
            });
          }
        }
      }
    },


    'youtube': {
      apiKey: _q.apiKeys.google,
      icon: 'fa-youtube-play',

       itemTypes: {

        'video': {
          get: function(text, view, page, key) {
            return loadYoutube().then(function() {
              return _g.gapi.client.youtube.search.list({
                q: text,
                part: 'snippet',
                type: 'video',
                maxResults: 50,
                pageToken: page
              });
            }).then(function(response) {
              return {
                items: response.result.items.map(function(value) {
                  return {
                    name: value.snippet.title,
                    artist: value.snippet.channelTitle,
                    _youtubeId: value.id.videoId
                  };
                }),
                nextPage: response.result.nextPageToken
              };
            });
          },

          add: function(item) {
            return loadYoutube().then(function() {
              return _g.gapi.client.youtube.videos.list({
                part: 'contentDetails',
                id: item._youtubeId
              });
            }).then(function(response) {
              return {
                name: item.name,
                artist: item.artist,
                url: "https://www.youtube.com/watch?v=" + item._youtubeId,
                length: youtubeToMilliseconds(response.result.items[0].contentDetails.duration)
              };
            });
          }
        },

        'playlist-item': {
          get: function(text, view, page, key) {
            return loadYoutube().then(function() {
              return _g.gapi.client.youtube.playlistItems.list({
                part: 'snippet',
                playlistId: view,
                maxResults: 50,
                pageToken: page
              });
            }).then(function(response) {
              return {
                items: response.result.items.filter(function(value) {
                  return value.snippet.resourceId.kind == 'youtube#video';
                }).map(function(value) {
                  return {
                    name: value.snippet.title,
                    artist: value.snippet.channelTitle,
                    _youtubeId: value.snippet.resourceId.videoId,
                  };
                }),
                nextPage: response.result.nextPageToken
              };
            });
          },

          add: function(item) {
            return loadYoutube().then(function() {
              return _g.gapi.client.youtube.videos.list({
                part: 'contentDetails',
                id: item._youtubeId
              });
            }).then(function(response) {
              return {
                name: item.name,
                artist: item.artist,
                url: "https://www.youtube.com/watch?v=" + item._youtubeId,
                length: youtubeToMilliseconds(response.result.items[0].contentDetails.duration)
              };
            });
          }
        },

        'playlist': {
          collectionOf: 'playlist-item',

          get: function(text, view, page, key) {
            return loadYoutube().then(function() {
              return _g.gapi.client.youtube.search.list({
                q: text,
                part: 'snippet',
                type: 'playlist',
                maxResults: 50,
                pageToken: page
              });
            }).then(function(response) {
              return {
                items: response.result.items.map(function(value) {
                  return {
                    name: value.snippet.title,
                    artist: value.snippet.channelTitle,
                    view: value.id.playlistId
                  };
                }),
                nextPage: response.result.nextPageToken
              };
            });
          }
        }
      }
    }
  };

  // visible apis on the search page
  var visible = [{
    name: 'Song',
    apis: [{
      name: 'soundcloud',
      type: 'song',
      icon: adapters['soundcloud'].icon
    }, {
      name: 'youtube',
      type: 'video',
      icon: adapters['youtube'].icon
    }, {
      name: 'spotify',
      type: 'song',
      icon: adapters['spotify'].icon
    }]
  }, {
    name: 'Playlist',
    apis: [{
      name: 'soundcloud',
      type: 'playlist',
      icon: adapters['soundcloud'].icon
    }, {
      name: 'youtube',
      type: 'playlist',
      icon: adapters['youtube'].icon
    }, {
      name: 'spotify',
      type: 'playlist',
      icon: adapters['spotify'].icon
    }]
  }, {
    name: 'Album',
    apis: [{
      name: 'spotify',
      type: 'album',
      icon: adapters['spotify'].icon
    }]
  }];

  // http://stackoverflow.com/a/22149575, quick hack to avoid loading a time library such as moment.js
  var youtubeToMilliseconds = function(duration) {
    var a = duration.match(/\d+/g);

    if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) {
      a = [0, a[0], 0];
    }

    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
      a = [a[0], 0, a[1]];
    }
    if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) {
      a = [a[0], 0, 0];
    }

    duration = 0;

    if (a.length == 3) {
      duration = duration + parseInt(a[0]) * 3600;
      duration = duration + parseInt(a[1]) * 60;
      duration = duration + parseInt(a[2]);
    }

    if (a.length == 2) {
      duration = duration + parseInt(a[0]) * 60;
      duration = duration + parseInt(a[1]);
    }

    if (a.length == 1) {
      duration = duration + parseInt(a[0]);
    }
    return duration * 1000;
  };

  // function that returns a resolved promise if _g.gapi client has loaded,
  // or a promise that resolves when the _g.gapi client loads
  var youtubeDefer = null;
  var loadYoutube = function() {
    if(_g.loaded) {
      return $q.resolve();
    } else {
      if(!youtubeDefer) {
        youtubeDefer = $q.defer();
        _g.onload = function() {
          youtubeDefer.resolve();
        };
      }
      return youtubeDefer.promise;
    }
  };

  var getSpotifyToken = function(key) {
    if(!localStorage['spotifyToken'] || new Date() >= Date.parse(localStorage['spotifyExpire'])) {
      localStorage['queueId'] = _q.queueId;
      localStorage['spotifyState'] = Math.random().toString(36).slice(2);

      window.location.href =
       "https://accounts.spotify.com/authorize?client_id=" + encodeURIComponent(key) +
       "&redirect_uri=" + encodeURIComponent(_q.host + "spotify") +
       "&scope=playlist-read-private" +
       "&response_type=token&state=" + encodeURIComponent(localStorage['spotifyState']);

      return null;
    } else {
      return localStorage['spotifyToken'];
    }
  };

  return {
    adapters: adapters,
    visible: visible
  };

}]);
