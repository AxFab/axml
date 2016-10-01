'use strict';
var niut = niut || require ('niut'),
    suite = niut.newSuite('My Test Suite');

(function () {

  suite.test('Mon Test', function (assert, done) {

    assert.isTrue(true);
    done();
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
