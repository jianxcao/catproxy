//创建一个https的代理服务器
import https from 'https';
import {getCert} from './cert/cert.js';
import getPort from 'empty-port';
import Promise from 'promise';
import log from './log';
import tls from 'tls';
import util from 'util';
let SNICallback = (servername, callback) => {
	try {
		let {privateKey: key, cert} = getCert(servername)
		let ctx = tls.createSecureContext({key, cert});
		callback(null, ctx);
	} catch (e) {
		log.error(e);
		callback(e);
	}
};
export default (host, port, callback) => {
	if (util.isFunction(port)) {
		callback = port;
		port = null;
	}
	return Promise.resolve(port)
	.then(p => {
		if (p) {
			return p;
		} else {
			return new Promise((resolve, reject) => {
				getPort({
					startPort: 10001
				}, (err, port) => {
					if (err) {
						reject(err);
					} else {
						resolve(port)
					}
				});				
			});
		}
	})
	.then(port => {
		let {privateKey: key, cert} = getCert(host);
		//SNICallback
		let server = https.createServer({key, cert, rejectUnauthorized: false, SNICallback}, callback);
		server.listen(port);
		return {server, port};
	})
	.then(null, err => log.error('create https proxy server error:' + err));
};
