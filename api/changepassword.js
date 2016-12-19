var vesperuser = require('../shared/vesperuser.js');

// POST

exports.post = function(request, response) {

  if (!requestHasSecretKey(request)) {
    response.send(400);
    return;
  }

  var username = request.body.username;
  var password = request.body.password;
  var resetPasswordToken = request.body.resetPasswordToken;

  if (!username || !password || !resetPasswordToken) {
    response.send(400);
    return;
  }
  if (!vesperuser.passwordIsValid(password)) {
    response.send(400);
    return;
  }

  var tokenInfo = vesperuser.decryptedTokenInfo(request, resetPasswordToken);
  if (!tokenInfo || vesperuser.tokenIsExpired(tokenInfo)) {
    response.send(403);
    return;
  }

  username = username.toLowerCase();
  if (username !== tokenInfo.username.toLowerCase()) {
    response.send(403);
    return;
  }

  var accountsTable = request.service.tables.getTable('accounts');

  vesperuser.userForUsername(accountsTable, username, function(err, user) {

    if (err) {
      response.send(500);
      return;
    }
    if (!user || !user.id) {
      response.send(403);
      return;
    }

    vesperuser.updateUserPassword(request, user, password, function(err) {

      if (err) {
        response.send(500);
        return;
      }

      response.send(204);
    });
  });
};

// Utilities

function requestHasSecretKey(request) {

  var secretKey = request.headers.resettokenkey;
  return secretKey === request.service.config.appSettings.RESET_TOKEN_KEY;
}