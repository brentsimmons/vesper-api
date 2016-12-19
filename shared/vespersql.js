if (!q) {
  var q = require('../shared/q.js');
}

exports.uniqueIDsForObjects = uniqueIDsForObjects;
exports.propertiesForObjects = propertiesForObjects;
exports.objectInArrayWithUniqueID = objectInArrayWithUniqueID;
exports.readFromTable = readFromTable;
exports.collectionMappedToUniqueID = collectionMappedToUniqueID;
exports.collectionMappedToProperty = collectionMappedToProperty;
exports.runBatch = runBatch;
exports.buildSQLAndParameters = buildSQLAndParameters; /*for testing only*/

function collectionMappedToUniqueID(collection) {

  return collectionMappedToProperty(collection, 'uniqueID');
}

function collectionMappedToProperty(collection, propertyName) {

  var mappedCollection = {};

  if (q.isEmpty(collection)) {
    return mappedCollection;
  }

  collection.forEach(function(oneItem) {

    var oneProperty = oneItem[propertyName];
    if (oneProperty) {
      mappedCollection[oneProperty] = oneItem;
    }
  });

  return mappedCollection;
}

function readFromTable(table, query, callback) {

  table.where(query).read({
    success: function(results) {
      callback(null, results);
    },
    error: function(err) {
      callback(err, null);
    }
  });
}

function propertiesForObjects(objects, propertyName) {

  if (q.isEmpty(objects)) {
    return null;
  }

  var properties = objects.map(function(item) {
    return item[propertyName];
  });

  return properties;
}

function uniqueIDsForObjects(objects) {

  return propertiesForObjects(objects, 'uniqueID');
}

function objectInArrayWithUniqueID(objects, uniqueID) {

  if (q.isEmpty(objects) || !uniqueID) {
    return null;
  }

  for (var i = 0; i < objects.length; i++) {

    var oneObject = objects[i];
    if (oneObject.uniqueID === uniqueID) {
      return oneObject;
    }
  }

  return null;
}

//Batch Inserts/Updates

function buildSQLAndParameters(request, objects, buildFunction) {

  //Returns result -- with .sql and .parameters.
  //SET NOCOUNT ON makes it so that mssql.query runs the callback
  //only after the entire query. Otherwise it calls back for
  //each statement in the query.

  var sql = 'BEGIN TRANSACTION;SET NOCOUNT ON;';
  var sqlParameters = [];

  objects.forEach(function(oneObject) {

    var oneObjectSQLAndParameters = buildFunction(request, oneObject);
    sql += oneObjectSQLAndParameters.sql;
    sqlParameters = sqlParameters.concat(oneObjectSQLAndParameters.parameters);
  });

  sql += 'COMMIT TRANSACTION;';

  return {
    sql: sql,
    parameters: sqlParameters
  };
}

function runDatabaseCallWithBuildFunction(request, objects, buildFunction, callback) {

  var result = buildSQLAndParameters(request, objects, buildFunction);

  request.service.mssql.query(result.sql, result.parameters, {

    success: function() {
      callback();
    },

    error: function(err) {
      callback(err);
    }
  });
}

function databaseCallWithRetries(request, objects, buildFunction, numberOfTries, callback) {

  //callback takes err, numberOfObjects. callback must not be nil.
  //callback is called on success or after exhausting numberOfTries,
  //in which case err is not null. numberOfObjects is always objects.length,
  //even in the case of an error.

  var numberOfAttempts = 0;

  runDatabaseFunction();

  function runDatabaseFunction() {

    runDatabaseCallWithBuildFunction(request, objects, buildFunction, function(err) {

      if (!err) {
        callback(null, objects.length);
        return;
      }

      numberOfAttempts++;

      if (numberOfAttempts === numberOfTries) {
        console.error('databaseCallWithRetries: ' + err.message);
        callback(err, objects.length);
        return;
      }

      //       console.log('Trying again: ' + numberOfAttempts);
      runDatabaseFunction();
    });
  }
}

function runBatch(request, objects, buildFunction, batchSize, numberOfTries, runBatchCallback) {

  //runBatchCallback takes an err parameter. runBatchCallback must not be nil.
  //If one batch returns an error, it will continue to
  //run batches. The runBatchCallback will be called after all
  //batches have been run.

  var numberAttempted = 0;
  var firstError = null;

  doNextBatch();

  function doNextBatch() {

    var oneBatch = objects.slice(numberAttempted, numberAttempted + batchSize);
    databaseCallWithRetries(request, oneBatch, buildFunction, numberOfTries, handleDatabaseCallComplete);
  }

  function handleDatabaseCallComplete(err, numberOfObjects) {

    if (err && !firstError) {
      firstError = err;
    }

    numberAttempted += numberOfObjects;
    if (numberAttempted < objects.length) {
      setTimeout(doNextBatch(), 1);
    }
    else {
      runBatchCallback(firstError);
    }
  }
}