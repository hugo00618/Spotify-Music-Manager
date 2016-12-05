"use strict";

(function(exports) {
    var passedData = {};
    var userId;
    var colours;

    exports.onloadWindow = function() {
        passedData = getDecodedPassedData();

        myNgInclude(function() {
            // title bar
            $('#title-bar-label').text("Edit Tag");

            $('#title-bar-left-button').css('display', 'block');
            $('#title-bar-left-button-label').text("Cancel");

            $('#title-bar-right-button').css('display', 'block');
            $('#title-bar-right-button').addClass('bold');
            $('#title-bar-right-button-label').text("Done");

            //bottom bar
            $('#bottom-bar-cell-tags').addClass('is-selected');
            $('#bottom-bar-cell-tags').attr('href', "index.html#access_token=" + passedData['access_token']);
            $('#bottom-bar-cell-ratings').attr('href', 'ratingsView.html?access_token=' + passedData['access_token']);
            $('#bottom-bar-cell-search').attr('href', 'searchView.html?access_token=' + passedData['access_token']);
            $('#bottom-bar-cell-playlists').attr('href', "playlistsView.html?access_token=" + passedData['access_token']);

        });

        getMyColours(function(myColours) {
            colours = myColours;
        });

        getUser(passedData['access_token'], function(user) {
            userId = user['id'];
            getMyUser(userId, function(myUser) {
                var myUserTags = JSON.parse(myUser['tags']);
                var myTag = myUserTags[passedData['tag_index']];

                var tagView = $('#tag-view-tag');
                tagView.attr('colour-id', myTag['colourId']);
                tagView.addClass(getColourClassName(colours, myTag['colourId']));
                tagView.text(myTag['name']);

                var myTaggedTracks = [];
                if (myTag['tracks'] !== undefined) {
                    myTaggedTracks = myTag['tracks'];
                }

                var myUserTracks = JSON.parse(myUser['tracks']);
                // sort tracks by name
                myUserTracks.sort(function(a, b) {
                    return a['name'].localeCompare(b['name']);
                });

                for (var i = 0; i < myUserTracks.length; i++) {
                    var curTrackId = myUserTracks[i]['id'];

                    getTrack(passedData['access_token'], curTrackId, function(track) {
                        var myCell = $($('#tag-view-playlist-cell-template').html());
                        var myContainer;

                        if (myTaggedTracks.indexOf(track['id']) !== -1) { // assigned
                            myContainer = $('#tag-view-assigned-playlists-container');
                        } else { // unassigned
                            myContainer = $('#tag-view-unassigned-playlists-container');
                        }

                        myCell.attr('track-id', track['id']);
                        console.log(track);

                        var myCellThumbnail = myCell.find('#tag-view-playlist-cell-thumbnail');
                        var thumbnailUrl = track['album']['images'][0] ? track['album']['images'][0]['url'] : DEFAULT_THUMBNAIL_URL;
                        myCellThumbnail.attr('src', thumbnailUrl);

                        var myCellTitle = myCell.find('.tagViewPlaylistCellTitle');
                        myCellTitle.text(track['name']);

                        var myCellSubtitle = myCell.find('.tagViewPlaylistCellSubtitle');
                        myCellSubtitle.text(getAtristString(track['artists']));

                        myContainer.append(myCell);
                    });
                }
            });
        });

        $(window).click(function(event) {
            if (!$(event.target).hasClass('deleteTagCell')) {
                $('.deleteTagCell').removeClass('confirmed');
            }
        })
    };

    exports.onclickTitleBarLeftButton = function() {
        window.location = window.location.origin + '/index.html#access_token=' + passedData['access_token'];
    }

    exports.onclickTitleBarRightButton = function() {
        getMyUser(userId, function(myUser) {
            var myUserTags = JSON.parse(myUser['tags']);
            var myTaggedTracks = [];

            $('#tag-view-assigned-playlists-container').find('.tagViewPlaylistCell').each(function() {
                myTaggedTracks.push($(this).attr('track-id'));
            })

            myUserTags[passedData['tag_index']]['tracks'] = myTaggedTracks;
            myUserTags[passedData['tag_index']]['colourId'] = $('#tag-view-tag').attr('colour-id');
            myUser['tags'] = JSON.stringify(myUserTags);

            $.ajax({
                type: "POST",
                url: 'user-info',
                data: myUser,
                success: function() {
                    window.location = window.location.origin + '/index.html#access_token=' + passedData['access_token'];
                },
                dataType: "json"
            });
        });
    }

    exports.onclickTagBubble = function() {
        var cell = $('#tag-view-tag');

        var curColourId = parseInt(cell.attr('colour-id'));
        var curColourClass = getColourClassName(colours, curColourId);
        var nextColourId = getNextColourId(colours, curColourId)
        var nextColourClass = getColourClassName(colours, nextColourId);

        cell.removeClass(curColourClass);
        cell.addClass(nextColourClass);
        cell.attr("colour-id", nextColourId);

        /* getMyUser(userId, function(myUser) {
            var myUserTags = JSON.parse(myUser['tags']);

            var title = $(sender).next('.tagCellTextContainer').find('.tagCellTitle');
            var cellIndex = findIndexInArray(myUserTags, 'name', title.text());

            myUserTags[cellIndex]['colourId'] = nextColourId;

            myUser['tags'] = JSON.stringify(myUserTags);
            $.post('user-info', myUser, null, "json");
        }); */
    }

    exports.onclickPlaylistCellAction = function(sender) {
        var senderCell = $(sender).closest('.tagViewPlaylistCell');
        var fromContainer = senderCell.parent();
        var toContainer;
        if (fromContainer.attr('id') === "tag-view-assigned-playlists-container") {
            toContainer = $('#tag-view-unassigned-playlists-container');
        } else {
            toContainer = $('#tag-view-assigned-playlists-container');
        }
        senderCell.remove();
        toContainer.append(senderCell);
    }

    exports.onclickPlaylistCell = function(ev) {
        ev.stopPropagation();
        var sender = $(ev.target);
        if (!sender.hasClass('tagViewPlaylistCellActionButton')) { // if action button is not being clicked
            var senderCell = sender.closest('.tagViewPlaylistCell');
            window.location = window.location.origin + '/trackView.html?access_token=' + passedData['access_token'] +
                '&track_id=' + senderCell.attr('track-id');
        }
    }

    exports.onclickDeleteTag = function() {
        // if ($('.deleteTagCell').hasClass('confirmed')) {
            getMyUser(userId, function(myUser) {
                var myUserTags = JSON.parse(myUser['tags']);

                myUserTags.splice(parseInt(passedData['tag_index']), 1);
                myUser['tags'] = JSON.stringify(myUserTags);

                $.ajax({
                    type: "POST",
                    url: 'user-info',
                    data: myUser,
                    success: function() {
                        window.location = window.location.origin + '/index.html#access_token=' + passedData['access_token'];
                    },
                    dataType: "json"
                });
            });
        // } else {
            // $('.deleteTagCell').addClass('confirmed');
        // }
    }

})(window);
