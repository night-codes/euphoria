var cluster = require('cluster');
var fs      = require('fs.extra');
var path    = __dirname + "/db/";
var dev     = (process.env.NODE_ENV && process.env.NODE_ENV == "dev");
var lib     = {};

lib.load = function(name, object, callback){

	var label = "DB.Euphoria: READ \"" + name + "\"";
	if(dev) console.time(label);
	var tmp = path + "tmp~" + name + "_euphoria.db";
	var fln = path + name + "_euphoria.db";

	fs.exists(fln, function (exists) {
		fs.exists(tmp, function (exists_tmp) {
			if(!exists && !exists_tmp) {
				save(name, object, callback);
			} else {
				fs.readFile(exists_tmp ? tmp : fln, {encoding: 'utf8'}, function (err, data) {
				    if (err) {
				    	fs.readFile(exists_tmp ? fln : tmp, {encoding: 'utf8'}, function (err, data) {
						    if (err) throw err;
						    if(dev) console.timeEnd(label);
							callback(null, JSON.parse(data));
						});
				    } else {
				    	if(dev) console.timeEnd(label);
						callback(null, JSON.parse(data));
				    }
				});
			}
		});
	});
};


lib.save = function(name, object, callback){

	var label = "DB.Euphoria: WRITE \"" + name + "\"";
	if(dev) console.time(label);
	var tmp = path + "tmp~" + name + "_euphoria.db";
	var fln = path + name + "_euphoria.db";

	function wrt() {
		fs.writeFile(fln, JSON.stringify(object), {encoding: 'utf8'}, function(err) {
			if (err) throw err;
			fs.unlink(tmp, function(err) {
				if(dev) console.timeEnd(label);
				callback(null, object);
			});
		});
	}

	function copyWrt() {
		fs.copy(fln, tmp, function (err) {
			if (err) throw err;
			wrt();
		});
	}


	fs.exists(fln, function (exists) {
		if (exists) {
			fs.exists(tmp, function (exists) {
				if (!exists)
					fs.unlink(tmp, function(err) {	copyWrt();	});
				else
					copyWrt();
			});
		} else {
			wrt();
		}
	});
};


if (cluster.isWorker) {
	process.on('message', function(data) {
		data.args.push(function(err, result) {process.send( {'reqId': data.reqId, 'message': {'err': err, 'result': result}} );});
		lib[data.func].apply(this, data.args);
	});
}


process.once('SIGINT', function() {}).once('SIGTERM', function() {});
