"use strict";
import http from 'http';
import https from 'https';
import defCfg from './config/defCfg';
import * as config from './config/config';
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
import {localIps} from './getLocalIps';
import {error as errFun} from './tools';
//process.env.NODE_ENV
//主类
class CatProxy extends EventEmitter{
	/**
	 * 
	 * @param  {[type]} option 
	 *  {
	 *  	type: "当前服务器类型"
	 *		port: "当前http端口",
	 *    httpsPort: "当前https服务器端口",
	 *		certHost: "https证书生成默认host代理",
	 *		crackHttps 是否解开 https请求，在 http代理模式下,
	 *		log: '日志级别',
	 *		uiPort 端口
	 *	}
	 *	@param servers 自定义服务器,最多同时开启2个服务器，一个http一个https, 2个服务器的时候顺序是http,https 
	 *	如果只有一个则没有顺序问题
	 */
	constructor(option, sers) {
		super();
		//读取缓存配置文件
		let fileCfg = {};
		['port', 'httpsPort', 'uiPort', 'type', 'log']
		.forEach(current => {
			let val = config.get(current);
			if ( val !== undefined && val !== null) {
				fileCfg[current] = val;
			}
		});
		//混合三种配置
		this.option = merge({}, defCfg, fileCfg, option);
		//将用户当前设置保存到缓存配置文件
		['port', 'httpsPort', 'uiPort', 'type', 'log', 'breakHttps']
		.forEach(current => {
			if (option[current] !== null && option[current] !== undefined) {
				config.set(current, option[current]);
			}
		});
		//如果存在自定义sever
		if (sers && sers.length) {
			let servers = [];
			let type = this.option.type;
			if (type === 'http' && sers[0] instanceof http) {
				servers[0] = sers[0];
			} else if (type === 'https' && sers[0] instanceof https) {
				servers[0] = sers[0];
			} else if (type === 'all' && sers[0] instanceof http && sers[1] instanceof https) {
				servers = sers.slice(0, 2);
			}
		}
		config.save();
	}
	init() {
		if (this.option.log) {
			log.transports.console.level = this.option.log;
		}

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
		let port = this.option.uiPort;
		if (+port === 0) {
			return;
		}
		ui({
			port : port,
			hostname: localIps[0],
			host: `http://${localIps[0]}:${port}`
		});
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
		let com = this;
		let servers = this.servers || [];
		//可以自定义server或者用系统内置的server
		if (opt.type === 'http' && !servers[0]) {
			servers[0] = http.createServer();
		} else  if (opt.type === 'https' && !servers[0]){
			//找到证书，创建https的服务器
			let {privateKey: key, cert} = getCert(opt.certHost);
			servers.push[0] = https.createServer({key,cert, rejectUnauthorized: false, SNICallback});
		} else if (opt.type === 'all' && !servers[0]  && !servers[1]) {
			servers[0] = http.createServer();
			let {privateKey: key, cert} = getCert(opt.certHost);
			servers[1] = https.createServer({key,cert, rejectUnauthorized: false, SNICallback});
		}
		servers.forEach(server => {
			// server.on('upgrade', com.requestUpgradeHandler);
			//如果在http下代理https，则需要过度下请求
			if (server instanceof  http.Server) {
				server.on('connect', com.requestConnectHandler);
			}
			server.on('request', com.requestHandler);
			let serverType = server instanceof  http.Server ? 'http' : 'https';
			let port = serverType === 'http' ? opt.port : opt.httpsPort;
			//如果server没有被监听，则调用默认端口监听
			if (!server.listening) {
				//根据server的类型调用不同的端口
				server.listen(port, function () {
					log.info('proxy server start from ' + `${serverType}://${localIps[0]}:${port}`);
				});
			}
			server.on('error', errFun);
		});
		this.servers = servers;
	}
}
process.on('uncaughtException', errFun);
process.on('exit', ()=> log.info('服务器退出'));
export default CatProxy;
