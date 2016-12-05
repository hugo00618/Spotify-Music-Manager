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
    var userId, colours, myUserTracks, myUserTags;
    var model;

    var SearchModel = function() {
        this._showFilterPane = false;

        this._tagFilterOn = false;
        this._includedTagIndices = [];

        this._ratingFilterOn = false;
        this._ratingStar = 5;

        this.refreshView = function() {
            this.notify();
        }

        this.switchFilterPaneVisibility = function() {
            this._showFilterPane = !this._showFilterPane;
            this.notify();
        }

        this.toggleFilterVisibility = function(filterId) {
            switch (filterId) {
                case "searchFilterSectionTag":
                    this._tagFilterOn = !this._tagFilterOn;
                    break;
                case "searchFilterSectionRating":
                    this._ratingFilterOn = !this._ratingFilterOn;
                    break;
                default:
                    break;
            }

            this.notify();
        }

        this.toggleFilterOutTagAtIndex = function(index) {
            var includedIndex = this._includedTagIndices.indexOf(index);

            if (includedIndex === -1) { // not in included list, add it in
                this._includedTagIndices.push(index);
            } else { // already in included list, remove it
                this._includedTagIndices.splice(includedIndex, 1);
            }

            this.notify();
        }

        this.isTagIndexIncluded = function(index) {
            return this._includedTagIndices.indexOf(index) !== -1;
        }

        this.setRating = function(rating) {
            this._ratingStar = rating;
            this.notify();
        }

        this.getFocusSearchInput = function() {
            return this._focusSearchInput;
        }

        this.getShowFilterPane = function() {
            return this._showFilterPane;
        }

        this.getFilterOn = function() {
            return this._tagFilterOn || this._ratingFilterOn;
        }

        this.getTagFilterOn = function() {
            return this._tagFilterOn;
        }

        this.getRatingFilterOn = function() {
            return this._ratingFilterOn;
        }

        this.getRatingStar = function() {
            return this._ratingStar;
        }

        this.getSearchResult = function(_callback) {
            var myFilteredUserTrackIds = [];

            if (this._tagFilterOn) {
                for (var i = 0; i < this._includedTagIndices.length; i++) {
                    var myIncludedTag = myUserTags[this._includedTagIndices[i]];
                    var myIncludedTracks = myIncludedTag['tracks'];

                    if (myIncludedTracks !== undefined) {
                        myFilteredUserTrackIds = myFilteredUserTrackIds.concat(myIncludedTracks);
                    }
                }

                // remove duplicates (tracks have multiple selected tags)
                myFilteredUserTrackIds = myFilteredUserTrackIds.filter(function(item, pos) {
                    return myFilteredUserTrackIds.indexOf(item) === pos;
                });
            } else {
                for (var i = 0; i < myUserTracks.length; i++) {
                    myFilteredUserTrackIds.push(myUserTracks[i]['id']);
                }
            }

            if (this._ratingFilterOn) {
                var that = this;
                myFilteredUserTrackIds = myFilteredUserTrackIds.filter(function(item) {
                    var myUserTrack = findInArray(myUserTracks, 'id', item);

                    if (myUserTrack['rating'] === undefined || myUserTrack['rating'] < that._ratingStar) {
                        return false;
                    } else {
                        return true;
                    }
                });
            }

            var searchStr = $('.searchInput').val();
            if (searchStr !== "") {
                var myKeywordFilteredUserTrackIds = [];
                var j = 0;
                for (var i = 0; i < myFilteredUserTrackIds.length; i++) {
                    getTrack(passedData['access_token'], myFilteredUserTrackIds[i], function(myTrack) {
                        j++;
                        if (isTrackRelevant(myTrack, searchStr)) {
                            myKeywordFilteredUserTrackIds.push(myTrack['id']);
                        }

                        if (j === myFilteredUserTrackIds.length) {
                            _callback(myKeywordFilteredUserTrackIds);
                        }
                    });
                }
            } else {
                _callback(myFilteredUserTrackIds);
            }

        }
    }

    _.assignIn(SearchModel.prototype, {
        // Add an observer to the list
        addObserver: function(observer) {
            if (_.isUndefined(this._observers)) {
                this._observers = [];
            }
            this._observers.push(observer);
            observer(this, null);
        },

        // Notify all the observers on the list
        notify: function(args) {
            if (_.isUndefined(this._observers)) {
                this._observers = [];
            }
            _.forEach(this._observers, function(obs) {
                obs(this, args);
            });
        }
    });

    var SearchBarView = function(model) {
        var _searchResult = [];

        this.updateView = function(obs, args) {
            if (model.getShowFilterPane()) {
                $('.searchBarContainer').addClass('show-filter-pane');
                $('#search-view-content').css('top', '256px');
            } else {
                $('.searchBarContainer').removeClass('show-filter-pane');
                $('#search-view-content').css('top', '60px');

            }

            if (model.getFilterOn()) {
                $('.searchFilterIcon').addClass('filter-on');
            } else {
                $('.searchFilterIcon').removeClass('filter-on');
            }

            if (model.getTagFilterOn()) {
                $('#searchFilterSectionTag').find('.mySwitchery').addClass('is-on');
                $('#searchFilterSectionTag').find('.selectingCell').addClass('is-expanded');

                $('.tagSelectingCell *').remove();
                for (var i = 0; i < myUserTags.length; i++) {
                    var tagged = model.isTagIndexIncluded(i);
                    var tagCell = getTagCell(myUserTags[i], tagged);
                    tagCell.attr('tag-index', i);
                    $('.tagSelectingCell').append(tagCell);
                }
            } else {
                $('#searchFilterSectionTag').find('.mySwitchery').removeClass('is-on');
                $('#searchFilterSectionTag').find('.selectingCell').removeClass('is-expanded');
            }

            if (model.getRatingFilterOn()) {
                $('#searchFilterSectionRating').find('.mySwitchery').addClass('is-on');
                $('#searchFilterSectionRating').find('.selectingCell').addClass('is-expanded');

                var rating = model.getRatingStar();
                var ratingStars = $('.ratingCell .ratingStar');
                var i;
                for (i = 0; i < rating; i++) {
                    $(ratingStars[i]).addClass('is-selected');
                }
                for (; i < 5; i++) {
                    $(ratingStars[i]).removeClass('is-selected');
                }
            } else {
                $('#searchFilterSectionRating').find('.mySwitchery').removeClass('is-on');
                $('#searchFilterSectionRating').find('.selectingCell').removeClass('is-expanded');
            }

            model.getSearchResult(function(searchResult) {
                // update search result view only when the result changes
                if (!_.isEqual(_searchResult, searchResult)) {
                    _searchResult = searchResult;
                    $('#search-view-content *').remove();
                    var myTracks = [];
                    var j = 0;
                    for (var i = 0; i < searchResult.length; i++) {
                        getTrack(passedData['access_token'], searchResult[i], function(track) {
                            j++;
                            myTracks.splice(j, 0, track);

                            if (j === searchResult.length) {
                                myTracks.sort(function(a, b) {
                                    return a['name'].localeCompare(b['name']);
                                });
                                for (var k = 0; k < myTracks.length; k++) {
                                    $('#search-view-content').append(getTrackCell(myTracks[k]));
                                }
                            }
                        });
                    }
                }
            });
        }

        model.addObserver(this.updateView);
    }

    function isTrackRelevant(track, searchStr) {
        searchStr = searchStr.toLowerCase();

        // track name
        var trackName = track['name'].toLowerCase();
        if (trackName.indexOf(searchStr) !== -1) {
            return true;
        }

        // artists name
        var trackArtists = getAtristString(track['artists']).toLowerCase();
        if (trackArtists.indexOf(searchStr) !== -1) {
            return true;
        }

        // album name
        var albumName = track['album']['name'].toLowerCase();
        if (albumName.indexOf(searchStr) !== -1) {
            return true;
        }

        // tag name
        for (var i = 0; i < myUserTags.length; i++) {

            var tagName = myUserTags[i]['name'].toLowerCase();

            // if searchStr is a tag name and track has this tag
            if (tagName.indexOf(searchStr) !== -1 && myUserTags[i]['tracks'].indexOf(track['id']) !== -1) {
                return true;
            }
        }

        return false;
    }

    function getTagCell(tag, tagged) {
        var cell = $($('#tagBubbleCellTemplate').html());

        cell.text(tag['name']);

        cell.addClass(getColourClassName(colours, tag['colourId']));
        if (!tagged) {
            cell.addClass('faded');
        }

        return cell;
    }

    function getTrackCell(track) {
        var cell = $($('#trackCellTemplate').html());
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
            // title bar
            $('#title-bar-label').hide();

            //bottom bar
            $('#bottom-bar-cell-tags').attr('href', "index.html#access_token=" + passedData['access_token']);
            $('#bottom-bar-cell-ratings').attr('href', "ratingsView.html?access_token=" + passedData['access_token']);
            $('#bottom-bar-cell-search').addClass('is-selected');
            $('#bottom-bar-cell-playlists').attr('href', "playlistsView.html?access_token=" + passedData['access_token']);
        });

        getMyColours(function(myColours) {
            colours = myColours;

            getUser(passedData['access_token'], function(user) {
                userId = user['id'];

                /* refresh track db */
                refreshMyTracks(passedData['access_token'], userId, function() {});

                getMyUserTracks(userId, function(userTracks) {
                    myUserTracks = userTracks;

                    getMyUserTags(userId, function(userTags) {
                        myUserTags = userTags;

                        model = new SearchModel();
                        var searchBarView = new SearchBarView(model);
                    });
                });
            });
        });

        $('.searchViewFilterPaneContentContainer').scroll(function(e) {
            var scrolled = e.target.scrollTop !== 0;
        });
    }

    exports.onclickSearchInput = function() {
        $('.searchInput').focus();
        // $('.searchInput').select(); // desktop
        // $('.searchInput').get(0).setSelectionRange(0, $('.searchInput').val().length); // mobile
        $('.searchHintContainer').hide();
    }

    exports.onchangeSearchInput = function() {
        model.refreshView();
    }

    exports.onblurSearchInput = function() {
        if ($('.searchInput').val() === "") {
            $('.searchHintContainer').show();
        }
    }

    exports.onclickFilterButton = function() {
        model.switchFilterPaneVisibility();
    }

    exports.onclickSwitch = function(sender) {
        var filterId = $(sender).closest('.searchFilterSectionContainer').attr('id');
        model.toggleFilterVisibility(filterId);
    }

    exports.setRating = function(rating) {
        model.setRating(rating);
    }

    exports.onclickTag = function(sender) {
        model.toggleFilterOutTagAtIndex(parseInt($(sender).attr('tag-index')));
    }

    exports.onclickTrackCell = function(sender) {
        var senderCell = $(sender).closest('.trackCell');

        window.location = window.location.origin + '/trackView.html?access_token=' + passedData['access_token'] +
            "&track_id=" + senderCell.attr('track-id');
    }


})(window);
