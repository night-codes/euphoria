var cluster = require('cluster');
var fs      = require('fs-extra');
var lib     = require('./lib/worker');
var extend  = require('./lib/extend');
var logger  = require('./lib/logger');

var gracefull    = 0;
var allready     = [];
var dev          = (process.env.NODE_ENV && process.env.NODE_ENV == "dev");
var useCluster   = false;




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
				if (typeof callback == "function") callback(ret.err);
			});
		}
	});
}


function _load(object, name, callback){

	var label = "[" + Date() + "] Euphoria: READ \"" + name + "\" OK! ";
	if (!dev) {
		logger.log("TRY READ... \"" + name + "\"");
		console.time(label);
	}

	setImmediate(function () {
		if (!useCluster) {
			lib.load(object, name, function(err) {
				if(!dev && !err) console.timeEnd(label);
				setImmediate(function() {
					callback(err);
				});
			});
		} else {
			var worker = initWorker();
			load(worker, object, name, function(err){
				worker.kill();
				if(!dev && !err) console.timeEnd(label);
				setImmediate(function() {
					callback(err);
				});
			});
		}
	});
}


function _save(object, name, callback){

	var label = "[" + Date() + "] Euphoria: WRITE \"" + name + "\" OK! ";
	if (!dev) {
		logger.log("TRY WRITE... \"" + name + "\"");
		console.time(label);
	}

	setImmediate(function () {
		if (!useCluster) {
			lib.pathSave(object, name, function(err) {
				if(!dev && !err) console.timeEnd(label);
				setImmediate(function() {
					if (typeof callback == "function") callback(err);
				});
			});
		} else {
			var worker = initWorker();
			save(worker, object, name, function(err) {
				worker.kill();
				if(!dev && !err) console.timeEnd(label);
				setImmediate(function() {
					if (typeof callback == "function") callback(err);
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
					}
				}
				setTimeout(tick, interval);

				gracefull++;
				function gracefulExit() {

					var callee = arguments.callee;
					var nokill = arguments[0] || false;

					save(worker, object, name, function() {
						gracefull--;
						if (useCluster) worker.kill();
						worker = false;
						logger.log("Database \"" + name + "\" is disconnected");
						if (nokill) {
							process.removeListener('SIGINT', callee).removeListener('SIGTERM', callee).removeListener('term_' + name, callee);
							nokill();
						}
						if (!gracefull && !nokill) process.exit();
					});
				}
				process.once('SIGINT', gracefulExit).once('SIGTERM', gracefulExit).on('term_' + name, gracefulExit);
				console.timeEnd(label);
			} else {
				logger.warn("Database \"" + name + "\" is not connected (object offline)! " + err);
			}
			setImmediate(function() {
				callback();
			});
		});
	});
}

function disconnect(name, callback) {
	if (typeof callback != "function") callback = function(){};

	process.emit('term_' + name, callback);
}

function grace() {console.warn(" - Exit interrupt..."); if (!gracefull) process.exit();}
process.once('SIGINT', grace).once('SIGTERM', grace);


module.exports.connect    = connect;
module.exports.disconnect = disconnect;
module.exports.load       = _load;
module.exports.save       = _save;
module.exports.gracefull  = gracefull;

module.exports.cluster = function(bool){
	useCluster = bool;
	return module.exports;
};
