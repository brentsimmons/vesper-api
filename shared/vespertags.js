var q = require('../shared/q.js');
var vespersql = require('../shared/vespersql.js');
var vespersync = require('../shared/vespersync.js');

exports.tagsForUserID = tagsForUserID;
exports.tagsForJSONTags = tagsForJSONTags;
exports.tagsMissingFromOtherTags = tagsMissingFromOtherTags;
exports.batchUpdateTags = batchUpdateTags;
exports.batchInsertTags = batchInsertTags;
exports.insertTagsBuildFunction = insertTagsBuildFunction; /*Testing only.*/
exports.updateTagsBuildFunction = updateTagsBuildFunction; /*Testing only.*/

function tagsForUserID(tagsTable, userID, callback) {

  vespersql.readFromTable(tagsTable, {
    userID: userID
  }, callback);
}

function tagsForJSONTags(JSONTags, userID) {

  var tags = JSONTags.map(function(item) {

    item.userID = userID;

    if (!item.nameModificationDate) {
      item.nameModificationDate = vespersync.oldDate;
    }
    else {
      item.nameModificationDate = new Date(item.nameModificationDate);
    }

    return item;
  });

  return tags;
}

function tagsMissingFromOtherTags(tags, otherTags) {

  var missingTags = [];
  var otherTagsMap = vespersql.collectionMappedToUniqueID(otherTags);

  tags.forEach(function(oneTag) {

    if (oneTag.uniqueID) {
      var foundTag = otherTagsMap[oneTag.uniqueID];
      if (!foundTag) {
        missingTags.push(oneTag);
      }
    }
  });

  return missingTags;
}

// Updates

function updateTagsBuildFunction(request, oneTag) {

  var sql = 'UPDATE tags SET name=?, nameModificationDate=? WHERE id=?;';
  var parameters = [oneTag.name, oneTag.nameModificationDate, oneTag.id];

  return {
    sql: sql,
    parameters: parameters
  };
}

function batchUpdateTags(request, tags, callback) {

  if (q.isEmpty(tags)) {
    callback();
    return;
  }

  var BATCH_SIZE = 10;
  var NUMBER_OF_TRIES = 3;

  vespersql.runBatch(request, tags, updateTagsBuildFunction, BATCH_SIZE, NUMBER_OF_TRIES, callback);
}

// Inserts

function insertTagsBuildFunction(request, oneTag) {

  var sql = 'INSERT into tags (userID, uniqueID, name, nameModificationDate) values (?, ?, ?, ?);';
  var parameters = [oneTag.userID, oneTag.uniqueID, oneTag.name, oneTag.nameModificationDate];

  return {
    sql: sql,
    parameters: parameters
  };
}

function batchInsertTags(request, tags, callback) {

  if (q.isEmpty(tags)) {
    callback();
    return;
  }

  var BATCH_SIZE = 6;
  var NUMBER_OF_TRIES = 2;

  vespersql.runBatch(request, tags, insertTagsBuildFunction, BATCH_SIZE, NUMBER_OF_TRIES, callback);
}