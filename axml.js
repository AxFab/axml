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

(function () {
  var previous_mod, root = this
  if (root != null)
    previous_mod = root.axml
  
// Dependancies ===========================================================
  var fs = root.fs
  if( typeof fs === 'undefined' ) {
    if( typeof require !== 'undefined' ) {
      fs = require('fs')
    }
    else throw new Error('axml requires fs');
  }

  var stream = root.stream
  if( typeof stream === 'undefined' ) {
    if( typeof require !== 'undefined' ) {
      stream = require('stream')
    }
    else throw new Error('axml requires stream');
  }

// String extentions ======================================================

  String.prototype.trim=function() {
    return this.replace(/^\s+|\s+$/g, '');
  }

  // ----------------------------------------------------------------------
  String.prototype.ltrim=function() {
    return this.replace(/^\s+/,'');
  }

  // ----------------------------------------------------------------------
  String.prototype.rtrim=function() {
    return this.replace(/\s+$/,'');
  }

  // ----------------------------------------------------------------------
  String.prototype.fulltrim=function() {
    return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');
  }

  // ----------------------------------------------------------------------
  String.prototype.startswith=function(str) {
    return this.substring(0, str.length) == str;
  }

  // ----------------------------------------------------------------------
  String.prototype.endswith=function(str) {
    return this.substring(this.length - str.length, this.length) == str;
  }


// Module axml =========================================================

  var axml = function (options) {
    if (!(this instanceof axml))
      return new axml(options);

    this.super_ = stream.Transform
    stream.Transform.call (this)
    this._init (options)
  }

  // ======================================================================
  axml.prototype = Object.create (stream.Transform.prototype, {})

  // ----------------------------------------------------------------------
  axml.prototype._transform = function(chunk, encoding, callback) {

    var countLine = function(str) {
      if (!this.line)
        this.line = 1
      var k = -1, l = 0
      while ((k = str.indexOf("\n", k+1)) >= 0) l++;
      return l;
    }

    var stBy = function (txt, sfx) {
      return txt.startswith (sfx)
    }

    var eTo = function (txt, pfx) {
      var k = 0
      while (!txt.substring(0,k).endswith (pfx) && txt.length > k) k++;
      return txt.length > k ? k : null
    }

    try {
      if (!this.data)
        this.data = ''
      var txt = this.data + chunk.toString()
      var l;
      for (; ; ) {
        if (stBy (txt, '<![CDATA['))  l = { k:eTo(txt, ']]>'), t:'CDATA' }
        else if (stBy (txt, '<?'))    l = { k:eTo(txt, '?>'), t:'DECLARATION' }
        else if (stBy (txt, '<!--'))  l = { k:eTo(txt, '-->'), t:'COMMENT' }
        else if (stBy (txt, '<!'))    l = { k:eTo(txt, '>'), t:'DOCTYPE' }
        else if (stBy (txt, '<'))     l = { k:eTo(txt, '>'), t:'ELEMENT' }
        else  l = { k:eTo(txt, '<')-1, t:'TEXT' }

        if (l.k > 0) {
          l.s = txt.substring (0, l.k)
          txt = txt.substring (l.k)
          var line = countLine (l.s);
          // console.log (l)
          if (this[l.t])
            this[l.t] (this, l);
          this.line += line;

        } else {
          this.data = txt
          callback ()
          return
        }
      }
    } catch (e) {
      console.log ('parsing error at: ' + this.line, e)
      callback (e)
    }
  }

  // ----------------------------------------------------------------------
  axml.prototype._flush = function(callback) {
    callback (null, this.top)
  }

  // ----------------------------------------------------------------------
  axml.prototype._init = function (opt) {
    if (!opt) opt = {}
    this.TEXT = opt.TEXT || axml.JSONML_TEXT
    this.ELEMENT = opt.ELEMENT || axml.JSONML_ELEMENT
    this.COMMENT = opt.COMMENT
    this.DECLARATION = opt.DECLARATION
    this.DOCTYPE = opt.DOCTYPE
  }

  // ======================================================================
  axml.readFile = function (uri, callback) {
    var streamXml = new axml()
    var streamFs = fs.createReadStream (uri)
    streamXml.on('finish', function(err) {
      callback(err, streamXml.top)
    })
    streamFs.pipe (streamXml)
  }

  // ======================================================================
  axml.JSONML_TEXT = function (prv, node) {
    if (!prv.content) 
      prv.content = []
    if (prv.current && node.s.trim() != '')
      prv.current.push (node.s)
  }

  // ----------------------------------------------------------------------
  axml.JSONML_ELEMENT = function (prv, node) {

    if (!prv.content) 
      prv.content = []

    if (!prv.stack) 
      prv.stack = []

    if (node.s.endswith('/>'))
      node.closed = true

    if (node.s[1] == '/') {
      node.name = node.s.substring(2, node.s.length - 1).trim()

      if (prv.current[0] != node.name)
        console.warn ('Wrong closing tag: ' + node.name + ' at ' + prv.line );
      prv.stack.pop()
      prv.current =  prv.stack[prv.stack.length-1]
      return
    }

    node.n = node.s.substring (1, node.s.length - (node.closed ? 2 : 1))
    var k = node.n.indexOf (' ')
    node.name = (k > 0) ? node.n.substring (0, k) : node.n

    var newNode = [node.name]

    if (k > 0) {
      node.attr = node.n.substring (k)
      // PARSE ATTR
      var attributes = axml.parseAttributes (node.attr)
      newNode.push (attributes)
    }

    // console.log (newNode, prv.stack)
    if (node.closed)
      prv.current.push (newNode)
    else {

      if (!prv.top) {
        prv.top = newNode
        prv.current = newNode
      } else {
        prv.current.push (newNode)
      }

      prv.current = newNode
      prv.stack.push (prv.current)
    }
  }

  // ======================================================================
  axml.parseAttributes = function (string) {
    var attrs = {}
    var value = ''
    var variable = ''
    var scope

    for (var i=0; i < string.length; ++i) {
      if (scope == '=') {
        if (string[i] == '"') scope = '"'
        else if (string[i] == '\'') scope = '\''
        else console.log ('ERROR ' , string[i])
      } else if (scope == '\'' || scope == '"') {
        if (string[i] == scope) {
          attrs [variable] = value
          variable = ''
          value = ''
          scope = null
        } else
          value += string[i]

      } else if (string[i] == '=') {
        scope = '='
      } else if (string[i] != ' ') {
        variable += string[i]
      } else if (variable != '') {
        variable = ''
        value = ''
        scope = null
      }
    }
    return attrs;
  }

  // ----------------------------------------------------------------------
  axml.stringify = function (data, opt) {
    var str = ''
    var attr = '' 

    if (opt == null) {
      opt = {
        depth:0, eol:'\n', tabs:'  ',
      }
    } else {
      if (opt.depth == null) opt.depth = 0
      if (opt.eol == null) opt.eol = '\n'
      if (opt.tabs == null) opt.tabs = '  '
    }

    opt.depthPadding = ''
    if (opt.tabs !== false) {
      for (var i=0; i<opt.depth; ++i)
        opt.depthPadding += tabs
    }
    
    if (typeof data === 'string') {
      return opt.depthPadding + data + opt.eol
    }

    if (data == null) {
      return ''
    }

    if (data.length > 1 && typeof data[1] === 'object' && data[1].length == null) {
      attr += ' '
      for (var k in data[1])
        attr += k + '="'+ data[1][k].toString() +'" '
    }

    var haschild = (data.length > 1 && (typeof data[1] !== 'object' || data[1].length != null)) || data.length > 2
    // console.log (data.length, data[1], data[1].length, haschild)

    if (haschild) {
      str += opt.depthPadding + '<' + data[0] + attr + '>' + opt.eol
      var st = attr == '' ? 1 : 2
      for (var i=st; i<data.length; ++i)
        str += axml.stringify (data[i], { depth:opt.depth+1, eol:opt.eol})
      str += opt.depthPadding + '</' + data[0] + '>' + opt.eol
    } else {
      str += opt.depthPadding + '<' + data[0] + attr + '/>' + opt.eol
    }

    return str
  }

  // Helper function ======================================================
  axml.start = function (data) {
    if (Object.prototype.toString.call(data) !== '[object Array]' || 
        typeof data[0] !== 'string')
      throw new Error('Type error, this is not a JsonML Element')
    if (Object.prototype.toString.call(data[1]) !== '[object Object]')
      return 2
    return 1
  }

  // ----------------------------------------------------------------------
  axml.name = function (data) {
    if (Object.prototype.toString.call(data) !== '[object Array]' || 
        typeof data[0] !== 'string')
      throw new Error('Type error, this is not a JsonML Element')
    return data[0]
  }

  // ----------------------------------------------------------------------
  axml.attributes = function (data) {
    if (Object.prototype.toString.call(data) !== '[object Array]' || 
        typeof data[0] !== 'string')
      throw new Error('Type error, this is not a JsonML Element')
    if (Object.prototype.toString.call(data[1]) !== '[object Object]')
      return data[1]
    return {}
  }

  // ----------------------------------------------------------------------
  axml.istag = function (data) {
    return Object.prototype.toString.call(data) !== '[object Array]' && 
        typeof data[0] !== 'string'
  }

  // ----------------------------------------------------------------------
  axml.istext = function (data) {
    return typeof data !== 'string'
  }

// Export the module ======================================================
  axml.noConflict = function () {
    root.axml = previous_mod
    return axml
  }

  if (typeof module !== 'undefined' && module.exports) // Node.js
    module.exports = axml
  else if (typeof exports !== 'undefined')
    exports = module.exports = axml
  else if (typeof define !== 'undefined' && define.amd) // AMD / RequireJS
    define([], function () { return axml })
  else // Browser
    root.axml = axml
  
}).call(this)

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
