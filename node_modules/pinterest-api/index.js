'use strict';

var fs = require('fs'),
    request = require('request'),
    async = require('async'),
    cheerio = require('cheerio'),
    reverseTimeAgo = require('./lib/reverseTimeAgo'),
    parseString = require('xml2js').parseString;

fs.exists(__dirname + '/cache', function (exists) {
    if (!exists) {
        fs.mkdir(__dirname + '/cache');
    }
});

function mergeMaps(maps) {
    var result = {};
    for (var i = 0; i < maps.length; i++) {
        var keys = Object.keys(maps[i]);
        for(var j = 0; j < keys.length; j++) {
            result[keys[j]] = maps[i][keys[j]];
        }
    }
    return result;
}

// private members
var CACHE_PREFIX = 'cache/pinterest_',
    itemsPerPage = null, // all results on 1 page by default
    obtainDates = true,
    currentPage = 1;

/* 
 * Get the item from the cache if exists
 *
 * @param string key
 * @param Function callback
 * @invoke callback(mixed response)
 */

function getCache(key, doesDateMatter, callback) {
    key = key.replace(/\//g, '-');
    var cacheFile = __dirname + '/' + CACHE_PREFIX + key + '.cache';
    fs.exists(cacheFile, function (exists) {
        if (exists) {
            fs.stat(cacheFile, function (err, stats) {
                if (err) {
                    throw err;
                }
                if (!doesDateMatter || (stats.mtime.valueOf() > (new Date().valueOf() - 60 * 60 * 1000))) {
                    // The cache is less than 60 minutes old so return the contents
                    fs.readFile(cacheFile, function (err, data) {
                        if (err) {
                            console.error('Error reading the cache file at ' + cacheFile);
                            throw err;
                        }
                        var dataString = data.toString();
                        var dataObj;
                        try {
                            dataObj = JSON.parse(dataString);
                        } catch(e) {
                            dataObj = null;
                        }

                        callback(dataObj, stats.mtime);
                        return;
                    });
                } else {
                    // The cache is older than 60 minutes
                    callback(null);
                    return;
                }
            });
        } else {
            // The cache doesn't exist
            callback(null);
            return;
        }
    });
}

/* 
 * Put an item in the cache
 *
 * @param string key
 * @param JSON contents
 * @param Function callback (optional)
 * @invoke callback()
 */

function putCache(key, contents, callback) {
    key = key.replace(/\//g, '-');
    var cacheFile = __dirname + '/' + CACHE_PREFIX + key + '.cache';

    fs.writeFile(cacheFile, contents, function (err) {
        if (err) {
            console.error('Error adding response to cache at ' + cacheFile);
            throw err;
        } else if (callback) {
            callback();
            return;
        }
    });
}

/* 
 * Method to make GET request
 *
 * @param string url
 * @param Function callback
 * @invoke callback(Object response)
 */

function get(url, shouldParse, callback) {
    request(url, function (err, response, body) {
        if (err) {
            console.error('Error making GET request to endpoint ' + url);
      callback(shouldParse ? {} : "{}");
        }

        if (response.statusCode !== 200) {
            console.error('non 200 response for URL: ' + url);
            callback(shouldParse ? {} : "{}");
            return;
        }

        var toReturn = shouldParse ? JSON.parse(body) : body;
        callback(toReturn);
        return;
    });
}

/* 
 * Build the response, wraps the data in some extra information like currentpage etc.
 *
 * @param Array data
 * @return Object response
 */

function buildResponse(data) {
    var response = {};
    response.totalItems = data.length;
    response.itemsPerPage = itemsPerPage;
    response.totalPages = itemsPerPage === null ? 1 : Math.ceil(data.length / itemsPerPage);
    response.currentPage = itemsPerPage === null ? 1 : currentPage;
    response.data = itemsPerPage === null ? data : data.slice(itemsPerPage * (currentPage - 1), itemsPerPage);

    return response;
}

/*
 * Get the pin ID out of a pin URL
 *
 * @param String pinUrl
 * @return String pinId
 */

function getPinIdFromUrl(pinUrl) {
    var startIndex = pinUrl.indexOf('pin/') + 4;
    var endIndex = pinUrl.indexOf('/', startIndex);
    endIndex = endIndex === -1 ? pinUrl.length + 1 : endIndex;
    return pinUrl.slice(startIndex, endIndex);
}

/*
 * Create the url for a specific pin
 *
 * @param String pinId
 * @return String pinUrl
 */

function createPinUrl(pinId) {
    return 'http://www.pinterest.com/pin/' + pinId + '/';
}

/*
 * Create a map of pin IDs to publish dates based on the object created using the XML parseString library
 *
 * @param Object xmlObject
 * @return Object pinDateMap
 */

function createPinDateMapFromRssXmlObject(xmlObject) {
    var pinDateMap;

    try {
        pinDateMap = {};
        var pins = xmlObject.rss.channel[0].item;
        for (var i = 0; i < pins.length; i++) {
            var publishDate = new Date(pins[i].pubDate[0]);
            var pinId = getPinIdFromUrl(pins[i].guid[0]);
            pinDateMap[pinId] = publishDate;
        }
    } catch (e) {
        pinDateMap = {};
    }

    return pinDateMap;
}

/*
 * Returns a map of pin IDs to publish dates based on the GET request response to the pinterest board XML URLs
 *
 * @param String response
 * @param Function callback
 * @invokes callback(Object pinDateMap)
 */

function getPinDateMapFromBoardRssGetResponse(response, board, callback) {
    parseString(response, function (err, result) {
        if (err) {
            // Don't throw because pinterest either does not have RSS feeds for boards with special characters
            // or we just haven't been able to figure out how they are handling special characters.
            // Either way, the response will be HTML in predictable cases like this, so we don't want to throw.
            console.error('Error getting RSS feed for board ' + board + '. Unable to retrieve publish dates. This is expected to happen if the board name contains an escaped character');
            callback({});
            return;
        }
        callback(createPinDateMapFromRssXmlObject(result));
        return;
    });
}

/*
 * Get publish dates for each pin on a board based on RSS
 *
 * @param String board
 * @param Function callback
 * @invokes callback(Object pinDateMap)
 */

function getDatesForBoardPinsFromRss(username, board, callback) {
    getCache(board + '_RSS', true, function (cacheData) {
        if (cacheData === null) {
            get('http://www.pinterest.com/' + username + '/' + board.replace(/#/g, '') + '.rss', false, function (response) {
                putCache(board + '_RSS', JSON.stringify(response));
                getPinDateMapFromBoardRssGetResponse(response, board, callback);
            });
        } else {
            getPinDateMapFromBoardRssGetResponse(cacheData, board, callback);
        }
    });
}

function getPinDateFromScriptTag(html, pinId) {
    /*
     The date is present in a JSON object that is passed to a method in a script tag that looks like this:

     <script id="jsInit">
        Pw.loadEverything(Pc.locale, function() {
            P.main.start({"copytune": {"Create a business account": {"copytune:ptnr_copytune_ecommerce": ...
                ...
                "tree": {
                    ...
                    "data": {
                        ...
                        "id": 12345,
                        ...
                        "created_at": "Thu, 26 Mar 2015 17:47:01 +0000"
                        ...
                    }
                ...
                "canDebug": false
            });
        });
    </script>
    */

    try {
        var date = null;
        var $ = cheerio.load(html);
        var scriptText = $('#jsInit').eq(0).text();
        scriptText = scriptText.substring(scriptText.indexOf('P.main.start(') + 13, scriptText.lastIndexOf(';'));
        scriptText = scriptText.substring(0, scriptText.lastIndexOf(';') - 1);
        var scriptObject = JSON.parse(scriptText);

        if(scriptObject.tree.data.created_at && scriptObject.tree.data.id == pinId) {
            date = new Date(scriptObject.tree.data.created_at);
        }

        return date;

    } catch(e) {
        return null;
    }
}

function parseHtmlAndGetEarliestPossibleDate(html, date) {
    var $ = cheerio.load(html);
    var timeAgoText = $('.commentDescriptionTimeAgo').eq(0).text();
    timeAgoText = timeAgoText.replace('&bull;', '').trim();
    var earliestPossibleDate = reverseTimeAgo.getEarliestPossibleDateFromTimeAgoText(timeAgoText, date);
    
    if (earliestPossibleDate instanceof Error) {
        return null;
    }

    return earliestPossibleDate;
}

/*
 * Get publish dates for pins through scraping
 *
 * @param Array pinIds
 * @param Function callback
 * @invokes callback(Object pinDateMap)
 */

function getDatesForPinsFromScraping(pinIds, pinDateMap, callback, recurseCount) {
    pinDateMap = pinDateMap || {};

    if (pinIds.length === 0 || recurseCount > 9) {
        callback(pinDateMap);
        return;
    }

    recurseCount = recurseCount ? recurseCount : 0;
    var pinIdsToRetry = [];

    async.eachLimit(pinIds, 10, function (pinId, asyncCallback) {
        getCache(pinId + '_HTML', false, function (cacheData, dateCached) {

            pinDateMap[pinId] = {};

            if (cacheData === null) {
                var getOptions = {
                'url': createPinUrl(pinId),
                'gzip': true,
                'headers': {
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    // Adding the User-Agent is what fixed the weird no data on es subdomains bug
                    // Probably possible to use something else, but this worked.
                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:33.0) Gecko/20100101 Firefox/33.0',
                    }
                };

                request.get(getOptions, function(err, res, body) {
                    if (err) {
                        console.error('error getting ' + getOptions.url);
                        console.error(err);
                        pinIdsToRetry.push(pinId);
                        asyncCallback();
                        return;
                    }

                    putCache(pinId + '_HTML', JSON.stringify(body));

                    pinDateMap[pinId].date = getPinDateFromScriptTag(body, pinId);
                    pinDateMap[pinId].source = 'rss';
                    // TODO: We now sort of have a third source of dates, but changing the created_at_source values or adding a new one could break existing clients
                    // For now, set it as 'rss' since it still communicates the important info that the date retrieved is known to be accurate
                    // Later, we could maybe change the possible created_at_source values and announce the breaking change in documentation

                    if(!pinDateMap[pinId].date) {
                        pinDateMap[pinId].date = parseHtmlAndGetEarliestPossibleDate(body);
                        pinDateMap[pinId].source = 'html';
                    }

                    if (pinDateMap[pinId].date === null) {
                        pinIdsToRetry.push(pinId);
                    }
                    asyncCallback();
                });

            } else {

                pinDateMap[pinId].date = getPinDateFromScriptTag(cacheData, pinId);
                pinDateMap[pinId].source = 'rss';

                if(!pinDateMap[pinId].date) {
                    pinDateMap[pinId].date = parseHtmlAndGetEarliestPossibleDate(cacheData);
                    pinDateMap[pinId].source = 'html';
                }

                if (pinDateMap[pinId].date === null) {
                    pinIdsToRetry.push(pinId);
                }

                asyncCallback();
            }
        });
    }, function (err) {
        if (err) { throw err; }
        getDatesForPinsFromScraping(pinIdsToRetry, pinDateMap, callback, recurseCount += 1);
    });
}

// public

/*
 * Constructor function
 *
 * @param String username
 */

function constructor(username) {
    /*
     * Set itemsPerPage variable
     *
     * @param Mixed newItemsPerPage
     */

    function setItemsPerPage(newItemsPerPage) {
        itemsPerPage = newItemsPerPage;
    }

    /*
     * Get itemsPerPage variable
     *
     */

    function getItemsPerPage() {
        return itemsPerPage;
    }

    /*
     * Set currentPage variable
     *
     * @param Number newItemsPerPage
     */

    function setCurrentPage(newCurrentPage) {
        currentPage = newCurrentPage;
    }

    /*
     * Get currentPage variable
     *
     */

    function getCurrentPage() {
        return currentPage;
    }

    /*
     * Get all the boards for the user
     *
     * @param boolean paginate
     * @param Function callback
     * @invoke callback(Mixed boards)
     */

    function getBoards(paginate, callback) {
        var boardsResponse;

        // Check for cache existence
        getCache('boards_' + username, true, function (cacheData) {
            if (cacheData === null) {
                // Create get request and put it in the cache
                get('http://pinterestapi.co.uk/' + username + '/boards', true, function (response) {
                    putCache('boards_' + username, JSON.stringify(response));

                    if (paginate) {
                        boardsResponse = buildResponse(response.body ? response.body : []);
                    } else {
                        boardsResponse = response.body ? response.body : [];
                    }
                    callback(boardsResponse);
                    return;
                });
            } else {
                if (paginate) {
                    boardsResponse = buildResponse(cacheData.body ? cacheData.body : []);
                } else {
                    boardsResponse = cacheData.body ? cacheData.body : [];
                }
                callback(boardsResponse);
                return;
            }
        });
    }

    /*
     * Get pins from a single board
     *
     * @param string board
     * @param boolean paginate
     * @param Function callback
     * @invoke callback(Mixed pins)
     */

    function getPinsFromBoard(board, paginate, callback) {
        var pins = [];
        var pinDateMap = {};

        async.parallel([
            function (asyncCallback) {
                getCache(board, true, function (cacheData) {
                    if (cacheData === null) {
                        // Get data and put it in the cache
                        get('https://api.pinterest.com/v3/pidgets/boards/' + username + '/' + board.replace(/#/g, '') + '/pins/', true, function (response) {
                            putCache(board, JSON.stringify(response));
                            pins = response.data ? response.data.pins : [];
                            asyncCallback();
                        });
                    } else {
                        pins = cacheData.data ? cacheData.data.pins : [];
                        asyncCallback();
                    }
                });
            },
            function (asyncCallback) {
                if (!obtainDates) {
                    asyncCallback();
                    return;
                }

                getDatesForBoardPinsFromRss(username, board, function (dates) {
                    pinDateMap = dates;
                    asyncCallback();
                    return;
                });
            }],
            function (err) {
                if (err) { throw err; }
                var pinIdsThatNeedDates = [];
                for (var i = 0; i < pins.length; i++) {
                    pins[i].created_at = null;
                    pins[i].created_at_source = null;
                    if (pinDateMap[pins[i].id]) {
                        pins[i].created_at = pinDateMap[pins[i].id];
                        pins[i].created_at_source = 'rss';
                    } else {
                        pinIdsThatNeedDates.push(pins[i].id);
                    }
                }

                if (obtainDates) {
                    getDatesForPinsFromScraping(pinIdsThatNeedDates, null, function (scrapedPinDateMap) {
                        for (var i = 0; i < pins.length; i++) {
                            if (scrapedPinDateMap[pins[i].id] && scrapedPinDateMap[pins[i].id].date) {
                                pins[i].created_at = scrapedPinDateMap[pins[i].id].date;
                                pins[i].created_at_source = scrapedPinDateMap[pins[i].id].source;
                            }
                        }
                        if (paginate) {
                            pins = buildResponse(pins);
                        }

                        callback(pins);
                        return;
                    });
                } else {
                    if (paginate) {
                        pins = buildResponse(pins);
                    }

                    callback(pins);
                    return;
                }
            }
        );
    }

    /*
     * Get all the user's pins (from all boards we can get)
     *
     * @param Function callback
     * @invoke callback(Object pins)
     */

    function getPins(callback) {
        var allPins = [];
        getBoards(false, function (boards) {
            async.each(boards, function(board, asyncCallback) {
                var splitHref = board.href.split('/');
                if (splitHref[1] === username) { // it's possible to have boards listed from other users
                    var boardHref = board.href.split('/')[2];
                    getPinsFromBoard(boardHref, false, function (pins) {
                        allPins = allPins.concat(pins);
                        asyncCallback();
                    });
                } else {
                    asyncCallback();
                }
            },
            function (err) {
                if (err) {
                    console.error('Error iterating through each board to get pins');
                    throw err;
                }
                callback(buildResponse(allPins));
                return;
            });
        });
    }

    /*
     * Get obtainDates variable
     *
     */

    function getObtainDates() {
        return obtainDates;
    }

    /*
     * Set obtainDates variable
     *
     * @param boolean bool
     */

    function setObtainDates(bool) {
        obtainDates = bool;
    }

    return {
        getPins: getPins,
        getBoards: getBoards,
        getPinsFromBoard: getPinsFromBoard,
        getCurrentPage: getCurrentPage,
        setCurrentPage: setCurrentPage,
        getItemsPerPage: getItemsPerPage,
        setItemsPerPage: setItemsPerPage,
        getObtainDates: getObtainDates,
        setObtainDates: setObtainDates
    };
}

// Static methods

/*
 * Get data on pinIds
 *
 * @param Array pinIds
 * @param Function callback
 * @invoke callback(Object pins)
 */

constructor.getDataForPins = function(pinIds, callback) {
    var allPinsData = [];
    var groupedPinIds = [];
    var boards = [];
    var pinsThatNeedScrapedDates = [];
    var APIMaxPinsAllowedPerRequest = 10;

    for (var i = 0; i < pinIds.length; i += APIMaxPinsAllowedPerRequest) {
        var pinIdGroup = pinIds.slice(i, i + APIMaxPinsAllowedPerRequest);
        groupedPinIds.push(pinIdGroup);
    }

    async.series(
        [
            // get pin data from API
            function(seriesCallback) {
                async.eachLimit(groupedPinIds, 50, function(groupOfPinIds, eachCallback) {
                    var pinIdsString = groupOfPinIds.join(',');
                    getCache(pinIdsString, true, function (cacheData) {
                        if (cacheData === null) {
                            get('http://api.pinterest.com/v3/pidgets/pins/info/?pin_ids=' + pinIdsString, true, function (response) {
                                putCache(pinIdsString, JSON.stringify(response));
                                allPinsData = allPinsData.concat(response.data ? response.data : []);
                                eachCallback();
                                return;
                            });
                        } else {
                            allPinsData = allPinsData.concat(cacheData.data ? cacheData.data : []);
                            eachCallback();
                            return;
                        }
                    });
                }, function (err) {
                    if(err) {
                        throw err;
                    }
                    seriesCallback();
                    return;
                });             
            },
            // create list of boards that the pins belong to
            function(seriesCallback) {
                var userBoardAlreadyAdded = {};

                for(var i = 0; i < allPinsData.length; i++) {
                    var pin = allPinsData[i];
                    if(pin.board) {
                        var boardUrlParts = pin.board.url.split('/');
                        var user = boardUrlParts[1];
                        var board = boardUrlParts[2];

                        if(!userBoardAlreadyAdded[user + board]) {
                            userBoardAlreadyAdded[user + board] = true;
                            boards.push({user: user, board: board});
                        }
                    }
                }

                seriesCallback();
                return;
            },
            // get what dates we can for pins from the board RSS feeds
            function(seriesCallback) {
                if(!obtainDates) {
                    seriesCallback();
                    return;
                }

                var pinDateMaps = [];
                async.eachLimit(boards, 5, function(board, eachCallback) {
                    getDatesForBoardPinsFromRss(board.user, board.board, function(result) {
                        pinDateMaps.push(result);
                        eachCallback();
                    });
                }, function (err) {
                    if(err) {
                        throw err;
                    }

                    var pinDateMap = mergeMaps(pinDateMaps);

                    for (var i = 0; i < allPinsData.length; i++) {
                        allPinsData[i].created_at = null;
                        allPinsData[i].created_at_source = null;
                        if (pinDateMap[allPinsData[i].id]) {
                            allPinsData[i].created_at = pinDateMap[allPinsData[i].id];
                            allPinsData[i].created_at_source = 'rss';
                        } else {
                            pinsThatNeedScrapedDates.push(allPinsData[i].id);
                        }
                    }

                    seriesCallback();
                    return;
                });
            },
            // get remaining dates by scraping
            function(seriesCallback) {
                if(!obtainDates) {
                    seriesCallback();
                    return;
                }

                getDatesForPinsFromScraping(pinsThatNeedScrapedDates, null, function (pinDateMap) {
                    for (var i = 0; i < allPinsData.length; i++) {
                        if (allPinsData[i].created_at == null && pinDateMap[allPinsData[i].id] && pinDateMap[allPinsData[i].id].date) {
                            allPinsData[i].created_at = pinDateMap[allPinsData[i].id].date;
                            allPinsData[i].created_at_source = pinDateMap[allPinsData[i].id].source;
                        }
                    }
                    seriesCallback();
                    return;
                });
            }
        ],
        function(err) {
            if (err) {
                throw err;
            }
            callback(buildResponse(allPinsData));
            return;
        }
    );
};

constructor.getEarliestPossibleDateFromTimeAgoText = reverseTimeAgo.getEarliestPossibleDateFromTimeAgoText;

module.exports = constructor;
