var vesperuser = require('../shared/vesperuser.js');
var vesperemail = require('../shared/vesperemail.js');
var q = require('../shared/q.js');

exports.resetPasswordToken = resetPasswordToken; /*Testing only.*/

// POST

exports.post = function(request, response) {

  try {
    var username = request.body.username;
    if (!username) {
      response.send(400);
      return;
    }
    username = username.toLowerCase();
  }
  catch (err) {
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

    response.send(204);
    var url = resetPasswordURL(request, username);
    createAndSendEmail(request, url, username);
  });
};

// Utilities

function resetPasswordToken(request, username, salt, encryptionKey, expirationDate) {

  // salt, encryptionKey, and expirationDate are passed-in only when testing.
  
  if (!expirationDate) {
    expirationDate = q.dateWithNumberOfHoursInTheFuture(new Date(), 1);
  }
  var expirationTimestamp = q.unixTenDigitTimestampWithDate(expirationDate);
  if (!salt) {
    salt = request.service.config.appSettings.RESET_TOKEN_SALT;
  }
  var token = expirationTimestamp + ':' + salt + ':' + username;

  if (!encryptionKey) {
    encryptionKey = request.service.config.appSettings.RESET_TOKEN_ENCRYPTION_KEY;
  }
  var encryptedToken = q.encryptText(token, encryptionKey);
  return encryptedToken;
}

function resetPasswordURL(request, username) {

  var encryptedToken = resetPasswordToken(request, username);
  encryptedToken = encryptedToken.replace(/\//g, '*');
  encryptedToken = encryptedToken.replace(/\+/g, '.');
  encryptedToken = encryptedToken.replace(/=/g, '-');

  var urlPrefix = request.service.config.appSettings.RESET_PASSWORD_URL_PREFIX;
  var url = urlPrefix + encodeURIComponent(encryptedToken);

  return url;
}

function createAndSendEmail(request, url, emailAddress) {

  var message = {};
  message.to = emailAddress;
  message.from = request.service.config.appSettings.RESET_PASSWORD_EMAIL_ADDRESS;;
  message.subject = 'Reset Password';
  message.text = 'You can reset your password by opening this link in your browser and typing a new password.\n\n' + url + '\n\n';

  vesperemail.sendEmail(request, message, function(err) {

    if (err) {
      console.error('Error sending reset-password email: ' + err);
    }
  });
}