var vespernotes = require('../vespernotes.js');
var assert = require('assert');

suite('vespernotes', function() {

  var x = null;

  test('notesMinusDeletedNotes', function() {

    var deletedNoteIDs = [12, 435023459, 34345799];
    var notes = [{
      noteID: 10,
      text: 'Some text'
    }, {
      noteID: 12,
      text: 'Some more text'
    }, {
      noteID: 40040404,
      text: 'Text, yep'
    }, {
      noteID: 34345799,
      text: 'More text'
    }];

    x = vespernotes.notesMinusDeletedNotes(notes, deletedNoteIDs);
    var expectedResult = [{
      noteID: 10,
      text: 'Some text'
    }, {
      noteID: 40040404,
      text: 'Text, yep'
    }];

    assert.strictEqual(JSON.stringify(x), JSON.stringify(expectedResult));
  });

});