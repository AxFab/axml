'use strict';
var niut = niut || require ('niut');

var suites = [
  __dirname + '/my-suite.js'
];

niut.runner(suites, function(echec) {
  if (echec) throw new Error('CheckMate...');
});
