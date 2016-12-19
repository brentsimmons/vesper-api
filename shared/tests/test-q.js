var q = require('../q.js');
var assert = require('assert');

suite('q', function() {

  var x = null;

  test('base64Encode', function() {

    x = q.base64Encode('Brent');
    assert.strictEqual(x, 'QnJlbnQ=');

    x = q.base64Encode('Brént');
    assert.strictEqual(x, 'QnLDqW50');
  });

  test('base64Decode', function() {

    x = q.base64Decode('QnLDqW50');
    assert.strictEqual(x, 'Brént');

    x = q.base64Decode('QnJlbnQ=');
    assert.strictEqual(x, 'Brent');
  });

  test('slowEquals', function() {

    assert.strictEqual(q.slowEquals('Brént', 'Brént'), true);
    assert.strictEqual(q.slowEquals('123456789î', '123456789î'), true);

    assert.strictEqual(q.slowEquals('123456789î', '12345î'), false);
    assert.strictEqual(q.slowEquals('Brent', 'Brént'), false);
    assert.strictEqual(q.slowEquals('123', '456'), false);
  });

  test('isEmpty', function() {

    assert.strictEqual(q.isEmpty(''), true);
    x = null;
    assert.strictEqual(q.isEmpty(x), true);
    assert.strictEqual(q.isEmpty([]), true);
    assert.strictEqual(q.isEmpty(' '), false);
    assert.strictEqual(q.isEmpty([0]), false);
  });

  test('dateWithNumberOfMinutesInThePast', function() {

    x = q.dateWithNumberOfMinutesInThePast(new Date(), 10);
    assert.strictEqual(x < new Date(), true);

    x = q.dateWithNumberOfMinutesInThePast(new Date('12-12-12 12:10:00'), 10);
    assert.strictEqual(+x, +new Date('12-12-12 12:00:00'));
  });

  test('dateWithNumberOfMinutesInTheFuture', function() {

    x = q.dateWithNumberOfMinutesInTheFuture(new Date(), 10);
    assert.strictEqual(x > new Date(), true);

    x = q.dateWithNumberOfMinutesInTheFuture(new Date('12-12-12 12:10:00'), 10);
    assert.strictEqual(+x, +new Date('12-12-12 12:20:00'));
  });

  test('dateWithNumberOfMinutesInTheFuture', function() {

    x = q.dateWithNumberOfHoursInTheFuture(new Date(), 10);
    assert.strictEqual(x > new Date(), true);

    x = q.dateWithNumberOfHoursInTheFuture(new Date('12-12-12 12:00:00'), 10);
    assert.strictEqual(+x, +new Date('12-12-12 22:00:00'));
  });

  test('dateWithNumberOfDaysInTheFuture', function() {

    x = q.dateWithNumberOfDaysInTheFuture(new Date(), 10);
    assert.strictEqual(x > new Date(), true);

    x = q.dateWithNumberOfDaysInTheFuture(new Date('12-12-12 22:00:00'), 10);
    assert.strictEqual(+x, +new Date('12-22-12 22:00:00'));
  });

  test('unixTenDigitTimestampWithDate', function() {

    x = new Date('Sat Jun 14 2014 20:40:05 GMT-0700 (PDT)');
    assert.strictEqual(q.unixTenDigitTimestampWithDate(x), 1402803605);
  });

  test('salt', function() {

    x = q.salt();
    assert.strictEqual(x.length >= 35, true);
  });

  test('urlFriendly', function() {

    x = 'OTR=qZjA0d+3dqRjA5/=';
    x = q.urlFriendly(x);
    assert.strictEqual(x, 'OTRqZjA0d-3dqRjA5_');
  });

  test('encryptText', function() {

    x = q.encryptText('These are the times that try men’s souls.', 'ed9Fkl$#9EF][ELkf9#"a');
    assert.strictEqual(x, 'tG/JywvU6EDNLdyXjcA1+kgEOsMtz0wEfpaCi/jSbLbFzgSpklKendzDqaUSqHMT');
  });

  test('decryptText', function() {

    var key = 'dsfap(4303F"]{f';
    x = q.encryptText('They were the worst of times, they were the best of times.', key);
    x = q.decryptText(x, key);
    assert.strictEqual(x, 'They were the worst of times, they were the best of times.');

    x = q.decryptText('tG/JywvU6EDNLdyXjcA1+kgEOsMtz0wEfpaCi/jSbLbFzgSpklKendzDqaUSqHMT', 'ed9Fkl$#9EF][ELkf9#"a');
    assert.strictEqual(x, 'These are the times that try men’s souls.');
  });

});