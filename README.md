#euphoria

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
_(Coming soon)_

## Examples
_(Coming soon)_

## Contributing
_(Coming soon)_

## Release History
0.0.1 - Initial

## License
Copyright (c) 2014 Oleksiy Chechel
Licensed under the MIT license.
