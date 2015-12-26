angular.module('queueSearch', ['utilSocket'])
.controller('SearchController', ['$location', '$http', 'socketFactory',
  function($location, $http, socket) {
    var controller = this;

    controller.socket = socket;

    controller.navigateList = function() {
      $location.path('/');
    };
    
    var searchParams = $location.search();
    controller.searchText = searchParams.q || "";
    controller.searchType = searchParams.t || "";
    controller.searchHref = searchParams.h;
    controller.searchPageHref = searchParams.ph;
    controller.searchId = searchParams.id || "";
    controller.pageToken = searchParams.pt;
    controller.pageOffset = searchParams.p || 0;
    controller.searchResults = [];

    controller.nextPageHref = "";
    controller.nextPageToken = "";

    if(controller.searchType) {
        controller.loading = true;

        if(controller.searchType == 'spotify-song') {
            $http({
                url: controller.searchPageHref || 'https://api.spotify.com/v1/search',
                method: 'GET',
                params: controller.searchPageHref ? undefined : {
                    type: 'track',
                    q: controller.searchText,
                    limit: 50,
                    offset: 0
                }
            }).success(function(data) {
                controller.loading = false;
                $.each(data.tracks.items, function(index, value) {
                    controller.searchResults.push({
                        name: value.name,
                        url: value.external_urls.spotify,
                        length: value.duration_ms,
                        artist: value.artists[0].name,
                        icon: "fa-spotify"
                    });
                });
                controller.nextPageHref = data.tracks.next;
            });
        }

        else if(controller.searchType == 'spotify-album-song') {
            $http({
                url: controller.searchPageHref || controller.searchHref,
                method: 'GET',
                params: controller.searchPageHref ? undefined : {
                    limit: 50,
                    offset: 0
                }
            }).success(function(data) {
                controller.loading = false;
                $.each(data.items, function(index, value) {
                    controller.searchResults.push({
                        name: value.name,
                        artist: value.artists[0].name,
                        url: value.external_urls.spotify,
                        length: value.duration_ms,
                        icon: "fa-spotify"
                    });
                });
                controller.nextPageHref = data.next;
            });
        }

        else if(controller.searchType == 'spotify-playlist-song') {
            $http({
                url: controller.searchPageHref || controller.searchHref,
                method: 'GET',
                params: controller.searchPageHref ? undefined : {
                    limit: 50,
                    offset: 0
                }, headers: {
                    'Authorization': 'Bearer ' + localStorage['spotifyToken']
                }
            }).success(function(data) {
                controller.loading = false;
                $.each(data.items, function(index, value) {
                    controller.searchResults.push({
                        name: value.track.name,
                        artist: value.track.artists[0].name,
                        url: value.track.external_urls.spotify,
                        length: value.track.duration_ms,
                        icon: "fa-spotify"
                    });
                });
                controller.nextPageHref = data.next;
            });
        }

        else if(controller.searchType == 'spotify-album') {
            $http({
                url: controller.searchPageHref || 'https://api.spotify.com/v1/search',
                method: 'GET',
                params: controller.searchPageHref ? undefined : {
                    type: 'album',
                    q: controller.searchText,
                    limit: 50,
                    offset: 0
                }
            }).success(function(data) {
                controller.loading = false;
                $.each(data.albums.items, function(index, value) {
                    controller.searchResults.push({
                        name: value.name,
                        api: value.href
                    });
                });
                controller.nextPageHref = data.albums.next;
            });
        }

        else if(controller.searchType == 'spotify-playlist') {
            if(localStorage['spotifyToken'] && new Date() < Date.parse(localStorage['spotifyExpire'])) {
                $http({
                    url: 'https://api.spotify.com/v1/me',
                    method: 'GET',
                    params: {},
                    headers: {
                      'Authorization': 'Bearer ' + localStorage['spotifyToken']
                    }
                }).success(function(data) {
                    $http({
                        url: controller.searchPageHref || 'https://api.spotify.com/v1/users/'+data.id+'/playlists',
                        method: 'GET',
                        params: controller.searchPageHref ? undefined : {
                            "public": "null",
                            limit: 50,
                            offset: 0
                        },
                        headers: {
                          'Authorization': 'Bearer ' + localStorage['spotifyToken']
                        }
                    }).success(function(data) {
                        controller.loading = false;
                        $.each(data.items, function(index, value) {
                            controller.searchResults.push({
                                name: value.name,
                                api: value.tracks.href
                            });
                        });
                        controller.nextPageHref = data.next;
                    });
                });
            } else {
                localStorage['queueId'] = _q.id;
                localStorage['spotifyState'] = Math.random().toString(36).slice(2);
                window.location.href = 
                 "https://accounts.spotify.com/authorize?client_id=" + encodeURIComponent(_q.spotifyClientId) +
                 "&redirect_uri=" + encodeURIComponent(_q.host + "spotify") +
                 "&scope=playlist-read-private" + 
                 "&response_type=token&state=" + encodeURIComponent(localStorage['spotifyState']);
            }
        }

        else if(controller.searchType == 'soundcloud-song') {
            $http({
                url: controller.searchPageHref || 'http://api.soundcloud.com/tracks',
                method: 'GET',
                params: controller.searchPageHref ? undefined : {
                    q: controller.searchText,
                    client_id: _q.soundcloudClientId,
                    limit: 50,
                    linked_partitioning: 1
                }
            }).success(function(data) {
                controller.loading = false;
                $.each(data.collection, function(index, value) {
                    controller.searchResults.push({
                        name: value.title,
                        url: value.permalink_url,
                        length: value.duration,
                        artist: value.user.username,
                        icon: "fa-soundcloud"
                    });
                });
                controller.nextPageHref = data.next_href;
            });
        }

        else if(controller.searchType == 'soundcloud-playlist-song') {
            $http({
                url: controller.searchPageHref || controller.searchHref,
                method: 'GET',
                params: controller.searchPageHref ? undefined : { 
                    client_id: _q.soundcloudClientId,
                    limit: 50,
                    linked_partitioning: 1
                }
            }).success(function(data) {
                controller.loading = false;
                $.each(data.collection, function(index, value) {
                    controller.searchResults.push({
                        name: value.title,
                        url: value.permalink_url,
                        length: value.duration,
                        artist: value.user.username,
                        icon: "fa-soundcloud"
                    });
                });
                controller.nextPageHref = data.next_href;
            });
        }

        else if(controller.searchType == 'soundcloud-playlist') {
            $http({
                url: controller.nextPageHref || 'http://api.soundcloud.com/playlists',
                method: 'GET',
                params: controller.nextPageHref ? undefined : {
                    q: controller.searchText,
                    client_id: _q.soundcloudClientId,
                    limit: 50,
                    linked_partitioning: 1
                }
            }).success(function(data) {
                controller.loading = false;
                $.each(data.collection, function(index, value) {
                    controller.searchResults.push({
                        name: value.title,
                        api: value.uri,
                        artist: value.user.username
                    });
                });
                controller.nextPageHref = data.next_href;
            });
        }

        else if(controller.searchType == 'youtube-video' && gapi.client.youtube) {
            var request = gapi.client.youtube.search.list({
               q: controller.searchText,
               part: 'snippet',
               type: 'video',
               maxResults: 50,
               pageToken: controller.pageToken
            });

            request.execute(function(response) {
                controller.loading = false;
                $.each(response.items, function(index, value) {
                    controller.searchResults.push({
                        name: value.snippet.title,
                        id: value.id.videoId,
                        artist: value.snippet.channelTitle
                    });
                });
                controller.nextPageToken = response.nextPageToken;
                controller.$apply();
            });
        }

        else if(controller.searchType == 'youtube-playlist' && gapi.client.youtube) {
            var request = gapi.client.youtube.search.list({
               q: controller.searchText,
               part: 'snippet',
               type: 'playlist',
               maxResults: 50,
               pageToken: controller.pageToken
            });

            request.execute(function(response) {
                controller.loading = false;
                $.each(response.items, function(index, value) {
                    controller.searchResults.push({
                        name: value.snippet.title,
                        id: value.id.playlistId,
                        artist: value.snippet.channelTitle
                    });
                });
                controller.nextPageToken = response.nextPageToken;
                controller.$apply();
            });
        }

        else if(controller.searchType == 'youtube-playlist-item' && gapi.client.youtube) {
            var request = gapi.client.youtube.playlistItems.list({
                part: 'snippet',
                playlistId: controller.searchId,
                maxResults: 50,
                pageToken: controller.pageToken
            });

            request.execute(function(response) {
                controller.loading = false;
                $.each(response.items, function(index, value) {
                    if(value.snippet.resourceId.kind == 'youtube#video') {
                        controller.searchResults.push({
                            name: value.snippet.title,
                            id: value.snippet.resourceId.videoId,
                            artist: value.snippet.channelTitle
                        });
                    }
                });
                controller.nextPageToken = response.nextPageToken;
                controller.$apply();
            });
        }
    } else {
        jQuery("#search").focus(); // hacky, i'm sorry angular
    }

    controller.search = function(type) {
        if(controller.searchText || type == 'spotify-playlist') {
            $location.search({
                t: type,
                q: controller.searchText,
                h: null,
                ph: null,
                id: null,
                pt: null,
                p: null
            });   
        }      
    }

    controller.viewSoundcloudPlaylist = function(result) {        
        $location.search({
            t: 'soundcloud-playlist-song',
            h: result.api + '/tracks',
            ph: null,
            q: null,
            id: null,
            pt: null,
            p: null
        });
    };

    controller.viewSpotifyPlaylist = function(result) {
        $location.search({
            t: 'spotify-playlist-song',
            h: result.api,
            ph: null,
            q: null,
            id: null,
            pt: null,
            p: null
        });
    }
    controller.viewSpotifyAlbum = function(result) {
        $location.search({
            t: 'spotify-album-song',
            h: result.api + '/tracks',
            ph: null,
            q: null,
            id: null,
            pt: null,
            p: null
        });
    }

    controller.viewYoutubePlaylist = function(result) {
        $location.search({
            t: 'youtube-playlist-item',
            h: null,
            ph: null,
            q: null,
            id: result.id,
            pt: null,
            p: null
        });
    }
    
    controller.addQueue = function(type, result) {
        result.added = true;
        controller.socket.emit('add-queue', {type: type, results: [result]});
    }

    controller.addYoutubeQueue = function(type, result) {
        var request = gapi.client.youtube.videos.list({
           part: 'contentDetails',
           id: result.id
        });

        request.execute(function(data) {
            controller.addQueue(type, {
                name: result.name,
                url: "https://www.youtube.com/watch?v=" + result.id,
                length: convert_time(data.items[0].contentDetails.duration),
                artist: result.artist,
                icon: "fa-youtube-play"
            });
            result.added = true;
            controller.$apply();
        });
    }

    controller.pageBack = function() {
        window.history.back();
    }

    controller.pageForward = function() {
        if(controller.nextPageToken) {
            $location.search($.extend({}, $location.search(), {
                pt: controller.nextPageToken
            }));
        } else if(controller.nextPageHref) {
            $location.search({
                ph: controller.nextPageHref,
                h: null,
                q: null,
                id: null,
                pt: null,
                p: null,
                t: controller.searchType
            });
        }
    }
    
    controller.focusSearch = function() {
        window.scrollTo(0, 0);
    }

    function convert_time(duration) {
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
  }
]);