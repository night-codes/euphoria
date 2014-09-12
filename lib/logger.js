var dev = process.env.NODE_ENV && process.env.NODE_ENV == "dev";
exports.log = function(data){
	console.log("[" + Date() + "] Euphoria: " + data);
};
exports.warn = function(data){
	console.warn("[" + Date() + "] Euphoria: " + data);
};
exports.dev = function(data){
	if (dev) console.warn("[" + Date() + "] Euphoria [DEVELOP]:::: " + data);
};
