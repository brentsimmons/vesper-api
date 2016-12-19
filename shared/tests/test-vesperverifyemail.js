var vesperverifyemail = require('../vesperverifyemail.js');
var q = require('../q.js');
var assert = require('assert');

suite('verifyemail', function() {

  var x = null;

  test('verifyEmailToken', function() {

    x = vesperverifyemail.verifyEmailToken(null, 'brent@ranchero.com', '340EF904uh$FE9834AFh+');
    assert.strictEqual(x, 'MxrH0f0AaTuXzPTrJm.JswVj60Pb0x.LsSTeUZqyu.E-');
  });

  test('decryptedVerifyEmailToken', function() {

    x = vesperverifyemail.decryptedVerifyEmailToken(null, 'MxrH0f0AaTuXzPTrJm.JswVj60Pb0x.LsSTeUZqyu.E-', '340EF904uh$FE9834AFh+');
    assert.strictEqual(x, 'brent@ranchero.com');
  });

  test('verifyEmailURL', function() {

    x = vesperverifyemail.verifyEmailURL(null, 'brent@ranchero.com', 'https://accounts.vesperapp.co/verify/', '340EF904uh$FE9834AFh+');
    assert.strictEqual(x, 'https://accounts.vesperapp.co/verify/MxrH0f0AaTuXzPTrJm.JswVj60Pb0x.LsSTeUZqyu.E-')

  });
});