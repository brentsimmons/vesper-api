var vesperuser = require('../shared/vesperuser.js');

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

  var emailUpdates = request.body.emailUpdates;

  request.service.mssql.query('UPDATE accounts SET emailUpdates=? where (id=?);', [emailUpdates, userID], {

    success: function(results) {

      response.send(204);
    },

    error: function(err) {

      console.error(err);
      response.send(500);
    }
  });
};

exports.get = function(request, response) {

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

  request.service.mssql.query('select emailUpdates from accounts where (id = ?);', [userID], {

    success: function(results) {

      if (results.length != 1) {
        response.send(500);
      }

      else {
        var emailUpdates = results[0];
        response.send(200, emailUpdates);
      }
    },

    error: function(err) {
      console.error(err);
      response.send(500);
    }
  });
};