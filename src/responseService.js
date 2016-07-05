//处理请求来后返回的数据
import http from 'http';
import https from 'https';
import log from './log';
import zlib from 'zlib';
import {Buffer} from 'buffer';
import fs from 'fs';
import merge from 'merge';
//处理本地数据
export let local = function(reqInfo, resInfo, fileAbsPath) {
	let com = this;
	Promise.resolve(this.beforeReq(reqInfo))
	.then((result) => {
		reqInfo = result || reqInfo;
		return new Promise(resolve => {
			fs.readFile(fileAbsPath, function(err, buffer) {
				if (err) {
					resInfo.bodyData = new Buffer("local file error" + err);
					resolve(resInfo);
				} else {
					resInfo.bodyData = buffer;
					resolve(resInfo);
				}
			});
		});
	})
	.then(resInfo => {
		let {bodyData} = resInfo;
		let headers = {
			'content-length': (bodyData || "").length
		};
		return merge(resInfo, {
				headers,
				host: reqInfo.host,
				method: reqInfo.method,
				protocol: reqInfo.protocol,
				fullUrl: reqInfo.fullUrl,
				port: reqInfo.port,
				endTime : new Date().getTime(),
				path: reqInfo.path,
				url: reqInfo.url
		});
	})
	.then(resInfo => {
			return Promise.resolve(com.afterRes(resInfo))
		.then(result => result || resInfo);
	})
	.then(({res, headers, bodyData}) => {
		res.writeHead(200, headers);
		res.end(bodyData);
	});
};

export let remote = function(reqInfo, resInfo) {
	let {req} = reqInfo;
	let {res} = resInfo;
	let com = this;
	//trigger beforeReq
	return Promise.resolve(com.beforeReq(reqInfo))
	.then((result)=> {
			reqInfo = reqInfo || result;
			//请求选项
			let options = {
				hostname: reqInfo.host.split(':')[0],
				port: reqInfo.port || (reqInfo.protocol === 'http' ? 80 : 443),
				path: reqInfo.path,
				method: reqInfo.method,
				headers: reqInfo.headers
			};
			try {
				//忽略不安全的警告
				options.rejectUnauthorized = false;
				//不要压缩请求
				delete options.headers['accept-encoding'];
			} catch (e) {}
			//写入请求数据长度
			options.headers["content-length"] = reqInfo.bodyData.length || 0;
			//发送请求，包括https和http
			log.debug('send proxy', options.hostname, /https/.test(reqInfo.protocol) ? 'https' : 'http');
			return options;
	})
	.then((options) => {
		let proxyReq = (/https/.test(reqInfo.protocol) ? https : http)
		.request(options, function(proxyRes) {
			log.debug('received request from: ' + options.hostname);
			//取到 状态码和 headers
			let {statusCode, headers} = proxyRes;
			//如果文件压缩了，需要解压缩，删掉 压缩的编码
			let isZip = /gzip/i.test(headers['content-encoding']);
			let isDeflate = /deflate/i.test(headers['content-encoding']);
			if (isZip || isDeflate) {
				delete headers['content-encoding'];
			}
			//写回header
			delete headers['content-length'];
			let receiveData = [];
			proxyRes.on("data", function(chunk) {
				receiveData.push(chunk);
			});
			proxyRes.on("end", function() {
				return new Promise(function(resolve) {
					let data = Buffer.concat(receiveData);
					if (isZip) {
							zlib.gunzip(data, function(err, buff) {
								if (err) {
									resolve(err.message);
									log.error('decompress err: ', err.message);
								} else {
									resolve(buff);
								}
							}); 
					} else if(isDeflate) {
							zlib.inflateRaw(data, function(err, buff) {
								if (err) {
									resolve(err.message);
									log.error('decompress err: ', err.message);
								} else {
									// log.debug('buff', buff.length, buff.toString());
									resolve(buff);
								}
							});

					} else {
						resolve(data);
					}
				})
				.then(function(data) {
					headers['content-length'] = data.length;
					let resInfo = {
						res,
						headers,
						host: options.host,
						method: options.method,
						protocol: reqInfo.protocol,
						fullUrl: reqInfo.fullUrl,
						port: options.port,
						endTime : new Date().getTime(),
						path: options.path,
						url: reqInfo.url,
						bodyData: data
					};
					return resInfo;
				})
				.then(resInfo => {
					return Promise.resolve(com.afterRes(resInfo))
					.then(result => result || resInfo);
				})
				.then(function({headers, bodyData}) {
					// if ((proxyRes.headers['content-type'] || "").indexOf('image') < 0) {
					//  log.debug("content", data.toString());
					// }
					res.writeHead(statusCode, headers);
					res.end(bodyData);
				})
				.then(null, err => log.error(err));
			});
			proxyRes.on('error', function(err) {
				log.error(`error proxy URL: ${req.url}__${err}`);
			});
		});
		//出错直接结束请求
		proxyReq.on("error", (err) => {
			log.error(`error proxy URL: ${req.url}__${err}`);
			///结束请求
			res.write('error proxy:' + err.message);
			res.end();
		});
		//trigger afterReq
		//将request的数据传送过去
		proxyReq.write(reqInfo.bodyData);
		proxyReq.end();
	})
	.then(null, err => log.error(err));
};

export default function(reqInfo, resInfo){
	remote.call(this, reqInfo, resInfo);
	// local.call(this, reqInfo, resInfo, "D:/project/gitWork/catproxy/bin.js");
}
