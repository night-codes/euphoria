var cluster = require('cluster');
var fs      = require('fs-extra');
var extend  = require('./extend.js');
var path    = __dirname.replace(/\/lib$/g, "/db/");


var dev     = process.env.NODE_ENV && process.env.NODE_ENV == "dev";
var lib     = {};

lib.load = function(name, object, callback){

	var label = "[" + Date() + "] Euphoria: READ \"" + name + "\" OK! ";
	console.log("[" + Date() + "] Euphoria: TRY READ... \"" + name + "\"");
	if(dev) console.time(label);


	var tmp = path + "tmp~" + name + "_euphoria.db";
	var fln = path + name + "_euphoria.db";
	var data;

	try {

		var exists     = fs.existsSync(fln);
		var exists_tmp = fs.existsSync(tmp);

		if(!exists && !exists_tmp) {
			lib.save(name, object, callback);
		} else if (exists_tmp){
			data = JSON.parse(fs.readFileSync(tmp, {encoding: 'utf8'}));
		} else {
			data = JSON.parse(fs.readFileSync(fln, {encoding: 'utf8'}));
		}

		if(dev) console.timeEnd(label);
		if (module.parent) extend(object, data);
		delete data;
		callback(null, object);

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

		// copy old database to temporary file
		if (fs.existsSync(fln)){
			if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
			fs.copySync(fln, tmp);
			fs.chmodSync(tmp, "666");
		}

		// write database
		fs.outputFileSync(fln, JSON.stringify(object), {encoding: 'utf8'});
		fs.chmodSync(fln, "666");

		// delete temporary file
		if (fs.existsSync(tmp)) fs.unlinkSync(tmp);

		// commit
		if(dev) console.timeEnd(label);
		callback(null, object);

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



