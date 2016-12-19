var q = require('../shared/q.js');
var vespersql = require('../shared/vespersql.js');
var crypto = require('crypto');

exports.usernameIsValid = usernameIsValid;
exports.passwordIsValid = passwordIsValid;
exports.usernameAndPasswordFromRequest = usernameAndPasswordFromRequest;
exports.usernameAndPasswordFromHeader = usernameAndPasswordFromHeader;
exports.authenticatedShortUserIDWithRequestUser = authenticatedShortUserIDWithRequestUser;
exports.authenticationToken = authenticationToken;
exports.userForUsername = userForUsername;
exports.userForUserID = userForUserID;
exports.hash = hash;
exports.decryptedTokenInfo = decryptedTokenInfo;
exports.tokenIsExpired = tokenIsExpired;
exports.updateUserPassword = updateUserPassword;
exports.updateUserEmailVerificationDate = updateUserEmailVerificationDate;
exports.statsForUserID = statsForUserID;
exports.usernameAndPasswordFromAuthenticationString = usernameAndPasswordFromAuthenticationString; /*Testing only.*/
exports.signature = signature; /*Testing only.*/

exports.errors = {
  VSErrorInvalidUsername: "VSErrorInvalidUsername",
  VSErrorInvalidPassword: "VSErrorInvalidPassword",
  VSErrorUsernameAlreadyExists: "VSErrorUsernameAlreadyExists",
};

function usernameIsValid(username) {

  if (!username) {
    return false;
  }
  if (username.indexOf(' ') !== -1) {
    return false;
  }
  if (username.indexOf('\n') !== -1) {
    return false;
  }
  if (username.indexOf('\r') !== -1) {
    return false;
  }
  if (username.indexOf('\t') !== -1) {
    return false;
  }
  if (username.indexOf('@') === -1 || username.indexOf('.') === -1) {
    return false;
  }
  if (username.length < 5 || username.length > 150) {
    return false;
  }

  return true;
}

function passwordIsValid(password) {

  if (!password) {
    return false;
  }
  return password && password.length >= 7 && password.length < 100;
}

function usernameAndPasswordFromRequest(request) {

  var rawHeader = request.headers.authorization;
  return usernameAndPasswordFromHeader(rawHeader);
}

function usernameAndPasswordFromAuthenticationString(s) {

  var components = s.split(':');
  var username = components.splice(0, 1)[0];
  username = username.toLowerCase();
  var password = components.join(':');

  return {
    username: username,
    password: password
  };
}

function usernameAndPasswordFromHeader(header) {

  if (!header || header.length < 1) {
    return null;
  }

  var token = header.split(/\s+/).pop();
  var decodedString = q.base64Decode(token);
  return usernameAndPasswordFromAuthenticationString(decodedString);
}

function authenticatedShortUserIDWithRequestUser(user) {

  /*{ level: 'authenticated',
		userId: 'Custom:1',
		getIdentities: [Function] }*/

  var authenticated = user.level;
  if (authenticated !== 'authenticated') {
    return null;
  }

  var userID = user.userId;
  if (!userID) {
    return null;
  }
  var components = userID.split(':');
  if (components[0] !== 'Custom') {
    return null;
  }

  return components[1];
}

function signature(input, masterKey) {

  var key = crypto.createHash('sha256').update(masterKey + "JWTSig").digest('binary');
  var str = crypto.createHmac('sha256', key).update(input).digest('base64');
  return q.urlFriendly(str);
}

function authenticationToken(userID, masterKey, expirationDate) {

  /* http://www.thejoyofcode.com/Exploring_custom_identity_in_Mobile_Services_Day_12_.aspx */

  var s1 = '{"alg":"HS256","typ":"JWT","kid":"0"}';
  var j2 = {
    "exp": q.unixTenDigitTimestampWithDate(expirationDate),
    "iss": "urn:microsoft:windows-azure:zumo",
    "ver": 2,
    "aud": 'Custom',
    "uid": userID,
  };
  var s2 = JSON.stringify(j2);
  var b1 = q.urlFriendly(q.base64Encode(s1));
  var b2 = q.urlFriendly(q.base64Encode(s2));
  var b3 = signature(b1 + "." + b2, masterKey);
  return [b1, b2, b3].join(".");
}

