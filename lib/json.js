var async = require('async');
var stringify;


	var stringifyArray = function (array, callback, lvl) {
		process.nextTick(function() {

			if (array.length === 0) {
				callback(null, "[]");
			} else if (array.length > 50){
				callback(null, JSON.stringify(array));
			} else {
				try {
					async.mapSeries(array,
						function(element, callback){
							setImmediate(function() {
								stringify(element, function (err, value) {
									if (!err) {
										if (typeof value === 'undefined') {
											callback(null, JSON.stringify(element));
										} else {
											callback(null, value);
										}
									} else {
										callback(err);
									}
								}, lvl+1);
							});
						},
						function(err, results){
							if (!err) {
								callback(null, "[" + results.join() + "]");
							} else {
								callback(err);
							}
						}
					);
				} catch (err) {
					callback(err);
				}
			}
		});
	};




	var stringifyObject = function (object, callback, lvl) {
		process.nextTick(function() {

			var keys = Object.keys(object);

			if (keys.length === 0) {
				callback(null, "{}");
			} else if (keys.length > 50){
				callback(null, JSON.stringify(object));
			} else {
				try {
					async.mapSeries(keys,
						function(key, callback){
							setImmediate(function() {
								stringify(object[key], function (err, value) {
									if (!err) {
										if (typeof value === 'undefined') {
											callback(null, JSON.stringify(key) + ":" + JSON.stringify(object[key]));
										} else {
											callback(null, JSON.stringify(key) + ":" + value);
										}
									} else {
										callback(err);
									}
								}, lvl+1);
							});
						},
						function(err, results){
							if (!err) {
								callback(null, "{" + results.join() + "}");
							} else {
								callback(err);
							}
						}
					);
				} catch (err) {
					callback(err);
				}
			}
		});
	};


	exports.stringify = stringify = function (data, callback, lvl) {
		lvl = lvl || 0;
		process.nextTick(function() {
			if (data === undefined) {
				setImmediate(function() {
					callback(null, undefined);
				});
			} else if (lvl > 1) {
				setImmediate(function() {
					callback(null, JSON.stringify(data));
				});
			} else {
				try {
					if (typeof data == "object") {
						if (data === null || typeof data.toJSON === "function" || data.constructor === String || data.constructor === Number || data.constructor === Boolean) {
							// 1) why is typeof null === "object"?
							// 2) used by Date and possibly some others.
							// 3) horrible, someone used the new String(), new Number(), or new Boolean() syntax.
							setImmediate(function() {
								callback(null, JSON.stringify(data));
							});
						} else if (Array.isArray(data)) {
							setImmediate(function() {
								stringifyArray(data, callback, lvl);
							});
						} else {
							setImmediate(function() {
								stringifyObject(data, callback, lvl);
							});
						}
					} else {
						setImmediate(function() {
							callback(null, JSON.stringify(data));
						});
					}
				} catch (err) {
					setImmediate(function() {
						callback(err);
					});
				}
			}
		});
	};
