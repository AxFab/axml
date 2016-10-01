'use strict';

var JsonMlHelper = (function () {

  var JsonMlHelper = {};

  JsonMlHelper.start = function (data) {
    if (Object.prototype.toString.call(data) !== '[object Array]' || 
        typeof data[0] !== 'string')
      throw new Error('Type error, this is not a JsonML Element');
    if (Object.prototype.toString.call(data[1]) !== '[object Object]')
      return 2;
    return 1;
  };

  JsonMlHelper.name = function (data) {
    if (Object.prototype.toString.call(data) !== '[object Array]' || 
        typeof data[0] !== 'string')
      throw new Error('Type error, this is not a JsonML Element');
    return data[0];
  }

  JsonMlHelper.attributes = function (data) {
    if (Object.prototype.toString.call(data) !== '[object Array]' || 
        typeof data[0] !== 'string')
      throw new Error('Type error, this is not a JsonML Element');
    if (Object.prototype.toString.call(data[1]) !== '[object Object]')
      return data[1];
    return {};
  };

  JsonMlHelper.istag = function (data) {
    return Object.prototype.toString.call(data) !== '[object Array]' && 
        typeof data[0] !== 'string';
  };

  JsonMlHelper.istext = function (data) {
    return typeof data !== 'string';
  };

  JsonMlHelper.foreach = function (data, callback) {
    if (Object.prototype.toString.call(data) !== '[object Array]' || 
        typeof data[0] !== 'string')
      throw new Error('Type error, this is not a JsonML Element');

    for (var i=axml.start(data); i<data.length; ++i)
      callback (data[i]);
  };

  JsonMlHelper.elements = function (data, name, callback) {
    // name is optional
    if (callback == null) { callback = name; name = null; } 

    axml.foreach (data, function (child) {
      if (axml.istag(data[i]) && (name == null || axml.name(child) == name))
        callback (child);
    });
  };

  return JsonMlHelper;
})();

if (typeof module !== 'undefined' && module.exports) {// Node.js
  module.exports = JsonMlHelper;
}
