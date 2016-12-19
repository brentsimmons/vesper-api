var q = require('../shared/q.js');
var vespertags = require('../shared/vespertags.js');
var vesperuser = require('../shared/vesperuser.js');
var vespersql = require('../shared/vespersql.js');

exports.mergeTag = mergeTag; /*Testing only.*/

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

  var tagsTable = request.service.tables.getTable('tags');
  vespertags.tagsForUserID(tagsTable, userID, function(err, existingTags) {

    if (err) {
      console.error(err);
      request.respond(500);
      return;
    }

    processTagsAndRespond(request, response, userID, existingTags);
  });
}

// Processing Tags

function processTagsAndRespond(request, response, userID, existingTags) {

  try {
    var incomingTags = vespertags.tagsForJSONTags(request.body, userID);
    if (q.isEmpty(incomingTags)) {
      response.send(200, existingTags);
      return;
    }

    if (q.isEmpty(existingTags)) {

      vespertags.batchInsertTags(request, incomingTags, function(err) {

        if (err) {
          response.send(500);
        }
        else {
          response.send(204);
        }
      });

      return;
    }

    var tagsTable = request.service.tables.getTable('tags');
    mergeTags(request, existingTags, incomingTags, tagsTable, function(err, mergedTags) {

      if (err) {
        response.send(500);
        return;
      }

      response.send(200, mergedTags);
      return;
    });

  }
  catch (err) {
    console.error(err);
    response.send(500);
  }
}

// Merging Tags

function mergeTag(incomingTag, existingTag) {

  // Returns: result.mergedTag (only if not equal to incomingTag),
  // result.tagToUpdateInDatabase (only if needs to be updated).
  // One or both may be undefined or null.

  var didChangeIncomingTag = false;
  var shouldUpdate = false;
  var result = {};

  if (incomingTag.nameModificationDate < existingTag.nameModificationDate) {

    // Newer database tag name
    incomingTag.nameModificationDate = existingTag.nameModificationDate;
    incomingTag.name = existingTag.name;
    didChangeIncomingTag = true;
  }

  else if (incomingTag.nameModificationDate > existingTag.nameModificationDate) {

    // Newer incoming tag name
    shouldUpdate = true;
  }

  if (shouldUpdate) {

    incomingTag.id = existingTag.id;
    result.tagToUpdateInDatabase = incomingTag;
  }

  if (didChangeIncomingTag) {
    result.mergedTag = incomingTag;
  }

  return result;
}

function mergeTags(request, existingTags, incomingTags, tagsTable, callback) {

  // Both existingTags and incomingTags must not be empty.

  var mappedExistingTags = vespersql.collectionMappedToUniqueID(existingTags);
  var mergedTags = [];
  var tagsToInsert = [];
  var tagsToUpdate = [];

  incomingTags.forEach(function(oneIncomingTag) {

    var oneExistingTag = mappedExistingTags[oneIncomingTag.uniqueID];

    if (!oneExistingTag) {
      tagsToInsert.push(oneIncomingTag);
    }

    else {
      var result = mergeTag(oneIncomingTag, oneExistingTag);
      if (result.mergedTag) {
        mergedTags.push(result.mergedTag);
      }
      if (result.tagToUpdateInDatabase) {
        tagsToUpdate.push(result.tagToUpdateInDatabase);
      }
    }
  });

  var missingTags = vespertags.tagsMissingFromOtherTags(existingTags, incomingTags);
  if (!q.isEmpty(missingTags)) {
    mergedTags = mergedTags.concat(missingTags);
  }

  vespertags.batchUpdateTags(request, tagsToUpdate, function(err) {

    var updateErr = err;

    vespertags.batchInsertTags(request, tagsToInsert, function(err) {

      if (!err) {
        err = updateErr;
      }

      callback(err, mergedTags);
    });
  });
}