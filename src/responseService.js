//处理请求来后返回的数据
import http from 'http';
import https from 'https';
import log from './log';
import zlib from 'zlib';
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
import {writeErr} from './tools';
import mime from 'mime';
import path from 'path';
import querystring from 'querystring'
let isStartHttps = /https/;
//解压数据
let decodeCompress = function(bodyData, encode) {
	return new Promise(function(resolve, reject) {
		//成功的取到bodyData
		if (bodyData) {
			let isZip = /gzip/i.test(encode);
			let isDeflate = /deflate/i.test(encode);
			if (isZip) {
					zlib.gunzip(bodyData, function(err, buff) {
						if (err) {
							reject(err.message);
							log.error('decompress err: ', err.message);
						} else {
							resolve(buff);
						}
					}); 
			} else if(isDeflate) {
					zlib.inflateRaw(bodyData, function(err, buff) {
						if (err) {
							reject(err.message);
							log.error('decompress err: ', err.message);
						} else {
							resolve(buff);
						}
					});
			} else {
				resolve(bodyData);
			}
		} else {
			resolve([]);
		}
	});
};

let triggerBeforeRes = (resInfo, com) => {
	let headers = resInfo.headers || {};
	return decodeCompress(resInfo.bodyData, headers['content-encoding'])
	.then((bodyData) => {
		//不压缩
		//获取数据出错，就不解压
		if (!resInfo.bodyDataErr) {
			delete headers['content-encoding'];
		}
		resInfo.bodyData = bodyData;
		let result, info = merge({}, resInfo);
		delete info.res;
		try{
			result = com.beforeRes(info);
		} catch(e) {
			log.error('调用beforeRes出错', e.message);
			return Promise.reject(e.message);
		}
		//如果有返回结果
		if (result) {
			//返回的是一个promise
			if(result.then) {
				return result.then(result => merge(resInfo, result), () => resInfo);
			//返回的是一个resInfo
			} else {
				resInfo = merge(resInfo, result);
			}
		}
		return  Promise.resolve(resInfo);
	});
};

let toHeadersFirstLetterUpercase = (headers = {})=>{
	let reg = /(?:^\w)|-\w/g;
	let result = {};
	if(headers) {
		for (let key in headers) {
			result[key.replace(reg, current => current ? current.toUpperCase() : current)] = headers[key];
		}
		return result;
	}
	return headers;
};

//处理本地数据
export let local = function(reqInfo, resInfo, fileAbsPath) {
	var com = this;
	resInfo.headers = resInfo.headers || {};
	return new Promise(resolve => {
		fs.readFile(fileAbsPath, function(err, buffer) {
			if (err) {
				resInfo.bodyData = new Buffer("local file error" + err);
				//如果用户没有设置statusCode就设置默认的
				resInfo.statusCode = 404;
				resolve(resInfo);
			} else {
				//如果用户没有设置statusCode就设置默认的
				resInfo.statusCode = 200;
				resInfo.bodyData = buffer;
				resolve(resInfo);
			}
		});
	})
	.then(resInfo => {
		return triggerBeforeRes(resInfo, com);
	})
	.then(resInfo => {
		let {bodyData, headers = {}, statusCode, res} = resInfo;
		headers['loacl-file'] = querystring.escape(fileAbsPath);
		delete headers['content-length'];
		delete headers['content-encoding'];
		if (!headers['content-type']) {	
			let mimeType = mime.lookup((path.extname(fileAbsPath) || "").slice(1));
			headers['content-type'] = mimeType;
		}
		res.writeHead(statusCode, toHeadersFirstLetterUpercase(headers) || {});
		if (!res.headers) {
			res.headers = headers || {};
		}
		res.end(bodyData);
		res.emit('resBodyDataReady', null, bodyData);
	}, function(err) {
		let {headers = {}, res} = resInfo;
		delete headers['content-encoding'];
		delete headers['content-length'];
		if (!headers['content-type']) {
			headers['content-type'] = 'text/html;charset=utf-8';
		}
		res.writeHead(500, toHeadersFirstLetterUpercase(headers) || {});
		err = writeErr(err);
		res.end(err);
		res.emit('resBodyDataReady', err, null);
	})
	.then(null, function(err) {
		log.error(err);
	})
};
//处理将 域名转换成ip
let detailHost = function(result, reqInfo, resInfo) {
	//取当前启动的port
	let com = this;
	let {port, httpsPort} = com.option;
	let isServerPort = +port === +result.port;
	if (isStartHttps.test(reqInfo.protocol)) {
		isServerPort = +httpsPort === +result.port;
	}
	//这里自己将死循环嗯哼获取ip错误的情况已经处理了
	return changeHost(result.hostname, isServerPort)
	.then(address => {
		//如果还是死循环，则跳出
		if (isServerPort && localIps.some(current => ip.isEqual(current, address))) {
			return Promise.reject('Dead circulation');
		}
		return merge(result, {
			hostname: address
		});
	}, err => {
		let {res} = resInfo;
		return triggerBeforeRes(merge({}, resInfo, {bodyDataErr: err, headers: {}}), com)
		.then(({statusCode, headers}) => {
			delete headers['content-encoding'];
			delete headers['content-length'];
			res.writeHead(statusCode || 500, headers);
			err = writeErr(err);
			res.end(err);
			res.emit('resBodyDataReady', err, null);
		});
	});
};

