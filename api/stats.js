var q = require('../shared/q.js');
var vesperstats = require('../shared/vesperstats.js');

var lastStatsFetchDate = null;
var cachedStatsTable = {};


exports.get = function(request, response) {

  var shouldFetchStats = false;

  var cutoffDate = q.dateWithNumberOfMinutesInThePast(new Date(), 60);
  if (cutoffDate > lastStatsFetchDate || !cachedStatsTable.numberOfAccounts) {
    shouldFetchStats = true;
  }

  if (!shouldFetchStats) {
    response.send(200, cachedStatsTable);
    return;
  }

  vesperstats.fetchCounts(request, function(err, statsTable) {

    if (err) {
      console.error(err);
      response.send(500);
      return;
    }

    lastStatsFetchDate = new Date();
    statsTable.updateDate = lastStatsFetchDate;

    response.send(200, statsTable);

    cachedStatsTable = statsTable;
  });
};