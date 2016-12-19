var tags = require('../../api/tags.js');
var q = require('../q.js');
var assert = require('assert');

suite('tags', function() {

  var x = null;

  test('mergeTag', function() {

    var now = new Date();
    var past = q.dateWithNumberOfMinutesInThePast(now, 1);
    var future = q.dateWithNumberOfMinutesInTheFuture(now, 1);

    var incomingTag = {
      name: 'A Tag',
      uniqueID: 'a tag',
      nameModificationDate: now,
      userID: 482438
    };
    var existingTag = {
      name: 'a Tag',
      uniqueID: 'a tag',
      nameModificationDate: past,
      userID: 482438,
      id: 93925752984567
    };

    x = tags.mergeTag(incomingTag, existingTag);
    assert.strictEqual(x.tagToUpdateInDatabase.name, 'A Tag');
    assert.strictEqual(x.tagToUpdateInDatabase.uniqueID, 'a tag');
    assert.strictEqual(x.tagToUpdateInDatabase.nameModificationDate, now);
    assert.strictEqual(x.tagToUpdateInDatabase.userID, 482438);
    assert.strictEqual(x.tagToUpdateInDatabase.id, 93925752984567);

    existingTag.nameModificationDate = future;
    x = tags.mergeTag(incomingTag, existingTag);
    assert.strictEqual(x.mergedTag.name, 'a Tag');
    assert.strictEqual(x.mergedTag.uniqueID, 'a tag');
    assert.strictEqual(x.mergedTag.nameModificationDate, future);
    assert.strictEqual(x.mergedTag.userID, 482438);
    assert.strictEqual(x.mergedTag.id, 93925752984567);
  });
});