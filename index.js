var cluster = require('cluster');
var _extend  = require('util')._extend;
var fs      = require('fs.extra');

var gracefull    = 0;
var allready     = [];
var dev          = (process.env.NODE_ENV && process.env.NODE_ENV == "dev");

function extend(obj, obj2) {
	var keys = Object.keys(obj2);
	keys.forEach(function(key){
		if (obj[key]) {
			if(typeof obj[key] == 'object' && typeof obj2[key] == 'object') {
				var keys2 = Object.keys(obj2[key]);
				keys2.forEach(function(key2){
					if (obj[key][key2]) {
						if(typeof obj[key][key2] == 'object' && typeof obj2[key][key2] == 'object') {
							_extend(obj[key], obj2[key]);
						} else {
							obj[key][key2] = obj2[key][key2];
						}
					} else {
						obj[key][key2] = obj2[key][key2];
					}
				});
			} else {
				obj[key] = obj2[key];
			}
		} else {
			obj[key] = obj2[key];
		}
	});
}


function initWorker() {
	var old = cluster.settings.exec;
	cluster.setupMaster();
	cluster.settings.exec = __dirname + "/worker.js";
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


function load(worker, name, object, callback){
	clusterExec(worker, "load", [name, object], function(ret) {
		extend(object, ret.result);
		if (typeof callback == "function") callback();
	});
}


function save(worker, name, object, callback){
	clusterExec(worker, "save", [name, object], callback);
}


function _load(name, object, callback){
	var worker = initWorker();
	load(worker, name, object, function(){
		worker.kill();
		if (typeof callback == "function") callback(object);
	});
}


function _save(name, object, callback){
	var worker = initWorker();
	save(worker, name, object, function() {
		worker.kill();
		if (typeof callback == "function") callback(object);
	});
}


function setInterval(val){
	interval = parseInt(val, 10);
}


function connect(object, name, callback) {

	if (allready.indexOf(name) != -1)
		throw new Error("Database with the same name (" + name + ") is already connected!");
	allready.push(name);

	fs.mkdirs(__dirname + "/db/");

	var interval = 5000;
	var worker = initWorker();

	var label = "DB.Euphoria: Database \"" + name + "\" is connected";
	console.time(label);
	load(worker, name, object, function() {

		function tick() {
			if (worker) {
				var saveStart = Date.now();
				save(worker, name, object, function() {
					interval = Math.max(5000, (Date.now()-saveStart));
					setTimeout(tick, interval);
				});
			}
		}
		setTimeout(tick, interval);

		gracefull++;
		function gracefulExit() {
			save(worker, name, object, function() {
				console.log("Exit save for " + name + "_euphoria.db");
				gracefull--;
				worker.kill();
				if (!gracefull) process.exit();
			});
		}
		process.once('SIGINT', gracefulExit).once('SIGTERM', gracefulExit);
		console.timeEnd(label);
		callback();
	});

}


function grace() {console.warn(" - Exit interrupt..."); if (!gracefull) process.exit();}
process.once('SIGINT', grace).once('SIGTERM', grace);


module.exports.connect   = connect;
module.exports.load      = _load;
module.exports.save      = _save;
module.exports.gracefull = gracefull;
