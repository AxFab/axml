'use strict';
var niut = niut || require ('niut');

var suites = [
  __dirname + '/my-suite.js',
  __dirname + '/cdata.js',
  __dirname + '/html.js',
];

niut.runner(suites, function(echec) {
  if (echec) throw new Error('CheckMate...');
});
