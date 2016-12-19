var vesperblob = require('../shared/vesperblob.js');
var qs = require('querystring');
var azure = require('azure');

exports.get = function(request, response) {

    var filename = request.query.filename;
    var foldername = vesperblob.folderNameWithRequest(request, filename);
//     list(request, response, foldername);
    
  response.send(statusCodes.OK, { message : foldername });
};

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

function blobServiceWithRequest(request) {

  var accountName = request.service.config.appSettings.STORAGE_ACCOUNT_NAME;
  var key = request.service.config.appSettings.STORAGE_ACCOUNT_ACCESS_KEY;
  var host = accountName + '.blob.core.windows.net';
  var blobService = azure.createBlobService(accountName, key, host);

  return blobService;
}