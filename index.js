var cluster = require('cluster');
var fs      = require('fs-extra');
var lib     = require('./lib/worker');
var extend  = require('./lib/extend');
var logger  = require('./lib/logger');

var gracefull    = 0;
var allready     = [];
var dev          = (process.env.NODE_ENV && process.env.NODE_ENV == "dev");
var useCluster   = true;




function initWorker() {
	var old = cluster.settings.exec;
	cluster.setupMaster();
	cluster.settings.exec = __dirname + "/lib/worker.js";
	var worker = cluster.fork();
	cluster.settings.exec = old;
	return worker;
}


function clusterExec(worker, func, args, callback) {
	var reqId =  Math.random().toString(36).substring(2);
	var k = {"reqId": reqId, "func": func, "args": args};


	if (typeof args == 'object' && !Array.isArray(args)) {
		for (var a in args) {
			if (a != 'reqId' && a != 'func' && a != 'args') k[a] = args[a];
		}
	} else if (!Array.isArray(args)) {
		k.args = [args];
	}

	worker.send(k);
	if (typeof callback == 'function') {
		worker.on('message', function(ret) {
			if (ret.reqId && ret.reqId == reqId) {
				callback(ret.message);
				worker.removeListener('message', arguments.callee);
			}
		});
	}
}


function load(worker, object, name, callback){
	setImmediate(function () {
		if (!useCluster) {
			lib.load(object, name, callback);
		} else {
			clusterExec(worker, "load", [object, name], function(ret) {
				if (ret.result) extend(object, ret.result);
				if (typeof callback == "function") callback(ret.err, object);
			});
		}
	});
}


function save(worker, object, name, callback){
	setImmediate(function () {
		if (!useCluster) {
			lib.pathSave(object, name, callback);
		} else {
			clusterExec(worker, "pathSave", [object, name], function(ret) {
				if (typeof callback == "function") callback(ret.err, object);
			});
		}
	});
}


function _load(object, name, callback){
	setImmediate(function () {
		if (!useCluster) {
			lib.load(object, name, callback);
		} else {
			var worker = initWorker();
			load(worker, object, name, function(err, obj){
				worker.kill();
				setImmediate(function() {
					callback(err, obj);
				});
			});
		}
	});
}


function _save(object, name, callback){
	setImmediate(function () {
		if (!useCluster) {
			lib.pathSave(object, name, callback);
		} else {
			var worker = initWorker();
			save(worker, object, name, function(err) {
				worker.kill();
				setImmediate(function() {
					if (typeof callback == "function") callback(err, object);
				});
			});
		}
	});
}


function setInterval(val){
	interval = parseInt(val, 10);
}


function connect(object, name, callback) {
	setImmediate(function () {
		if (allready.indexOf(name) != -1)
			throw new Error("[" + Date() + "] Database with the same name (" + name + ") is already connected!");
		allready.push(name);

		fs.mkdirs(__dirname + "/db/");

		var interval = 20000;
		var worker = true;
		if (useCluster)  worker = initWorker();

		var label = "[" + Date() + "] Euphoria: Database \"" + name + "\" is connected";
		console.time(label);
		load(worker, object, name, function(err) {
			if (!err) {
				function tick() {
					if (worker) {
						var saveStart = Date.now();
						save(worker, object, name, function() {
							interval = Math.max(30000, (Date.now()-saveStart)*2);
							setTimeout(tick, interval);
						});
					} else {
						logger.warn("Worker \"" + name + "\" not found!");
					}
				}
				setTimeout(tick, interval);

				gracefull++;
				function gracefulExit() {
					save(worker, object, name, function() {
						console.log("Exit save for " + name + "_euphoria.db");
						gracefull--;
						if (useCluster) worker.kill();
						worker = false;
						if (!gracefull) process.exit();
					});
				}
				process.once('SIGINT', gracefulExit).once('SIGTERM', gracefulExit);
				console.timeEnd(label);
			} else {
				logger.warn("Database \"" + name + "\" is not connected (object offline)!");
			}
			setImmediate(function() {
				callback();
			});
		});
	});
}


function grace() {console.warn(" - Exit interrupt..."); if (!gracefull) process.exit();}
process.once('SIGINT', grace).once('SIGTERM', grace);


module.exports.connect   = connect;
module.exports.load      = _load;
module.exports.save      = _save;
module.exports.gracefull = gracefull;
module.exports.cluster = function(bool){
	useCluster = bool;
	return module.exports;
};
