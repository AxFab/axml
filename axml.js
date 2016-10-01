/*!
    Axml
   Copyright 2014-2015 Fabien Bavent
  
    ---------------------------------------------------------------------

  All rights reserved.
  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  * Neither the name of the author nor of its contributors may be used to 
    endorse or promote products derived from this software without specific 
    prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND ANY
  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL THE REGENTS AND CONTRIBUTORS BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
'use strict';

var fs = fs || require('fs'),
    stream = stream || require('stream');

var axml = (function () {

  var SGML = {

    // Look for the next block on the buffer.
    nextBlock: function (chunk)
    {
      if (/^<!\[CDATA\[/.test(chunk)) {
        return { type: 'CDATA', size: chunk.indexOf(']]>') + 3, };
      } else if (/^<\?/.test(chunk)) {
        return { type: 'DECLARATION', size: chunk.indexOf('?>') + 2, };
      } else if (/^<!--/.test(chunk)) {
        return { type: 'COMMENT', size: chunk.indexOf('-->') + 3, };
      } else if (/^<!/.test(chunk)) {
        return { type: 'DOCTYPE', size: chunk.indexOf('>') + 1, };
      } else if (/^</.test(chunk)) {
        return { type: 'ELEMENT', size: chunk.indexOf('>') + 1, };
      } else {
        return { type: 'TEXT', size: chunk.indexOf('<'), };
      }
    },

    createText: function (chunk)
    {
      return { type: 'TEXT', size: chunk.length, litteral:chunk };
    },

    // Count the number of new-lines in a chunk of text.
    countLine: function(chunk)
    {
      var k = -1, l = 0;
      while ((k = chunk.indexOf("\n", k+1)) >= 0) {
        l++;
      }
      return l;
    },

    prepare: function(block) 
    {
      var text = block.litteral;
      // Check this is a close-tag '</name>'. 
      if (text[1] == '/') {
        block.name = text.substring(2, text.length - 1).replace(/^\s+|\s+$/g, '');
        block.closing = true;
        return;
      } 

      // Check that tag is closing itself:  '<name />'. 
      if (/\/>$/.test(text)) {
        block.closed = true;
      }

      // Split name and attributes
      text = text.substring(1, text.length - (block.closed ? 2 : 1));
      var k = text.indexOf (' ');
      block.name = (k > 0) ? text.substring (0, k) : text;
      block.attributes = {};
      if (k > 0) {
        var attributes = text.substring(k);
        block.attributes = SGML.attributes(attributes);
      }
    },

    attributes: function(string)
    {
      var attributes = {},
          value = '', // Last value read.
          variable = '', // Last variable read.
          scope = ''; // Symbol of parsing state.

      for (var i = 0; i < string.length; ++i) {
        if (scope == '=') {
          if (string[i] == '"') {
            scope = '"';
          } else if (string[i] == '\'') {
            scope = '\'';
          } else { 
            scope = ' ';
          }
        } else if (scope == '\'' || scope == '"' || scope == ' ') {
          if (string[i] == scope) {
            // Create the attribute.
            attributes[variable] = value; 
            variable = '';
            value = '';
            scope = null;
          } else {
            value += string[i]
          }
        } else if (string[i] == '=') {
          scope = '=';
        } else if (string[i] != ' ') {
          variable += string[i];
        } else if (variable != '') {
          variable = '';
          value = '';
          scope = null;
        }
      }
      return attributes;
    },

    decodeEscaped: function(text) {
      var escapes = { 
        '&amp;': '&',
      };
      return text.replace(/&[a-zA-Z0-9_]+;/g, function(code) {
        if (escapes[code]) {
          return escapes[code];
        }
        return code;
      });
    },

    encodeEscaped: function(text) {
      return text
        .replace(/\&/g, '&amp;');
    },
  };

  var JSONML = {

    create: function () {
      return { 
        cursor: null,
        root: null,
      };
    },

    compile: function (document) {
      return document.root[0];
    },

    TEXT: function (document, block) {
      var text = block.litteral.replace(/^\s+|\s+$/g, '');
      if (text === '') {
        return;
      }

      if (!document.cursor) {
        throw new SyntaxError('Insertion of text outside tags is forbidden.');
      }
      document.cursor.push (SGML.decodeEscaped(text));
    },

    ELEMENT: function (document, block) {

      if (!document.root) {
        document.cursor = document.root = [];
        document.stack = [];
      } else if (document.stack.length === 0) {
        console.warn ('Element found after the root element: ' + block.name);
      }

      if (block.closing) {
        if (document.cursor[0] !== block.name) {
          console.warn ('Wrong closing tag: ' + block.name);
        }
        document.stack.pop();
        if (document.stack.length > 0) {
          document.cursor = document.stack[document.stack.length - 1];
        }
        return;
      } 

      var node = [block.name];
      document.cursor.push (node);
      if (block.attributes) {
        node.push(block.attributes);
      }
      if (block.closed) {
        return;
      }

      document.cursor = node;
      document.stack.push(node);
    },

    CDATA: function (document, block) {
      var text = block.litteral;
      text = 'CDATA--' + text.substring(9, text.length - 3);
      if (!document.cursor) {
        throw new SyntaxError('Insertion of CDATA section outside tags is forbidden.');
      }
      document.cursor.push (text);
    },
  };

  var parserDico = {
    JSONML: JSONML,
  };

  var axml = function (options) 
  {
    this._super = stream.Transform
    stream.Transform.call (this)

    this.parser = options.parser || parserDico[options.parser] || JSONML;
    this.document = this.parser.create();
    this.buffer = '';
    this.row = 1;
  };

  axml.prototype = Object.create (stream.Transform.prototype);

  axml.prototype._transform = function(chunk, encoding, callback) {
    try {

      this.buffer += chunk.toString();
      for (;;) {
        var block = SGML.nextBlock(this.buffer);
        if (block.size <= 0) {
          return callback();
        }
        block.litteral = this.buffer.substring(0, block.size);
        this.buffer = this.buffer.substring(block.size);
        if (block.type === 'ELEMENT') {
          SGML.prepare(block);
        }
        if (this.parser[block.type]) {
          this.parser[block.type](this.document, block);
        }
        this.row += SGML.countLine(block.litteral);
      }
    } catch(ex) {
      console.error('Parsing error at line ' + this.row, ex);
      return callback(ex);
    }
  };

  axml.prototype._flush = function(callback) {
    var block = SGML.createText(this.buffer);
    this.buffer = '';
    if (this.parser[block.type]) {
      this.parser[block.type](this.document, block);
    }
    callback (null, this.parser.compile(this.document));
  };

  axml.prototype.getDocument = function() {
    if (this.compiled === null || this.compiled === undefined) {
      this.compiled = streamXml.parser.compile(streamXml.document);
    }
    return this.compiled;
  };

  axml.readFile = function (uri, callback) {
    var streamXml = new axml();
    var streamFs = fs.createReadStream (uri);
    streamXml.on('finish', function(err) {
      callback(err, streamXml.getDocument());
    });
    streamFs.pipe (streamXml);
  };

  axml.parse = function (text, options, callback) {
    var stream = new axml();
    var doc = null;
    stream._transform(text, options.encoding || 'utf-8', function() {
      stream._flush(function (err) {
        if (!err)
          doc = streamXml.getDocument();
        if (callback) {
          callback(err, doc);
        }
      });
    }); 
    return doc;
  };

  axml.stringify = function (data, options) {
    if (!options) {
      options = {};
    }
    var opt = {
      eol: options.eol || '\n',
      indent: options.indent || '  ',
      _indent: options._indent || '',
    };

    if (data === null || data === undefined) {
      return '';
    } else if (typeof data === 'string') {
      if (/^CDATA--/.test(data)) {
        return opt._indent + '<![CDATA[' + data.substring(7) + ']]>' + opt.eol;
      }
      return opt._indent + data + opt.eol;
    } 

    var xml = '';
    var attributes = '';
    var start = 1;
    // TODO -- replace last requirement by array testing
    if (data.length > 1 && typeof data[1] === 'object' && data[1].length === undefined) {
      attributes = ' ';
      start = 2;
      for (var k in data[1]) {
        attributes += k + '="' + data[1][k].toString() +'" ';
      }
    }

    if (data.length > start) {
      xml += opt._indent + '<' + data[0] + attributes + '>' + opt.eol;
      for (var i = start; i < data.length; ++i) {
        xml += axml.stringify(data[i], {
          depth: opt.depth+1,
          eol: opt.eol,
          indent: opt.indent,
          _indent: opt._indent + opt.indent,
        });
      }
      xml += opt._indent + '</' + data[0] + '>' + opt.eol;
    } else {
      xml += opt._indent + '<' + data[0] + attributes + '/>' + opt.eol;
    }
    return xml;
  };

  axml.setParser = function(name, parser) {
    if (parser === null || parser === undefined) {
      delete parserDico[name];
    } else {
      parserDico[name] = parser;
    } 
  };

  axml.JsonMl = (function () {

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

  return axml;
})();

if (typeof module !== 'undefined' && module.exports) {// Node.js
  module.exports = axml;
}
