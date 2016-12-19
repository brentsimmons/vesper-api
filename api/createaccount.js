var vesperuser = require('../shared/vesperuser.js');
var q = require('../shared/q.js');
var vesperverifyemail = require('../shared/vesperverifyemail.js');
var vesperemail = require('../shared/vesperemail.js');

// POST

exports.post = function(request, response) {

  try {
    var authentication = vesperuser.usernameAndPasswordFromRequest(request);
    var username = authentication.username;
    var password = authentication.password;

    if (!vesperuser.usernameIsValid(username)) {
      response.send(400, vesperuser.errors.VSErrorInvalidUsername);
      return;
    }
    if (!vesperuser.passwordIsValid(password)) {
      response.send(400, vesperuser.errors.VSErrorInvalidPassword);
      return;
    }

    username = username.toLowerCase();
  }

  catch (err) {
    console.error(err);
    response.send(400);
    return;
  }

  var accounts = request.service.tables.getTable('accounts');

  vesperuser.userForUsername(accounts, username, function(err, user) {

    if (err) {
      response.send(500);
      return;
    }

    if (user) {
      response.send(400, vesperuser.errors.VSErrorUsernameAlreadyExists);
      return;
    }

    var emailUpdates = request.body.emailUpdates;
    if (!emailUpdates) {
      emailUpdates = false;
    }

    createUserWithUsername(username, password, emailUpdates, accounts, function(err) {

      if (err) {
        response.send(500);
        return;
      }

      response.send(204);

      vesperverifyemail.sendVerificationEmailToUsername(request, username);
    });
  });
}

// Utilities

function createUserWithUsername(username, password, emailUpdates, accounts, callback) {

  var user = {
    username: username,
    emailUpdates: emailUpdates,
    salt: q.salt()
  };

  vesperuser.hash(password, user.salt, function(err, hashedPassword) {

    if (err) {
      callback(err);
      return;
    }

    user.password = hashedPassword;
    user.dateCreated = new Date();

    accounts.insert(user, {
      success: function(results) {
        callback();
      },
      error: function(err) {
        console.error(err);
        callback(err);
      }
    });
  });
}