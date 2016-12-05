"use strict";

(function(exports) {
    var DEFAULT_PLAYLIST_THUMBNAIL_URL = "assets/playlist_spotify_squared_icon_native_640.png";

    var passedData = {};
    var userId, colours;

    function getMyTrack(_callback) {
        getMyUser(userId, function(myUser) {
            var myUserTracks = JSON.parse(myUser['tracks']);
            var track = findInArray(myUserTracks, 'id', passedData['track_id']);
            _callback(track);
        })
    }

    function getTagCell(tag, tagged) {
        var cell = $($('#track-viewtag-cell-template').html());

        cell.text(tag['name']);

        cell.addClass(getColourClassName(colours, tag['colourId']));
        if (!tagged) {
            cell.addClass('faded');
        }

        return cell;
    }

    exports.onloadWindow = function() {
        passedData = getDecodedPassedData();

        myNgInclude(function() {
            //bottom bar
            $('#bottom-bar-cell-tags').attr('href', "index.html#access_token=" + passedData['access_token']);
            $('#bottom-bar-cell-ratings').attr('href', 'ratingsView.html?access_token=' + passedData['access_token']);
            $('#bottom-bar-cell-search').attr('href', 'searchView.html?access_token=' + passedData['access_token']);
            $('#bottom-bar-cell-playlists').addClass('is-selected');
            $('#bottom-bar-cell-playlists').attr('href', "playlistsView.html?access_token=" + passedData['access_token']);
        });

        getUser(passedData['access_token'], function(user) {
            userId = user['id'];

            getTrack(passedData['access_token'], passedData['track_id'], function(track) {
                console.log(track);

                var albumCover = $('#track-cover');
                albumCover.css('background-image', 'url(' + track['album']['images'][0]['url'] + ')');

                var spotifyButton = $('.spotifyButton');
                spotifyButton.attr('href', track['external_urls']['spotify']);

                var title = $('#track-title');
                title.text(track['name']);

                var subtitle = $('#track-subtitle');
                subtitle.text(getAtristString(track['artists']));

                var trackId = track['id'];

                getMyTrack(function(myTrack) {
                    var trackRating = myTrack['rating'];
                    if (trackRating === undefined) {
                        $('.ratingContainer').addClass('unrated');
                    } else {
                        rate(parseInt(trackRating));
                    }
                });
            });

        getMyColours(function(myColours) {
            colours = myColours;
                getMyUserTags(userId, function(myUserTags) {
                    // add tagged tags first, then untagged
                    for (var i = 0; i < myUserTags.length; i++) {
                        var taggedTracks = myUserTags[i]['tracks'];
                        if (taggedTracks === undefined) {
                            taggedTracks = [];
                        }

                        if (taggedTracks.indexOf(passedData['track_id']) !== -1) { // tagged
                            var tagCell = getTagCell(myUserTags[i], true);
                            tagCell.attr('tag-index', i);
                            $('.playlistTagContainer').append(tagCell);
                        }
                    }
                    for (var i = 0; i < myUserTags.length; i++) {
                        var taggedTracks = myUserTags[i]['tracks'];
                        if (taggedTracks === undefined) {
                            taggedTracks = [];
                        }

                        if (taggedTracks.indexOf(passedData['track_id']) == -1) { // untagged
                            var tagCell = getTagCell(myUserTags[i], false);
                            tagCell.attr('tag-index', i);
                            $('.playlistTagContainer').append(tagCell);
                        }
                    }
                });
            })
        });

    }

    exports.rate = function(star) {
        $('.ratingContainer').removeClass('unrated');

        var stars = $('.rating-container .rating-star');
        var i;
        for (i = 0; i < star; i++) {
            $(stars[i]).removeClass('unselected');
            $(stars[i]).addClass('selected');
        }
        for (; i < 5; i++) {
            $(stars[i]).removeClass('selected');
            $(stars[i]).addClass('unselected');
        }

        getMyUser(userId, function(myUser) {
            var myTracks = JSON.parse(myUser['tracks']);
            var myTrackIndex = findIndexInArray(myTracks, 'id', passedData['track_id']);

            myTracks[myTrackIndex]['rating'] = star;
            myUser['tracks'] = JSON.stringify(myTracks);

            $.post('user-info', myUser, null, "json");
        });
    }

    exports.onclickTag = function(sender) {
        var tagIndex = $(sender).attr('tag-index');

        getMyUser(userId, function(myUser) {
            var myUserTags = JSON.parse(myUser['tags']);

            if ($(sender).hasClass('faded')) { // tag
                $(sender).removeClass('faded');

                if (myUserTags[tagIndex]['tracks'] === undefined) {
                    myUserTags[tagIndex]['tracks'] = [];
                }

                myUserTags[tagIndex]['tracks'].push(passedData['track_id']);
            } else { // untag
                $(sender).addClass('faded');
                var taggedTracks = myUserTags[tagIndex]['tracks'];
                taggedTracks.splice(taggedTracks.indexOf(passedData['track_id']), 1);

            }

            myUser['tags'] = JSON.stringify(myUserTags);
            $.post('user-info', myUser, null, "json");
        });

    }

})(window);
