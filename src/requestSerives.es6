import url from 'url';
import Promise from 'promise';
import {Buffer} from 'buffer';
import responseService from './responseService';
import log from './log';
//请求到后的解析
let requestHandler = function(req, res) {
	//build  req info object
	let headers = req.headers,
			method = req.method,
			host =  req.headers.host,
			protocol = req.protocol || 'http',
			fullUrl = protocol === "http" ? req.url : (protocol + '://' + host + req.url),
			urlObject = url.parse(fullUrl),
			path = urlObject.path,
			visitUrl = protocol + "://" + host + path;
	console.log(req.url);
	let reqInfo = {
		headers,
		host,
		method,
		protocol,
		fullUrl,
		req,
		startTime : new Date().getTime(),
		path,
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
		responseService(reqInfo, resInfo);
	})
	.then(null, (err)=>{
		log.error(err);
	});
};
let requestConnectHandler = (response, socket, head) => {

};

export default {requestHandler, requestConnectHandler};
