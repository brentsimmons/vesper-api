var crypto = require('crypto');

exports.folderNameWithRequest = folderNameWithRequest;
exports.fileListWithBlobList = fileListWithBlobList;
exports.encryptedFolderName = encryptedFolderName; /*for testing only*/

function folderNameWithRequest(request, userID) {

  var hmacKey = request.service.config.appSettings.BLOB_FOLDER_HMAC_KEY;
  return encryptedFolderName(userID, hmacKey);
}

function encryptedFolderName(foldername, hmacKey) {

  var hash = crypto.createHmac('md5', hmacKey);
  hash.update(foldername);
  foldername = hash.digest('hex');

  return foldername;
}

function fileListWithBlobList(blobList) {

  var fileList = blobList.map(function(oneItem) {

    var oneFile = {};
    oneFile.name = oneItem.name;
    oneFile.contentType = oneItem.properties['Content-Type'];

    return oneFile;
  });

  return fileList;
}