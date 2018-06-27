// These functions are based off of the way it is believed that Pinterest does their time ago approximations, which would be:
// The given time is always rounded down to the floor, so:
// 2 minutes old persists until the pin has been up for 3 minutes
// 5 hours old persists until the pin has been up for 6 hours
// etc.
// This is opposed to rounding (i.e. 1 minute would persist when the pin is between 30 and 90 seconds old)

function getEarliestTimeAgoInMs(value, unit) {
    var MINUTE_IN_SECONDS = 60;
    var HOUR_IN_SECONDS = 60 * MINUTE_IN_SECONDS;
    var DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS;
    var WEEK_IN_SECONDS = 7 * DAY_IN_SECONDS;
    var YEAR_IN_SECONDS = 365 * DAY_IN_SECONDS;
    var seconds;

    switch (unit) {
        case 'minute':
            seconds = value * MINUTE_IN_SECONDS;
            return (seconds + MINUTE_IN_SECONDS) * 1000 - 1;
        case 'hour':
            seconds = value * HOUR_IN_SECONDS;
            return (seconds + HOUR_IN_SECONDS) * 1000 - 1;
        case 'day':
            seconds = value * DAY_IN_SECONDS;
            return (seconds + DAY_IN_SECONDS) * 1000 - 1;
        case 'week':
            seconds = value * WEEK_IN_SECONDS;
            return (seconds + WEEK_IN_SECONDS) * 1000 - 1;
        // pinterest does not seem to use months
        case 'year':
            seconds = value * YEAR_IN_SECONDS;
            return (seconds + YEAR_IN_SECONDS) * 1000 - 1;
    }
}

function getEarliestPossibleDateFromTimeAgoText(timeAgoText, dateToStartFrom) {
    var splitText = timeAgoText.split(' ');
    var earliestTimeAgoInMs;
    if (typeof splitText[0] === 'string' && splitText[0].toLowerCase() === 'just') { // Just Now
      earliestTimeAgoInMs = 60 * 1000 - 1;
    } else {
        var value = Number(splitText[0]);

        if (typeof splitText[1] !== 'string') {
            return new Error('timeAgoText not in the expected format: ', timeAgoText);
        }
        
        var unit = splitText[1].toLowerCase();

        if (unit[unit.length - 1] === 's') { // make sure units are always singular
          unit = unit.slice(0, unit.length - 1);
        }

        earliestTimeAgoInMs = getEarliestTimeAgoInMs(value, unit);
    }

    dateToStartFrom = dateToStartFrom ? dateToStartFrom : new Date();
    var earliestTimeAgoDate = new Date(dateToStartFrom - earliestTimeAgoInMs);

    return earliestTimeAgoDate;
}

exports.getEarliestTimeAgoInMs = getEarliestTimeAgoInMs;
exports.getEarliestPossibleDateFromTimeAgoText = getEarliestPossibleDateFromTimeAgoText;