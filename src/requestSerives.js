import url from 'url';
import Promise from 'promise';
import tls from 'tls';
import {Buffer} from 'buffer';
import log from './log';
import net from 'net';
import getHttpsSer from './httpsProxySer';
import {STATUS, LIMIT_SIZE} from './config/defCon';
//请求到后的解析
let requestHandler = function(req, res) {
	var com = this;
	//build  req info object
	let isSecure = req.socket instanceof tls.TLSSocket,
		headers = req.headers,
		method = req.method,
		host = req.headers.host,
		protocol = !!isSecure ? "https" : 'http',
		fullUrl = /^http.*/.test(req.url) ? req.url : (protocol + '://' + host + req.url),
		urlObject = url.parse(fullUrl),
		port = urlObject.port || (protocol === "http" ? '80' : '443'),
		pathStr = urlObject.path,
		visitUrl = protocol + "://" + host + pathStr;
	log.verbose("request url: " + fullUrl);
	//请求信息
	let reqInfo = {
		headers,
		host,
		method,
		protocol,
		port,
		path: pathStr,
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
	let resInfo = {};
	Object.defineProperties(resInfo, {
		res: {
			writable: false,
			value: res,
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
	let opt = this.option;
	//如果需要捕获https的请求
	if (opt.crackHttps) {
		log.verbose(`crack https http://${req.url}`);
		getSer(this.requestHandler)
			.then(({
				port
			}) => {
				var srvSocket = net.connect(port, "localhost", () => {
					cltSocket.write(`HTTP/${req.httpVersion} 200 Connection Established\r\n` +
						'Proxy-agent: Node-CatProxy\r\n' +
						'\r\n');
					srvSocket.write(head);
					srvSocket.pipe(cltSocket);
					cltSocket.pipe(srvSocket);
				});
				cltSocket.on('error', err => log.error(`crack https请求出现错误: ${err}`));
				srvSocket.on('error', err => log.error(`crack https请求出现错误: ${err}`));
			});
	} else {
		log.verbose(` through https connect http://${req.url}`);
		// connect to an origin server
		var srvUrl = url.parse(`http://${req.url}`);
		var srvSocket = net.connect(srvUrl.port, srvUrl.hostname, () => {
			cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
				'Proxy-agent: Node-CatProxy\r\n' +
				'\r\n');
			srvSocket.write(head);
			srvSocket.pipe(cltSocket);
			cltSocket.pipe(srvSocket);
		});
		cltSocket.on('error', err => log.error(`转发https请求出现错误: ${err}`));
		srvSocket.on('error', err => log.error(`转发https请求出现错误: ${err}`));
	}
};
/**
 * upgrade ws转发请求处理
 * @param req
 * @param socket
 */
let requestUpgradeHandler = function(req, socket) {
	//socket请求直接转发吧
	socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' + 'Upgrade: WebSocket\r\n' + 'Connection: Upgrade\r\n' + '\r\n');
	socket.pipe(socket); // echo back
};
export default {
	requestHandler,
	requestConnectHandler,
	requestUpgradeHandler
};
