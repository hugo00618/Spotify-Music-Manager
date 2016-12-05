/* ********** Spotify ********** */
function getUser(accessToken, _callback) {
    $.ajax('https://api.spotify.com/v1/me', {
        dataType: 'json',
        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
        success: function(r) {
            _callback(r);
        },
        error: function() {
            window.location.href = window.location.origin;
        }
    });
}

function getPlaylists(accessToken, userId, _callback) {
    $.ajax('https://api.spotify.com/v1/users/' + userId + '/playlists', {
        dataType: 'json',
        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
        success: function(r) {
            _callback(r);
        }
    });
}

function getPlaylist(accessToken, userId, playlistId, _callback) {
    var url = 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId;
    $.ajax(url, {
        dataType: 'json',
        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
        success: function(r) {
            _callback(r);
        }
    });
}

function getTrack(accessToken, id, _callback) {
    $.ajax('https://api.spotify.com/v1/tracks/' + id, {
        dataType: 'json',
        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
        success: function(r) {
            _callback(r);
        }
    });
}

/* ********** Database ********** */
function getMyColours(_callback) {
    $.getJSON('tag-colours', function(d) {
        _callback(d);
    });
}

function getMyUser(userId, _callback) {
    $.getJSON('user-info', function(d) {
        var myUser = findInArray(d, 'userId', userId);

        if (myUser === undefined) {
            myUser = { "userId": userId };
            $.ajax({
                type: "POST",
                url: 'user-info',
                data: myUser,
                success: function(newUser) {
                    _callback(newUser);
                },
                dataType: "json"
            });
        } else {
            _callback(myUser);
        }
    });
}

function getMyUserTags(userId, _callback) {
    getMyUser(userId, function(myUser) {
        var myUserTags = myUser['tags'];
        if (myUserTags === undefined) {
            myUserTags = [];

            myUser['tags'] = JSON.stringify([]);
            $.ajax({
                type: "POST",
                url: 'user-info',
                data: myUser,
                success: _callback(myUserTags),
                dataType: "json"
            });
        } else {
            myUserTags = JSON.parse(myUserTags);
            _callback(myUserTags);
        }
    })
}

function getMyUserTracks(userId, _callback) {
    getMyUser(userId, function(myUser) {
        var myUserTracks = myUser['tracks'];
        if (myUserTracks === undefined) {
            myUserTracks = [];

            myUser['tracks'] = JSON.stringify([]);
            $.ajax({
                type: "POST",
                url: 'user-info',
                data: myUser,
                success: _callback(myUserTracks),
                dataType: "json"
            });
        } else {
            myUserTracks = JSON.parse(myUserTracks);
            _callback(myUserTracks);
        }
    });
}

function storeMyTracks(userId, tracks, _callback) {
    getMyUser(userId, function(myUser) {
        var myUserTracks = myUser['tracks'];
        if (myUserTracks === undefined) {
            myUserTracks = [];
        } else {
            myUserTracks = JSON.parse(myUserTracks);
        }

        for (var i = 0; i < tracks.length; i++) {
            var curTrack = tracks[i]['track'];
            if (findInArray(myUserTracks, 'id', curTrack['id']) === undefined) {
                myUserTracks.push({ 'id': curTrack['id'], 'name': curTrack['name'] });
            }
        }

        myUser['tracks'] = JSON.stringify(myUserTracks);
        $.ajax({
            type: "POST",
            url: 'user-info',
            data: myUser,
            success: _callback,
            dataType: "json"
        });
    });
}

function refreshMyTracks(accessToken, userId, _callback) {
    getPlaylists(accessToken, userId, function(playlists) {
        playlists = playlists['items'];

        var myTracks = [];
        var j = 0;
        for (var i = 0; i < playlists.length; i++) {
            getPlaylist(accessToken, userId, playlists[i]['id'], function(playlist) {
                j++;
                var curTracks = playlist['tracks']['items'];
                myTracks = myTracks.concat(curTracks);
                if (j == playlists.length) {
                    storeMyTracks(userId, myTracks, _callback);
                }
            });
        }
    });
}

function getColourClassName(colours, colourId) {
    return colours[colourId - 1]['name'];
}

/* ********** Other Utils ********** */
function myNgInclude(_callback) {
    var len = $('.myNgInclude').length;
    $('.myNgInclude').each(function(index) {
        if (index === len - 1) { // if last element, call _callback function
            $(this).load($(this).attr("my-ng-include"), _callback);
        } else {
            $(this).load($(this).attr("my-ng-include"));
        }
    });
}

function getDecodedPassedData() {
    var passedData = {};
    var url = document.location.href;
    var params = url.split('?')[1].split('&');
    for (var i = 0; i < params.length; i++) {
        var tmp = params[i].split('=');
        passedData[tmp[0]] = tmp[1];
    }
    return passedData;
}

function getNextColourId(colours, colourId) {
    if (colourId === colours.length) { // last colour, return first colour
        return 1; // id starts from 1
    } else {
        return colourId + 1;
    }
}

function getAtristString(artists) {
    var artistsStr = "";
    for (var i = 0; i < artists.length; i++) {
        artistsStr += artists[i]['name'];
        if (i + 1 !== artists.length) { // not the last element
            artistsStr += ", ";
        }
    }

    return artistsStr;
}

function findInArray(arr, key, keyValue) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i][key] == keyValue) {
            return arr[i];
        }
    }
    return undefined;
}

function findIndexInArray(arr, key, keyValue) {
    var i;
    for (i = 0; i < arr.length; i++) {
        if (arr[i][key] === keyValue) {
            return i;
        }
    }
    return -1;
}
