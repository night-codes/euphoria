var fs    = require('fs-extra');
var async = require('async');
var path  = __dirname.replace(/\/lib$/g, "/db/");
var utils = {};
var info  = {};

utils.getFields = function(object, name, callback){
	var dir = path + '/' + name;
	try {
		var arch = [];
		async.series({
			// dir exists? create if not
			createDir: function(callback){
				fs.exists(dir, function (e) {
					fs.ensureDir(dir, function(err) {
						if (err) throw err;
						callback(null, !e);
					});
				});
			},
			// dir exists? create if not
			createArchiveDir: function(callback){
				fs.exists(dir + "/archive", function (e) {
					fs.ensureDir(dir + "/archive", function(err) {
						if (err) throw err;
						callback(null, !e);
					});
				});
			},
			// get file list
			inDir: function(callback){
				fs.readdir(dir, function(err, list){
					fs.readdir(dir + "/archive", function(err, listArch){
						var inDir = [];
						list.forEach(function(el, i) {
							if (/\.db$/gi.test(el)) {
								inDir.push(el.replace(/\.db$/gi, ''));
							}
						});
						listArch.forEach(function(el, i) {
							if (/\.db$/gi.test(el)) {
								arch.push(el.replace(/\.db$/gi, ''));
							}
							inDir.push(el.replace(/\.db$/gi, ''));
						});
						callback(null, inDir);
					});
				});
			},
			// Object.keys
			inObject: function(callback){
				callback(null, Object.keys(object));
			},
			// Object.keys
			inArch: function(callback){
				callback(null, arch);
			},
			// Object.keys
			inArch: function(callback){
				callback(null, arch);
			}
		},
		function(err, results){

			results.toLoad   = [];
			results.toSave   = [];
			results.toDelete = [];

			results.inDir.forEach(function(el, i) {
				if (results.inObject.indexOf(el) == -1 && results.inArch.indexOf(el) == -1 ) {
					results.toDelete.push(el);
				}
				if (results.inArch.indexOf(el) == -1 ) {
					results.toLoad.push(el);
				}
			});
			results.inObject.forEach(function(el, i) {
				if (results.inArch.indexOf(el) == -1 ) {
					results.toSave.push(el);
				}
			});


			// result callback
			info[name] = results;
			callback(null, results);
		});

	} catch (e) {
		console.warn(e + ' in "utils.getFields()"');
		callback(e, false);
	}
};


module.exports = utils;