function statsForUserID(request, userID, callback) {

  request.service.mssql.query('select numberOfNotes, numberOfTags, numberOfAttachments, numberOfDeletedNotes from (select count(*) as numberOfNotes from vesper.notes where userID=?) numberOfNotes CROSS JOIN (select count(*) as numberOfTags from vesper.tags where userID=?) numberOfTags CROSS JOIN (select count(*) as numberOfAttachments from vesper.notes where userID=? and attachments is not null) numberOfAttachments CROSS JOIN (select count(*) as numberOfDeletedNotes from vesper.deletednotes where userID=?) numberOfDeletedNotes;', [userID, userID, userID, userID], {

    success: function(results) {

      callback(null, results[0]);
    },
    error: function(err) {
      callback(err);
    }
  });
}

function userForUsername(accountsTable, username, callback) {

  // Callbacks gets 0 results or 1 result. Never multiple.

  username = username.toLowerCase();

  vespersql.readFromTable(accountsTable, {
    username: username
  }, function(err, results) {

    if (err) {
      callback(err, null);
      return;
    }

    if (results.length === 1) {
      callback(null, results[0]);
      return;
    }

    callback(null, null);
  });
}

function userForUserID(accountsTable, userID, callback) {

  // Callbacks gets 0 results or 1 result. Never multiple.

  vespersql.readFromTable(accountsTable, {
    id: userID
  }, function(err, results) {

    if (err) {
      callback(err, null);
      return;
    }

    if (results.length === 1) {
      callback(null, results[0]);
      return;
    }

    callback(null, null);
  });
}

function hash(text, salt, callback) {

  var crypto = require('crypto');
  var ITERATIONS = 1000;
  var BYTES = 32;

  crypto.pbkdf2(text, salt, ITERATIONS, BYTES, function(err, derivedKey) {
    if (err) {
      callback(err);
    }
    else {
      var h = new Buffer(derivedKey).toString('base64');
      callback(null, h);
    }
  });
}

// Tokens

function decryptedTokenInfo(request, resetPasswordToken) {

  // Some base64 characters have been replaced with URL-friendly alternates.

  resetPasswordToken = resetPasswordToken.replace(/\*/g, '\/');
  resetPasswordToken = resetPasswordToken.replace(/\./g, '+');
  resetPasswordToken = resetPasswordToken.replace(/-/g, '=');

  var plainText = q.decryptText(resetPasswordToken, request.service.config.appSettings.RESET_TOKEN_ENCRYPTION_KEY);
  if (!plainText) {
    return null;
  }

  var components = plainText.split(':');
  if (!components || components.length != 3) {
    return null;
  }

  var salt = components[1];
  if (salt !== request.service.config.appSettings.RESET_TOKEN_SALT) {
    return null;
  }

  var tokenInfo = {};

  tokenInfo.username = components[2];

  var expirationDateValue = parseInt(components[0]); // 10-digit timestamp
  tokenInfo.expirationDate = new Date(expirationDateValue * 1000);

  return tokenInfo;
}

function tokenIsExpired(tokenInfo) {

  var now = new Date();
  if (tokenInfo.expirationDate < new Date()) {
    return true;
  }

  // Sanity check. If the date expires 25 or more hours in the future,
  // then it's bogus and we pretend it's expired.

  var futureDate = q.dateWithNumberOfHoursInTheFuture(now, 25);
  if (tokenInfo.expirationDate > futureDate) {
    return true;
  }

  return false;
}

function updateUserPassword(request, user, password, callback) {

  hash(password, user.salt, function(err, hashedPassword) {

    if (err || !hashedPassword) {
      callback(err);
      return;
    }

    request.service.mssql.query('UPDATE accounts SET password=? where (id=?);', [hashedPassword, user.id], {

      success: function(results) {
        callback();
      },

      error: function(err) {
        callback(err);
      }
    });
  });
}


function updateUserEmailVerificationDate(request, user, callback) {

  var now = new Date();

  request.service.mssql.query('UPDATE accounts SET verificationDate=? where (id=?);', [new Date(), user.id], {

    success: function(results) {
      callback();
    },

    error: function(err) {
      callback(err);
    }
  });
}