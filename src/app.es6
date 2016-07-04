"use strict";
import http from 'http';
import https from 'https';
import defCon from './defCon';
import merge from 'merge';
import Promise from 'promise';
import log from './log';
import reqSer from './requestSerives';
import net from 'net';
import url from 'url';
import EventEmitter from 'events';
//主类
class CatProxy extends EventEmitter{
	constructor(option) {
		super();
		this.option = merge(option, defCon);
	}
	init() {
		//请求事件方法
		this.requestHandler = reqSer.requestHandler.bind(this);
		return Promise.resolve()
		.then(this.createCache.bind(this))
		.then(this.checkParam.bind(this))
		.then(this.createServer.bind(this))
		// .then(this.proxyHttps.bind(this))
		.then(this.checkEnv.bind(this))
		.then(null, this.errorHandle.bind(this));
	}
	//创建缓存，创建请求保存
	createCache() {
	}
	checkParam() {
	}
	//环境检测
	checkEnv() {
	}
	//代理https
	//直接代理后https请求不明文通过
	proxyHttps() {
		if (this.option.model === 'proxy') {
			this.server.on('connect', (req, cltSocket, head) => {
				// connect to an origin server
				var srvUrl = url.parse(`http://${req.url}`);
				var srvSocket = net.connect(srvUrl.port, srvUrl.hostname, () => {
					cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
													'Proxy-agent: Node-CatProxy\r\n' +
													'\r\n');
					srvSocket.write(head);
					srvSocket.pipe(cltSocket);
					cltSocket.pipe(srvSocket);
					srvSocket.on('error',(err) => {
						log.error(err);
					});
				});
			});
			//处理转发ws请求
			this.server.on('upgrade', (req, socket) => {
				socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
										 'Upgrade: WebSocket\r\n' +
										 'Connection: Upgrade\r\n' +
										 '\r\n');
				socket.pipe(socket); // echo back
			});
		}
	}
	//出错处理
	errorHandle(err) {
		if (err) {
			log.error(err);
		}
	}
	//根据配置创建服务器
	createServer() {
		let opt = this.option;
		let server;
		let httpsServer;
		if (opt.model === 'host') {
				server = https.createServer(this.requestHandler);
				//找到证书，创建https的服务器
				httpsServer = https.createServer(this.requestHandler);
				httpsServer.listen(opt.httpsPort);
				this.httpsServer = httpsServer;
				server.listen(opt.httpPort);
		} else if (opt.model === 'proxy') {
			if (opt.type === 'https') {
				//找到证书，创建https的服务器
				server = https.createServer(this.requestHandler);
			} else {
				server = http.createServer(this.requestHandler);
			}
			server.listen(opt.port, function() {
				log.info('proxy server start from ' + 'http://127.0.0.1:' + opt.port);
			});
		}
		if (httpsServer) {
			httpsServer.on('clientError', (error) => log.error('clientError: ' + error.stack));
		}
		if (server) {
			server.on('clientError', (error) => log.error('clientError: ' + error.stack));
		}
		this.server = server;
	}

}
export {CatProxy};
