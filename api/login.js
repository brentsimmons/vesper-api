var q = require('../shared/q.js');
var vesperuser = require('../shared/vesperuser.js');

// POST

exports.post = function(request, response) {

  try {
    var authentication = vesperuser.usernameAndPasswordFromRequest(request);
    var username = authentication.username;
    var password = authentication.password;

    if (!username || !password) {
      response.send(400);
      return;
    }
  }

  catch (err) {
    console.error(err);
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
      response.send(401);
      return;
    }

    vesperuser.hash(password, user.salt, function(err, hashedPassword) {

   	if (err) {
        console.error(err);
        response.send(500);
        return;
      }

      try {

        var incoming = hashedPassword;
        if (!q.slowEquals(incoming, user.password)) {
          response.send(401);
          return;
        }

        var expirationDate = q.dateWithNumberOfDaysInTheFuture(new Date(), 1);
        var userID = 'Custom:' + user.id;

        var masterKey = request.service.config.appSettings.VESPER_MASTER_KEY;

        var token = vesperuser.authenticationToken(userID, masterKey, expirationDate);

        response.send(200, {
          token: token,
          emailUpdates: user.emailUpdates
        });
      }

      catch (err) {
        console.error(err);
        response.send(500);
      }
    });
  });
}