//真正代理请求
let proxyReq = function(options, reqInfo, resInfo, req) {
	var com = this;
	return new Promise((resolve, reject) => {
		//发出请求
		let proxyReq = (isStartHttps.test(reqInfo.protocol) ? https : http)
		.request(options, proxyRes => {
			let remoteUrl = getUrl(merge({}, options, {protocol: reqInfo.protocol}));
			log.verbose(`received request from : ${remoteUrl}`);
			log.verbose('request originalFullUrl: ' + reqInfo.originalFullUrl);
			resInfo = merge(resInfo, {
				headers: proxyRes.headers || {},
				statusCode: proxyRes.statusCode
			});
			resolve({proxyRes, remoteUrl, reqInfo, resInfo});
		});
		//向 直接请求写入数据
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
				req.pipe(proxyReq);				
			}
		} else {//没有数据就直接end否则读取数据
			proxyReq.end();
		}
		//出错直接结束请求
		proxyReq.on("error", (err) => {
			log.error(err);
			reject(err);
		});
	})
	.then(({proxyRes, remoteUrl, reqInfo, resInfo}) => {
		let {res} = resInfo;
		//数据太大的时候触发
		let err = {
			message: 'request entity too large',
			status: STATUS.LIMIT_ERROR
		};
		let resBodyData = [], l = 0, isError = false, isFired = false;
		proxyRes
		//过滤大文件，只有小文件才返回
		//文件过大的将无法拦截，没有事件通知
		.on('data', chunk => {
			if (l > LIMIT_SIZE) {
				isError = true;
				//log.debug('in size', LIMIT_SIZE, l);
				if (!isFired) {
					isFired = true;
					let {statusCode, headers} = resInfo;
					delete headers['content-length'];
					headers['remote-url'] = querystring.escape(remoteUrl);
					res.writeHead(statusCode || 200, toHeadersFirstLetterUpercase(headers));
					res.write(Buffer.concat(resBodyData));
					res.write(chunk);	
					resBodyData = [];
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
				//文件大小没有出错的情况下
				if (!isError) {
					return triggerBeforeRes(merge({}, resInfo, {bodyData}), com)
						.then((resInfo) => {
							let {statusCode, headers, bodyData} = resInfo;
							delete headers['content-length'];
							headers['remote-url'] = querystring.escape(remoteUrl);
							res.writeHead(statusCode || 200, toHeadersFirstLetterUpercase(headers));
							res.write(bodyData);
							return resInfo;
						}, (err) => {
							let headers = resInfo.headers;
							delete headers['content-length'];
							headers['remote-url'] = querystring.escape(remoteUrl);
							res.writeHead(500, toHeadersFirstLetterUpercase(headers));
							err = writeErr(err);
							res.write(err);
							log.error(err);
							resInfo.statusCode = 500;
							resInfo.bodyData = err;
							return resInfo;
						});
				} else {
					return resInfo;
				}
			})
			.then(({headers, bodyData}) => {
				//转换head大小写问题
				if (!res.headers) {
					res.headers = headers;
				}
				res.end();
				res.emit('resBodyDataReady', isError ? err : null, bodyData || []);
			});
		});
	})
	.then(null, function(err) {
		///-----------------------------------------------------------处理超时无响应等等请求状态
	});
};

