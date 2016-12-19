var vespertags = require('../vespertags.js');
var vespersync = require('../vespersync.js');
var assert = require('assert');

suite('vespertags', function() {

  var x = null;

  test('tagsForJSONTags', function() {

    var JSONTags = [{
      name: 'A Tag',
      id: 4569876,
      uniqueID: 'a tag'
    }, {
      name: 'Another Tag',
      nameModificationDate: new Date('2013-07-12T16:34:29.039-07:00'),
      id: 234234,
      uniqueID: 'another tag'
    }];

    x = vespertags.tagsForJSONTags(JSONTags, '345234');
    
    assert.strictEqual(x.length, 2);
    var tag = x[0];
    assert.strictEqual(tag.id, 4569876);
    assert.strictEqual(tag.uniqueID, 'a tag');
    assert.strictEqual(tag.nameModificationDate, vespersync.oldDate);
    
    tag = x[1];
    assert.strictEqual(tag.id, 234234);
    assert.strictEqual(tag.name, 'Another Tag');
    assert.strictEqual(+tag.nameModificationDate, +new Date('2013-07-12T16:34:29.039-07:00'));
  });

  test('tagsMissingFromOtherTags', function() {

    var tags = [{
      name: 'A Tag',
      nameModificationDate: new Date('2014-07-12T16:34:29.039-07:00'),
      id: 4569876,
      uniqueID: 'a tag'
    }, {
      name: 'Another Tag',
      nameModificationDate: new Date('2013-07-12T16:34:29.039-07:00'),
      id: 234234,
      uniqueID: 'another tag'
    }];

    var otherTags = [{
      name: 'A Tag',
      nameModificationDate: new Date('2014-07-12T16:34:29.039-07:00'),
      id: 4569876,
      uniqueID: 'a tag'
    }, {
      name: 'Some other tag',
      nameModificationDate: new Date('2015-07-12T16:34:29.039-07:00'),
      id: 6546135564,
      uniqueID: 'some other tag'
    }];

    x = vespertags.tagsMissingFromOtherTags(tags, otherTags);
    assert.strictEqual(x.length, 1);
    assert.strictEqual(x[0], tags[1]);
  });

  test('updateTagsBuildFunction', function() {

    x = {
      name: 'a tag',
      nameModificationDate: new Date('2014-07-12T16:34:29.039-07:00'),
      id: 4569876,
    };

    x = vespertags.updateTagsBuildFunction(null, x);
    assert.strictEqual(x.sql, 'UPDATE tags SET name=?, nameModificationDate=? WHERE id=?;');

    assert.strictEqual(x.parameters[0], 'a tag');
    assert.strictEqual(+x.parameters[1], +new Date('2014-07-12T16:34:29.039-07:00'));
    assert.strictEqual(x.parameters[2], 4569876);
  });

  test('insertTagsBuildFunction', function() {

    x = {
      name: 'A Tag',
      nameModificationDate: new Date('2014-06-12T16:44:29.099-07:00'),
      uniqueID: 'a tag',
      userID: 1020358490
    };

    x = vespertags.insertTagsBuildFunction(null, x);
    assert.strictEqual(x.sql, 'INSERT into tags (userID, uniqueID, name, nameModificationDate) values (?, ?, ?, ?);');

    assert.strictEqual(x.parameters[0], 1020358490);
    assert.strictEqual(x.parameters[1], 'a tag');
    assert.strictEqual(x.parameters[2], 'A Tag');
    assert.strictEqual(+x.parameters[3], +new Date('2014-06-12T16:44:29.099-07:00'));
  });
});