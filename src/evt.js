// 事件触发中心
import log from './log';
import {parseRule} from './config/rule';
import * as config from './config/config';
import iconv from 'iconv-lite';
import {Buffer} from 'buffer';
import Promise from 'promise';
import path from 'path';
import {getMonitorId} from './tools'; 
import {decodeCompress, isBinary, getCharset} from './dataHelper';
import mime from 'mime';
import requestIp from 'request-ip';
import {localIps} from './getLocalIps';
import ip from 'ip';
import URL from 'url';
import {insertWeinreScript} from './weinreServer';
// 自动解析类型，其他类型一律保存的是 Buffer
var autoDecodeRegs = /text\/.+|(?:application\/(?:json.*|.*javascript))/i;

/**
 * 代理请求发出前
 * 该方法主要是处理在响应前的所有事情，可以用来替换header，替换头部数据等操作
 * 可以直接像res中写数据结束请求
 * 如果是异步请返回promise对象
 * @param reqInfo 请求信息 可以修改请求代理的form数据和 请求代理的头部数据
 * @param {resInfo} 响应投信息可以修改响应投的header
 * @param res 响应对象
 * @returns {*}
 *   reqInfo 包含的信息
 *  {
 *    headers: "请求头"
 *		host: "请求地址,包括端口，默认端口省略"
 *		method: "请求方法"
 *		protocol: "请求协议"
 *		originalFullUrl: "原始请求地址，包括参数"
 *		req: "请求对象，请勿删除"
 *		port: "请求端口"
 *		startTime: "请求开始时间"
 *		path: "请求路径，包括参数"
 *		originalUrl: "原始的请求地址,不包括参数,请不要修改",
 *		bodyData: "buffer 数据，body参数，可以修改"
 *    reqInfo.sendToFile
 *    //重定向到某个url，--有这个，就会忽略远程的调用即host设置之类的都无效
 *    reqInfo.redirect
 *	}
 *
 *  举例说明,可以请求的修改的地方
 *  	修改请求头，注意只有请求远程服务器的时候管用
 *  	reqInfo.headers['test-cjx'] = 111;
 *   	//修改请求域名
 *    reqInfo.host = '114.113.198.187';
 *    //修改请求协议
 *    reqInfo.protocol = '114.113.198.187';
 *    //修改请求端口
 *    reqInfo.port="8080"
 *    //修改请求路径--包括get参数
 *    reqInfo.path= "/ccc?aaa"
 *    //修改方法
 *    reqInfo.method= "post" //注意post方法要有对应的content-type数据才能过去
 *    //修改请求数据
 *    reqInfo.bodyData = "请求数据",
 *    //直接定位到某个文件 --如果返回某个文件，有这个，就会忽略远程的调用即host设置之类的都无效
 *    reqInfo.sendToFile
 *    //重定向到某个url，--有这个，就会忽略远程的调用即host设置之类的都无效
 *    reqInfo.redirect
 */
