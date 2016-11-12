import url from 'url';
import Promise from 'promise';
import {Buffer} from 'buffer';
import log from './log';
import net from 'net';
import getServer from './serverManager';
import {STATUS, LIMIT_SIZE} from './config/defCfg';
import * as config from './config/config';
import http from 'http';
import https from 'https';
import changeHost from './changeHost';
import {getCert} from './cert/cert.js';
import responseService from './responseService';
let headerWsTest = /upgrade\s*:\s*websocket\s*\n/i;
import {pipeRequest} from './evt';
// 升级到 ws wss
let upgradeToWebSocket = function(req, cltSocket, head) {
	var com = this;
	// 不是upgrade websocket请求 直接放弃
	if (req.headers.upgrade.toLowerCase() !== 'websocket') {
		cltSocket.destroy();
		return;
	}
	// 禁止超时
	cltSocket.setTimeout(0);
	// 禁止纳格（Nagle）算法。默认情况下TCP连接使用纳格算法，这些连接在发送数据之前对数据进行缓冲处理。 将noDelay设成true会在每次socket.write()被调用时立刻发送数据。noDelay默认为true。
	cltSocket.setNoDelay(true);
	// 启用长连接
	cltSocket.setKeepAlive(true, 0);
	let isSecure = req.connection.encrypted || req.connection.pai;
	let url = req.url;
	let hostname = req.headers.host.split(':');
	let port = hostname[1] ? hostname[1] : isSecure ? 443 : 80;
	hostname =  hostname[0];
	let options = {
		port,
		path: url,
		method: req.method,
		headers: req.headers
	};
	if(isSecure) {
		let {privateKey: key, cert} = getCert(hostname);
		options.key = key;
		options.cert = cert;
		options.rejectUnauthorized = false;
	}
	let {port: p, httpsPort: hp} = config.get();
	let isServerPort = +port === +p;
	if (isSecure) {
		isServerPort = +hp === +port;
	}
	changeHost(hostname, isServerPort).then(ip => {
		options.hostname = ip;
		var proxyReq = (isSecure ? https : http)
		.request(options, (proxyRes) => {
			if (!proxyRes.upgrade) {
				proxyRes.end && proxyRes.end();
			}
		});
		proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
			let result = {};
			Object.defineProperties(result, {
				host: {
					value: req.headers.host,
					enumerable: true
				},
				port : {
					value: port,
					enumerable: true
				},
				protocol: {
					value: isSecure ? "wss" : "ws",
					enumerable: true
				}
			});
			pipeRequest.call(com, result);
			proxySocket.on('error', (err)=> log.error(err));
			proxySocket.on('end', function () {
				cltSocket.end();
			});
			proxySocket.setTimeout(0);
			proxySocket.setNoDelay(true);
			proxySocket.setKeepAlive(true, 0);
			cltSocket.on('error', (err) => {
				proxySocket.end();
				log.error(err);
			});
			if (proxyHead && proxyHead.length) {
				proxySocket.unshift(proxyHead);
			}
			let headers = Object.keys(proxyRes.headers)
			.reduce(function (head, key) {
				var value = proxyRes.headers[key];
				if (!Array.isArray(value)) {
					head.push(key + ': ' + value);
					return head;
				}
				for (var i = 0; i < value.length; i++) {
					head.push(key + ': ' + value[i]);
				}
				return head;
			}, ['HTTP/1.1 101 Switching Protocols'])
			.join('\r\n') + '\r\n\r\n';
			// 写入头文件
			cltSocket.write(headers);
			proxySocket.pipe(cltSocket).pipe(proxySocket);
		});
		proxyReq.on('error', (err) => {
			log.error(err);
			cltSocket.end();
		});
		req.pipe(proxyReq);
	}, (error) => {
		log.error(error);
		cltSocket.end();
	});
};

// 请求到后的解析
export let requestHandler = function(req, res) {
	var com = this;
	let isSecure = req.connection.encrypted || req.connection.pai,
		headers = req.headers,
		method = req.method,
		host = headers.host,
		protocol = !!isSecure ? "https" : 'http',
		fullUrl = /^http.*/.test(req.url) ? req.url : (protocol + '://' + host + req.url),
		urlObject = url.parse(fullUrl),
		port = urlObject.port || (protocol === "http" ? '80' : '443'),
		pathStr = urlObject.path,
		pathname = urlObject.pathname,
		visitUrl = protocol + "://" + host + pathname;
	log.verbose("request url: " + fullUrl);
	// 请求信息
	let reqInfo = {
		headers,
		host,
		method,
		protocol,
		port,
		path: pathStr
	};
	Object.defineProperties(reqInfo, {
		req: {
			writable: false,
			value: req,
			enumerable: true
		},
		originalFullUrl: {
			writable: false,
			value: fullUrl,
			enumerable: true
		},
		originalUrl: {
			writable: false,
			value: visitUrl,
			enumerable: true
		},
		startTime:{
			writable: false,
			value: new Date().getTime(),
			enumerable: true
		}
	});
	// 响应信息
	let resInfo = {headers: {}};
	Object.defineProperties(resInfo, {
		res: {
			writable: false,
			value: res,
			enumerable: true
		},
		originalFullUrl: {
			writable: false,
			value: fullUrl,
			enumerable: true
		},
		originalUrl: {
			writable: false,
			value: visitUrl,
			enumerable: true
		}
	});
	// 调用相应模块
	responseService.call(com, reqInfo, resInfo);
	let reqBodyData = [];
	let l = 0;
	let end = () => {
		req.emit('reqBodyDataReady', null, Buffer.concat(reqBodyData));
	};		
	let data = (buffer)=> {
		l = l + buffer.length;
		reqBodyData.push(buffer);
		// 超过长度了
		if (l > LIMIT_SIZE) {
			req.pause();
			req.unpipe();
			req.removeListener('data', data);
			req.removeListener('end', end);
			req.emit('reqBodyDataReady', {
				message: 'request entity too large',
				status: STATUS.LIMIT_ERROR
			}, Buffer.concat(reqBodyData));
		}
	};
	req
	.on('data', data)
	.on('end', end)
	.on('error', err => {
		log.error('error req', err);
	});
};

