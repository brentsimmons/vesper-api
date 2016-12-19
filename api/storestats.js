var vesperstats = require('../shared/vesperstats.js');

exports.post = function(request, response) {

  vesperstats.fetchCounts(request, function(err, statsTable) {
  
    statsTable.dateFetched = new Date();

    var databaseTable = request.service.tables.getTable('stats');

    databaseTable.insert(statsTable, {
      success: function(results) {;
      },
      error: function(err) {
        console.error(err);
      }
    });

    response.send(204);
  });
};