var beforeReq = function(reqInfo) {
	// reqInfo.headers['test-cjx'] = 111;
	// reqInfo.path = '/hyg/mobile/common/base/base.34b37a3c0b.js';
	// reqInfo.port = 9090;
	// reqInfo.protocol = "https";
	// reqInfo.path = "/a/b?c=d";
	// reqInfo.method = "post";
	// reqInfo.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
	// reqInfo.bodyData = new Buffer('a=b&c=d');
	// reqInfo.sendToFile = "D:/project/gitWork/catproxy/bin.js";
	// reqInfo.serverIp ="127.0.1" // 真实地服务器ip地址，请不要修改
	// log.debug(reqInfo.headers);
	// log.debug(reqInfo.bodyData.toString());
	// if (reqInfo.host.indexOf('pimg1.126.net') > -1) {
	// 	reqInfo.host = '114.113.198.187';
	// }
	let catProxy = this.catProxy;
	let com = this;
	return parseRule(reqInfo)
	.then(result => result || reqInfo)
	.then(reqInfo => {
		let {req, headers} = reqInfo;
		let clientIp = requestIp.getClientIp(req); 
		// clientIp获取不对，就设置成 机器ip？？？
		// let xForwardedFor = headers['x-forwarded-for'];
		// if (!xForwardedFor) {
		// 	headers['x-forwarded-for'] = clientIp + "," + localIps[0];
		// } else {
		// 	headers['x-forwarded-for'] = "," + localIps[0];
		// }
		reqInfo.clientIp = clientIp;
		return reqInfo;
	})
	.then(function(reqInfo) {
		let arr = catProxy._beforeReqEvt;
		if (!arr.length) {
			return reqInfo;
		}
		var p = Promise.resolve(arr[0].call(com, reqInfo));
		for (let i = 1; i < arr.length; i++) {
			p.then(function() {
				return arr[i].call(com, reqInfo);
			});
		}
		return p;
	})
	.then(function(result) {
		return result || reqInfo;
	}, (err) => {
		log.error(err);
		return reqInfo;
	});
};

/** 
 *禁止缓存
 * */
var disCache = function (resInfo) {
	// 禁用缓存则删掉缓存相关的header
	var disCache = config.get('disCache');
	if (disCache) {
		// http 1.1引入
		resInfo.headers['cache-control'] = "no-store";
		// 时间点表示什么时候文件过期，缺点，服务器和客户端必须有严格的时间同步
		// 旧浏览器兼容  expires -1 表示不缓存
		resInfo.headers.expires = "-1";
	 
		// 删除 etag ,让浏览器下次请求不能带 If-None-Match 头部,这样服务器无法返回304
		/**
		 * etag是服务器首次相应带etag，给文件打标机，下次在请求的时候浏览器 
		 *  请求头会带 If-None-Match , 服务器根据该字段判断文件是否改变，如果没改变就返回304，否则返回新文件
		 */
		delete resInfo.headers.etag;
		/**
		 * last-Modified 是 浏览器首次返回的res中带Last-Modified头，标记一个时间，服务器下次接受到请求会带头If-Modified-Since
		 * 服务器根据该头部判断是否是缓存，如果是返回304，不是则返回新文件
		 * 缺点，如果服务器文件并没有什么改变，只是改变了时间，也会跟新文件
		 */
			// 删除 last-modified,让浏览器下次请求不能带 If-Modified-Since 头部,这样服务器无法返回304
		delete resInfo.headers['last-modified'];
	}
	return resInfo;
};

/**
 * 触发事件调用用户事件
 */
var callBeforeResEvt = function(catProxy, resInfo, context) {
	let arr = catProxy._beforeResEvt;
	if (!arr.length) {
		return resInfo;
	}
	var p = Promise.resolve(arr[0].call(context, resInfo));
	for (let i = 1; i < arr.length; i++) {
		p.then(function() {
			return arr[i].call(context, resInfo);
		});
	}
	p.then(() => {
		return resInfo;
	});
	return p;	
};

/**
 * 准备响应请求前
 * @param  {[type]} resInfo [响应信息]
 *  *  resInfo包含的信息
 *  {
 *    headers: "请求头 --- 代理请求已经发出并受到，无法修改"
 *		host: "请求地址,包括端口，默认端口省略 --- 代理请求已经发出并受到，无法修改"
 *		method: "请求方法 --- 代理请求已经发出并受到，无法修改"
 *		protocol: "请求协议 --- 代理请求已经发出并受到，无法修改"
 *		originalFullUrl: "原始请求地址，包括参数 --- 代理请求已经发出并受到，无法修改"
 *		req: "请求对象，请勿删除 --- 代理请求已经发出并受到，无法修改"
 *		port: "请求端口 --- 代理请求已经发出并受到，无法修改"
 *		startTime: "请求开始时间 --- 代理请求已经发出并受到，无法修改"
 *		path: "请求路径，包括参数 --- 代理请求已经发出并受到，无法修改"
 *		originalUrl: "原始的请求地址,不包括参数,请不要修改 --- 代理请求已经发出并受到，无法修改", 

 *    statusCode: "响应状态码, 可以修改"
 *    headers: "请求头,可修改"
 *    ---注意如果有bodyData则会直接用bodyData的数据返回
 *		bodyData: "buffer 数据",
 *		bodyDataErr: "请求出错，目前如果是大文件会触发这个,这个时候bodyData为空，且不可以设置"
 *    charset: "", 编码，如果是 文本文件设置后，如果支持该编码将用该编码解码
 *		//这个时候 resInfo,bodyData无效
 *    
 *	}
 *
 *   举例说明可以修改响应的地方/
 *  	resInfo.headers['test-cjx'] = 111;
 * @return {[type]}         [description]
 */
