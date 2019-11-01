// 创建一个https的代理服务器
import https from 'https';
import { getCert } from './cert/cert.js';
import { getPort } from './tools';
import Promise from 'promise';
import log from './log';
import tls from 'tls';
import util from 'util';
import constants from 'constants';
import { requestHandler, requestUpgradeHandler } from './requestSerives';
let SNICallback = (servername, callback) => {
	try {
		let { privateKey: key, cert } = getCert(servername);
		let ctx = tls.createSecureContext({ key, cert });
		callback(null, ctx);
	} catch (e) {
		log.error(e);
		callback(e);
	}
};
export { SNICallback };
export default (host, port) => {
	if (!host) {
		throw new Error('host is must');
	}
	return (
		Promise.resolve(port)
			.then(p => {
				if (p) {
					return p;
				} else {
					return getPort();
				}
			})
			// 不支持sni的请求可能点了就没反应,SNICallback在客户端不支持的情况下，不会报错，会直接返回
			.then(port => {
				let { privateKey: key, cert } = getCert(host);
				let server = https.createServer(
					{
						secureOptions:
							constants.SSL_OP_NO_SSLv3 || constants.SSL_OP_NO_TLSv1,
						key,
						cert,
						SNICallback,
						rejectUnauthorized: false
					},
					function(req, res) {
						if (req.headers.upgrade) {
							return;
						}
						requestHandler.call(this, req, res);
					}
				);

				server.on('upgrade', requestUpgradeHandler);

				server.on('clientError', function(err, con) {
					log.error('clientError', err);
				});

				server.listen(port);
				server.on('error', err =>
					log.error(err + 'inner https prxoy server err:' + err)
				);
				return { server, port };
			})
			.then(null, err => log.error('create https proxy server error:' + err))
	);
};
