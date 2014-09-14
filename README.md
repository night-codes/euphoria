# Euphoria

Simple object database for Node.JS (with cluster use)

## Getting Started
```javascript
var eu = require('euphoria');
// or:
// var eu = require('euphoria').cluster(false);

var obj = {}, obj2 = {"foo": "bar"};

eu.connect(obj, "db1", function() {
	console.log("obj sync started!");
});

eu.connect(obj2, "db2", function() {
	console.log("obj2 sync started!");
});
```


## Documentation

**euphoria.connect**
```javascript
/**
 * Connect object to DB.Euphoria
 * 
 * @param {Object}   object    Object for sync
 * @param {String}   name ID   Name of database file for sync (will be created automatically).
 * @param {Function} callback  
 * 
 * That's all) After calling callback you can work with the object as 
 * if nothing had happened - it will saved at intervals of 20 seconds 
 * in a separate thread, then restart or crash the application it will 
 * be restored.
 */
eu.connect(object, name, callback);
```
   
**euphoria.load**
```javascript
/**
 * Load database file to your object (without permanent sync)
 * 
 * @param {Object}   object    Object for load
 * @param {String}   name ID   Name of database file for load.
 * @param {Function} callback  
 */
eu.load(object, name, callback);
```
   
**euphoria.save**
```javascript
/**
 * Save your object to database file (without permanent sync)
 * 
 * @param {Object}   object    Object for save
 * @param {String}   name ID   Name of database file for save (will be created automatically).
 * @param {Function} callback  
 */
eu.save(object, name, callback);
```
   
   
## Release History
0.0.1 - Initial   
0.1.0 - Added protection from falls during dubbing DB. Support Cluster streams.      
0.2.0 - Support for older Node versions and getting rid of the Observed   
0.2.1 - Async call for functions   
0.2.2 - Work without clusters: **require('euphoria').cluster(false);**, fixed sudden cessation of work worker`s   
0.2.3 - Fixed some bugs   
0.2.4 - Added asynchrony in the non-clustered operations   
0.2.5 - Balance between the load and the speed in async mode as for me;) (added some asynchrony in JSON stringify). Unified order of arguments.   
   
0.3.0 - Splitting an object across multiple files.   
   
   
## License
   
MIT License   
   
Copyright (C) 2013 Oleksiy Chechel (alex.mirrr@gmail.com)   
   
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:   
   
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.   
   
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