/**
 * connect转发请求处理
 * @param req
 * @param cltSocket
 * @param head
 */
export let requestConnectHandler = function(req, cltSocket, head) {
	var com = this;
	return new Promise(function(resolve, reject) {
		if (!head || head.length === 0) {
			cltSocket.once('data', (chunk) => {
				resolve(chunk);
			});
		} else {
			resolve(head);
		}
		cltSocket.write('HTTP/' + req.httpVersion +' 200 Connection Established\r\n' +
			'Proxy-agent: Node-CatProxy\r\n'
		);
		if (req.headers['proxy-connection'] === 'keep-alive') {
			cltSocket.write('Proxy-Connection: keep-alive\r\n');
			cltSocket.write('Connection: keep-alive\r\n');
		}
		cltSocket.write('\r\n');
	})
	.then(first => {
		cltSocket.pause();
		// log.debug("first data", first[0]);
		let opt = config.get();
		let reqUrl = `http://${req.url}`;
		let srvUrl = url.parse(reqUrl);
		let crackHttps;
		if (typeof opt.breakHttps === 'boolean') {
			crackHttps = opt.breakHttps;
		} else if (typeof opt.breakHttps === 'object' && opt.breakHttps.length) {
			crackHttps = opt.breakHttps.some((current) => new RegExp(current).test(srvUrl.hostname));
		}
		// 如果当前状态是 破解状态  并且有排除列表
		if (crackHttps && typeof opt.excludeHttps === 'object' && opt.excludeHttps) {
			crackHttps = !opt.excludeHttps.some((current) => new RegExp(current).test(srvUrl.hostname));
		}
		// * - an incoming connection using SSLv3/TLSv1 records should start with 0x16
		// * - an incoming connection using SSLv2 records should start with the record size
		// *   and as the first record should not be very big we can expect 0x80 or 0x00 (the MSB is a flag)
		// 如果需要捕获https的请求
		// 访问地址直接是ip，跳过不代理  
		if (crackHttps && (first[0] == 0x16 || first[0] == 0x80 || first[0] == 0x00)) {
			log.verbose(`crack https ${reqUrl}`);
			getServer(opt.sni === 1 ?  "" : srvUrl.hostname)
				.then(({
					port,
					server
				}) => {
					// 与服务器绑定
					server.catProxy = com.catProxy;
					let srvSocket = net.connect(port, "localhost", () => {
						srvSocket.pipe(cltSocket).pipe(srvSocket);
						cltSocket.emit('data', first);
						cltSocket.resume();
					});
					srvSocket.on('error', (err) => {
						cltSocket.end();
						log.error(`crack https请求出现错误: ${err}`);
					});
					cltSocket.on('error', err => {
						log.error(`crack https请求出现错误: ${err}`);
						srvSocket.end();
					});
				});
		} else {
			// 不认识的协议或者 不破解的https直接连接对应的服务器
			log.verbose(`pipe request ${reqUrl}`);
			let result = {};
			Object.defineProperties(result, {
				host: {
					value: srvUrl.host,
					enumerable: true
				},
				port : {
					value: srvUrl.port,
					enumerable: true
				},
				protocol: {
					value: headerWsTest.test(first.toString()) ? "ws" : "http",
					enumerable: true
				}
			});
			pipeRequest.call(com, result);
			let srvSocket = net.connect(srvUrl.port, srvUrl.hostname, () => {
				srvSocket.pipe(cltSocket).pipe(srvSocket);
				cltSocket.emit('data', first);
				cltSocket.resume();
			});
			cltSocket.on('error', err => {
				log.error(`转发请求出现错误: ${err}`);
				srvSocket.end();
			});
			srvSocket.on('error',  (err) => {
				cltSocket.end();
				log.error(`转发请求出现错误: ${err}`);
			});
		}
	})
	.then(null, err => log.error(err));
};
/**
 * upgrade ws转发请求处理
 * @param req
 * @param socket
 */
export let requestUpgradeHandler = function(req, cltSocket, head) {
	// 不是get 取不到 upgrade就放弃
	if (req.method === 'GET' && req.headers.upgrade) {
		upgradeToWebSocket.call(this, req, cltSocket, head);
	} else {
		cltSocket.destroy();
	}
};

export default {
	requestHandler,
	requestConnectHandler,
	requestUpgradeHandler
};
