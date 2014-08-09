var cluster      = require('cluster');
var observe      = require('observed');
var extend       = require('util')._extend;

var gracefull    = 0;
var allready     = [];


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
	clusterExec(worker, "save", [name, object], function(ret) {
		if (typeof callback == "function") callback();
	});
}


function _load(name, object, callback){
	var worker = initWorker();
	clusterExec(worker, "load", [name, object], function(ret) {
		extend(object, ret.result);
		worker.kill();
		if (typeof callback == "function") callback(object);
	});
}


function _save(name, object, callback){
	var worker = initWorker();
	clusterExec(worker, "save", [name, object], function(ret) {
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

	var observ   = observe(object);
	var change   = false;
	var interval = 5000;

	observ.on('change', function() {
		change = true;
	});

	var worker = initWorker();

	load(worker, name, object, function() {

		function tick() {
			observ.deliverChanges();
			if (change) {
				var saveStart = Date.now();
				save(worker, name, object, function() {
					change = false;
					interval = Math.max(2000, (Date.now()-saveStart)*2);
					if (worker) setTimeout(tick, interval);
				});
			} else {
				if (worker) setTimeout(tick, interval);
			}
		}
		setTimeout(tick, interval);

		gracefull++;
		function gracefulExit() {
			change = false;
			save(worker, name, object, function() {
				console.log("Exit save for " + name + "_euphoria.db");
				gracefull--;
				worker.kill();
				if (!gracefull) process.exit();
			});
		}
		process.once('SIGINT', gracefulExit).once('SIGTERM', gracefulExit);
		callback();
	});

}


function grace() {console.warn(" - Exit interrupt..."); if (!gracefull) process.exit();}
process.once('SIGINT', grace).once('SIGTERM', grace);


module.exports.connect   = connect;
module.exports.load      = _load;
module.exports.save      = _save;
module.exports.gracefull = gracefull;








