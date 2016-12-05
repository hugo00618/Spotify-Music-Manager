"use strict";

(function(exports) {
    var DEFAULT_PLAYLIST_THUMBNAIL_URL = "assets/playlist_spotify_squared_icon_native_640.png";

    var passedData = {};
    var userId;
    var colours;

    exports.onloadWindow = function() {
        passedData = getDecodedPassedData();

        myNgInclude(function() {
            // title bar
            $('#title-bar-label').text("Tags");

            //bottom bar
            $('#bottom-bar-cell-playlists').attr('href', "index.html#access_token=" + passedData['access_token']);
            $('#bottom-bar-cell-tags').addClass('is-selected');
        });
    };

})(window);
