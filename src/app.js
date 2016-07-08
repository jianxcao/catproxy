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
import url from 'url';
import EventEmitter from 'events';
import express from 'express';
import {getCert} from './cert/cert.js';

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
		return Promise.resolve()
		.then(this.createCache.bind(this))
		.then(this.checkParam.bind(this))
		.then(this.createApp.bind(this))
		.then(this.createServer.bind(this))
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
	//出错处理
	errorHandle(err) {
		if (err) {
			log.error(err);
		}
	}
	//创建一个express的app
	createApp() {
		this.app = express();
		//绑定到远程应用
		this.app.use("/", this.requestHandler);
	}
	//根据配置创建服务器
	createServer(server) {
		let opt = this.option;
		//可以自定义server或者用系统内置的server
		if (!(server instanceof http.Server || server instanceof https.Server)) {
			if (opt.type === 'https') {
				//找到证书，创建https的服务器
				let {privateKey: key, cert} = getCert(opt.host);
				server = https.createServer({key,cert, rejectUnauthorized: false});
			} else {
				server = http.createServer();
			}
		}
		//如果是https，则需要过度下请求
		if (server instanceof  http.Server) {
			server.on('connect', this.requestConnectHandler);
			server.on('upgrade', this.requestUpgradeHandler);
		}
		//与express绑定
		server.on('request', this.app);
		//如果server没有被监听，则调用默认端口监听
		if (!server.listening) {
			server.listen(opt.port, function () {
				log.info('proxy server start from ' + 'http://127.0.0.1:' + opt.port);
			});			
		}
		this.server = server;
	}
}
process.on('uncaughtException', err => log.error("出现错误：" + err));
process.on('exit', ()=> log.info('服务器退出'));
export {CatProxy};
