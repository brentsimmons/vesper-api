var q = require('../shared/q.js');
var vesperuser = require('../shared/vesperuser.js');
var vespersync = require('../shared/vespersync.js');
var vespernotes = require('../shared/vespernotes.js');
var vespersql = require('../shared/vespersql.js');

exports.mergeOneProperty = mergeOneProperty; /*Testing only.*/

// POST

exports.post = function(request, response) {

  try {
    var userID = vesperuser.authenticatedShortUserIDWithRequestUser(request.user);
    if (!userID) {
      /*Should never get here -- Mobile Services takes care of permissions.*/
      response.send(401);
      return;
    }
  }
  catch (err) {
    console.error(err);
    response.send(400);
    return;
  }

  vespersync.addSyncTokenToResponse(response);
  processNotesAndRespond(request, response, userID);
};

// Processing Notes

function processNotesAndRespond(request, response, userID) {

  var incomingNotes = notesForJSONNotes(request, request.body, userID);

  fetchDeletedNoteIDs(request, userID, function(err, deletedNoteIDs) {

    if (err) {
      console.error(err);
      response.send(500);
      return;
    }

   incomingNotes = vespernotes.notesMinusDeletedNotes(incomingNotes, deletedNoteIDs);

    var lastSyncDate = vespersync.syncDateFromRequest(request);

    mergeNotes(request, incomingNotes, userID, function(err) {

     if (err) {
        console.error(err);
        response.send(500);
        return;
      }

      vespernotes.fetchModifiedNotes(request, userID, lastSyncDate, function(err, notesToReturn) {

        if (!err && notesToReturn) {
        notesToReturn = vespernotes.notesToReturnWithFetchResults(request, deletedNoteIDs, notesToReturn);
          notesToReturn = vespernotes.notesMinusDeletedNotes(notesToReturn, deletedNoteIDs);
        }

        q.respond(response, err, notesToReturn);
     });
    });
  });
}

// Deleted Note IDs

function fetchDeletedNoteIDs(request, userID, callback) {

  request.service.mssql.query('select noteID from deletednotes where (userID = ?);', [userID], {

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

// Merging Notes

function mergeNotes(request, incomingNotes, userID, callback) {

  var incomingNoteIDs = vespersql.propertiesForObjects(incomingNotes, 'noteID');

  if (q.isEmpty(incomingNoteIDs)) {
    callback(null);
    return;
  }

  vespernotes.fetchNotesWithIDs(request, incomingNoteIDs, userID, function(err, results) {

    if (err) {
      callback(err);
      return;
    }

    mergeFetchedNotes(request, incomingNotes, results, callback);
  });
}

function mergeOneProperty(incomingNote, existingNote, propertyName) {

  // Returns true if property changed on existingNote.

  var datePropertyName = propertyName + 'ModificationDate';

  if (incomingNote[datePropertyName] > existingNote[datePropertyName]) {

    existingNote[datePropertyName] = incomingNote[datePropertyName];
    existingNote[propertyName] = incomingNote[propertyName];

    return true;
  }

  return false;
}

function mergeOneNote(incomingNote, existingNote) {

  // Returns note only if it needs to updated in database.

  var shouldUpdate = false;

  if (mergeOneProperty(incomingNote, existingNote, 'archived')) {
    shouldUpdate = true;
  }
  if (mergeOneProperty(incomingNote, existingNote, 'text')) {
    shouldUpdate = true;
  }
  if (mergeOneProperty(incomingNote, existingNote, 'sortDate')) {
    shouldUpdate = true;
  }
  if (mergeOneProperty(incomingNote, existingNote, 'tags')) {
    shouldUpdate = true;
  }
  if (mergeOneProperty(incomingNote, existingNote, 'attachments')) {
    shouldUpdate = true;
  }

  if (shouldUpdate) {
    existingNote.serverModificationDate = new Date();
    return existingNote;
  }

  return null;
}

function mergeFetchedNotes(request, incomingNotes, existingNotes, callback) {

  // Both incomingNotes and existingNotes must not be empty.

  var mappedExistingNotes = vespersql.collectionMappedToProperty(existingNotes, 'noteID');

  var notesToInsert = [];
  var notesToUpdate = [];

  incomingNotes.forEach(function(oneIncomingNote) {

    var oneNoteID = oneIncomingNote.noteID;
    if (!oneNoteID) {
      return;
    }

    var oneFetchedNote = mappedExistingNotes[oneNoteID];

    if (!oneFetchedNote) {
      notesToInsert.push(oneIncomingNote);
    }
    else {
      var noteToUpdate = mergeOneNote(oneIncomingNote, oneFetchedNote);
      if (noteToUpdate) {
        notesToUpdate.push(noteToUpdate);
      }
    }
  });

  vespernotes.batchUpdateNotes(request, notesToUpdate, function(err) {

    var updateErr = err;

    vespernotes.batchInsertNotes(request, notesToInsert, function(err) {

      if (!err) {
        err = updateErr;
      }

      callback(err);
    });
  });
}

// Incoming Notes

function notesForJSONNotes(request, JSONNotes, userID) {

  if (q.isEmpty(JSONNotes)) {
    return null;
  }

  var serverModificationDate = new Date();
  var notes = JSONNotes.map(function(item) {

    item.userID = userID;
    item.serverModificationDate = serverModificationDate;

    item.creationDate = vespersync.dateWithJSONDate(item.creationDate);
    item.sortDate = vespersync.dateWithJSONDate(item.sortDate);

    if (item.textModificationDate) {
      item.textModificationDate = new Date(item.textModificationDate);
    }
    if (item.sortDateModificationDate) {
      item.sortDateModificationDate = new Date(item.sortDateModificationDate);
    }
    if (item.archivedModificationDate) {
      item.archivedModificationDate = new Date(item.archivedModificationDate);
    }
    if (item.tagsModificationDate) {
      item.tagsModificationDate = new Date(item.tagsModificationDate);
    }
    if (item.attachmentsModificationDate) {
      item.attachmentsModificationDate = new Date(item.attachmentsModificationDate);
    }

    // Attachments come in as base64-encoded JSON strings. Decode them and then store as JSON strings.

    if (item.attachments) {
      item.attachments = q.base64Decode(item.attachments);
    }

    return item;
  });

  return notes;
}