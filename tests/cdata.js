'use strict';
var axml = axml || require ('../axml.js'),
    niut = niut || require ('niut'),
    suite = niut.newSuite('To JsonMl test suite');

(function () {

  suite.test('Simple parsing with CDATA', function (assert, done) {
    var jsonml = [
      'sample',
      ['description', 'An example of escaped CENDs'],
      ['data', 'CDATA--This text contains a CEND ]]','CDATA-->'],
      ['alternative', 'CDATA--This text contains a CEND ]','CDATA--]>'],
    ];

    axml.readFile(__dirname + '/sample03.xml', function (err, result) {
      assert.isEquals(JSON.stringify(jsonml), JSON.stringify(result));
      done();
    });
  });
  // TODO -- CDATA, DOCTYPE, Errors, readFile, setParser

})();

if (typeof module !== 'undefined' && module.exports) {// Node.js
  module.exports = suite;

  if (require.main === module) {
    niut.runner(suites, function(echec) {
      if (echec) throw new Error('CheckMate...');
    });
  }
}
