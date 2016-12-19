var forgotpassword = require('../../api/forgotpassword.js');
var q = require('../q.js');
var assert = require('assert');

suite('forgotpassword', function() {

  var x = null;

  test('resetPasswordToken', function() {

    var expirationDate = new Date('Sat Jun 14 2014 20:40:05 GMT-0700 (PDT)');

    x = forgotpassword.resetPasswordToken(null, 'brent@ranchero.com', '49KJLE804jnEFL;089#P03', 'ALALAkfoeP#[]F*#"', expirationDate);
    assert.strictEqual(x, '8Kc19aDyrys2AQ47SNvTZI+mvT5/+2SSIOybT+zhfA1lnds3Psulx+6xINvo4xAPAMd2lMgiGp2OomjfTIUsFA==');
  });
});