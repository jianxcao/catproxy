//对外接口提供js
var app = require('./build/app');
var config = require('./build/config/config');
var cert = require('./build/cert/cert');

exports = module.exports = {
	cert: cert,
	config: config,
	Server: app.CatProxy
};
// process.env.NODE_ENV = "production";

console.log(process.env);
