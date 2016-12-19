var vesperverifyemail = require('../shared/vesperverifyemail.js');
var vesperuser = require('../shared/vesperuser.js');

// POST

exports.post = function(request, response) {

  if (!requestHasSecretKey(request)) {
    response.send(400);
    return;
  }

  var token = request.body.token;
  if (!token) {
    response.send(400);
    return;
  }

  var username = vesperverifyemail.decryptedVerifyEmailToken(request, token);
  if (!username) {
    response.send(400);
    return;
  }

  var accountsTable = request.service.tables.getTable('accounts');
  vesperuser.userForUsername(accountsTable, username, function(err, user) {

   if (err) {
      console.error(err);
      response.send(500);
      return;
    }

    if (!user) {
      var error = {
        error: 'VSNoSuchUser'
      };
      response.send(400, error);
      return;
    }

    if (user.verificationDate) {
      var result = {
        emailAddress: user.username
      };
      response.send(200, result);
      return;
    }

    vesperuser.updateUserEmailVerificationDate(request, user, function(err) {

      if (err) {
        console.error(err);
        response.send(500);
        return;
      }

    var result = {
        emailAddress: user.username
      };

      response.send(200, result);
    });
  });

};

// Utilities

function requestHasSecretKey(request) {

  var secretKey = request.headers.verifyemailapikey;
  return secretKey === request.service.config.appSettings.VERIFY_EMAIL_API_KEY;
}