// 处理请求来后返回的数据
import http from 'http';
import https from 'https';
import log from './log';
import {Buffer} from 'buffer';
import fs from 'fs';
import merge from 'merge';
import {STATUS, LIMIT_SIZE} from './config/defCfg';
import Promise from 'promise';
import changeHost from './changeHost';
import ip from 'ip';
import {localIps} from './getLocalIps';
import {getUrl} from './tools';
import net from 'net';
import {getCert} from './cert/cert.js';
import {writeErr, sendErr, getMonitorId} from './tools';
import mime from 'mime';
import path from 'path';
import querystring from 'querystring';
import * as config from './config/config';
let isStartHttps = /https/;
import {beforeReq, afterRes, beforeRes} from './evt';
// 发送代理请求钱触发
let triggerBeforeRes = function(resInfo) {
	return beforeRes.call(this, resInfo).then(result => {
		return merge(resInfo, result);
	});
};

// 处理本地数据
let local = function(reqInfo, resInfo, fileAbsPath) {
	var com = this;
	resInfo.headers = resInfo.headers || {};
	return new Promise(resolve => {
		fs.readFile(fileAbsPath, function(err, buffer) {
			if (err) {
				resInfo.bodyData = new Buffer("local file error" + err);
				// 如果用户没有设置statusCode就设置默认的
				resInfo.statusCode = 404;
				resolve(resInfo);
			} else {
				// 如果用户没有设置statusCode就设置默认的
				resInfo.statusCode = 200;
				resInfo.bodyData = buffer;
				resolve(resInfo);
			}
		});
	})
	.then(resInfo => {
		return triggerBeforeRes.call(com, resInfo);
	})
	.then(resInfo => {
		let {bodyData, headers = {}, statusCode, res} = resInfo;
		headers['loacl-file'] = querystring.escape(fileAbsPath);
		delete headers['content-length'];
		delete headers['content-encoding'];
		if (!headers['content-type']) {	
			let extName = path.extname(fileAbsPath) || "";
			let mimeType = extName ? mime.lookup((extName).slice(1)) : 'text/html';
			headers['content-type'] = mimeType;
		}
		res.writeHead(statusCode, headers || {});
		if (!res.headers) {
			res.headers = headers || {};
		}
		res.end(bodyData);
		res.emit('resBodyDataReady', null, bodyData);
	}, function(err) {
		let {headers = {}, res} = resInfo;
		// 由错误方法删除的header
		return Promise.reject(err);
	});
};
// 处理将 域名转换成ip
let detailHost = function(result, reqInfo, resInfo) {
	// 取当前启动的port
	let com = this;
	let {port, httpsPort} = config.get();
	let isServerPort = +port === +result.port;
	if (isStartHttps.test(reqInfo.protocol)) {
		isServerPort = +httpsPort === +result.port;
	}
	// 这里自己将死循环嗯哼获取ip错误的情况已经处理了
	return changeHost(result.hostname, isServerPort)
	.then(address => {
		// 如果还是死循环，则跳出
		if (isServerPort && localIps.some(current => ip.isEqual(current, address))) {
			return Promise.reject('Dead circulation');
		}
		return merge(result, {
			hostname: address
		});
	}, err => {
		let {res} = resInfo;
		return triggerBeforeRes.call(com, merge(resInfo, {statusCode: 504}, {bodyDataErr: err, headers: {}}))
		.then(() => {
			return Promise.reject(err);
		});
	});
};

