var vesperuser = require('../vesperuser.js');
var q = require('../q.js');
var assert = require('assert');

suite('vesperuser', function() {

  var x = null;

  test('usernameIsValid', function() {

    assert.equal(vesperuser.usernameIsValid(null), false);
    assert.equal(vesperuser.usernameIsValid('brent ranchero.com'), false);
    assert.equal(vesperuser.usernameIsValid('brent@ranchero.com '), false);
    assert.equal(vesperuser.usernameIsValid('brent@ranchero.\tcom'), false);
    assert.equal(vesperuser.usernameIsValid('brent@ranchero.\rcom'), false);
    assert.equal(vesperuser.usernameIsValid('brent@ranchero.\ncom'), false);
    assert.equal(vesperuser.usernameIsValid('brent@rancherocom'), false);
    assert.equal(vesperuser.usernameIsValid('b@x.'), false);

    assert.equal(vesperuser.usernameIsValid('brent@ranchero.com'), true);
  });

  test('passwordIsValid', function() {

    assert.equal(vesperuser.passwordIsValid('123456'), false);
    assert.equal(vesperuser.passwordIsValid(''), false);
    assert.equal(vesperuser.passwordIsValid(null), false);

    assert.equal(vesperuser.passwordIsValid('KD94jkFE0#0%8'), true);
  });

  test('usernameAndPasswordFromAuthenticationString', function() {

    x = vesperuser.usernameAndPasswordFromAuthenticationString('Brent:foo');
    assert.strictEqual(x.username, 'brent');
    assert.strictEqual(x.password, 'foo');

    x = vesperuser.usernameAndPasswordFromAuthenticationString('Brent:');
    assert.strictEqual(x.username, 'brent');
    assert.strictEqual(x.password, '');

    x = vesperuser.usernameAndPasswordFromAuthenticationString('Brent:');
    assert.strictEqual(x.username, 'brent');
    assert.strictEqual(x.password, '');

    x = vesperuser.usernameAndPasswordFromAuthenticationString(':');
    assert.strictEqual(x.username, '');
    assert.strictEqual(x.password, '');

    x = vesperuser.usernameAndPasswordFromAuthenticationString('');
    assert.strictEqual(x.username, '');
    assert.strictEqual(x.password, '');

    x = vesperuser.usernameAndPasswordFromAuthenticationString('342345');
    assert.strictEqual(x.username, '342345');
    assert.strictEqual(x.password, '');

    x = vesperuser.usernameAndPasswordFromAuthenticationString('bre NT:foo:b6)-ar:b#az:1@@@!23');
    assert.strictEqual(x.username, 'bre nt');
    assert.strictEqual(x.password, 'foo:b6)-ar:b#az:1@@@!23');

    x = vesperuser.usernameAndPasswordFromAuthenticationString('brent@ranchero.com:alzer50#1gx');
    assert.strictEqual(x.username, 'brent@ranchero.com');
    assert.strictEqual(x.password, 'alzer50#1gx');
  });

  test('authenticatedShortUserIDWithRequestUser', function() {

    x = {
      level: 'unknown',
      userId: 'Foo:2'
    };
    x = vesperuser.authenticatedShortUserIDWithRequestUser(x);
    assert.strictEqual(!x, true);

    x = {
      level: 'authenticated',
      userId: 'Foo:2'
    };
    x = vesperuser.authenticatedShortUserIDWithRequestUser(x);
    assert.strictEqual(!x, true);

    x = {
      userId: 'Foo:2'
    };
    x = vesperuser.authenticatedShortUserIDWithRequestUser(x);
    assert.strictEqual(!x, true);

    x = {
      level: 'authenticated'
    };
    x = vesperuser.authenticatedShortUserIDWithRequestUser(x);
    assert.strictEqual(!x, true);

    x = {};
    x = vesperuser.authenticatedShortUserIDWithRequestUser(x);
    assert.strictEqual(!x, true);

    x = {
      level: 'unknown',
      userId: 'userId:2'
    };
    x = vesperuser.authenticatedShortUserIDWithRequestUser(x);
    assert.strictEqual(!x, true);

    x = {
      level: 'custom',
      userId: 'userId:29458940'
    };
    x = vesperuser.authenticatedShortUserIDWithRequestUser(x);
    assert.strictEqual(!x, true);

    x = {
      level: 'Custom',
      userId: 'userId:29458940'
    };
    x = vesperuser.authenticatedShortUserIDWithRequestUser(x);
    assert.strictEqual(!x, true);

    x = {
      level: 'authenticated',
      userId: 'userId:29458940'
    };
    x = vesperuser.authenticatedShortUserIDWithRequestUser(x);
    assert.strictEqual(!x, true);

    x = {
      level: 'authenticated',
      userId: 'Custom:29458940'
    };
    x = vesperuser.authenticatedShortUserIDWithRequestUser(x);
    assert.strictEqual(x, '29458940');
  });

  test('signature', function() {

    x = vesperuser.signature('this is a test', '48#8f90#lFKJLGA)-2@');
    assert.strictEqual(x, 'WkCMJOGffaO7Jcq6j8kQ69W4LWDdAtaq-GI4YGYuWpQ');

    x = vesperuser.signature('this is a test', '#09#$8FHu#89F;A+d9');
    assert.strictEqual(x, 'Av8pSth0pJTSaQK9zvCNzzrzWFYevgNbQt7oxyIi2M4');
  });

  test('hash', function(done) {

    setTimeout(vesperuser.hash('This is some text', '9etjko#$89#FP3+!@gfD:V,RF<', function(err, x) {
      assert.strictEqual(x, 'PR72+eMzlZJA4IEtURqfmNFiCyumIHcVmETvQvknaN0=');
      done();
    }), 100000);
  });

  test('tokenIsExpired', function() {

    x = {
      expirationDate: new Date('12-12-12')
    };
    assert.strictEqual(vesperuser.tokenIsExpired(x), true);

    x = {
      expirationDate: q.dateWithNumberOfHoursInTheFuture(new Date(), 24)
    };
    assert.strictEqual(vesperuser.tokenIsExpired(x), false);

    x = {
      expirationDate: q.dateWithNumberOfMinutesInTheFuture(new Date(), 256)
    };
    assert.strictEqual(vesperuser.tokenIsExpired(x), false);

  });
});