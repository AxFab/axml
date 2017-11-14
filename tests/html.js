'use strict';
var axml = axml || require ('../axml.js'),
    niut = niut || require ('niut'),
    suite = niut.newSuite('To JsonMl test suite');

(function () {

  suite.test('Basic parsing of HTML', function (assert, done) {

    axml.readFile('tests/sample01.html', axml.HTML, function (err, result) {
      assert.isEquals(err, undefined);
      done();
    });
  });

})();

if (typeof module !== 'undefined' && module.exports) {// Node.js
  module.exports = suite;

  if (require.main === module) {
    niut.runner(suites, function(echec) {
      if (echec) throw new Error('CheckMate...');
    });
  }
}
