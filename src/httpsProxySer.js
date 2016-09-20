// 创建一个https的代理服务器
import https from 'https';
import {getCert} from './cert/cert.js';
import getPort from 'empty-port';
import Promise from 'promise';
import log from './log';
import tls from 'tls';
import util from 'util';
let SNICallback = (servername, callback) => {
	try {
		let {privateKey: key, cert} = getCert(servername);
		let ctx = tls.createSecureContext({key, cert});
		callback(null, ctx);
	} catch (e) {
		log.error(e);
		callback(e);
	}
};
export {SNICallback};
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
						resolve(port);
					}
				});				
			});
		}
	})
	// 不支持sni的请求可能点了就没反应,SNICallback在客户端不支持的情况下，不会报错，会直接返回
	.then(port => {
		let {privateKey: key, cert} = getCert(host);
		let server = https.createServer({
			key, 
			cert,
			SNICallback,
			rejectUnauthorized: false
		}, callback);
		server.listen(port);
		server.on('error', err => log.error(err + 'inner https prxoy server err:' + err));
		return {server, port};
	})
	.then(null, err => log.error('create https proxy server error:' + err));
};
