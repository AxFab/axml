
#Axml

Xml parser and serializer, JsonML.

[![Npm version](https://badge.fury.io/js/axml.svg)](1) 
&nbsp; 
[![Build Status](https://api.travis-ci.org/AxFab/axml.svg?branch=master)](2)

## Overview

Axml is a simple xml converter. It convert Xml to JsonML form which is easier 
to manipulate using javascript.
JsonML is a makup language used to map XML document. 

The parser support comments, CData, doctype. 
However JsonML doesn't support those. The parser can be overwrite to form any 
other object capable to support data. 


## Install

    npm install axml



## API

The axml parser overwrite the Node.js stream object. It can be used and pipe 
with any others stream object (compression, encryption...). However the easiest 
way to use it is to use the static methods.

### Static API
To read a xml file you can use the asynchrone function `readFile`. 
```js
var axml = require ('axml')
axml.readFile (uri, function (err, data) {
  // data is a JsonML object.
})
```

To convert JsonML back to Xml, you can use the `stringify` method.
```js
var str = axml.stringify(data, { eol:'\n', tabs:'  ', depth:0 })
```
### Stream API
If you wish to have better control on the process, you can create a parser 
instance. This instance is a `stream.Transform` object. You can know more on  
[Node.Js documentation](3).
```js
var axml = require ('axml')

var stream = new axml()
var stream = fs.createReadStream (uri)
stream .on('finish', function(err) {
  console.log (stream.top)
})
fs.createReadStream(uri).pipe (stream)
```
### Strings

Like a lot of my other JavaScript module. I tend to add some extension to the 
default JavaScript runtime.

Here, the string object have been extended by this functions:

```js
// Remove blank space at the end and beginning of the string.
str.trim () 
// Remove blank space at the left( beginning) of the string.
str.ltrim () 
// Remove blank space at the right (end) of the string.
str.rtrim () 
// Remove all extra white-space, at the end, at the beginning and replace any 
white-space between word by a single space.
str.fulltrim() 
// Return true if the string starts with the content of the string 'model' 
str.startswith(model) 
// Return true if the string ends with the content of the string 'model' 
str.endswith(model) 
```

### Plugin-In

At creation of the instance, the axml class take a optional object as argument.
Here's an hint, full explanation is currently on writing.

```js
var parser = new axml ({
  TEXT:my_parser_for_text,
  ELEMENT:my_parser_for_element,
  COMMENT:my_parser_for_comment,
  DECLARATION:my_parser_for_declaration,
  DOCTYPE:my_parser_for_doctype,
});

function my_parser (parser, node) {
  node = {
    k: /* Offset */
    t: /* Type */
    s: /* Literal */
  }
}
```


## JsonML

JsonML, the JSON Markup Language is a lightweight markup language used to map 
between XML (Extensible Markup Language) and 
JSON (JavaScript Object Notation)[^wikipedia].

JsonML allows any XML document to be represented uniquely as a JSON string. 
The syntax uses:

- JSON arrays to represent XML elements;
-  JSON objects to represent attributes;
-  JSON strings to represent text nodes.

XML
```xml
<person created="2006-11-11T19:23" modified="2006-12-31T23:59">
    <firstName>Robert</firstName>
    <lastName>Smith</lastName>
    <address type="home">
        <street>12345 Sixth Ave</street>
        <city>Anytown</city>
        <state>CA</state>
        <postalCode>98765-4321</postalCode>
    </address>
</person>
```

JsonML
```js
["person",
  {"created":"2006-11-11T19:23",
   "modified":"2006-12-31T23:59"},
  ["firstName", "Robert"],
  ["lastName", "Smith"],
  ["address", {"type":"home"},
    ["street", "12345 Sixth Ave"],
    ["city", "Anytown"],
    ["state", "CA"],
    ["postalCode", "98765-4321"]
  ]
]
```


## License
This code is under the modified BSD license.




 [^wikipedia]: the definition of JsonMl is base on the [Wikipedia article][4]

 [1]: https://badge.fury.io/js/axml
 [2]: http://travis-ci.org/axfab/axml
 [3]: http://nodejs.org/api/stream.html#stream_class_stream_transform
 [4]: http://en.wikipedia.org/wiki/JsonML

