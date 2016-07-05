var certCenter = require('../cert/cert.js');
certCenter.emptyCertDir();
var https = require('https');
var {privateKey: key, cert} = certCenter.getCert("*.lmlc.com");
var server = https.Server({
		key,
		cert,
		rejectUnauthorized: false
	}, function(req, res){
	 console.log(req.secure);
	 console.log(req.headers);
	 console.log(req.url);
	 res.write('success');
	 res.end();
});
// https默认de监听端口时443，启动1000以下的端口时需要sudo权限
server.listen(443, function(){
	console.log("https listening on port: 443");
});
