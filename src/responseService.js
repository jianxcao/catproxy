//处理请求来后返回的数据
import http from 'http';
import https from 'https';
import log from './log';
import zlib from 'zlib';
import {Buffer} from 'buffer';
import fs from 'fs';
import merge from 'merge';
import {STATUS, LIMIT_SIZE} from './config/defCon';
import Promise from 'promise';
import changeHost from './changeHost';
import ip from 'ip';
import {localIps} from './getLocalIps';
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
		delete headers['content-encoding'];
		resInfo.bodyData = bodyData;
		let result, info = merge({}, resInfo);
		delete info.res;
		try{
			result = com.beforeRes(info);
		} catch(e) {
			log.error('调用beforeRes出错', e.message);
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

let getUrl = ({port, path: pathname, protocol, hostname})=> {
	if (hostname && protocol) {
		hostname = hostname.split(':')[0];
		port  = ":" + port;
		protocol === "https" ? "http" : "https";
		if (+port === 80 && protocol === "http") {
			port = "";
		}
		if (+port === 443 && protocol === "https") {
			port = "";
		}
		pathname = pathname || "";
		return `${protocol}://${hostname}${port}${pathname}`;
	}
};
let toHeadersFirstLetterUpercase = (headers)=>{
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
			let {bodyData, headers, statusCode, res} = resInfo;
			headers['loacl-file'] = fileAbsPath;
			res.writeHead(statusCode, toHeadersFirstLetterUpercase(headers) || {});
			if (!res.headers) {
				res.headers = headers || {};
			}
			res.end(bodyData);
			res.emit('resBodyDataReady', null, bodyData);
	});
};

export let remote = function(reqInfo, resInfo) {
	let {req} = reqInfo;
	let {res} = resInfo;
	let com = this;
	Promise.resolve()
	.then(() => {
		 	let t = /^\/.*/;
			//请求选项
			let options = {
				hostname: reqInfo.host.split(':')[0],
				port: reqInfo.port || (reqInfo.protocol === 'http' ? 80 : 443),
				path: t.test(reqInfo.path) ? reqInfo.path : "/" + reqInfo.path,
				method: reqInfo.method,
				headers: reqInfo.headers //大小写问题，是否需要转换
			};
			try {
				//忽略不安全的警告
				options.rejectUnauthorized = false;
			} catch (e) {}
			//发送请求，包括https和http
			log.verbose('send proxy', options.hostname, /https/.test(reqInfo.protocol) ? 'https' : 'http');
			return options;
	})
	.then(options => {
		//取当前启动的port
		let {port} = com.option;
		let isServerPort = +port === +options.port;
		return changeHost(options.hostname, isServerPort)
		.then(address => {
			//如果还是死循环，则跳出
			if (isServerPort && localIps.some(current => ip.isEqual(current, address))) {
				return Promise.reject('Dead circulation');
			}
			return merge(options, {
				hostname: address
			});
		})
		.then(null, err => {
			let {res} = resInfo;
			triggerBeforeRes(merge({}, resInfo, {bodyDataErr: err, headers: {}}), com)
			.then(({statusCode, headers}) => {
					res.writeHead(statusCode || 500, headers);
					res.write(err);
					res.end();
			});
		});
	})
	.then((options) => {
		if (!options) {
			return;
		}
		let proxyReq = (/https/.test(reqInfo.protocol) ? https : http)
		.request(options, function(proxyRes) {
			log.verbose('received request from: ' + reqInfo.originalFullUrl);
			resInfo = merge(resInfo, {
				headers: proxyRes.headers || {},
				statusCode: proxyRes.statusCode
			});
			//delete headers['content-length'];
			//没有内容
			// if (+statusCode === 204) {
			// 	res.end();
			// } else {
			// }
			//数据太大的时候触发
			let err = {
				message: 'request entity too large',
				status: STATUS.LIMIT_ERROR
			};
			let resBodyData = [];
			let l = 0;
			let isError = false;
			let isFired = false;
			proxyRes
			//过滤大文件，只有小文件才返回	
			.on('data', chunk => {
				if (l > LIMIT_SIZE) {
					isError = true;
					if (!isFired) {
						isFired = true;
						//如果数据太大提前触发事件，没找到更好的方法，这个时候 用户无法设置bodData
						triggerBeforeRes(merge({}, resInfo, {bodyDataErr: err.message}), com)
						.then(({statusCode, headers}) => {
							headers['remote-url'] = getUrl(merge({}, options, {protocol: reqInfo.protocol}));
							res.writeHead(statusCode || 200, toHeadersFirstLetterUpercase(headers));
							res.write(Buffer.concat(resBodyData));
							res.write(chunk);
							resBodyData = [];
						});
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
								headers['remote-url'] = getUrl(merge({}, options, {protocol: reqInfo.protocol}));
								res.writeHead(statusCode || 200, toHeadersFirstLetterUpercase(headers));
								res.write(bodyData);
								return resInfo;
							});
					} else {
						return resInfo;
					}
				})
				.then(({headers, bodyData})=> {
					//转换head大小写问题
					if (!res.headers) {
						res.headers = headers;
					}
					res.end();
					res.emit('resBodyDataReady', isError ? err : null, bodyData || []);
				});
			});
		});
		//出错直接结束请求
		proxyReq.on("error", (err) => {
			log.error(`error proxy URL: ${req.url}__${err}`);
			res.writeHead(500, {});
			res.end(err.message);
		});
		//有数据就 直接写入
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
	})
	.then(null, err => log.error(err));
};

export default function(reqInfo, resInfo){
	let com = this;
	let res = resInfo.res;
	let req = reqInfo.req;
	//当bodyData缓存处理完毕就触发事件告诉用户数据
	res.on("resBodyDataReady", (err, bodyData) => {
		let headers = res.headers;
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
			if (resInfo.res.finished) {
				//用户做了转发处理，这个时候不知道内容是什么
				resInfo.res.emit('resBodyDataReady', null, null);
			} else {
				if (reqInfo.sendToFile) {
					local.call(com, reqInfo, resInfo, reqInfo.sendToFile);
				} else {
					remote.call(com, reqInfo, resInfo);
				}
			}
		});
	});
}
