import url from 'url';
import Promise from 'promise';
import tls from 'tls';
import {Buffer} from 'buffer';
import log from './log';
import net from 'net';
import getHttpsSer from './httpsProxySer';
import {STATUS, LIMIT_SIZE} from './config/defCfg';
//请求到后的解析
let requestHandler = function(req, res) {
	var com = this;
	//build  req info object
	let isSecure = req.connection.encrypted || req.connection.pai,
		headers = req.headers,
		method = req.method,
		host = req.headers.host,
		protocol = !!isSecure ? "https" : 'http',
		fullUrl = /^http.*/.test(req.url) ? req.url : (protocol + '://' + host + req.url),
		urlObject = url.parse(fullUrl),
		port = urlObject.port || (protocol === "http" ? '80' : '443'),
		pathStr = urlObject.path,
		pathname = urlObject.pathname,
		visitUrl = protocol + "://" + host + pathname;
	log.verbose("request url: " + fullUrl);
	//请求信息
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
	//响应信息
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

	com.responseService(reqInfo, resInfo);
	let reqBodyData = [];
	let l = 0;
	let end = () => {
		req.emit('reqBodyDataReady', null, Buffer.concat(reqBodyData));
	};		
	let data = (buffer)=> {
		l = l + buffer.length;
		reqBodyData.push(buffer);
		//超过长度了
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

let httpsSerInfo = null;
let getSer = requestHandler => {
	if (httpsSerInfo) {
		return Promise.resolve(httpsSerInfo);
	} else {
		return getHttpsSer('localhost', requestHandler)
			.then((info) => {
				httpsSerInfo = info;
				return info;
			});
	}
};
/**
 * connect转发请求处理
 * @param req
 * @param cltSocket
 * @param head
 */
let requestConnectHandler = function(req, cltSocket, head) {
	let startTan = /^!.*/;
	let opt = this.option;
	let reqUrl = `https://${req.url}`;
	let srvUrl = url.parse(reqUrl);
	let crackHttps = true;
	if (opt.breakHttps === false) {
		crackHttps = false;
	} else if (typeof opt.breakHttps === 'object' && opt.breakHttps.length) {
		for(let current of opt.breakHttps) {
			if (current === srvUrl.hostname) {
				crackHttps =  false;
				break;
			}
		}
	}
	// log.debug(opt.breakHttps, crackHttps, srvUrl.hostname);

	//如果需要捕获https的请求
	//访问地址直接是ip，跳过不代理  
	if (crackHttps && !net.isIP(srvUrl.hostname)) {
		log.verbose(`crack https ${reqUrl}`);
		getSer(this.requestHandler)
			.then(({
				port
			}) => {
				let srvSocket = net.connect(port, "localhost", () => {
				cltSocket.write('HTTP/' + req.httpVersion +' 200 Connection Established\r\n' +
					'Proxy-agent: Node-CatProxy\r\n' +
					'\r\n');
					srvSocket.pipe(cltSocket).pipe(srvSocket);
				});
				srvSocket.on('error', (err) => {
					cltSocket.write("HTTP/" + req.httpVersion + " 500 Connection error\r\n\r\n");
					cltSocket.end();
					log.error(`crack https请求出现错误: ${err}`);
				});
				cltSocket.on('error', err => log.error(`crack https请求出现错误: ${err}`));
			});
	} else {
		log.verbose(`through https connect ${reqUrl}`);
		// connect to an origin server
		let srvSocket = net.connect(srvUrl.port, srvUrl.hostname, () => {
			cltSocket.write('HTTP/' + req.httpVersion +' 200 Connection Established\r\n' +
				'Proxy-agent: Node-CatProxy\r\n' +
				'\r\n');
			srvSocket.pipe(cltSocket).pipe(srvSocket);
		});
		cltSocket.on('error', err => log.error(`转发https请求出现错误: ${err}`));
		srvSocket.on('error',  (err) => {
			cltSocket.write("HTTP/" + req.httpVersion + " 500 Connection error\r\n\r\n");
			cltSocket.end();
			log.error(`转发https请求出现错误: ${err}`);
		});
	}
};
/**
 * upgrade ws转发请求处理
 * @param req
 * @param socket
 */
let requestUpgradeHandler = function(req, cltSocket, head) {
	let {headers} = req; 
	let headersStr = '';
	let host = headers.host;
	headersStr += 'HTTP/1.1 101 Web Socket Protocol Handshake\r\n';
	headersStr +=  'Upgrade:WebSocket\r\n';
	headersStr += 'Connection:Upgrade\r\n';
	for(let key in headers) {
		if (key !== "Upgrade" && key !== 'Connection') {
			headersStr += key + ":" + headers[key] + "\r\n";
		}
	}
	headersStr + '\r\n';
	host = host.split(':')[0];
	let reqSocket = net.connect({
		host: host,
		port: 443
	}, () => {
		reqSocket.write(headersStr);
		cltSocket.pipe(reqSocket);
		reqSocket.pipe(cltSocket);
	});
	// log.debug('********************');
	// log.debug(req.url);
	// log.debug('********************');
	//socket请求直接转发吧
	// cltSocket.write(headersStr);
 //  cltSocket.pipe(cltSocket); // echo back
};
export default {
	requestHandler,
	requestConnectHandler,
	requestUpgradeHandler
};
