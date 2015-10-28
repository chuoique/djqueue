jQuery.noConflict();
jQuery(window).load(function(){
    setTimeout(function() {
        jQuery("#movie_player .video-stream").css({
            "width": jQuery(window).width() + 'px',
            "height": jQuery(window).height() + 'px',
            "position": 'fixed',
            "top": '0',
            "left": '0',
            "background-color": 'white'
        });
        jQuery("#movie_player .html5-video-controls").hide();
        jQuery("#masthead-positioner").hide();
        jQuery(".ytp-player-content").hide();
    }, 10);
});