var beforeRes = async function(resInfo) {
	let catProxy = this.catProxy;
	let com = this;
	let contentEncoding = resInfo.headers['content-encoding'];
	let contentType = resInfo.headers['content-type'];
	resInfo.ext = mime.extension(contentType || "") || (path.extname(URL.parse(resInfo.originalUrl|| "").pathname || "") || "").slice(1);
	// 禁止缓存
	resInfo = await disCache(resInfo);
	try {
		// 解压成功就删除解压头部
		if (contentEncoding && resInfo.bodyData.length) {
			let bodyData = await decodeCompress(resInfo.bodyData, contentEncoding);
			resInfo.bodyData = bodyData;			
			delete resInfo.headers['content-encoding'];
			// 更新content-length
			if (resInfo.headers['content-length']) {
				resInfo.headers['content-length'] = bodyData.length;
			}
		}		
	} catch(e) {
		log.error(e);
	}
	resInfo.isBinary = isBinary(resInfo.bodyData);	
	// 文本文件 -- 需要检测编码是不是不是 utf-8
	// 二进制文件是没有charset的
	if (!resInfo.isBinary) {
		// 设置默认编码
		resInfo.charset = getCharset(resInfo);
		if (resInfo.weinre) {
			try {
				resInfo.bodyData = await insertWeinreScript(resInfo.bodyData, resInfo.charset);
			} catch (error) {
				console.log(error);
				log.error(error);	
			}
		}
	}
	// 触发事件
	let result = await callBeforeResEvt(catProxy, resInfo, com);
	resInfo = result || resInfo;
	return resInfo;
};

/**
 * 请求响应后
 * 该方法主要是请求响应后的处理操作，主要是可以查看请求数据，
 * 注意这时候请求已经结束了，无法在做其他的处理
 * @param result
 * 所有字段不可以修改,只可以查看
 *  * result包含的信息
 *  {
 *  	statusCode: "响应状态码"
 *    headers: "请求头"
 *		host: "请求地址"
 *		method: "请求方法"
 *		protocol: "请求协议"
 *		originalFullUrl: "原始请求地址，包括参数"
 *		port: "请求端口"
 *		endTime: "请求开始时间"
 *		path: "请求路径，包括参数"
 *		originalUrl: "原始的请求地址,不包括参数",
 *		bodyData: "buffer 数据，body参数",
 *		bodyDataErr: null,
 *		bodyDataFile: null //如果资源定位到本地就显示这个字段
 *	}
 * @returns {*}
 */
var afterRes = function(result) {
	let catProxy = this.catProxy;
	if (catProxy && catProxy._afterResEvt.length) {
		catProxy._afterResEvt.forEach(current => {
			try{ 
				current.call(this, result);
			} catch (e) {
				log.error(e);
			}
		});
	}
	return result;
};

// 中转请求
var pipeRequest = function(result) {
	result.id = getMonitorId();
	let catProxy = this.catProxy;
	if (catProxy && catProxy._pipeRequestEvt.length) {
		catProxy._pipeRequestEvt.forEach(current => current.call(this, result));
	}
};
export {
	beforeReq,
	afterRes,
	beforeRes,
	pipeRequest
};
