var q = require('../shared/q.js');
var vesperblob = require('../shared/vesperblob.js');
var vesperuser = require('../shared/vesperuser.js');
var qs = require('querystring');
var azure = require('azure');


exports.register = function(api) {
  api.get('/:operation', getImplementation);
  api.delete('/:operation', deleteImplementation);
};

// DELETE

function deleteImplementation(request, response) {

  try {
    var userID = vesperuser.authenticatedShortUserIDWithRequestUser(request.user);
    if (!userID) {
      //Should never get here -- Mobile Services takes care of permissions.
      response.send(401);
      return;
    }
  }
  catch (err) {
    console.error(err);
    response.send(400);
    return;
  }

  try {
    var foldername = vesperblob.folderNameWithRequest(request, userID);
    var filename = request.params.operation;
    if (!filename || !foldername) {
      response.send(400);
      return;
    }
  }
  catch (err) {
    console.error(err);
    response.send(500);
  }

  var blobService = blobServiceWithRequest(request);
  blobService.deleteBlob(foldername, filename, function(err) {

    if (err) {
      console.error(err);
      response.send(500);
      return;
    }

    response.send(200);
  });
}


// GET

function getImplementation(request, response) {

  try {

    var userID = vesperuser.authenticatedShortUserIDWithRequestUser(request.user);
    if (!userID) {
      //Should never get here -- Mobile Services takes care of permissions.*/
      response.send(401);
      return;
    }

    var foldername = vesperblob.folderNameWithRequest(request, userID);

    if (request.params.operation === 'download') {
      download(request, response, foldername);
      return;
    }

    else if (request.params.operation === 'list') {
      list(request, response, foldername);
      return;
    }

    else if (request.params.operation === 'urlForUploading') {
      upload(request, response, foldername);
      return;
    }

    response.send(404);
  }

  catch (err) {
    console.error(err);
    response.send(500);
  }
}

function download(request, response, foldername) {

  var blobService = blobServiceWithRequest(request);

  try {
    var sharedAccessPolicy = {
      AccessPolicy: {
        Permissions: 'r',
        Expiry: q.dateWithNumberOfMinutesInTheFuture(new Date(), 5)
      }
    };

    var filename = request.query.filename;
    var sasURL = blobService.generateSharedAccessSignature(foldername, filename, sharedAccessPolicy);
    var accountName = request.service.config.appSettings.STORAGE_ACCOUNT_NAME;
    var url = 'https://' + accountName + '.blob.core.windows.net' + sasURL.path + '?' + qs.stringify(sasURL.queryString);

    response.redirect(url);
  }
  catch (err) {
    console.error(err);
    response.send(500);
  }
}

function list(request, response, foldername) {

  var blobService = blobServiceWithRequest(request);
  blobService.createContainerIfNotExists(foldername, function(err) {

    if (err) {
      console.error(err);
      response.send(500);
      return;
    }

    blobService.listBlobs(foldername, function(err, results) {

      if (err) {
        console.error(err);
        response.send(500);
        return;
      }

      var fileList = vesperblob.fileListWithBlobList(results);
      response.send(200, fileList);
    });
  });
}

function upload(request, response, foldername) {

  var blobService = blobServiceWithRequest(request);
  blobService.createContainerIfNotExists(foldername, function(err) {

    if (err) {
      console.error(err);
      response.send(500);
      return;
    }

    try {
      var sharedAccessPolicy = {
        AccessPolicy: {
          Permissions: 'w',
          Expiry: q.dateWithNumberOfMinutesInTheFuture(new Date(), 5)
        }
      };

      var filename = request.query.filename;
      var sasURL = blobService.generateSharedAccessSignature(foldername, filename, sharedAccessPolicy);
      var accountName = request.service.config.appSettings.STORAGE_ACCOUNT_NAME;
      var urlForUploading = 'https://' + accountName + '.blob.core.windows.net' + sasURL.path + '?' + qs.stringify(sasURL.queryString);

      response.send(200, {
        'url': urlForUploading
      });
    }
    catch (err) {
      console.error(err);
      response.send(500);
    }
  });
}

// Utilities

function blobServiceWithRequest(request) {

  var accountName = request.service.config.appSettings.STORAGE_ACCOUNT_NAME;
  var key = request.service.config.appSettings.STORAGE_ACCOUNT_ACCESS_KEY;
  var host = accountName + '.blob.core.windows.net';
  var blobService = azure.createBlobService(accountName, key, host);

  return blobService;
}