// 真正代理请求
let proxyReq = function(options, reqInfo, resInfo, req) {
	var com = this;
	return new Promise((resolve, reject) => {
		// 在这里hostname已经全部被转换成 ip了，将ip传递到前端
		resInfo.serverIp = options.hostname;
		// 发出请求
		log.verbose('send proxy request originalFullUrl: ' + reqInfo.originalFullUrl);
		let proxyReq = (isStartHttps.test(reqInfo.protocol) ? https : http)
		.request(options, proxyRes => {
			let remoteUrl = getUrl(merge({}, options, {protocol: reqInfo.protocol}));
			log.verbose(`received request from : ${remoteUrl}, statusCode ${proxyRes.statusCode}`);
			resInfo = merge(resInfo, {
				headers: proxyRes.headers || {},
				statusCode: proxyRes.statusCode
			});
			resolve({proxyRes, remoteUrl, reqInfo, resInfo});
		});
		// 向 直接请求写入数据
		if (reqInfo.bodyData && reqInfo.bodyData.length) {
			if (!reqInfo.bodyDataErr) {
				proxyReq.write(reqInfo.bodyData);
				proxyReq.end();
			} else {
				proxyReq.write(reqInfo.bodyData);
				req.on('data', function(buffer) {
					proxyReq.write(buffer);
				})
				.on('end', () => {
					proxyReq.end();
				});
				req.resume();
			}
		} else {// 没有数据就直接end否则读取数据
			proxyReq.end();
		}
		// 出错直接结束请求
		proxyReq.on("error", (err) => {
			reject(err);
		});
	})
	.then(({proxyRes, remoteUrl, reqInfo, resInfo}) => {
		let {res} = resInfo;
		// 数据太大的时候触发
		let err = {
			message: '响应数据过大，无法显示',
			status: STATUS.LIMIT_ERROR
		};
		let resBodyData = [], l = 0, isError = false, isFired = false;
		proxyRes
		// 过滤大文件，只有小文件才返回
		// 文件过大的将无法拦截，没有事件通知
		.on('data', chunk => {
			if (l > LIMIT_SIZE) {
				isError = true;
				if (!isFired) {
					isFired = true;
					let {statusCode, headers} = resInfo;
					headers['remote-url'] = querystring.escape(remoteUrl);
					res.writeHead(statusCode || 200, headers);
					res.write(Buffer.concat(resBodyData));
					res.write(chunk);	
					resBodyData = [];
					let bodyData = null;
					let bodyDataErr = err.message;
					// 提前触发事件
					return triggerBeforeRes.call(com, merge(resInfo, {bodyData, bodyDataErr}));					
				} else {
					res.write(chunk);
				}
			} else {
				resBodyData.push(chunk);
				l += chunk.length;
			}
		})
		.on('end', ()=> {
			let bodyData = Buffer.concat(resBodyData);
			return Promise.resolve(bodyData)
			.then((bodyData) => {
				// 文件大小没有出错的情况下
				if (!isError) {
					return triggerBeforeRes.call(com, merge(resInfo, {bodyData}))
						.then((resInfo) => {
							let {statusCode, headers, bodyData} = resInfo;
							headers['remote-url'] = querystring.escape(remoteUrl);
							res.writeHead(statusCode || 200, headers);
							res.write(bodyData);
							return resInfo;
						}, (err) => {
							let headers = resInfo.headers;
							headers['remote-url'] = querystring.escape(remoteUrl);
							res.writeHead(500, headers);
							err = writeErr(err);
							res.write(err);
							log.error(err);
							resInfo.statusCode = 500;
							resInfo.bodyData = err;
							return resInfo;
						});
				} else {
					resInfo.bodyData = new Buffer("");
					resInfo.bodyDataErr = err.message;
					return resInfo;
				}
			})
			.then(({headers, bodyData}) => {
				// 转换head大小写问题
				if (!res.headers) {
					res.headers = headers;
				}
				res.end();
				res.emit('resBodyDataReady', isError ? err : null, bodyData || new Buffer(""));
			}, function(err) {
				log.error(err);
			});
		});
	})
	.then(null, err => {
		let statusCode = "500";
		if (err && err.message.indexOf('ENOTFOUND') > -1){
			statusCode = '504';
		}
		// 出错也要处理下
		return triggerBeforeRes.call(com, merge({statusCode}, resInfo, {bodyDataErr: err, headers: {}}))
		.then(() => {
			return Promise.reject(err);
		});
	});
};

