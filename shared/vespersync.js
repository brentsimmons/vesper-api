var q = require('../shared/q.js');

exports.addSyncTokenToResponse = addSyncTokenToResponse;
exports.syncDateFromRequest = syncDateFromRequest;
exports.dateWithJSONDate = dateWithJSONDate;
exports.syncTokenWithDate = syncTokenWithDate; /*Testing only.*/
exports.dateWithSyncToken = dateWithSyncToken; /*Testing only.*/

var oldDate = new Date("2012-12-12T12:00:00Z");
exports.oldDate = oldDate;


function addSyncTokenToResponse(response) {

  var syncToken = syncTokenWithDate(new Date());
  response.set('x-vesper-synctoken', syncToken);
}

function dateWithJSONDate(d) {

  if (!d) {
    return oldDate;
  }

  return new Date(d);
}

function syncDateFromRequest(request) {

  // Returns oldDate if date not present in headers or is unparseable.

  var syncToken = request.headers['x-vesper-synctoken'];
  if (!syncToken) {
    return oldDate;
  }

  var syncDate = dateWithSyncToken(syncToken);
  if (!syncDate) {
    return oldDate;
  }
  return syncDate;
}

function syncTokenWithDate(d) {

  /*The leading 1: means it's a version 1 syncToken. There might be more versions later.*/

  var s = "1:" + d.getTime();
  return q.base64Encode(s);
}

function dateWithSyncToken(s) {

  /*1:dateTime base64-encoded. This function will get more complex if there are later versions of sync tokens.*/

  if (!s) {
    return null;
  }

  var decodedToken = q.base64Decode(s);
  var components = decodedToken.split(':');
  var dateTimeString = components[1];

  if (!dateTimeString) {
    return null;
  }

  var dateTime = parseInt(dateTimeString);
  var d = new Date(dateTime);
  return d;
}

