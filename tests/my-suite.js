'use strict';
var axml = axml || require ('../axml.js'),
    niut = niut || require ('niut'),
    suite = niut.newSuite('To JsonMl test suite');

(function () {

  var wayAndBack = function(assert, done, xml, jsonml, final) {
    if (!final) final = xml;
    var result = axml.parse(xml, {});
    assert.isEquals(JSON.stringify(jsonml), JSON.stringify(result));
    assert.isEquals(final, axml.stringify(result));
    done();
  };

  suite.test('Simple parse and stringify', function (assert, done) {
    var xml = 
      '<person created="2006-11-11T19:23" modified="2006-12-31T23:59">\n' +
      '  <firstName>Robert</firstName>\n' +
      '  <lastName>Smith</lastName>\n' +
      '  <address type="home">\n' +
      '    <street>12345 Sixth Ave</street>\n' +
      '    <city>Anytown</city>\n' +
      '    <state>CA</state>\n' +
      '    <postalCode>98765-4321</postalCode>\n' +
      '  </address>\n' +
      '</person>\n';
    var jsonml = 
      ["person",
        {"created":"2006-11-11T19:23", "modified":"2006-12-31T23:59"},
        ["firstName", "Robert"],
        ["lastName", "Smith"],
        ["address", 
          {"type":"home"},
          ["street", "12345 Sixth Ave"],
          ["city", "Anytown"],
          ["state", "CA"],
          ["postalCode", "98765-4321"]
        ]
      ];
    wayAndBack(assert, done, xml, jsonml);
  });

  suite.test('Comment, Escape and Closed tags', function (assert, done) {
    var xml = 
      '<?xml version="1.0" ?>\n' + 
      '<person name="Paul"  >\n' +
      '  <information />\n' +
      '  <contact/>\n' +
      '  <employer>' +
      '    <!-- The name of the compagny -->\n' +
      '    Richmond &amp; Co.\n' +
      '  </employer>\n' +
      '</person>\n';
    var jsonml = 
      ["person",
        {"name":"Paul"},
        ["information"],
        ["contact"],
        ["employer", "Richmond & Co." ]
      ];
    var result = 
      '<person name="Paul">\n' +
      '  <information/>\n' +
      '  <contact/>\n' +
      '  <employer>Richmond &amp; Co.</employer>\n' +
      '</person>\n';
    wayAndBack(assert, done, xml, jsonml, result);
  });


  suite.test('Cross text and tags', function (assert, done) {
    var xml = 
      '<?xml version="1.0" ?>\n' + 
      '<paragraphe author="John Ruskin" >\n' +
      '  La suprême récompense du <strong>travail</strong>' +
      '  n\'est pas ce qu\'il vous <emphasis>permet de gagner</emphasis>, mais ce qu\'il' +
      ' vous permet de <strong>devenir</strong>.' +
      '</paragraphe>\n';
    var jsonml = 
      ["paragraphe",
        {"author":"John Ruskin"},
        "La suprême récompense du",
        ["strong", "travail"],
        "n\'est pas ce qu\'il vous",
        ["emphasis", "permet de gagner"],
        ", mais ce qu\'il vous permet de",
        ["strong", "devenir"],
        "."
      ];
    var result = 
      '<paragraphe author="John Ruskin">\n' +
      '  La suprême récompense du\n'+ 
      '  <strong>travail</strong>\n' +
      '  n\'est pas ce qu\'il vous\n' +
      '  <emphasis>permet de gagner</emphasis>\n' +
      '  , mais ce qu\'il vous permet de\n' +
      '  <strong>devenir</strong>\n' +
      '  .\n' +
      '</paragraphe>\n';
    wayAndBack(assert, done, xml, jsonml, result);
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
