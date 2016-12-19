exports.base64Encode = base64Encode;
exports.base64Decode = base64Decode;
exports.slowEquals = slowEquals;
exports.isEmpty = isEmpty;
exports.dateWithNumberOfMinutesInThePast = dateWithNumberOfMinutesInThePast;
exports.dateWithNumberOfMinutesInTheFuture = dateWithNumberOfMinutesInTheFuture;
exports.dateWithNumberOfDaysInTheFuture = dateWithNumberOfDaysInTheFuture;
exports.dateWithNumberOfHoursInTheFuture = dateWithNumberOfHoursInTheFuture;
exports.unixTenDigitTimestampWithDate = unixTenDigitTimestampWithDate;
exports.encryptText = encryptText;
exports.decryptText = decryptText;
exports.salt = salt;
exports.urlFriendly = urlFriendly;
exports.respond = respond;


function respond(response, err, results) {

  if (err) {
    console.error(err);
    response.send(500);
    return;
  }

  if (!results || isEmpty(results)) {
    response.send(204);
    return;
  }

  response.send(200, results);
}

function base64Encode(s) {
  return new Buffer(s, 'utf8').toString('base64');
}

function base64Decode(s) {
  return new Buffer(s, 'base64').toString('utf8');
}

function slowEquals(a, b) {

  var diff = a.length ^ b.length;
  for (var i = 0; i < a.length && i < b.length; i++) {
    diff |= (a[i] ^ b[i]);
  }
  return a === b && diff === 0;
}

function isEmpty(x) {
  return !x || x.length < 1;
}

function dateWithNumberOfMinutesInThePast(d, minutes) {
  var x = new Date(d);
  x.setUTCMinutes(d.getUTCMinutes() - minutes);
  return x;
}

function dateWithNumberOfMinutesInTheFuture(d, minutes) {
  var x = new Date(d);
  x.setUTCMinutes(d.getUTCMinutes() + minutes);
  return x;
}

function dateWithNumberOfHoursInTheFuture(d, hours) {
  var x = new Date(d);
  x.setUTCHours(d.getUTCHours() + hours);
  return x;
}

function dateWithNumberOfDaysInTheFuture(d, days) {
  var x = new Date(d);
  x.setUTCDate(d.getUTCDate() + days);
  return x;
}

function unixTenDigitTimestampWithDate(d) {
  var t = d.getTime();
  t = t / 1000;
  return Math.floor(t);
}

function encryptText(s, key) {

  if (!s) {
    return null;
  }

  var crypto = require('crypto');
  var cipher = crypto.createCipher('aes256', key);
  var output = cipher.update(s, 'utf-8', 'base64');
  output += cipher.final('base64');

  return output;
}

function decryptText(s, key) {

  if (!s) {
    return null;
  }

  var crypto = require('crypto');
  var decipher = crypto.createDecipher('aes256', key);
  var output = decipher.update(s, 'base64', 'binary');
  output += decipher.final('binary');

  output = new Buffer(output, 'binary').toString('utf-8');

  return output;
}

function salt() {

  var crypto = require('crypto');
  var NUMBER_OF_RANDOM_BYTES = 35;
  var salt = new Buffer(crypto.randomBytes(NUMBER_OF_RANDOM_BYTES)).toString('base64');

  return salt;
}

function urlFriendly(b64) {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(new RegExp("=", "g"), '');
}