var vesperblob = require('../vesperblob.js');
var assert = require('assert');

suite('vesperblob', function() {

  var x = null;

  test('encryptedFolderName', function() {

    x = vesperblob.encryptedFolderName('brent@ranchero.com', '8*f#$l{fk"FjsA');
    assert.strictEqual(x, 'd4e960345c2df9c610b25a0ad0832f1e');
  });

  test('fileListWithBlobList', function() {

    x = [{
      name: 'foo',
      properties: {
        'Content-Type': 'image/jpeg',
        bar: 'baz'
      }
    }, {
      name: 'foo2',
      properties: {
        'Content-Type': 'image/png',
        barbaz: 'bazingle'
      }
    }];
    x = vesperblob.fileListWithBlobList(x);
    var fileList = [{
      name: 'foo',
      contentType: 'image/jpeg'
    }, {
      name: 'foo2',
      contentType: 'image/png'
    }];
    assert.strictEqual(JSON.stringify(x), JSON.stringify(fileList));
  });

});