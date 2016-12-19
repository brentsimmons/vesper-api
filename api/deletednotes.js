var q = require('../shared/q.js');
var vesperuser = require('../shared/vesperuser.js');
var vespersync = require('../shared/vespersync.js');
var vespersql = require('../shared/vespersql.js');
var vespernotes = require('../shared/vespernotes.js');

exports.deletedNotesForJSONDeletedNotes = deletedNotesForJSONDeletedNotes; /*Testing only.*/
exports.insertDeletedNotesBuildFunction = insertDeletedNotesBuildFunction; /*Testing only.*/

// POST

exports.post = function(request, response) {

  try {
    var userID = vesperuser.authenticatedShortUserIDWithRequestUser(request.user);
    if (!userID) {
      // Should never get here -- Mobile Services takes care of permissions.
      response.send(401);
      return;
    }

    vespersync.addSyncTokenToResponse(response);
    var syncDate = vespersync.syncDateFromRequest(request);
  }
  catch (err) {
    console.error(err);
    response.send(400);
    return;
  }

  existingDeletedNoteIDsSinceDate(request, userID, syncDate, function(err, existingDeletedNoteIDs) {

    if (err) {
      console.error(err);
      response.send(500);
      return;
    }

    var incomingNoteIDs = request.body;
    if (q.isEmpty(incomingNoteIDs)) {
      response.send(200, existingDeletedNoteIDs);
      return;
    }

    vespernotes.deleteNotesWithNoteIDs(request, incomingNoteIDs, userID);
    
    try {
      //Don't save duplicates.
      var noteIDsToStore = [];
      incomingNoteIDs.forEach(function(oneNoteID) {
        if (existingDeletedNoteIDs.indexOf(oneNoteID) < 0) {
          noteIDsToStore.push(oneNoteID);
        }
      });
    }
    catch (err) {
      console.error(err);
      response.send(500);
      return;
    }

    insertNoteIDs(request, userID, noteIDsToStore, function(err) {

      if (err) {
        console.error(err);
        response.send(500);
        return;
      }

      response.send(200, existingDeletedNoteIDs);
      return;
    });
  });
};


// Fetching deleted objects

function existingDeletedNoteIDsSinceDate(request, userID, syncDate, callback) {

  var sql = 'select noteID from deletednotes where (userID = ?) and (serverModificationDate > ?);'
  request.service.mssql.query(sql, [userID, syncDate.toISOString()], {

    success: function(results) {

      var noteIDs = [];
      results.forEach(function(oneID) {
        var oneNoteID = oneID.noteID;
        if (oneNoteID) {
          noteIDs.push(oneNoteID);
        }
      });

      callback(null, noteIDs);
    },
    error: function(err) {
      callback(err, null);
    }
  });
}


// Utilities

function deletedNotesForJSONDeletedNotes(noteIDs, userID) {

  // So they can be inserted:
  // convert noteIDs to objects with noteID, userID, serverModificationDate.

  var now = new Date();
  var deletedNotes = noteIDs.map(function(oneNoteID) {

    var item = {};
    item.noteID = oneNoteID;
    item.userID = userID;
    item.serverModificationDate = now;

    return item;
  });

  return deletedNotes;
}

function insertDeletedNotesBuildFunction(request, oneDeletedNote) {

  var sql = 'INSERT into deletednotes (noteID, userID, serverModificationDate) values (?, ?, ?);';
  var parameters = [oneDeletedNote.noteID, oneDeletedNote.userID, oneDeletedNote.serverModificationDate];

  return {
    sql: sql,
    parameters: parameters
  };
}

function insertNoteIDs(request, userID, noteIDs, callback) {

  if (q.isEmpty(noteIDs)) {
    callback();
    return;
  }

  var deletedNotes = deletedNotesForJSONDeletedNotes(noteIDs, userID);

  var BATCH_SIZE = 10;
  var NUMBER_OF_TRIES = 1;

  vespersql.runBatch(request, deletedNotes, insertDeletedNotesBuildFunction, BATCH_SIZE, NUMBER_OF_TRIES, callback);
}