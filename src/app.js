"use strict";
import http from 'http';
import https from 'https';
import defCon from './defCon';
import merge from 'merge';
import Promise from 'promise';
import log from './log';
import reqSer from './requestSerives';
import resSer from './responseService';
import {local, remote} from './responseService';
import {beforeReq, afterRes} from './evt';
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
		this.requestConnectHandler = reqSer.requestConnectHandler.bind(this);
		//response 服务
		this.responseService = resSer.bind(this);
		this.responseServiceRemote = remote.bind(this);
		this.responseServiceLocal = local.bind(this);
		//请求前
		this.beforeReq = beforeReq.bind(this); 
		//请求后
		this.afterRes = afterRes.bind(this); 
		return Promise.resolve()
		.then(this.createCache.bind(this))
		.then(this.checkParam.bind(this))
		.then(this.createServer.bind(this))
		.then(this.proxyHttps.bind(this))
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
				console.log('proxy https connect');
				try{
					// req.secure;
					req.headers['user-server-type'] = "https";
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
						srvSocket.on('timeout', function(){
							log.debug('**************https-timeout************');
						})
					});
				} catch(err) {
					log.error('https proxy err' + err.message);
				}
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
		let com = this;
		if (opt.model === 'host') {
				server = https.createServer((req, res)=> {
					//当前服务器类型
					req.proxyServerType = "https";
					//用户请求类型 --标记所用
					req.headers['user-server-type'] = "https";
					com.requestHandler(req, res);
				});
				//找到证书，创建https的服务器
				httpsServer = https.createServer((req, res)=>{
					//当前服务器类型
					req.proxyServerType = "http";
					//用户请求类型 --标记所用
					req.headers['user-server-type'] = "http";
					com.requestHandler(req, res);
				});
				httpsServer.listen(opt.httpsPort);
				this.httpsServer = httpsServer;
				server.listen(opt.httpPort);
		} else if (opt.model === 'proxy') {
			if (opt.type === 'https') {
				//找到证书，创建https的服务器
				server = https.createServer((req, res)=>{
					req.proxyServerType = "https";
					if (!req.headers['user-server-type']) {
						req.headers['user-server-type'] = 'http';
					}
					com.requestHandler(req, res);
				});
			} else {
				server = http.createServer((req, res)=>{
					req.proxyServerType = "http";
					if (!req.headers['user-server-type']) {
						req.headers['user-server-type'] = 'http';
					}
					com.requestHandler(req, res);
				});
			}
			server.listen(opt.port, function() {
				log.info('proxy server start from ' + 'http://127.0.0.1:' + opt.port);
			});
		}
		this.server = server;
	}

}
process.on('uncaughtException', err => log.error("出现错误：" + err));
process.on('exit', ()=> log.info('服务器退出'));
export {CatProxy};
