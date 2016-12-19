var vespersync = require('../vespersync.js');
var assert = require('assert');

suite('vespersync', function() {

  var x = null;

  test('dateWithJSONDate', function() {

    x = '2014-06-12T16:44:29.099-07:00';
    assert.notStrictEqual(+vespersync.dateWithJSONDate(x), +new Date("2012-12-12T12:00:00Z"));

    x = '2012-12-12T12:00:00Z';
    assert.strictEqual(+vespersync.dateWithJSONDate(x), +new Date("2012-12-12T12:00:00Z"));
  });

  test('syncDateFromRequest', function() {

    var request = {
      headers: {
        'x-vesper-synctoken': 'MToxNDAyNjE2NjY5MDk5'
      }
    };

    x = vespersync.syncDateFromRequest(request);
    assert.strictEqual(+x, +new Date('2014-06-12T16:44:29.099-07:00'));

    request = {
      headers: {}
    };
    
    x = vespersync.syncDateFromRequest(request);
    assert.strictEqual(+x, +new Date("2012-12-12T12:00:00Z"));
  });

  test('syncTokenWithDate', function() {

    x = new Date('2014-06-12T16:44:29.099-07:00');
    var syncToken = vespersync.syncTokenWithDate(x);

    assert.strictEqual(syncToken, 'MToxNDAyNjE2NjY5MDk5');
  });

  test('dateWithSyncToken', function() {

    x = vespersync.dateWithSyncToken('MToxNDAyNjE2NjY5MDk5');
    assert.strictEqual(+x, +new Date('2014-06-12T16:44:29.099-07:00'));
  });
});