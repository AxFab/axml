
var axml = require('../axml.js')

exports.testSomething = function(test) {
    var stream = new axml()
    // test.expect(1)
    test.ok(stream != null, "this assertion should pass")
    test.done()
}


