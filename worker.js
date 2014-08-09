var cluster = require('cluster');
var fs      = require('fs.extra');
var path    = __dirname + "/db/";



function load(name, object, callback){

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
							callback(null, JSON.parse(data));
						});
				    } else {
						callback(null, JSON.parse(data));
				    }
				});
			}
		});
	});
}


function save(name, object, callback){

	var tmp = path + "tmp~" + name + "_euphoria.db";
	var fln = path + name + "_euphoria.db";

	console.time("Write " + name + "_euphoria.db - ");
	fs.exists(fln, function (exists) {
		if (exists) {
			fs.copy(fln, tmp, function (err) {
				if (err) throw err;
				fs.writeFile(fln, JSON.stringify(object), {encoding: 'utf8'}, function(err) {
					if (err) throw err;
					fs.unlink(tmp, function(err) {
						callback(null, object);
					});
				});
			});
		} else {
			fs.writeFile(fln, JSON.stringify(object), {encoding: 'utf8'}, function(err) {
				if (err) throw err;
				fs.unlink(tmp, function(err) {
					callback(null, object);
				});
			});
		}
	});
}


if (cluster.isWorker) {
	process.on('message', function(data) {
		var a = [];
		for (var i=0; i<data.args.length; i++) a.push("data.args[" + i + "]");

		eval(data.func + "(" + a.join(", ") + ", function(err, result) {process.s" +
			"end( {'reqId': data.reqId, 'message': {'err': err, 'result': result}} );});");
	});
}


function gracefulExit() {}
process.once('SIGINT', gracefulExit).once('SIGTERM', gracefulExit);
