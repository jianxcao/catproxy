//处理请求来后返回的数据
import http from 'http';
import https from 'https';
import log from './log';
import zlib from 'zlib';
import {Buffer} from 'buffer';
import fs from 'fs';
import merge from 'merge';
import through2 from 'through2';
import {STATUS, LIMIT_SIZE} from './defCon';
import Promise from 'promise';
//处理本地数据
export let local = function(reqInfo, resInfo, fileAbsPath, bodyData) {
	return new Promise(resolve => {
		if (bodyData) {
			resInfo.bodyData = bodyData;
			resolve(resInfo);
			if (!resInfo.statusCode) {
				resInfo.statusCode = 200;
			}
		} else {
			fs.readFile(fileAbsPath, function(err, buffer) {
				if (err) {
					resInfo.bodyData = new Buffer("local file error" + err);
					//如果用户没有设置statusCode就设置默认的
					if (!resInfo.statusCode) {
						resInfo.statusCode = 404;
					}
					resolve(resInfo);
				} else {
					//如果用户没有设置statusCode就设置默认的
					if (!resInfo.statusCode) {
						resInfo.statusCode = 200;
					}
					resInfo.bodyData = buffer;
					resolve(resInfo);
				}
			});
		}
	})
	.then( resInfo => {
			let {bodyData, headers, statusCode, res} = resInfo;
			res.writeHead(statusCode, headers || {});
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
	Promise.resolve()
	.then(() => {
			//请求选项
			let options = {
				hostname: reqInfo.host.split(':')[0],
				port: reqInfo.port || (reqInfo.protocol === 'http' ? 80 : 443),
				path: reqInfo.path,
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
	.then((options) => {
		let proxyReq = (/https/.test(reqInfo.protocol) ? https : http)
		.request(options, function(proxyRes) {
			log.verbose('received request from: ' + reqInfo.originalFullUrl);
			//取到 状态码和 headers
			let {statusCode, headers} = proxyRes;
			headers = merge(headers, resInfo.headers);
			if (resInfo.statusCode) {
				statusCode = resInfo.statusCode;
			}
			//delete headers['content-length'];
			//没有内容
			//转换head大小写问题
			res.writeHead(statusCode, headers);
			if (!res.headers) {
				res.headers = headers;
			}
			if (+statusCode === 204) {
				res.end();
			} else {
				let resBodyData = [];
				let l = 0;
				let isFired = false;
				proxyRes
				//过滤文件下载，视频音频等文件，这里不监听他们
				//其他文件考虑写入内存？？还是写入文件？？	
				.pipe(through2(function(chunk, enc, callback) {
						if (l > LIMIT_SIZE) {
							if (!isFired) {
								res.emit('resBodyDataReady', {
										message: 'request entity too large',
										status: STATUS.LIMIT_ERROR
									}, []);
								isFired = true;
							}
						} else {
							resBodyData.push(chunk);
							l += chunk.length;
						}
						this.push(chunk);
						callback();
				}))
				.pipe(res);
				//请求结束
				res.on('finish', ()=> {
					if (!isFired) {
						isFired = true;
						res.emit('resBodyDataReady', null, Buffer.concat(resBodyData));
					}
				});
			}
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
		if (resInfo.bodyDataFile) {
			Object.defineProperty(result, 'bodyDataFile', {
				writable: false,
				value: resInfo.bodyDataFile,
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
			}
		});
		return new Promise(function(resolve, reject) {
			//成功的取到bodyData
			if (bodyData && !err) {
				let isZip = /gzip/i.test(headers['content-encoding']);
				let isDeflate = /deflate/i.test(headers['content-encoding']);
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
		})
		.then((bodyData) => {
			Object.defineProperties(result,  {
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
			});
			return result;
		}, err => {
			Object.defineProperties(result,  {
				endTime: {
					writable: false,
					value: new Date().getTime(),
					enumerable: true
				},
				bodyData: {
					writable: false,
					value: [],
					enumerable: true
				},
				bodyDataErr: {
					writable: false,
					value: err,
					enumerable: true
				},
			});	
			return result;		
		})
		.then(result => {
			return com.afterRes(result);
		});
	});
	req.on('reqBodyDataReady', (err, reqBodyData) => {
		reqInfo.bodyData = reqBodyData || [];
		reqInfo.bodyDataErr = err;
		//请求前拦截一次--所有的拦截都在evt.js中处理
		Promise.resolve(com.beforeReq(reqInfo, resInfo))
		.then((result) => {
			if (result && result.res) {
				reqInfo = result;
			}
			return {reqInfo, resInfo};
		})
		.then(({reqInfo, resInfo}) => {
			//如果在事件里面已经结束了请求，那就结束了
			if (!resInfo.res.finished) {
				if (resInfo.bodyDataFile) {
					local.call(com, reqInfo, resInfo, resInfo.bodyDataFile);
				} else if (resInfo.bodyData) {
					local.call(com, reqInfo, resInfo, null, resInfo.bodyData);
				} else {
					remote.call(com, reqInfo, resInfo);
				}
			}
		});
	});
}
