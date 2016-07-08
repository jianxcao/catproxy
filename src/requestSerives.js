import url from 'url';
import Promise from 'promise';
import tls from 'tls';
import {Buffer} from 'buffer';
import log from './log';
import net from 'net';
import getHttpsSer from './httpsProxySer' ;
//请求到后的解析
let requestHandler = function (req, res) {
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
	let reqInfo = {
		headers,
		host,
		method,
		protocol,
		fullUrl,
		req,
		port,
		startTime: new Date().getTime(),
		path: pathStr,
		url: visitUrl,
		bodyData: ''
	};
	let resInfo = {
		res
	};
	Promise.resolve(reqInfo)
		//拼接req body的数据
		.then((reqInfo)=> {
			return new Promise((resolve) => {
				var bufferData = [];
				req.on('data', (chunk)=> bufferData.push(chunk));
				req.on('end', ()=> {
					reqInfo.bodyData = Buffer.concat(bufferData) || new Buffer('');
					resolve(reqInfo);
				});
			});
		})
		//转发请求 本地转发或者 向远程服务器转发
		.then((reqInfo) => {
			com.responseService(reqInfo, resInfo);
		})
		.then(null, (err)=> {
			log.error(err);
		});
};

var httpsSerInfo = null;
var getSer = requestHandler => {
	if (httpsSerInfo) {
		return Promise.resolve(httpsSerInfo);
	} else {
		return getHttpsSer('localhost', requestHandler)
			.then((info)=> {
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
let requestConnectHandler = function(req, cltSocket, head){
	let opt = this.option;
	//如果需要捕获https的请求
	if (opt.crackHttps) {
		log.verbose(`crack https http://${req.url}`);
		getSer(this.requestHandler)
		.then(({port}) =>{
				var srvSocket = net.connect(port, "localhost", () => {
					cltSocket.write(`HTTP/${req.httpVersion} 200 Connection Established\r\n` +
						'Proxy-agent: Node-CatProxy\r\n' +
						'\r\n');
					srvSocket.write(head);
					srvSocket.pipe(cltSocket);
					cltSocket.pipe(srvSocket);
				});
				cltSocket.on('error', err => log.error(`crack https请求出现错误1: ${err}`));
				srvSocket.on('error', err => log.error(`crack https请求出现错误2: ${err}`));
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
export default {requestHandler, requestConnectHandler, requestUpgradeHandler};