let remote = function(reqInfo, resInfo) {
	let {req} = reqInfo;
	let {res} = resInfo;
	let com = this;
	let isSecure = req.connection.encrypted || req.connection.pai;
	let oldProtocol = !!isSecure ? "https" : 'http';
	return Promise.resolve()
	.then(() => {
		let t = /^\/.*/;
		let hostname = reqInfo.host.split(':')[0];
		if (!net.isIP(hostname)) {
			reqInfo.headers.host =  reqInfo.host;
		}
		// 请求选项
		let options = {
			hostname,
			port: reqInfo.port || (reqInfo.protocol === 'http' ? 80 : 443),
			path: t.test(reqInfo.path) ? reqInfo.path : "/" + reqInfo.path,
			method: reqInfo.method,
			headers: reqInfo.headers
		};
		if (reqInfo.protocol === 'https') {
			options.rejectUnauthorized = false;
			// 旧的协议是http-即http跳转向https--从新生成证书
			if (oldProtocol === 'http') {
				let {privateKey: key, cert} = getCert(hostname);
				options.key = key;
				options.cert = cert;
			}
		}
		return options;
	})
	.then(options => {
		return detailHost.call(com, options, reqInfo, resInfo);
	})
	.then((options) => {
		return proxyReq.call(com, options, reqInfo, resInfo, req);
	});
};
export default function(reqInfo, resInfo){
	// /******不要尝试取修改 resInfo的引用，会导致 isBinary取不到***************/
	let self = this;
	let res = resInfo.res;
	let req = reqInfo.req;
	let id = getMonitorId();
	Object.defineProperty(reqInfo, "id", {
		value: id,
		enumerable: true
	});	
	Object.defineProperty(resInfo, "id", {
		value: id,
		enumerable: true
	});	
	// 当bodyData缓存处理完毕就触发事件告诉用户数据
	res.on("resBodyDataReady", (err, bodyData) => {
		let headers = res.headers || {};
		let result = {};
		if (reqInfo.sendToFile) {
			Object.defineProperty(result, 'sendToFile', {
				writable: false,
				value: reqInfo.sendToFile,
				enumerable: true
			});
		}
		// 响应回来后所有的字段都是只读的
		Object.defineProperties(result, {
			headers: {
				writable: false,
				value: headers,
				enumerable: true
			},
			statusCode: {
				writable: false,
				value: res.statusCode,
				enumerable: true
			},
			host: {
				writable: false,
				value: reqInfo.host,
				enumerable: true
			},
			method: {
				writable: false,
				value: reqInfo.method,
				enumerable: true
			},
			protocol: {
				writable: false,
				value: reqInfo.protocol,
				enumerable: true
			},
			originalFullUrl: {
				writable: false,
				value: reqInfo.originalFullUrl,
				enumerable: true
			},
			port: {
				writable: false,
				value: reqInfo.port,
				enumerable: true
			},
			path: {
				writable: false,
				value: reqInfo.path,
				enumerable: true
			},
			originalUrl: {
				writable: false,
				value: reqInfo.originalUrl,
				enumerable: true
			},
			endTime: {
				writable: false,
				value: new Date().getTime(),
				enumerable: true
			},
			bodyData: {
				writable: false,
				value: bodyData,
				enumerable: true
			},
			bodyDataErr: {
				writable: false,
				value: err && err.message ? err.message : err,
				enumerable: true
			},
			id: {
				writable: false,
				value: id,
				enumerable: true
			},
			isBinary: {
				writable: false,
				value: resInfo.isBinary,
				enumerable: true			
			}
		});
		if (resInfo.charset) {
			Object.defineProperty(result, "charset", {
				writable: false,
				value: resInfo.charset
			});
		}
		return afterRes.call(self, result);
	});
	req.on('reqBodyDataReady', (err, reqBodyData) => {
		reqInfo.bodyData = reqBodyData || [];
		reqInfo.bodyDataErr = err;
		// 请求前拦截一次--所有的拦截都在evt.js中处理
		Promise.resolve(beforeReq.call(self, reqInfo))
		.then((result) => {
			// 引用发生变化
			if (result !== reqInfo) {
				reqInfo = merge(result, reqInfo);
			}
			Object.defineProperties(resInfo, {
				host: {
					writable: false,
					value: reqInfo.host,
					enumerable: true
				},
				method: {
					writable: false,
					value: reqInfo.method,
					enumerable: true
				},
				protocol: {
					writable: false,
					value: reqInfo.protocol,
					enumerable: true
				},
				port: {
					writable: false,
					value: reqInfo.port,
					enumerable: true
				},
				path: {
					writable: false,
					value: reqInfo.path,
					enumerable: true
				}			
			});
			// 将是否设置weinre传递到 resInfo
			if (typeof reqInfo.weinre === 'boolean') {
				resInfo.weinre = reqInfo.weinre;
				delete reqInfo.weinre;
			}			
			return {reqInfo, resInfo};
		})
		.then(({reqInfo, resInfo}) => {
			// 如果在事件里面已经结束了请求，那就结束了
			if (res.finished) {
				// 用户做了转发处理，这个时候不知道内容是什么
				res.emit('resBodyDataReady', null, null);
			} else if (reqInfo.redirect) {
				resInfo.headers = {
					'Location':reqInfo.redirect
				};
				resInfo.statusCode = 302;
				resInfo.bodyData = "";
				triggerBeforeRes.call(self, resInfo)
				.then(function() {
					res.writeHead(resInfo.statusCode, resInfo.headers);
					res.end();
					res.emit('resBodyDataReady', null, null);
				}, function() {
					let err = "调用内部出现错误";
					sendErr(res, err, req.url);
					res.emit('resBodyDataReady', err, null);
				});
			} else {
				if (reqInfo.sendToFile) {
					return local.call(self, reqInfo, resInfo, reqInfo.sendToFile);
				} else {
					return remote.call(self, reqInfo, resInfo);
				}
			}
		})
		.then(null, function(err) {
			// 日志在 sendErr中打印和处理
			sendErr(res, err, req.url);
			res.emit('resBodyDataReady', err, null);
		});
	});
}
