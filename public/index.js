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
    var client_id = 'd52298c1e2184d52b47a1c9ecd660c4f'; // Fill in with your value from Spotify
    var redirect_uri = window.location.href + "index.html";
    var g_access_token = '';

    var userId;
    var colours;

    function getTagCell(tag, index) {
        var cell = $($('#tagCellTemplate').html());
        cell.attr("cell-index", index);

        // set colour
        var colourId = parseInt(tag['colourId'])
        cell.attr('colour-id', colourId);
        cell.addClass(getColourClassName(colours, colourId));

        // set title
        var cellTitle = cell.find('.tagCellTitle');
        cellTitle.text(tag['name']);

        // set subtitle
        var myTracks = tag['tracks'];
        if (myTracks !== undefined) {
            var cellSubTitle = cell.find('.tagCellSubtitle');

            var cellSubTitleStr = myTracks.length === 1 ? myTracks.length + " Song" : myTracks.length + " Songs";
            cellSubTitle.text(cellSubTitleStr);

            /*            cellSubTitle.html("&nbsp"); // add place holder

                        var subTitleText = "";
                        var j = 0;
                        for (var i = 0; i < myTracks.length; i++) {
                            getTrack(g_access_token, myTracks[i], function(track) {
                                j++;
                                if (j === myTracks.length) { // last element
                                    subTitleText += track['name'];
                                    cellSubTitle.text(subTitleText);
                                } else {
                                    subTitleText += track['name'] + ", ";
                                }
                            });
                        }*/
        }

        return cell;
    }

    function randomColour() {
        return colours[Math.floor(Math.random() * colours.length)];
    }

    /*
     * Redirect to Spotify to login.  Spotify will show a login page, if
     * the user hasn't already authorized this app (identified by client_id).
     * 
     */
    var doLogin = function(callback) {
        var url = 'https://accounts.spotify.com/authorize?client_id=' + client_id +
            '&response_type=token' +
            '&scope=playlist-read-private' +
            '&redirect_uri=' + encodeURIComponent(redirect_uri);

        // console.log("doLogin url = " + url);
        window.location = url;
    }

    /*
     * What to do once the user is logged in.
     */
    function loggedIn() {


        // Post data to a server-side database.  See 
        // https://github.com/typicode/json-server
        // var now = new Date();
        // $.post("http://localhost:3000/demo", {"msg": "accessed at " + now.toISOString()}, null, "json");


        $.ajax('https://api.spotify.com/v1/me', {
            dataType: 'json',
            headers: {
                'Authorization': 'Bearer ' + g_access_token
            },
            success: function(r) {
                var userId = r['id'];

                $.getJSON('user-info', function(d) {
                    var myUser = findInArray(d, 'userId', userId);
                    if (myUser === undefined) {
                        myUser = { 'userId': userId };
                    }

                    getPlaylists(g_access_token, userId, function(items) {
                        var playlistIds = [];
                        items.forEach(function(item) {
                            console.log(item);
                            playlistIds.push(item['id']);
                            $('#playlists-view-playlists-container').append(getPlaylistCell(item));
                        });
                        myUser['playlists'] = JSON.stringify(playlistIds);
                        $.post('user-info', myUser, null, "json");
                    });

                });
            }
        });
    }

    /*
     * Export startApp to the window so it can be called from the HTML's
     * onLoad event.
     */
    exports.startApp = function() {
        // console.log('start app.');

        // console.log('location = ' + location);

        // Parse the URL to get access token, if there is one.
        var hash = location.hash.replace(/#/g, '');
        var all = hash.split('&');
        var args = {};
        all.forEach(function(keyvalue) {
            var idx = keyvalue.indexOf('=');
            var key = keyvalue.substring(0, idx);
            var val = keyvalue.substring(idx + 1);
            args[key] = val;
        });
        // console.log('args', args);

        if (typeof(args['access_token']) == 'undefined') {
            $('#start').click(function() {
                doLogin(function() {});
            });
            $('#login').show();
            $('#loggedin').hide();
        } else {
            g_access_token = args['access_token'];
            onloadWindow();
        }
    }

    exports.onloadWindow = function() {
        myNgInclude(function() {
            // title bar
            $('#title-bar-label').text("Tags");

            //bottom bar
            $('#bottom-bar-cell-tags').addClass('is-selected');
            $('#bottom-bar-cell-ratings').attr('href', 'ratingsView.html?access_token=' + g_access_token);
            $('#bottom-bar-cell-search').attr('href', 'searchView.html?access_token=' + g_access_token);
            $('#bottom-bar-cell-playlists').attr('href', "playlistsView.html?access_token=" + g_access_token);
        });

        $('#login').hide();
        $('#loggedin').show();

        getUser(g_access_token, function(user) {
            userId = user['id'];
            
            /* refresh track db */
            refreshMyTracks(g_access_token, userId, null);

            /* list tags */
            getMyUserTags(userId, function(myUserTags) {
                var tagsModel = new TagsModel(myUserTags);
                var tagsView = new TagsView(tagsModel, $('#tagsPageContent'));
            });
        });

        getMyColours(function(myColours) {
            colours = myColours;
            colours.forEach(function(item) {
                var cell = $($('#tagCellTemplate').html());
                cell.addClass(item['name']);
            });
        });
    }

    var TagsModel = function(myUserTags) {
        this.getMyUserTags = function() {
            return myUserTags;
        }
    }

    var TagsView = function(model, container) {
        var myUserTags = model.getMyUserTags();
        for (var i = 0; i < myUserTags.length; i++) {
            container.append(getTagCell(myUserTags[i], i));
        }
    }

    exports.onclickNewTag = function() {
        var cell = $($('#tagCellTemplate').html());
        var cellColour = randomColour()
        cell.addClass(cellColour['name']);
        cell.attr("colour-id", cellColour['id']);

        var title = cell.find('.tagCellTitle')
        title.css("display", "none");
        cell.find('.tagCellSubtitle').css('display', 'none');

        var titleInput = cell.find('.tagCellTitleEntry');
        titleInput.val(title.text());
        titleInput.css('display', '');

        $('#newTag').after(cell);

        titleInput.select(); // desktop
        titleInput.get(0).setSelectionRange(0, titleInput.val().length); // mobile
    };

    exports.onblurTitleInput = function(sender) {
        $(sender).css('display', 'none');

        var title = $(sender).prev('.tagCellTitle');
        title.text($(sender).val());
        title.css('display', '');

        var cell = $(sender).closest('.tagCell');
        var cellColourId = cell.attr("colour-id");

        getMyUser(userId, function(myUser) {
            var myUserTags = myUser['tags'];
            if (myUserTags === undefined) {
                myUserTags = [];
            } else {
                myUserTags = JSON.parse(myUserTags);
            }
            cell.attr('cell-index', myUserTags.length);
            myUserTags.push({ "name": title.text(), "colourId": cellColourId });

            myUser['tags'] = JSON.stringify(myUserTags);
            $.post('user-info', myUser, null, "json");
        });
    };

    exports.onclickColourIcon = function(sender) {
        var cell = $(sender).closest('.tagCell');

        var curColourId = parseInt(cell.attr('colour-id'));
        var curColourClass = getColourClassName(colours, curColourId);
        var nextColourId = getNextColourId(colours, curColourId)
        var nextColourClass = getColourClassName(colours, nextColourId);

        cell.removeClass(curColourClass);
        cell.addClass(nextColourClass);
        cell.attr("colour-id", nextColourId);

        getMyUser(userId, function(myUser) {
            var myUserTags = JSON.parse(myUser['tags']);

            var title = $(sender).next('.tagCellTextContainer').find('.tagCellTitle');
            var cellIndex = findIndexInArray(myUserTags, 'name', title.text());

            myUserTags[cellIndex]['colourId'] = nextColourId;

            myUser['tags'] = JSON.stringify(myUserTags);
            $.post('user-info', myUser, null, "json");
        });
    }

    exports.onclickTagCell = function(ev) {
        ev.stopPropagation();
        var sender = $(ev.target);
        if (!sender.hasClass('tagCellColourIcon')) { // if colour icon is not being clicked
            var senderCell = sender.closest('.tagCell');
            var cellIndex = parseInt(senderCell.attr('cell-index'));
            window.location = window.location.origin + "/tagView.html?access_token=" + g_access_token + "&tag_index=" + cellIndex;
        }
    }

})(window);
