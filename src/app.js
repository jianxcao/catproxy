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
import {beforeReq, afterRes, beforeRes} from './evt';
import EventEmitter from 'events';
import {getCert} from './cert/cert.js';
import {SNICallback} from './httpsProxySer';
import ui from './web/app';
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
		this.requestUpgradeHandler = reqSer.requestUpgradeHandler.bind(this);
		//response 服务
		this.responseService = resSer.bind(this);
		//this.responseServiceRemote = remote.bind(this);
		//this.responseServiceLocal = local.bind(this);
		//请求前
		this.beforeReq = beforeReq.bind(this); 
		//请求后
		this.afterRes = afterRes.bind(this);
		//请求前 
		this.beforeRes = beforeRes.bind(this); 
		return Promise.resolve()
		.then(this.createCache.bind(this))
		.then(this.checkParam.bind(this))
		.then(this.checkEnv.bind(this))
		.then(this.createServer.bind(this))
		.then(this.uiInit.bind(this))
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
	uiInit() {
		ui(this.option.uiPort);
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
		let server = opt.server;
		//可以自定义server或者用系统内置的server
		if (!(server instanceof http.Server || server instanceof https.Server)) {
			if (opt.type === 'https') {
				//找到证书，创建https的服务器
				let {privateKey: key, cert} = getCert(opt.host);
				server = https.createServer({key,cert, rejectUnauthorized: false, SNICallback});
			} else {
				server = http.createServer();
			}
		}
		//如果是https，则需要过度下请求
		if (server instanceof  http.Server) {
			server.on('connect', this.requestConnectHandler);
			server.on('upgrade', this.requestUpgradeHandler);
		}
		server.on('request', this.requestHandler);
		//如果server没有被监听，则调用默认端口监听
		if (!server.listening) {
			server.listen(opt.port, function () {
				log.info('proxy server start from ' + 'http://127.0.0.1:' + opt.port);
			});			
		}
		server.on('error', err => log.err(err));
		this.server = server;
	}
}
process.on('uncaughtException', err => log.error("出现错误：" + err.stack));
process.on('exit', ()=> log.info('服务器退出'));
export {CatProxy};
