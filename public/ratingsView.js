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
        var cell = $($('#ratings-view-track-cell-template').html());
        cell.attr('track-id', track['id']);
        var thumbnail = cell.find('.trackCellThumbnail');
        thumbnail.attr('src', track['album']['images'][0]['url']);

        var title = cell.find('.trackCellTitle');
        title.text(track['name']);

        var subTitle = cell.find('.trackCellSubtitle');


        subTitle.text(getAtristString(track['artists']));

        return cell;
    }

    function addTracks(tracks, containerDomSelector) {
        tracks.sort(function(a, b) {
            return a['name'].localeCompare(b['name']);
        });

        var container = $(containerDomSelector);
        for (var i = 0; i < tracks.length; i++) {
            getTrack(passedData['access_token'], tracks[i]['id'], function(track) {
                container.append(getTrackCell(track));
            });
        }
    }

    exports.onloadWindow = function() {
        passedData = getDecodedPassedData();

        myNgInclude(function() {
            /* getPlaylist(passedData['access_token'], userId, function(playlist) {
                // title bar
                $('#title-bar-label').text(playlist['name']);

                $('#title-bar-left-nav-button').show();
                $('#title-bar-left-nav-button-label').text("Playlists");

                var tracks = playlist['tracks']['items'];
                for (var i = 0; i < tracks.length; i++) {
                    $('#playlist-view-content').append(getTrackCell(tracks[i]['track']));
                }
            }); */
            // title bar
            $('#title-bar-label').text('Ratings');


            //bottom bar
            $('#bottom-bar-cell-tags').attr('href', "index.html#access_token=" + passedData['access_token']);
            $('#bottom-bar-cell-ratings').addClass('is-selected');
            $('#bottom-bar-cell-search').attr('href', 'searchView.html?access_token=' + passedData['access_token']);
            $('#bottom-bar-cell-playlists').attr('href', "playlistsView.html?access_token=" + passedData['access_token']);
        });

        getUser(passedData['access_token'], function(user) {
            userId = user['id'];

            /* refresh track db */
            refreshMyTracks(passedData['access_token'], userId, function() {
                getMyUserTracks(userId, function(myUserTracks) {
                    var tracks1 = [],
                        tracks2 = [],
                        tracks3 = [],
                        tracks4 = [],
                        tracks5 = [],
                        tracksNa = [];
                    for (var i = 0; i < myUserTracks.length; i++) {
                        switch (parseInt(myUserTracks[i]['rating'])) {
                            case 1:
                                tracks1.push(myUserTracks[i]);
                                break;
                            case 2:
                                tracks2.push(myUserTracks[i]);
                                break;
                            case 3:
                                tracks3.push(myUserTracks[i]);
                                break;
                            case 4:
                                tracks4.push(myUserTracks[i]);
                                break;
                            case 5:
                                tracks5.push(myUserTracks[i]);
                                break;
                            default: // undefined
                                tracksNa.push(myUserTracks[i]);
                                break;
                        }
                    }
                    addTracks(tracks1, '#ratings-view-section-1-stars');
                    addTracks(tracks2, '#ratings-view-section-2-stars');
                    addTracks(tracks3, '#ratings-view-section-3-stars');
                    addTracks(tracks4, '#ratings-view-section-4-stars');
                    addTracks(tracks5, '#ratings-view-section-5-stars');
                    addTracks(tracksNa, '#ratings-view-section-unrated');
                });
            });
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
