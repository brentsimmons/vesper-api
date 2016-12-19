var vespersql = require('../vespersql.js');
var assert = require('assert');

suite('vespersql', function() {

  var x = null;

  test('collectionMappedToUniqueID', function() {

    var notes = [{
      uniqueID: 10,
      text: 'Some text'
    }, {
      uniqueID: 12,
      text: 'Some more text'
    }, {
      uniqueID: 40040404,
      text: 'Text, yep'
    }, {
      uniqueID: 34345799,
      text: 'More text'
    }];

    var mappedNotes = vespersql.collectionMappedToUniqueID(notes);

    assert.strictEqual(mappedNotes[34345799].text, 'More text');
    assert.strictEqual(mappedNotes[10].text, 'Some text');
    assert.strictEqual(mappedNotes[12].text, 'Some more text');
    assert.strictEqual(mappedNotes[40040404].text, 'Text, yep');
  });

  test('collectionMappedToProperty', function() {

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

    var mappedNotes = vespersql.collectionMappedToProperty(notes, 'noteID');

    assert.strictEqual(mappedNotes[34345799].text, 'More text');
    assert.strictEqual(mappedNotes[10].text, 'Some text');
    assert.strictEqual(mappedNotes[12].text, 'Some more text');
    assert.strictEqual(mappedNotes[40040404].text, 'Text, yep');
  });

  test('propertiesForObjects', function() {

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

    var noteIDs = vespersql.propertiesForObjects(notes, 'noteID');

    assert.notStrictEqual(noteIDs.indexOf(34345799), -1);
    assert.notStrictEqual(noteIDs.indexOf(10), -1);
    assert.notStrictEqual(noteIDs.indexOf(12), -1);
    assert.notStrictEqual(noteIDs.indexOf(40040404), -1);

    assert.strictEqual(noteIDs.indexOf(5), -1);
    assert.strictEqual(noteIDs.indexOf('foo'), -1);

    assert.strictEqual(noteIDs.length, 4);
  });

  test('uniqueIDsForObjects', function() {

    var notes = [{
      uniqueID: 10,
      text: 'Some text'
    }, {
      uniqueID: 12,
      text: 'Some more text'
    }, {
      uniqueID: 40040404,
      text: 'Text, yep'
    }, {
      noteID: 34345799,
      text: 'More text'
    }];

    var noteIDs = vespersql.uniqueIDsForObjects(notes, 'noteID');

    assert.notStrictEqual(noteIDs.indexOf(10), -1);
    assert.notStrictEqual(noteIDs.indexOf(12), -1);
    assert.notStrictEqual(noteIDs.indexOf(40040404), -1);

    assert.strictEqual(noteIDs.indexOf(5), -1);
    assert.strictEqual(noteIDs.indexOf(34345799), -1);
    assert.strictEqual(noteIDs.indexOf('foo'), -1);

    assert.strictEqual(noteIDs.length, 4); /*one item will be undefined*/
  });

  test('objectInArrayWithUniqueID', function() {

    var notes = [{
      uniqueID: 10,
      text: 'Some text'
    }, {
      uniqueID: 12,
      text: 'Some more text'
    }, {
      uniqueID: 40040404,
      text: 'Text, yep'
    }, {
      noteID: 34345799,
      text: 'More text'
    }];

    x = vespersql.objectInArrayWithUniqueID(notes, 40040404);
    assert.strictEqual(x.text, 'Text, yep');

    x = vespersql.objectInArrayWithUniqueID(notes, 5);
    assert.strictEqual(!x, true);
  });

  test('buildSQLAndParameters', function() {

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

    function testBuildFunction(request, oneNote) {
      var sql = 'INSERT into notes (noteID, text) values (?, ?);';
      var parameters = [oneNote.noteID, oneNote.text];

      return {
        sql: sql,
        parameters: parameters
      };

    }

    x = vespersql.buildSQLAndParameters(null, notes, testBuildFunction);

    var expectedText = "BEGIN TRANSACTION;SET NOCOUNT ON;INSERT into notes (noteID, text) values (?, ?);INSERT into notes (noteID, text) values (?, ?);INSERT into notes (noteID, text) values (?, ?);INSERT into notes (noteID, text) values (?, ?);COMMIT TRANSACTION;";
    assert.strictEqual(expectedText, x.sql);

    var expectedParameters = [10, 'Some text', 12, 'Some more text', 40040404, 'Text, yep', 34345799, 'More text'];
    assert.strictEqual(JSON.stringify(expectedParameters), JSON.stringify(x.parameters));
  });
});