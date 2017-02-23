'use strict';
import http from 'http';
import https from 'https';
import extendMime from './extendMime';
import defCfg from './config/defCfg';
import configInit, * as config from './config/config';
import merge from 'merge';
import Promise from 'promise';
import log from './log';
import {requestHandler, requestConnectHandler, requestUpgradeHandler} from './requestSerives';
import EventEmitter from 'events';
import {getCert, getCertDir} from './cert/cert.js';
import {SNICallback} from './httpsProxySer';
import ui from './web/app';
import {localIps} from './getLocalIps';
import {error as errFun, getPort, openCmd} from './tools';
import * as requestMiddleware from './requestMiddleware';
import configProps from './config/configProps';
import util from 'util';
import * as rule from './config/rule';
import express from 'express';
import webCfg from './config/webCfg';
import path from 'path';
import ws from './ws/ws';
// 只有这些字段可以被保存到配置文件，如果设置了这个 只有这些字段会保存到配置文件，其他字段只能在内存中，不能保存到文件中
const defSaveProps =  ['hosts', "log", 'breakHttps', 'excludeHttps', 'sni'];
//	process.env.NODE_ENV
const getLocalUiReg = (port) => {
	let ips = localIps.slice(0);
	ips.push('localhost');
	let l = ips.length;
	return ips.reduce((result, cur, index) => {
		if (index > 0) {
			result += "|";
		} 
		result += `(?:${cur}`;
		if (port !== 80 || port !== 443) {
			result += `:${port})`;
		} else {
			result += ")";
		}
		// 最后一次
		if (index === l - 1) {
			return new RegExp(result, "i");
		}
		return result;
	}, "^(?:http|ws)(?:s?)://");
};
/**
 * 按顺序调用数组，每个步骤返回promise
 * @arr 表示要执行的数据
 * @result表示执行的结果，结果会进行合并，结果必须是一个object
 * @context 表示执行的上下文
 */
