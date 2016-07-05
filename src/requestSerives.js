import url from 'url';
import Promise from 'promise';
import {Buffer} from 'buffer';
import log from './log';
//请求到后的解析
let requestHandler = function(req, res) {
	var com = this;
	//build  req info object
	let headers = req.headers,
			method = req.method,
			host =  req.headers.host,
			protocol = req.headers['user-server-type'] || 'http',
			fullUrl = protocol === "http" ? req.url : (protocol + '://' + host + req.url),
			urlObject = url.parse(fullUrl),
			port = urlObject.port || (protocol === "http" ? '80': '443'),
			pathStr = urlObject.path,
			visitUrl = protocol + "://" + host + pathStr;
	log.debug("url: " + req.url);
	log.debug(`secure: + ${req.secure}--user-server-type:${req.headers['user-server-type']}`);
	let reqInfo = {
		headers,
		host,
		method,
		protocol,
		fullUrl,
		req,
		port,
		startTime : new Date().getTime(),
		path: pathStr,
		url: visitUrl,
		bodyData: ''
	};
	let resInfo = {
		res
	};
	Promise.resolve(reqInfo)
	//拼接req body的数据
	.then((reqInfo)=> {
		return new Promise((resolve) => {
			var bufferData = [];
			req.on('data', (chunk)=> bufferData.push(chunk));
			req.on('end', ()=> {
				let bodyData = Buffer.concat(bufferData).toString();
				reqInfo.bodyData = bodyData;
				resolve(reqInfo);
			});
		});
	})
	//转发请求 本地转发或者 向远程服务器转发
	.then((reqInfo) => {
		com.responseService(reqInfo, resInfo);
	})
	.then(null, (err)=>{
		log.error(err);
	});
};
let requestConnectHandler = (response, socket, head) => {

};

export default {requestHandler, requestConnectHandler};
