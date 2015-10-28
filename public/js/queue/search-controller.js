var module = angular.module('moduleControllerSearch', [
]);

module.controller('controllerSearch', ['$scope', '$location', '$http',
  function($scope, $location, $http) {
    var searchParams = $location.search();
    $scope.searchText = searchParams.q || "";
    $scope.searchType = searchParams.t || "";
    $scope.searchHref = searchParams.h;
    $scope.searchPageHref = searchParams.ph;
    $scope.searchId = searchParams.id || "";
    $scope.pageToken = searchParams.pt;
    $scope.pageOffset = searchParams.p || 0;
    $scope.searchResults = [];

    $scope.nextPageHref = "";
    $scope.nextPageToken = "";

    if($scope.searchType) {
        $scope.loading = true;

        if($scope.searchType == 'spotify-song') {
            $http({
                url: $scope.searchPageHref || 'https://api.spotify.com/v1/search',
                method: 'GET',
                params: $scope.searchPageHref ? undefined : {
                    type: 'track',
                    q: $scope.searchText,
                    limit: 50,
                    offset: 0
                }
            }).success(function(data) {
                $scope.loading = false;
                $.each(data.tracks.items, function(index, value) {
                    $scope.searchResults.push({
                        name: value.name,
                        url: value.external_urls.spotify,
                        length: value.duration_ms,
                        artist: value.artists[0].name,
                        icon: "fa-spotify"
                    });
                });
                $scope.nextPageHref = data.tracks.next;
            });
        }

        else if($scope.searchType == 'spotify-album-song') {
            $http({
                url: $scope.searchPageHref || $scope.searchHref,
                method: 'GET',
                params: $scope.searchPageHref ? undefined : {
                    limit: 50,
                    offset: 0
                }
            }).success(function(data) {
                $scope.loading = false;
                $.each(data.items, function(index, value) {
                    $scope.searchResults.push({
                        name: value.name,
                        artist: value.artists[0].name,
                        url: value.external_urls.spotify,
                        length: value.duration_ms,
                        icon: "fa-spotify"
                    });
                });
                $scope.nextPageHref = data.next;
            });
        }

        else if($scope.searchType == 'spotify-playlist-song') {
            $http({
                url: $scope.searchPageHref || $scope.searchHref,
                method: 'GET',
                params: $scope.searchPageHref ? undefined : {
                    limit: 50,
                    offset: 0
                }, headers: {
                    'Authorization': 'Bearer ' + localStorage['spotifyToken']
                }
            }).success(function(data) {
                $scope.loading = false;
                $.each(data.items, function(index, value) {
                    $scope.searchResults.push({
                        name: value.track.name,
                        artist: value.track.artists[0].name,
                        url: value.track.external_urls.spotify,
                        length: value.track.duration_ms,
                        icon: "fa-spotify"
                    });
                });
                $scope.nextPageHref = data.next;
            });
        }

        else if($scope.searchType == 'spotify-album') {
            $http({
                url: $scope.searchPageHref || 'https://api.spotify.com/v1/search',
                method: 'GET',
                params: $scope.searchPageHref ? undefined : {
                    type: 'album',
                    q: $scope.searchText,
                    limit: 50,
                    offset: 0
                }
            }).success(function(data) {
                $scope.loading = false;
                $.each(data.albums.items, function(index, value) {
                    $scope.searchResults.push({
                        name: value.name,
                        api: value.href
                    });
                });
                $scope.nextPageHref = data.albums.next;
            });
        }

        else if($scope.searchType == 'spotify-playlist') {
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
                        url: $scope.searchPageHref || 'https://api.spotify.com/v1/users/'+data.id+'/playlists',
                        method: 'GET',
                        params: $scope.searchPageHref ? undefined : {
                            "public": "null",
                            limit: 50,
                            offset: 0
                        },
                        headers: {
                          'Authorization': 'Bearer ' + localStorage['spotifyToken']
                        }
                    }).success(function(data) {
                        $scope.loading = false;
                        $.each(data.items, function(index, value) {
                            $scope.searchResults.push({
                                name: value.name,
                                api: value.tracks.href
                            });
                        });
                        $scope.nextPageHref = data.next;
                    });
                });
            } else {
                localStorage['spotifyState'] = Math.round(Math.random() * 1000);
                window.location.href = 
                 "https://accounts.spotify.com/authorize?client_id=" + encodeURIComponent(_q.spotifyClientId) +
                 "&redirect_uri=" + encodeURIComponent(_q.host + "spotify") +
                 "&scope=playlist-read-private" + 
                 "&response_type=token&state=" + encodeURIComponent(localStorage['spotifyState']);
            }
        }

        else if($scope.searchType == 'soundcloud-song') {
            $http({
                url: $scope.searchPageHref || 'http://api.soundcloud.com/tracks',
                method: 'GET',
                params: $scope.searchPageHref ? undefined : {
                    q: $scope.searchText,
                    client_id: _q.soundcloudClientId,
                    limit: 50,
                    linked_partitioning: 1
                }
            }).success(function(data) {
                $scope.loading = false;
                $.each(data.collection, function(index, value) {
                    $scope.searchResults.push({
                        name: value.title,
                        url: value.permalink_url,
                        length: value.duration,
                        artist: value.user.username,
                        icon: "fa-soundcloud"
                    });
                });
                $scope.nextPageHref = data.next_href;
            });
        }

        else if($scope.searchType == 'soundcloud-playlist-song') {
            $http({
                url: $scope.searchPageHref || $scope.searchHref,
                method: 'GET',
                params: $scope.searchPageHref ? undefined : { 
                    client_id: _q.soundcloudClientId,
                    limit: 50,
                    linked_partitioning: 1
                }
            }).success(function(data) {
                $scope.loading = false;
                $.each(data.collection, function(index, value) {
                    $scope.searchResults.push({
                        name: value.title,
                        url: value.permalink_url,
                        length: value.duration,
                        artist: value.user.username,
                        icon: "fa-soundcloud"
                    });
                });
                $scope.nextPageHref = data.next_href;
            });
        }

        else if($scope.searchType == 'soundcloud-playlist') {
            $http({
                url: $scope.nextPageHref || 'http://api.soundcloud.com/playlists',
                method: 'GET',
                params: $scope.nextPageHref ? undefined : {
                    q: $scope.searchText,
                    client_id: _q.soundcloudClientId,
                    limit: 50,
                    linked_partitioning: 1
                }
            }).success(function(data) {
                $scope.loading = false;
                $.each(data.collection, function(index, value) {
                    $scope.searchResults.push({
                        name: value.title,
                        api: value.uri,
                        artist: value.user.username
                    });
                });
                $scope.nextPageHref = data.next_href;
            });
        }

        else if($scope.searchType == 'youtube-video' && gapi.client.youtube) {
            var request = gapi.client.youtube.search.list({
               q: $scope.searchText,
               part: 'snippet',
               type: 'video',
               maxResults: 50,
               pageToken: $scope.pageToken
            });

            request.execute(function(response) {
                $scope.loading = false;
                $.each(response.items, function(index, value) {
                    $scope.searchResults.push({
                        name: value.snippet.title,
                        id: value.id.videoId,
                        artist: value.snippet.channelTitle
                    });
                });
                $scope.nextPageToken = response.nextPageToken;
                $scope.$apply();
            });
        }

        else if($scope.searchType == 'youtube-playlist' && gapi.client.youtube) {
            var request = gapi.client.youtube.search.list({
               q: $scope.searchText,
               part: 'snippet',
               type: 'playlist',
               maxResults: 50,
               pageToken: $scope.pageToken
            });

            request.execute(function(response) {
                $scope.loading = false;
                $.each(response.items, function(index, value) {
                    $scope.searchResults.push({
                        name: value.snippet.title,
                        id: value.id.playlistId,
                        artist: value.snippet.channelTitle
                    });
                });
                $scope.nextPageToken = response.nextPageToken;
                $scope.$apply();
            });
        }

        else if($scope.searchType == 'youtube-playlist-item' && gapi.client.youtube) {
            var request = gapi.client.youtube.playlistItems.list({
                part: 'snippet',
                playlistId: $scope.searchId,
                maxResults: 50,
                pageToken: $scope.pageToken
            });

            request.execute(function(response) {
                $scope.loading = false;
                $.each(response.items, function(index, value) {
                    if(value.snippet.resourceId.kind == 'youtube#video') {
                        $scope.searchResults.push({
                            name: value.snippet.title,
                            id: value.snippet.resourceId.videoId,
                            artist: value.snippet.channelTitle
                        });
                    }
                });
                $scope.nextPageToken = response.nextPageToken;
                $scope.$apply();
            });
        }
    } else {
        jQuery("#search").focus(); // hacky, i'm sorry angular
    }

    $scope.search = function(type) {
        if($scope.searchText || type == 'spotify-playlist') {
            $location.search({
                t: type,
                q: $scope.searchText,
                h: null,
                ph: null,
                id: null,
                pt: null,
                p: null
            });   
        }      
    }

    $scope.viewSoundcloudPlaylist = function(result) {        
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

    $scope.viewSpotifyPlaylist = function(result) {
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
    $scope.viewSpotifyAlbum = function(result) {
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

    $scope.viewYoutubePlaylist = function(result) {
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
    
    $scope.addQueue = function(type, result) {
        result.added = true;
        $scope.socket.emit('add-queue', {type: type, results: [result]});
    }

    $scope.addYoutubeQueue = function(type, result) {
        var request = gapi.client.youtube.videos.list({
           part: 'contentDetails',
           id: result.id
        });

        request.execute(function(data) {
            $scope.addQueue(type, {
                name: result.name,
                url: "https://www.youtube.com/watch?v=" + result.id,
                length: convert_time(data.items[0].contentDetails.duration),
                artist: result.artist,
                icon: "fa-youtube-play"
            });
            result.added = true;
            $scope.$apply();
        });
    }

    $scope.pageBack = function() {
        window.history.back();
    }

    $scope.pageForward = function() {
        if($scope.nextPageToken) {
            $location.search($.extend({}, $location.search(), {
                pt: $scope.nextPageToken
            }));
        } else if($scope.nextPageHref) {
            $location.search({
                ph: $scope.nextPageHref,
                h: null,
                q: null,
                id: null,
                pt: null,
                p: null,
                t: $scope.searchType
            });
        }
    }
    
    $scope.focusSearch = function() {
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