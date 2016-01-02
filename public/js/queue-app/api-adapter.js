angular.module('queueApiAdapter', [])
.factory('apiAdapter', ['$q', '$http', function($q, $http) {

  // visible apis on the search page
  var visible = [{
    name: 'Song',
    apis: [{
      api: 'soundcloud',
      type: 'song'
    }, {
      api: 'youtube',
      type: 'video'
    }, {
      api: 'spotify',
      type: 'song'
    }]
  }, {
    name: 'Playlist',
    apis: [{
      api: 'soundcloud',
      type: 'playlist'
    }, {
      api: 'youtube',
      type: 'playlist'
    }, {
      api: 'spotify',
      type: 'playlist'
    }]
  }, {
    name: 'Album',
    apis: [{
      api: 'spotify',
      type: 'album'
    }]
  }];

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
      apiKey: _q.spotifyClientId,
      icon: 'fa-spotify',
      itemTypes: {

        'song': {
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
          collectionOf: 'playlist-song',
          ignoreText: true, // allow spotify login if search box is empty
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

        'album': {
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
                    view: value.href + '/tracks'
                  };
                }),
                nextPage: data.albums.next
              }
            });
          }
        }
      }
    },


    'soundcloud': {
      apiKey: _q.soundcloudClientId,
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
            }).then(function(data) {
              return {
                items: data.collection.map(function(value) {
                  return {
                    name: value.title,
                    artist: value.user.username,
                    url: value.permalink_url,
                    length: value.duration
                  };
                }),
                nextPage: data.next_href
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
            }).then(function(data) {
              return {
                items: data.collection.map(function(value) {
                  return {
                    name: value.title,
                    artist: value.user.username,
                    url: value.permalink_url,
                    length: value.duration
                  };
                }),
                nextPage: data.next_href
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
            }).then(function(data) {
              return {
                items: data.collection.map(function(value) {
                  return {
                    name: value.title,
                    artist: value.user.username,
                    view: value.uri + '/tracks'
                  };
                }),
                nextPage: data.next_href
              }
            });
          }
        }
      }
    },


    'youtube': {
      apiKey: _q.googleKey,
      icon: 'fa-youtube-play',

       itemTypes: {

        'video': {
          get: function(text, view, page, key) {
            if(!gapi.client.youtube) {
              return $q.reject();
            }

            var request = gapi.client.youtube.search.list({
              q: text,
              part: 'snippet',
              type: 'video',
              maxResults: 50,
              pageToken: page
            });

            return request.execute().then(function(data) {
              return {
                items: data.items.map(function(value) {
                  return {
                    name: value.snippet.title,
                    artist: value.snippet.channelTitle,
                    _youtubeId: value.id.videoId
                  };
                }),
                nextPage: response.nextPageToken
              };
            });
          },

          add: function(item) {
            var request = gapi.client.youtube.videos.list({
              part: 'contentDetails',
              id: item._youtubeId
            });

            return request.execute().then(function(data) {
              return {
                name: item.name,
                artist: item.artist
                url: "https://www.youtube.com/watch?v=" + item._youtubeId,
                length: youtubeToMilliseconds(data.items[0].contentDetails.duration)
              };
            });

            return defer;
          }
        },

        'playlist-item': {
          get: function(text, view, page, key) {
            if(!gapi.client.youtube) {
              return $q.reject();
            }

            var request = gapi.client.youtube.search.list({
              part: 'snippet',
              playlistId: view,
              maxResults: 50,
              pageToken: page
            });

            return request.execute().then(function(data) {
              return {
                items: data.items.filter(function(value) {
                  return value.snippet.resourceId.kind == 'youtube#video';
                }).map(function(value) {
                  return {
                    name: value.snippet.title,
                    artist: value.snippet.channelTitle
                    _youtubeId: value.snippet.resourceId.videoId,
                  };
                }),
                nextPage: response.nextPageToken
              };
            });
          },

          add: function(item) {
            var request = gapi.client.youtube.videos.list({
              part: 'contentDetails',
              id: item._youtubeId
            });

            return request.execute().then(function(data) {
              return {
                name: item.name,
                artist: item.artist
                url: "https://www.youtube.com/watch?v=" + item._youtubeId,
                length: youtubeToMilliseconds(data.items[0].contentDetails.duration)
              };
            });

            return defer;
          }
        },

        'playlist': {
          collectionOf: 'playlist-song',
          get: function(text, view, page, key) {
            if(!gapi.client.youtube) {
              return $q.reject();
            }

            var request = gapi.client.youtube.search.list({
              q: text,
              part: 'snippet',
              type: 'playlist',
              maxResults: 50,
              pageToken: page
            });

            return request.execute().then(function(data) {
              return {
                items: data.items.map(function(value) {
                  return {
                    name: value.snippet.title,
                    artist: value.snippet.channelTitle,
                    view: value.id.playlistId                        
                  };
                }),
                nextPage: response.nextPageToken
              };
            });
          }
        }
      }
    }
  };

  // http://stackoverflow.com/a/22149575, quick hack to avoid loading moment.js or another time library
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
  }

  return {
    adapters: adapters,
    visible: visible
  };

}]);
