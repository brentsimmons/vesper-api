var q = require('../shared/q.js');
var vesperemail = require('../shared/vesperemail.js');

exports.decryptedVerifyEmailToken = decryptedVerifyEmailToken;
exports.verifyEmailToken = verifyEmailToken;
exports.verifyEmailURL = verifyEmailURL;
exports.sendVerificationEmailToUsername = sendVerificationEmailToUsername;

function decryptedVerifyEmailToken(request, token, key) {

  // Decrypt verify-email token.

  // Some base64 characters have been replaced with URL-friendly alternates.

  token = token.replace(/\*/g, '\/');
  token = token.replace(/\./g, '+');
  token = token.replace(/-/g, '=');

  if (!key) {
    key = request.service.config.appSettings.VERIFY_EMAIL_TOKEN_ENCRYPTION_KEY;
  }

  var decryptedToken = null;
  try {
    decryptedToken = q.decryptText(token, key);
  }
  catch (err) {
    console.error('Error decrypting: ' + token);
  }

  return decryptedToken;
}

function verifyEmailToken(request, username, key) {

  if (!key) {
    key = request.service.config.appSettings.VERIFY_EMAIL_TOKEN_ENCRYPTION_KEY;
  }
  var token = q.encryptText(username, key);

  token = token.replace(/\//g, '*');
  token = token.replace(/\+/g, '.');
  token = token.replace(/=/g, '-');

  return token;
}

function verifyEmailURL(request, username, urlPrefix, emailTokenEncryptionKey) {

  var token = verifyEmailToken(request, username, emailTokenEncryptionKey);

  if (!urlPrefix) {
    urlPrefix = request.service.config.appSettings.VERIFY_EMAIL_URL_PREFIX;
  }
  var url = urlPrefix + encodeURIComponent(token);

  return url;
}

function sendVerificationEmailToUsername(request, username) {

  var url = verifyEmailURL(request, username);

  var message = {};
  message.to = username;
  message.from = 'support@qbranch.co';
  message.fromname = 'Vesper Support';
  message.subject = 'Welcome to Vesper';
  message.text = 'Thank you for signing up for Vesper Sync. Tap the link below to verify your email address. (This helps in case there’s ever a problem with your account; verifying confirms that this email address is yours.)\n\n' + url + '\n\nIf you have any questions or concerns, please email us at support@qbranch.co.\n\n\n—Q Branch';

  vesperemail.sendEmail(request, message, function(err) {

    if (err) {
      console.error('Error sending reset-password email to ' + username + ': ' + err);
    }
  });
}