const execArrByStep = async function (arr, result, context) {
	result = result || {};
	if (!arr || !arr.length) {
		return result;
	}
	for(let cur of arr) {
		// 这里调用如果出错，最后直接抛出 -- 也可以考虑哪一步出错，哪一步单独抛出
		// 检测cur是够是一个函数？？
		let newRes = await cur.call(context, result);
		// 修改了引用
		if (newRes !== result) {
			result = merge(result, newRes);
		}
	}
	return result;
};
class CatProxy{
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
	 *	@param servers 自定义服务器,最多同时开启2个服务器，一个http一个https, 2个服务器的时候顺序是http,https  	如果只有一个则没有顺序问题
	 *
	 *  @param saveProps 要同步到文件的字段 为空则全部同步
	 *
	 */
	constructor(opt, saveProps) {
		this.option = {};
		// 初始化配置文件
		configInit();
		let certDir = getCertDir();
		log.info(`当前证书目录： ${certDir}`);
		// 读取缓存配置文件
		let fileCfg = {};
		configProps
		.forEach(current => {
			let val = config.get(current);
			if ( val !== undefined && val !== null) {
				fileCfg[current] = val;
			}
		});
		if (saveProps === false) {
			saveProps = defSaveProps;
		}
		// 混合三种配置
		let cfg = merge.recursive({}, defCfg, fileCfg, opt);
		if (saveProps && saveProps.length) {
			this.option.saveProps = saveProps;
		}
		// 将用户当前设置保存到缓存配置文件
		configProps
		.forEach(current => {
			if (cfg[current] !== null && cfg[current] !== undefined) {
				// 为‘’表示要删除这个字段
				if (cfg[current] === '' && config.get(current)) {
					config.del(current);
				} else {
					config.set(current, cfg[current]);
				}
			}
		});
		if (saveProps && saveProps.length) {
			config.save(saveProps); 
		} else {
			config.save();
		}
		this._beforeReqEvt = [];
		this._beforeResEvt = [];
		this._afterResEvt = [];
		this._pipeRequestEvt = [];
	}
	init() {
		let com = this;
		// 'hosts', "log", 'breakHttps', 'excludeHttps', 'sni' 可以通过 进程修改的字段
		// 别的进程发送的消息
		process.on('message', function(message) {
			if (!message.result || !typeof message.result === 'object') {
				return;
			}
			log.debug('receive message');
			if (message.type) {
				switch(message.type) {
				case "config":
					let data = {};
					defSaveProps.forEach(function(current) {
						if (message.result[current] !== undefined && message.result[current] !== null) {
							data[current] = message.result[current];
						}
					});
					config.set(data);
					// 每次服务变动都重新设置下log
					config.save(defSaveProps);
					com.setLogLevel();
					break;
				default:
					log.error('收到未知的消息', message);
				}
			}
		});
		this.setLogLevel();
		// dangerous options
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
		return Promise.resolve()
		.then(this.createCache.bind(this))
		.then(this.checkParam.bind(this))
		.then(this.checkEnv.bind(this))
		.then(this.createServer.bind(this))
		.then(this.uiInit.bind(this))
		.then(null, (err) => {
			this.errorHandle(err);
			process.exit(1);
		});
	}
	// 创建缓存，创建请求保存
	createCache() {
	}
	checkParam() {
	}
	// 设置 日志级别
	setLogLevel(logLevel) {
		if (logLevel) {
			config.set('log', logLevel);
			log.transports.console.level = config.get('log');
			config.save('log');
		} else {
			log.transports.console.level = config.get('log');
		}
	}
	// 设置服务器类别
	setServerType(type) {
		config.set('type', type);
		config.save('type');
	}
	// 设置服务器端口
	setHttpPort(port) {
		port = + port;
		config.set('port', port);
		config.save('port');
	}
	setHttpsPort(port) {
		port = + port;
		config.set('httpsPort', port);
		config.save('httpsPort');
	}
	// 设置ui端口
	setUiPort(port) {
		port = + port;
		config.set('uiPort', port);
		config.save('uiPort');
	}
	// 设置sni类型
	setSniType(type) {
		config.set("sni", type);
		config.save('sni');
	}
	// 设置破解https
	setBreakHttps(list) {
		config.set('breakHttps', list);
		config.save('breakHttps');
	}
	// 设置排除https列表
	setExcludeHttps(list) {
		config.set('excludeHttps', list);
		config.save('excludeHttps');
	}
	setRules(rules) {
		rule.saveRules(rules);
	}
	// 获取配置
	getConfig(key) {
		if (typeof key === 'string') {
			return config.get(key);
		}
		return config.get();
	}
	setConfig(...arg) {
		config.set(...arg);	
		config.save();
	}
	// 环境检测
	checkEnv() {
	}
	uiInit() {
		let port = config.get('uiPort');
		let isAutoOpen = config.get('autoOpen');
		let p = port;
		// 如果port是0 则只提供下载链接的server
		return Promise.resolve(p || getPort())
		.then((p) => {
			// 内置服务器初始化
			let host = `http://${localIps[0]}:${p}`;
			let uiOption = {
				port : p,
				hostname: localIps[0],
				host: host,
				wsServerUrl: host + webCfg.wsPath,
				cdnBasePath: path.join('/c', webCfg.cdnBasePath),
				env: webCfg.env
			};
			// 写成正则，判断是否是ui的一个访问地址
			this.localUiReg = getLocalUiReg(p);
			let uiApp = ui(!!port);
			let app = express();
			let uiServer = app.listen(p, function() {
				log.info('catproxy 规则配置地址：' + host +"/c/index");
				log.info('catproxy 监控界面地址：' + host +"/c/index");
				if(port && isAutoOpen) {
					openCmd(host + "/c/index");
				}
			});
			uiApp.locals.uiOption = uiOption;
			uiServer.on('error', (err) => {
				errFun(err);
				process.exit(1);
			});
			// 字app
			app.use("/c", uiApp);
			this.ui = {
				app,
				uiServer
			};
		})
		.then(() => {
			if (port) {
				return ws(this.ui.uiServer, this);
			}
		})
		.then(wsServer => {
			if (wsServer) {
				this.ui.wsServer = wsServer;
			}
		});
	}
	// 出错处理
	errorHandle(err) {
		if (err) {
			log.error(err);
		}
		return Promise.reject(err);
	}
	// 根据配置创建服务器
	createServer() {
		let opt = config.get();
		let servers = this.servers || [];
		let com = this;
		// 可以自定义server或者用系统内置的server
		if (opt.type === 'http' && !servers[0]) {
			servers[0] = http.createServer();
		} else if (opt.type === 'https' && !servers[0]){
			// 找到证书，创建https的服务器
			let {privateKey: key, cert} = getCert(opt.certHost);
			servers[0] = https.createServer({key,cert, rejectUnauthorized: false, SNICallback});
		} else if (opt.type === 'all' && !servers[0]  && !servers[1]) {
			servers[0] = http.createServer();
			let {privateKey: key, cert} = getCert(opt.certHost);
			servers[1] = https.createServer({key,cert, rejectUnauthorized: false, SNICallback});
		}
		let requestFun = requestMiddleware.middleWare(requestHandler);
		servers.forEach(server => {
			server.catProxy = com;
			// 如果在http下代理https，则需要过度下请求
			if (server instanceof  http.Server) {
				server.on('connect', requestConnectHandler);
			}
			server.on('upgrade', requestUpgradeHandler);
			server.on('request', function(req, res) {
				if (req.headers.upgrade) {
					return;
				}
				requestFun.call(this, req, res);
			});
			server.on('clientError', function(err, con) {
				log.error('ser-clientError' + err);
			});			
			let serverType = server instanceof  http.Server ? 'http' : 'https';
			let port = serverType === 'http' ? opt.port : opt.httpsPort;
			// 如果server没有被监听，则调用默认端口监听
			if (!server.listening) {
				// 根据server的类型调用不同的端口
				server.listen(port, function () {
					log.info('代理服务器启动于：' + `${serverType}://${localIps[0]}:${port}`);
				});
			}
			server.on('error', function(err) {
				errFun(err);
				process.exit(1);
			});
		});
		this.servers = servers;
	}
	// 想服务器添加request事件
	use (fun) {
		requestMiddleware.use(fun);
		return this;
	}
	// 在中转请求前，可以用于修改reqInfo
	onBeforeReq(...fun) {
		fun.forEach(f => util.isFunction(f) && this._beforeReqEvt.push(f));
	}
	// 请求结束，可以用于产看请求结果
	onAfterRes(...fun) {
		fun.forEach(f => util.isFunction(f) && this._afterResEvt.push(f));
	}
	// 获得中转请求前，可以用于修改resInfo
	onBeforeRes(...fun) {
		fun.forEach(f => util.isFunction(f) && this._beforeResEvt.push(f));
	}
	onPipeRequest(...fun) {
		fun.forEach(f => util.isFunction(f) && this._pipeRequestEvt.push(f));
	}
	/**
	 * 触发req事件，result表示参数，context表示上下文
	 * result 格式看evt中的格式
	 */
	triggerBeforeReq (result, context) {
		return execArrByStep(this._beforeReqEvt, result, context);
	}
	/**
	 * 触发 请求前事件
	 *  result 格式看evt中的格式
	 *  context为上下文
	 */
	triggerBeforeRes (result, context) {
		return execArrByStep(this._beforeResEvt, result, context);
	}
	/**
	 * 触发请求后事件
	 *  result 格式看evt中的格式
	 *  context为上下文
	 */
	triggerAfterRes (result, context) {
		if (this._afterResEvt.length) {
			this._afterResEvt.forEach(current => {
				try{ 
					current.call(context, result);
				} catch (e) {
					log.error(e);
				}
			});
		}
	}
	/**
	 * 触发穿过请求
	 *  result 格式看evt中的格式
	 *  context为上下文
	 */
	triggerPipeReq (result, context) {
		if (this._pipeRequestEvt.length) {
			this._pipeRequestEvt.forEach(current => {
				try{ 
					current.call(context, result);
				} catch (e) {
					log.error(e);
				}
			});
		}
	}
}

process.on('uncaughtException', errFun);
process.on('exit', ()=> log.info('服务器退出'));
export default CatProxy;
export {CatProxy};
