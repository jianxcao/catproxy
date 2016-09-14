var certCenter = require('../cert/cert.js');
var https = require('https');
var tls = require('tls');
var {
	privateKey: key,
	cert
} = certCenter.getCert("localhost");
var server = https.Server({
	key,
	cert,
	rejectUnauthorized: true
}, function(req, res) {
	console.log('in request');
	 res.write('success');
	 res.end();
});
server.on('connect', function() {
	console.log('connect');
});
server.on('secureConnection', function(cltSocket) {
	console.log(cltSocket);
});
server.on('connection', function(socket) {
	socket.on('data', function(buff) {
		console.log(buff.toString());
	});
	socket.on('error', function(err) {
		console.log('err', err);
	});
		socket.on('close', function(one) {
		console.log('close', one);
	});
	console.log('connection');
});
server.on('tlsClientError', function(err) {
	console.log(err);
});
// https默认de监听端口时443，启动1000以下的端口时需要sudo权限
server.listen(443, function() {
	console.log("https listening on port: 443");
});
// 
