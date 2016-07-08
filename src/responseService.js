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
	Promise.resolve()
	.then(() => {
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
	Promise.resolve()
	.then(() => {
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
			} catch (e) {}
			//发送请求，包括https和http
			log.verbose('send proxy', options.hostname, /https/.test(reqInfo.protocol) ? 'https' : 'http');
			return options;
	})
	.then((options) => {
		let proxyReq = (/https/.test(reqInfo.protocol) ? https : http)
		.request(options, function(proxyRes) {
			log.verbose('received request from: ' + reqInfo.fullUrl);
			//取到 状态码和 headers
			let {statusCode, headers} = proxyRes;
			//delete headers['content-length'];
			res.writeHead(statusCode, headers);
			proxyRes.pipe(res);
		});
		//出错直接结束请求
		 proxyReq.on("error", (err) => {
			log.error(err.stack);
		 	log.error(`error proxy URL: ${req.url}__${err}`);
		 	//结束请求
			 res.writeHead(500, {});
			 res.write('error proxy:' + err.message);
			 res.end();
		 });
		//trigger afterReq
		//将request的数据传送过去
		log.silly(reqInfo.bodyData.length);
		 proxyReq.write(reqInfo.bodyData);
		 proxyReq.end();
		//req.pipe(proxyReq);
		//req.on('end', () => {
		//	log.silly('end, end end end end');
		//	proxyReq.end();
		//});
		// req.on('end', ()=>{})
		// req.on('end', ()=>{})
	})
	.then(null, err => log.error(err));
};

export default function(reqInfo, resInfo){
	var com = this;
	var res = resInfo.res;
	res.on("finish", () => {
		log.debug('finish');
		//触发afterRes事件
		resInfo = merge(resInfo, {
			headers: res.headers,
			host: reqInfo.host,
			method: reqInfo.method,
			protocol: reqInfo.protocol,
			fullUrl: reqInfo.fullUrl,
			port: reqInfo.port,
			endTime : new Date().getTime(),
			path: reqInfo.path,
			url: reqInfo.url
		});
	});
	
	//请求前拦截一次--所有的拦截都在evt.js中处理
	Promise.resolve(this.beforeReq(reqInfo, resInfo.res))
	.then((result) => {
		if (result && result.res) {
			reqInfo = result;
		}
		return {reqInfo, resInfo}
	})
	.then(({reqInfo, resInfo}) => {
		//如果在事件里面已经结束了请求，那就结束了
		if (!resInfo.res.finished) {
			remote.call(com, reqInfo, resInfo);
			// local.call(com, reqInfo, resInfo, "D:/project/gitWork/catproxy/bin.js");
		}
	});
}
