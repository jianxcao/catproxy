//处理请求来后返回的数据
import http from 'http';
import https from 'https';
import log from './log';
import zlib from 'zlib';
import {Buffer} from 'buffer';
//处理本地数据
export let local = (reqInfo, resInfo) => {

};

export let remote = (reqInfo, resInfo) => {
	let options;
	let {req} = reqInfo;
	let {res} = resInfo;
	//请求选项
	options = {
		hostname: reqInfo.host,
		port: reqInfo.port || reqInfo.protocol === 'http' ? 80 : 443,
		path: reqInfo.path,
		method: reqInfo.method,
		headers: reqInfo.headers
	};
	try {
		//忽略不安全的警告
		options.rejectUnauthorized = false;
		//不要压缩请求
		// delete options.headers['accept-encoding'];
	} catch (e) {}
	//写入请求数据长度
	options.headers["content-length"] = reqInfo.bodyData.length || 0;
	//发送请求，包括https和http
	let proxySer = (/https/.test(reqInfo.protocol) ? https : http)
	.request(options, function(proxyRes) {
		//取到 状态码和 headers
		let {statusCode, headers} = proxyRes;
		//如果文件压缩了，需要解压缩，删掉 压缩的编码
		let isZip = /gzip/i.test(headers['content-encoding']);
		let isDeflate = /deflate/i.test(headers['content-encoding']);
		if (isZip || isDeflate) {
			delete headers['content-encoding'];
		}
				//写回header
		res.writeHead(statusCode, headers);
		let receiveData = [];
		proxyRes.on("data", function(chunk) {
			receiveData.push(chunk);
		});
		proxyRes.on("end", function() {
			return new Promise(function(resolve) {
				let data = Buffer.concat(receiveData);
				if (isZip) {
						zlib.gunzip(data, function(err, buff) {
							resolve(buff);
						});	
				} else if(isDeflate) {
						zlib.inflate(data, function(err, buff) {
							resolve(buff);
						});

				} else {
					resolve(data);
				}
			})
			.then(function(data) {
				console.log("content", data.toString());
				res.end(data);
			});
		});
		proxyRes.on('error', function(err) {
			log.error(`error proxy URL: ${req.url}__${err}`);
		});
	});
	//出错直接结束请求
	proxySer.on("error", (err) => {
		log.error(`error proxy URL: ${req.url}__${err}`);
		///结束请求
		res.write('error proxy');
		res.end();
	});
	//将request的数据传送过去
	proxySer.end(reqInfo.bodyData);
};

export default (reqInfo, resInfo) => {
	remote(reqInfo, resInfo);
};
