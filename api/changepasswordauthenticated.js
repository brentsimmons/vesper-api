var vesperuser = require('../shared/vesperuser.js');

// POST

exports.post = function(request, response) {

  try {
    var userID = vesperuser.authenticatedShortUserIDWithRequestUser(request.user);
    if (!userID) {
      // Should never get here -- Mobile Services takes care of permissions.
      response.send(401);
      return;
    }
  }
  catch (err) {
    console.error(err);
    response.send(400);
    return;
  }

  var incomingPassword = request.body.password;
  if (!vesperuser.passwordIsValid(incomingPassword)) {
    response.send(400);
    return;
  }

  var accountsTable = request.service.tables.getTable('accounts');
  vesperuser.userForUserID(accountsTable, userID, function(err, user) {

    if (err) {
      response.send(500);
      return;
    }
    if (!user) {
      response.send(403);
      return;
    }

    vesperuser.updateUserPassword(request, user, incomingPassword, function(err) {

      if (err) {
        console.error(err);
        response.send(500);
      }

      response.send(204);
    });
  });
}