var q = require('../shared/q.js');
var vespersql = require('../shared/vespersql.js');

exports.fetchNotesWithIDs = fetchNotesWithIDs;
exports.fetchModifiedNotes = fetchModifiedNotes;
exports.batchUpdateNotes = batchUpdateNotes;
exports.batchInsertNotes = batchInsertNotes;
exports.notesToReturnWithFetchResults = notesToReturnWithFetchResults;
exports.deleteNotesWithNoteIDs = deleteNotesWithNoteIDs;
exports.notesMinusDeletedNotes = notesMinusDeletedNotes;

function deleteNotesWithNoteIDs(request, noteIDs, userID) {

  //No callback.

  if (q.isEmpty(noteIDs)) {
    return;
  }

  var placeholders = noteIDs.map(function() {
    return '?';
  }).join(',');

  var parameters = [userID].concat(noteIDs);
  var query = 'delete from notes where userID = ? and noteID in (' + placeholders + ');';
  request.service.mssql.query(query, parameters);
}


function fetchNotesWithIDs(request, noteIDs, userID, callback) {

  if (q.isEmpty(noteIDs)) {
    callback();
    return;
  }

  var placeholders = noteIDs.map(function() {
    return '?';
  }).join(',');

  var parameters = [userID].concat(noteIDs);
  var query = 'select * from notes where userID = ? and noteID in (' + placeholders + ');';

  fetchNotesWithQuery(request, query, parameters, callback);
}

function fetchModifiedNotes(request, userID, lastSyncDate, callback) {

  var d = q.dateWithNumberOfMinutesInThePast(lastSyncDate, 10);
  var query = 'select * from notes where (userID = ?) and (serverModificationDate > ?);';
  var parameters = [userID, d];

  fetchNotesWithQuery(request, query, parameters, callback);
}


function fetchNotesWithQuery(request, query, parameters, callback) {

  request.service.mssql.query(query, parameters, {

    success: function(results) {

      decryptTextInNotes(request, results);
      callback(null, results);
    },
    error: function(err) {
      console.error(err);
      callback(err, null);
    }
  });
}


function decryptTextInNotes(request, notes) {

  if (q.isEmpty(notes)) {
    return;
  }

  notes.forEach(function(oneNote) {
    if (oneNote.text) {
      oneNote.text = decryptedNoteText(request, oneNote.text);
    }
  });
}

function decryptedNoteText(request, s) {

  if (!s) {
    return s;
  }

  var keyID = parseInt(request.service.config.appSettings.VESPER_TEXT_KEY_ID);
  var textToken = request.service.config.appSettings.VESPER_TEXT_TOKEN;
  var textTokenLength = textToken.length;

  for (var i = keyID; i >= 0; i--) {

    var key = request.service.config.appSettings['VESPER_TEXT_KEY_' + keyID];
    try {
      var decryptedText = q.decryptText(s, key);
      if (decryptedText && decryptedText.substring(0, textTokenLength) === textToken) {
        decryptedText = decryptedText.slice(textTokenLength);
        return decryptedText;
      }
    }
    catch (err) {;
    }
  }

  console.error('Could not decrypt text.');

  return null;
}

function notesMinusDeletedNotes(notes, deletedNoteIDs) {

  if (!notes) {
    return notes;
  }

  var result = [];

  notes.forEach(function(oneNote) {

    if (!deletedNoteIDs || deletedNoteIDs.indexOf(oneNote.noteID) < 0) {
      result.push(oneNote);
    }
  });

  return result;
}


function notesToReturnWithFetchResults(request, deletedNoteIDs, notes) {

  if (q.isEmpty(notes)) {
    return null;
  }

  var notesToReturn = notes.map(function(item) {

    delete item.id;
    delete item.serverModificationDate;
    delete item.userID;

    var attachments = item.attachments;
    if (attachments) {
      attachments = q.base64Encode(attachments);
      item.attachments = attachments;
    }

    return item;
  });

  return notesToReturn;
}

function encryptedTextForNote(request, oneNote) {

  if (!oneNote.text) {
    return;
  }

  var keyID = request.service.config.appSettings.VESPER_TEXT_KEY_ID;
  var key = request.service.config.appSettings['VESPER_TEXT_KEY_' + keyID];

  var s = request.service.config.appSettings.VESPER_TEXT_TOKEN + oneNote.text;
  return q.encryptText(s, key);
}

// Updates


function updateNotesBuildFunction(request, oneNote) {

  var text = encryptedTextForNote(request, oneNote);

  var sql = 'UPDATE notes SET archived=?, text=?, sortDate=?, textModificationDate=?, tagsModificationDate=?, attachmentsModificationDate=?, serverModificationDate=?, tags=?, archivedModificationDate=?, sortDateModificationDate=?, attachments=? WHERE id=?;';
  var parameters = [
    oneNote.archived,
    text ? text : null,
    oneNote.sortDate,
    oneNote.textModificationDate ? oneNote.textModificationDate : null,
    oneNote.tagsModificationDate ? oneNote.tagsModificationDate : null,
    oneNote.attachmentsModificationDate ? oneNote.attachmentsModificationDate : null,
    oneNote.serverModificationDate,
    oneNote.tags ? oneNote.tags : null,
    oneNote.archivedModificationDate ? oneNote.archivedModificationDate : null,
    oneNote.sortDateModificationDate ? oneNote.sortDateModificationDate : null,
    oneNote.attachments ? oneNote.attachments : null,
    oneNote.id
  ];

  return {
    sql: sql,
    parameters: parameters
  };
}

function batchUpdateNotes(request, notes, callback) {

  if (q.isEmpty(notes)) {
    callback();
    return;
  }

  var BATCH_SIZE = 5;
  var NUMBER_OF_TRIES = 2;

  vespersql.runBatch(request, notes, updateNotesBuildFunction, BATCH_SIZE, NUMBER_OF_TRIES, callback);
}

// Inserts

function insertNotesBuildFunction(request, oneNote) {

  var text = encryptedTextForNote(request, oneNote);

  var sql = 'INSERT into notes (noteID, userID, archived, text, creationDate, sortDate, textModificationDate, tagsModificationDate, attachmentsModificationDate, archivedModificationDate, sortDateModificationDate, serverModificationDate, tags, attachments) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);';
  var parameters = [
    oneNote.noteID,
    oneNote.userID,
    oneNote.archived,
    text ? text : null,
    oneNote.creationDate,
    oneNote.sortDate,
    oneNote.textModificationDate ? oneNote.textModificationDate : null,
    oneNote.tagsModificationDate ? oneNote.tagsModificationDate : null,
    oneNote.attachmentsModificationDate ? oneNote.attachmentsModificationDate : null,
    oneNote.archivedModificationDate ? oneNote.archivedModificationDate : null,
    oneNote.sortDateModificationDate ? oneNote.sortDateModificationDate : null,
    oneNote.serverModificationDate ? oneNote.serverModificationDate : null,
    oneNote.tags ? oneNote.tags : null,
    oneNote.attachments ? oneNote.attachments : null
  ];

  return {
    sql: sql,
    parameters: parameters
  };
}

function batchInsertNotes(request, notes, callback) {

  if (q.isEmpty(notes)) {
    callback();
    return;
  }

  var BATCH_SIZE = 1;
  var NUMBER_OF_TRIES = 1;

  vespersql.runBatch(request, notes, insertNotesBuildFunction, BATCH_SIZE, NUMBER_OF_TRIES, callback);
}