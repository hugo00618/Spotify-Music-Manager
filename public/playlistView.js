/*
 *  Starter code for University of Waterloo CS349 Fall 2016.
 *  
 *  bwbecker 20161113
 *  
 *  Some code adapted from https://github.com/possan/playlistcreator-example
 */
"use strict";

var DEFAULT_THUMBNAIL_URL = "assets/playlist_spotify_squared_icon_native_640.png";

// An anonymous function that is executed passing "window" to the
// parameter "exports".  That is, it exports startApp to the window
// environment.
(function(exports) {
    var passedData = {};
    var userId;

    function getTrackCell(track) {
        var cell = $($('#playlist-view-track-cell-template').html());
        cell.attr('track-id', track['id']);

        var thumbnail = cell.find('.trackCellThumbnail');
        thumbnail.attr('src', track['album']['images'][0]['url']);

        var title = cell.find('.trackCellTitle');
        title.text(track['name']);

        var subTitle = cell.find('.trackCellSubtitle');


        subTitle.text(getAtristString(track['artists']));

        return cell;
    }

    exports.onloadWindow = function() {
        passedData = getDecodedPassedData();

        myNgInclude(function() {
            getUser(passedData['access_token'], function(user) {
                userId = user['id'];
                getPlaylist(passedData['access_token'], userId, passedData['playlist_id'], function(playlist) {
                    // title bar
                    $('#title-bar-label').text(playlist['name']);

                    $('#title-bar-left-nav-button').show();
                    $('#title-bar-left-nav-button-label').text("Playlists");

                    var tracks = playlist['tracks']['items'];
                    for (var i = 0; i < tracks.length; i++) {
                        $('#playlist-view-content').append(getTrackCell(tracks[i]['track']));
                    }
                });
            });


            //bottom bar
            $('#bottom-bar-cell-tags').attr('href', "index.html#access_token=" + passedData['access_token']);
            $('#bottom-bar-cell-ratings').attr('href', 'ratingsView.html?access_token=' + passedData['access_token']);
            $('#bottom-bar-cell-search').attr('href', 'searchView.html?access_token=' + passedData['access_token']);
            $('#bottom-bar-cell-playlists').addClass('is-selected');
            $('#bottom-bar-cell-playlists').attr('href', "playlistsView.html?access_token=" + passedData['access_token']);
        });
    }

    exports.onclickTitleBarLeftButton = function() {
        window.location = window.location.origin + '/playlistsView.html?access_token=' + passedData['access_token'];
    }

    exports.onclickTrackCell = function(sender) {
        var senderCell = $(sender).closest('.trackCell');

        window.location = window.location.origin + '/trackView.html?access_token=' + passedData['access_token'] +
            "&track_id=" + senderCell.attr('track-id');
    }

})(window);
