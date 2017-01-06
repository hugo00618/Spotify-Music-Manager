/*
 *  Starter code for University of Waterloo CS349 Fall 2016.
 *  
 *  bwbecker 20161113
 *  
 *  Some code adapted from https://github.com/possan/playlistcreator-example
 */
"use strict";

var DEFAULT_PLAYLIST_THUMBNAIL_URL = "assets/playlist_spotify_squared_icon_native_640.png";

// An anonymous function that is executed passing "window" to the
// parameter "exports".  That is, it exports startApp to the window
// environment.
(function(exports) {
    var passedData = {};
    var userId;

    /*
     * Returns the playListCell DOM of item
     */
    function getPlaylistCell(item) {
        var cell = $($('#playlist-cell-template').html());
        var cellAnchor = cell.find('.playlitsCellLink');
        var cellThumbnail = cell.find(".playListCellThumbnail");
        var cellTitle = cell.find('.playlistCellLabelTitle');
        var cellSongCount = cell.find('.playListCellLabelSongCount');

        var thumbnailUrl = item['images'][0] ? item['images'][0]['url'] : DEFAULT_PLAYLIST_THUMBNAIL_URL;
        var songCountNumber = item.tracks.total;
        var songCountText = songCountNumber === 1 ? songCountNumber + " Song" : songCountNumber + " Songs";

        var anchorLink = "playlistView.html";
        anchorLink += "?access_token=" + passedData['access_token'];
        anchorLink += "&owner_id=" + item['owner']['id'];
        anchorLink += "&playlist_id=" + item['id'];
        cellAnchor.attr("href", anchorLink);
        cellThumbnail.attr("src", thumbnailUrl);
        cellTitle.text(item.name);
        cellSongCount.text(songCountText);

        return cell;
    }

    exports.onloadWindow = function() {
        passedData = getDecodedPassedData();

        myNgInclude(function() {
            // title bar
            $('#title-bar-label').text("Playlists");

            //bottom bar
            $('#bottom-bar-cell-tags').attr('href', "index.html#access_token=" + passedData['access_token']);
            $('#bottom-bar-cell-ratings').attr('href', 'ratingsView.html?access_token=' + passedData['access_token']);
            $('#bottom-bar-cell-search').attr('href', 'searchView.html?access_token=' + passedData['access_token']);
            $('#bottom-bar-cell-playlists').addClass('is-selected');
        });

        getUser(passedData['access_token'], function(user) {
            userId = user['id'];
            /* refresh track db */
            refreshMyTracks(passedData['access_token'], userId, function() {
                getPlaylists(passedData['access_token'], userId, function(playlistsObj) {
                    var playlists = playlistsObj['items'];
                    // var playlistIds = [];
                    for (var i = 0; i < playlists.length; i++) {
                        // playlistIds.push(item['id']);
                        $('#playlists-view-playlists-container').append(getPlaylistCell(playlists[i]));
                    }
                    // myUser['playlists'] = JSON.stringify(playlistIds);
                    // $.post('user-info', myUser, null, "json");
                });
            });
        });
    }

})(window);
