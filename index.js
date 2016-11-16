//对外接口提供js
var app = require('./build/app');
var cert = require('./build/cert/cert');
exports = module.exports = {
	cert: cert,
	Server: app.default ? app.default : app.CatProxy
};
