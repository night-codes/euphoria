var cluster   = require('cluster');
var fs        = require('fs-extra');
var async     = require('async');
var extend    = require('./extend');
var aJSON     = require('./json');
var path      = __dirname.replace(/\/lib$/g, "/db/");


var dev = process.env.NODE_ENV && process.env.NODE_ENV == "dev";
var lib = {};

lib.load = function(name, object, callback){

	var label = "[" + Date() + "] Euphoria: READ \"" + name + "\" OK! ";
	console.log("[" + Date() + "] Euphoria: TRY READ... \"" + name + "\"");
	if(dev) console.time(label);


	var tmp = path + "tmp~" + name + "_euphoria.db";
	var fln = path + name + "_euphoria.db";
	var data;

	try {

		var exists, exists_tmp;
		async.series([
			// fln exists?
			function(callback){
				fs.exists(fln, function (e) {
					exists = e;
					callback(null, exists);
				});
			},
			// tmp exists?
			function(callback){
				fs.exists(tmp, function (e) {
					exists_tmp = e;
					callback(null, exists_tmp);
				});
			},
			// save file
			function(callback){
				if(!exists && !exists_tmp) {
					console.log(name + "2");
					lib.save(name, object, callback);
				} else if (exists_tmp){
					try {
						fs.readFile(tmp, {encoding: 'utf8'}, function(err, d) {
							if (err) throw err;
							callback(null, JSON.parse(d));
						});
					} catch (e) {
						console.warn("[" + Date() + "] Euphoria: Error from loading temporary file (" + e + ")");
						if (exists){
							console.log("[" + Date() + "] Euphoria: Try load main file...");
							try {
								fs.readFile(fln, {encoding: 'utf8'}, function(err, d) {
									if (err) throw err;
									callback(null, JSON.parse(d));
								});
							} catch (e) {
								console.warn("[" + Date() + "] Euphoria: Error from loading main file (" + e + ")! We lost it =(");
								callback(e, false);
								return;
							}
						} else {
							console.warn("[" + Date() + "] Euphoria: Main DB was not found! We lost it =(");
							callback(true, false);
							return;
						}
					}
				} else {
					try {
						fs.readFile(fln, {encoding: 'utf8'}, function(err, d) {
							if (err) throw err;
							callback(null, JSON.parse(d));
						});
					} catch (e) {
						console.warn("[" + Date() + "] Euphoria: Error from loading main file(" + e + ")! We lost it =(");
						callback(e, false);
						return;
					}
				}
			}

		],
		function(err, results){
			if (!err) {
				data = results[2];
				if(dev) console.timeEnd(label);
				if (module.parent) extend(object, data);
				callback(null, module.parent ? object : data );
				delete data;
			} else {
				callback(err, false);
			}
		});

	} catch (e) {
		console.warn("[" + Date() + "] Euphoria: " + e + ' in "lib.load()"');
		callback(e, false);
	}
};


lib.save = function(name, object, callback){

	if(dev) console.log("[" + Date() + "] Euphoria: TRY WRITE... \"" + name + "\"");
	var label = "[" + Date() + "] Euphoria: WRITE \"" + name + "\" OK! ";
	if(dev) console.time(label);

	var tmp = path + "tmp~" + name + "_euphoria.db";
	var fln = path + name + "_euphoria.db";

	try {

		var exists, exists_tmp, jsn;
		async.series([
			// fln exists?
			function(callback){
				fs.exists(fln, function (e) {
					exists = e;
					if (!e) console.warn("[" + Date() + "] Euphoria: Мain db file not found");
					callback(null, exists);
				});
			},
			// tmp exists?
			function(callback){
				fs.exists(tmp, function (e) {
					exists_tmp = e;
					if (e) console.warn("[" + Date() + "] Euphoria: Temporary db file found!");
					callback(null, exists_tmp);
				});
			},
			// deleting tmp
			function(callback){
				if (exists && exists_tmp){
					fs.unlink(tmp, function(err) {
						if (err) throw err;
						callback(null);
					});
				} else {
					callback(null);
				}
			},
			// copy old database to temporary file
			function(callback){
				if (exists){
					fs.copy(fln, tmp, function(err) {
						if (err) throw err;
						fs.chmod(tmp, "666", function() {
							callback(null);
						});
					});
				} else {
					callback(null);
				}
			},
			// JSON
			function(callback){
				setImmediate(function() {
					aJSON.stringify(object, function (err, jsonValue) {
					    if (err) throw err;
					    jsn = jsonValue;
					    setImmediate(function() {callback(null, jsn);});
					});
				});
			},
			// write database
			function(callback){
				fs.outputFile(fln, jsn, {encoding: 'utf8'}, function(err) {
					if (err) throw err;
					fs.chmod(tmp, "666", function() {
						callback(null);
					});
				});
			},
			// tmp exists?
			function(callback){
				fs.exists(tmp, function (e) {
					exists_tmp = e;
					callback(null, exists_tmp);
				});
			},
			// deleting tmp
			function(callback){
				if (exists_tmp){
					fs.unlink(tmp, function(err) {
						if (err) throw err;
						callback(null);
					});
				} else {
					callback(null);
				}
			}
		],
		function(err, results){
			// commit
			if(dev) console.timeEnd(label);
			callback(null, object);
		});

	} catch (e) {
		console.warn("[" + Date() + "] Euphoria: " + e + ' in "lib.save()"');
		callback(e, false);
	}
};




if (module.parent) {
	module.exports = lib;
} else {
	if (cluster.isWorker) {
		process.on('message', function(data) {
			data.args.push(function(err, result) {process.send( {'reqId': data.reqId, 'message': {'err': err, 'result': result}} );});
			lib[data.func].apply(this, data.args);
		});
		console.log("[" + Date() + "] Euphoria: worker started in PID: " + process.pid);
		process.once('SIGINT', function() {}).once('SIGTERM', function() {});
	}
}



