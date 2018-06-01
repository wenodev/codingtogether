var Promise = require('bluebird');
var rp = require('request-promise');

function Pinterest(apiToken) {
	this.apiToken = apiToken;
}

Pinterest.prototype.__route = function(path, options) {
	var routes = { };
	var route = routes[path] || Pinterest.prototype.__generic;
	return route.bind(this)(path, options);
};

Pinterest.prototype.__buildInfo = function(path, options) {
	return {
		resolveWithFullResponse: true,			
		method: options && options.method || "GET",
		url: path.indexOf('https') === 0 ? path : 'https://api.pinterest.com/v1/' + path + '/',
		qs: options && options.qs || {},
		form: options && options.body || {},
		headers: {
			'Authorization': 'Bearer ' + this.apiToken
		}
	};
};

Pinterest.prototype.__generic = function(path, options) {
	return rp(this.__buildInfo(path, options));
};

Pinterest.prototype.api = function(path, options) {
	return this.__route(path, options).then(function(response) {
		try {
			return Promise.resolve(JSON.parse(response.body),response.headers);
		}
		catch (e) {
			return Promise.reject(e);
		}
	});
};

exports.init = function(apiToken) {
	return new Pinterest(apiToken);
};
