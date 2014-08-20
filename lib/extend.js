var _extend = require('util')._extend;

module.exports = function(obj, obj2) {
	if (typeof obj != 'object') obj = {};
	if (typeof obj2 != 'object') return obj;

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
	return obj;
}