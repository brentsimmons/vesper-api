var notes = require('../../api/notes.js');
var q = require('../q.js');
var assert = require('assert');

suite('notes', function() {

  var x = null;
  var incomingNote = null;
  var existingNote = null;

  var now = new Date();
  var past = q.dateWithNumberOfMinutesInThePast(now, 1);
  var future = q.dateWithNumberOfMinutesInTheFuture(now, 1);

  test('mergeOneProperty', function() {

    incomingNote = {
      id: 23458345,
      text: 'This is some text',
      textModificationDate: past
    };
    existingNote = {
      id: 23458345,
      text: 'This is some new text',
      textModificationDate: future
    };
    
    x = notes.mergeOneProperty(incomingNote, existingNote, 'text');
    assert.strictEqual(x, false);
    
    incomingNote.textModificationDate = now;
    existingNote.textModificationDate = past;
    x = notes.mergeOneProperty(incomingNote, existingNote, 'text');
    assert.strictEqual(x, true);
  });
});