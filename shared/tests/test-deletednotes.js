var deletednotes = require('../../api/deletednotes.js');
var q = require('../q.js');
var assert = require('assert');

suite('deletednotes', function() {

  var x = null;
  var d = null;

  test('deletedNotesForJSONDeletedNotes', function() {

    var noteIDs = [1148351690322167, 8987413, 118112030377662, 2966197815245956];
    x = deletednotes.deletedNotesForJSONDeletedNotes(noteIDs, 39423127264);
    assert.strictEqual(x[0].noteID, 1148351690322167);
    assert.strictEqual(x[1].noteID, 8987413);
    assert.strictEqual(x[2].noteID, 118112030377662);
    assert.strictEqual(x[3].noteID, 2966197815245956);
    assert.strictEqual(x[0].userID, 39423127264);
    assert.strictEqual(x[1].userID, 39423127264);
    assert.strictEqual(x[2].userID, 39423127264);
    assert.strictEqual(x[3].userID, 39423127264);

    d = x[0].serverModificationDate;
    assert.strictEqual(+d > +q.dateWithNumberOfMinutesInThePast(new Date(), 1), true);
    assert.strictEqual(+d < +q.dateWithNumberOfMinutesInTheFuture(new Date(), 1), true);
  });

  test('insertDeletedNotesBuildFunction', function() {

    d = new Date();
    x = {
      noteID: 2966197815245956,
      userID: 39423127264,
      serverModificationDate: d
    };
    x = deletednotes.insertDeletedNotesBuildFunction(null, x);
    assert.strictEqual(x.sql, 'INSERT into deletednotes (noteID, userID, serverModificationDate) values (?, ?, ?);');
    assert.strictEqual(x.parameters[0], 2966197815245956);
    assert.strictEqual(x.parameters[1], 39423127264);
    assert.strictEqual(x.parameters[2], d);
  });
});