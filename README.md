
#Axml

Xml parser and serializer, JsonML.

[![Npm version](https://badge.fury.io/js/axml.svg)](https://badge.fury.io/js/axml)
&nbsp;
[![Npm download](https://img.shields.io/npm/dm/axml.svg)](https://www.npmjs.com/package/axml)
&nbsp;
[![Build Status](https://api.travis-ci.org/AxFab/axml.svg?branch=master)](http://travis-ci.org/axfab/axml)
&nbsp;
[![Coverage Status](https://img.shields.io/coveralls/AxFab/axml.svg)](https://coveralls.io/r/AxFab/axml?branch=master)
&nbsp;
[![Dependencies](https://david-dm.org/AxFab/axml.svg)](https://david-dm.org/AxFab/axml)


## Overview

Axml is a simple xml converter. It convert Xml to JsonML form which is easier to manipulate using javascript.
JsonML is a makup language used to map XML document. 

The parser support comments, CData, doctype. 
However JsonML doesn't support those. The parser can be overwrite to form any other object capable to support data. 


## Install

    npm install axml


## API

 The axml parser overwrite the Node.js stream object. It can be used and pipe 
 with any others stream object (compression, encryption...). However the 
 easiest way to use it is to use the static methods.

### Static API

 To read a xml file you can use the asynchrone function `readFile`.

```js
var axml = require ('axml');
axml.readFile (uri, function (err, data) {
  // data is a JsonML object.
});
```

 To convert JsonML back to Xml, you can use the `stringify` method.

```js
var str = axml.stringify(data, { eol:'\n', indent:'  ' });
```

### Stream API

 If you wish to have better control on the process, you can create a parser 
 instance. This instance is a `stream.Transform` object. You can know more 
 on  [Node.Js documentation](http://nodejs.org/api/stream.html#stream_class_stream_transform).

```js
var axml = require ('axml');
var stream = new axml();
var stream = fs.createReadStream (uri)
stream .on('finish', function(err) {
  console.log (stream.getDocument());
})
fs.createReadStream(uri).pipe (stream);
```

### Helper methods

 Here is some methods to help you deal with JsonML element. 
 Note that some of this function may trigger an exception is the data is not 
 recognize as a JsonML element.

 `axml.JsonMl.start (data)` Allow to know the index of the first child element on a 
 JsonML element.
 Simpler it return 2 is the element contains arguments or 1 if not.

 `axml.JsonMl.name (data)` This function will return the name of the JsonML element. Note that this can be replace by data[0]`, but the function also embed a type check.
    
 `axml.JsonMl.attributes (data)` This function return a javascript object that contains attributes of the element. Note that this method never return a null pointer, but an empty object in case there is no argument specified.

 `axml.JsonMl.istag (data)` Return true if the object is equivalent to an element node.

 `axml.JsonMl.istext (data)` Return true if the object is equivalent to a text node.

### Plugin-In

 At creation of the instance, the axml class take a optional object as 
 argument. Here's an hint, full explanation is currently on writing.

```js
var parser = {
  create:function() { return new docFactory(); },
  compile:function(docFactory) { return docFactory.docObj; },
  TEXT:function(docFactory, data) {},
  ELEMENT:function(docFactory, data) {},
  COMMENT: my_parser,
  DECLARATION:null,
  DOCTYPE:null,
  CDATA:null,
};

function my_parser (docFactory, data) {
  // data = { offset: 0, type: '', literal: '',  };
};
```


## JsonML

 JsonML, the JSON Markup Language is a lightweight markup language used to 
 map between XML (Extensible Markup Language) and JSON (JavaScript Object 
 Notation)<sup>[1](#fn:wikipedia)</sup>.

 JsonML allows any XML document to be represented uniquely as a JSON string. 
 The syntax uses:

  - JSON arrays to represent XML elements;
  - JSON objects to represent attributes;
  - JSON strings to represent text nodes.

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


---
<a name="fn:wikipedia"></a>
1. the definition of JsonMl is base on the [Wikipedia article](http://en.wikipedia.org/wiki/JsonML)