export let remote = function(reqInfo, resInfo) {
	let {req} = reqInfo;
	let {res} = resInfo;
	let com = this;
	let oldProtocol = reqInfo.protocol;
	Promise.resolve()
	.then(() => {
		let t = /^\/.*/;
		let hostname = reqInfo.host.split(':')[0];
		if (!net.isIP(hostname)) {
			reqInfo.headers.host =  reqInfo.host;
		}
		//请求选项
		let options = {
			hostname,
			port: reqInfo.port || (reqInfo.protocol === 'http' ? 80 : 443),
			path: t.test(reqInfo.path) ? reqInfo.path : "/" + reqInfo.path,
			method: reqInfo.method,
			headers: toHeadersFirstLetterUpercase(reqInfo.headers) //大小写问题，是否需要转换
		};
		if (reqInfo.protocol === 'https') {
			options.rejectUnauthorized = true;
			//旧的协议是http-即http跳转向https--从新生成证书
			if (oldProtocol === https) {
				let {privateKey: key, cert} = getCert(hostname);
				options.key = key;
				options.cert = cert;
			}
		}
		//发送请求，包括https和http
		log.verbose('send proxy', options.hostname, reqInfo.protocol);
		return options;
	})
	.then(options => {
		return detailHost.call(com, options, reqInfo, resInfo);
	})
	.then((options) => {
		return proxyReq.call(com, options, reqInfo, resInfo, req);
	})
	.then(null, err => {
		log.error(`proxy request err`, err);
		if (!res.finished) {
			res.writeHead(500);
			err = writeErr(err);
			res.end(err);
			res.emit('resBodyDataReady', err, null);
		}
		log.error(err);
	});
};

export default function(reqInfo, resInfo){
	let com = this;
	let res = resInfo.res;
	let req = reqInfo.req;
	//当bodyData缓存处理完毕就触发事件告诉用户数据
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
		//响应回来后所有的字段都是只读的
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
			}
		});
		return com.afterRes(result);
	});
	req.on('reqBodyDataReady', (err, reqBodyData) => {
		reqInfo.bodyData = reqBodyData || [];
		reqInfo.bodyDataErr = err;
		//请求前拦截一次--所有的拦截都在evt.js中处理
		Promise.resolve(com.beforeReq(reqInfo))
		.then((result) => {
			if (result && result.res) {
				reqInfo = result;
			}
			return {reqInfo, resInfo};
		})
		.then(({reqInfo, resInfo}) => {
			// 如果在事件里面已经结束了请求，那就结束了
			if (res.finished) {
				//用户做了转发处理，这个时候不知道内容是什么
				res.emit('resBodyDataReady', null, null);
			} else if (reqInfo.redirect) {
				resInfo.headers = {
					'Location':reqInfo.redirect
				};
				resInfo.statusCode = 302;
				resInfo.bodyData = "";
				triggerBeforeRes(resInfo, com)
				.then(function() {
					res.writeHead(resInfo.statusCode, resInfo.headers);
					res.end();
					res.emit('resBodyDataReady', null, null);
				}, function() {
					res.writeHead(500, {});
					res.end("调用内部出现错误");
					res.emit('resBodyDataReady', "调用内部出现错误", null);
				});
			} else {
				if (reqInfo.sendToFile) {
					return local.call(com, reqInfo, resInfo, reqInfo.sendToFile);
				} else {
					return remote.call(com, reqInfo, resInfo);
				}
			}
		}, function(err) {
			if (res.finished) {
				res.writeHead(500, {});
				err = writeErr(err);
				res.end(err);
				res.emit('resBodyDataReady', err, null);				
			}
		});
	});
}
