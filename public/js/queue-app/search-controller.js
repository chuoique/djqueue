angular.module('queueSearch', ['utilSocket', 'queueApiAdapter'])
.controller('SearchController', ['$location', '$q', 'socketFactory', 'apiAdapter',
  function($location, $q, socket, apis) {
    var controller = this;

    controller.items = [];      // search results
    controller.nextPage = null; // identifier for the next page
    controller.message = null;  // message to display when there are no items
    controller.searchText = ""; // search box text
    controller.visibleApis = apis.visible;

    // go back to the queue list view
    controller.navigateList = function() {
      $location.path('/');
    };

    // perform the search when the page is loaded with url query parameters
    controller.setup = function() {
      var params = $location.search();
      controller.paramApi = params.a;   // api name (e.g., spotify or soundcloud)
      controller.paramType = params.t;  // item type (e.g., playlist or album or song)
      controller.paramPage = params.p;  // page number identifier
      controller.searchText = params.q; // search box query text
      // params.v, params.p are identifers that can be used by api-adapter.js

      if(!params.a) {
        return;
      }

      if(!apis.adapters[params.a] || !apis.adapters[params.a].itemTypes[params.t]) {
        controller.message = "Search Error";
        return;
      }

      controller.currentApi = apis.adapters[params.a].itemTypes[params.t];

      controller.message = "Loading...";

      controller.currentApi.get(params.q, params.v, params.p, apis.adapters[params.a].apiKey)
      .then(function(data) {
        controller.items = data.items;
        controller.nextPage = data.nextPage;
        controller.message = null;
      }, function() {
        controller.message = "Search Error";
      });
    };

    // perform the specified search
    controller.search = function(api, type) {
      var ignoreText = apis.adapters[api] &&
          apis.adapters[api].itemTypes[type] &&
          apis.adapters[api].itemTypes[type].ignoreText;
      if(controller.searchText || ignoreText) {
        $location.search({
          a: api,
          t: type,
          q: controller.searchText,
          v: null,
          p: null // remove unnecessary parameters
        });
      }
    };
    
    // go to the previous page of results
    controller.pageBack = function() {
      // mostly a design decision, since i don't like the browser back button
      // to take me forward a page after i use the prev page button.
      window.history.back();
      // note that this will not work if you copy and paste a url, etc.
      // could also be implemented similarly to pageForward.
    };

    // load the next page of results
    controller.pageForward = function() {
      // load with the same parameters, but with the nextPage identifier
      // specified by the last set of results
      if(controller.nextPage) {
        $location.search($.extend({}, $location.search(), {
          p: controller.nextPage
        }));
      }
    };

    // view the individual items in a playlist, album, or any type of collection
    controller.view = function(item) {
      if(item.view) {
        $location.search({
          a: controller.paramApi,
             // for example, translate "playlist" to "playlist-song"
          t: controller.currentApi.collectionOf, 
          v: item.view, // send the view identifier to the api adapter
          q: null,
          p: null // remove unnecessary parameters
        });
      }
    };
    
    // add the item to the queue
    controller.add = function(position, item) {
      // if they specified an add function, call that first
      (controller.currentApi.add || $q.resolve)(item).then(function(newItem) {
        item.added = true; // give it a visible "item added" indicator on the search results
        newItem = {
          name: newItem.name, // filter out unnecessary data
          artist: newItem.artist,
          url: newItem.url,
          length: newItem.length,
          icon: apis.adapters[controller.paramApi].icon // attach the icon to it
        };
        
        socket.emit('queue-add-' + position, {items: [newItem]});
      });
    };

    // hacky one-liner to scroll to the top of the page when the search box
    // is selected. ideally this could be done with a directive
    controller.focusSearch = function() {
      window.scrollTo(0, 0);
    };

    controller.setup();
  }
]);
