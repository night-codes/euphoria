#DB.Euphoria

Easy object database for Node.JS (with cluster use)

## Getting Started
```javascript
var euphoria = require('euphoria');

var obj = {}, obj2 = {"foo": "bar"};

euphoria.connect(obj, "db1", function() {
	console.log("obj sync started!");
});

euphoria.connect(obj2, "db2", function() {
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
 * if nothing had happened - he will saved at intervals of 5 seconds 
 * in a separate thread, then restart or crash the application it will 
 * be restored.
 */
euphoria.connect(object, name, callback);
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
euphoria.load(object, name, callback);
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
euphoria.save(object, name, callback);
```


## Release History
0.0.1 - Initial

0.1.0 - Added protection from falls during dubbing DB. Support Cluster streams.

0.2.0 - Support for older Node versions and getting rid of the Observed

## License
Copyright (c) 2014 Oleksiy Chechel. 

Licensed under the MIT license.
