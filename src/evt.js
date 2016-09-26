// 事件触发中心
import log from './log';
import {parseRule} from './config/rule';
import * as config from './config/config';
import mime from 'mime';
import iconv from 'iconv-lite';
import zlib from 'zlib';
import {Buffer} from 'buffer';
import Promise from 'promise';
import path from 'path';
// <meta charset="gb2312">
// <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
var checkMetaCharset = /<meta(?:\s)+.*charset(?:\s)*=(?:[\s'"])*([^"']+)/i;
// 自动解析类型，其他类型一律保存的是 Buffer
var autoDecodeRegs = /text\/.+|(?:application\/(?:json.*|.*javascript))/i;
// 不解码的后缀格式
var excludeDecodeExt = ['ttf', 'eot', 'svg', 'woff']; 
// 解压数据
let decodeCompress = function(bodyData, encode) {
	return new Promise(function(resolve, reject) {
		// 成功的取到bodyData
		if (bodyData) {
			let isZip = /gzip/i.test(encode);
			let isDeflate = /deflate/i.test(encode);
			if (isZip) {
				zlib.gunzip(bodyData, function(err, buff) {
					if (err) {
						reject(bodyData);
						log.error('decompress err: ', err.message);
					} else {
						resolve(buff);
					}
				});
			} else if(isDeflate) {
				zlib.inflateRaw(bodyData, function(err, buff) {
					if (err) {
						reject(bodyData);
						log.error('decompress err: ', err.message);
					} else {
						resolve(buff);
					}
				});
			} else {
				reject(bodyData);
			}
		} else {
			reject(bodyData);
		}
	});
};

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

	// log.debug(reqInfo.headers);
	// log.debug(reqInfo.bodyData.toString());
	// if (reqInfo.host.indexOf('pimg1.126.net') > -1) {
	// 	reqInfo.host = '114.113.198.187';
	// }
	return parseRule(reqInfo)
	.then(result => result || reqInfo)
	.then(reqInfo => {
		return reqInfo;
	});
};
// 如果不是合法的类型，就不进行decode
var decodeContent = function(resInfo, isDecode) {
	let contentEncoding = resInfo.headers['content-encoding'];
	let bodyData = resInfo.bodyData;
	let contentType = resInfo.headers['content-type'] || "";

	// 先看看是否需要解压数据
	return decodeCompress(bodyData, contentEncoding)
	.then(function(bodyData) {
		delete resInfo.headers['content-encoding'];
		return bodyData;
	})
	// 解压后在通过编码去解码数据
	.then(function(bodyData) {
		// 默认编码是utf8
		let charset = 'UTF-8', tmp;
		let ext = mime.extension(contentType);
		if (!bodyData || !isDecode) {
			return {bodyData, charset};
		}
		if(contentType) {
			// 如果contenttype上又编码，则重新设置编码
			tmp = contentType.match(/charset=([^;]+)/);
			if (tmp && tmp.length > 0) {
				charset = tmp[1].toUpperCase();
			}
		}
		if (Buffer.isBuffer(bodyData)) {
			// 其他编码先尝试用 iconv去解码
			if (charset !== 'UTF-8' && iconv.encodingExists(charset)) {
				bodyData = iconv.decode(bodyData, charset);
			} else if(contentType &&  (ext === 'html' || ext === 'htm')) {// 如果是一个文档，在取一次编码
				let strBodyData = bodyData.toString();
				// 在内容中再次找寻编码
				let tmp = strBodyData.match(checkMetaCharset);
				if (tmp && tmp[1]) {
					tmp[1] = tmp[1].toUpperCase();
					if (tmp[1]!== "UTF-8" && iconv.encodingExists(tmp[1])) {
						charset = tmp[1];
						bodyData = iconv.decode(bodyData, tmp[1]);
					} else {
						bodyData = strBodyData;
					}
				} else {
					bodyData = strBodyData;
				}
			} else {
				bodyData = bodyData.toString();
			}
		}
		// 再次加编码传递到页面
		return {
			bodyData,
			charset
		};
	}, function(bodyData) {// 出错，编码错误，直接返回
		// 默认编码是utf8
		let charset = 'UTF-8', tmp;
		if (!bodyData || !isDecode) {
			return {bodyData, charset};
		}
		if(contentType) {
			// 如果contenttype上又编码，则重新设置编码
			tmp = contentType.match(/charset=([^;]+)/);
			if (tmp && tmp.length > 0) {
				charset = tmp[1].toUpperCase();
			}
		}
		return {
			bodyData,
			charset
		};
	});
};
/**
 * 准备响应请求前
 * @param  {[type]} resInfo [响应信息]
 *  *  resInfo包含的信息
 *  {
 *    statusCode: "响应状态码, 可以修改"
 *    headers: "请求头,可修改"
 *    ---注意如果有bodyData则会直接用bodyData的数据返回
 *		bodyData: "buffer 数据",
 *		bodyDataErr: "请求出错，目前如果是大文件会触发这个,这个时候bodyData为空，且不可以设置"
 *		//这个时候 resInfo,bodyData无效
 *		originalFullUrl 原始请求url
 *		originalUrl 原始请求url
 *	}
 *
 *   举例说明可以修改响应的地方/
 *  	resInfo.headers['test-cjx'] = 111;
 * @return {[type]}         [description]
 */
var beforeRes = function(resInfo) {
	return Promise.resolve(resInfo)
	.then(function (resInfo) {
		// 禁用缓存则删掉缓存相关的header
		var disCache = config.get('disCache');
		if (disCache) {
			resInfo.headers['cache-control'] = "no-store";
			resInfo.headers.expires = "0";
			delete resInfo.headers.etag;
			delete resInfo.headers['last-modifed'];
		}
		return resInfo;
	})
	.then(function(resInfo) {
		// 禁用缓存或者用户这是监听，则需哟啊解码内容返回给用户
		var disCache = config.get('disCache');
 		// 用户监听
		var useListener = false;
		if (disCache || useListener) {
			let contentType = resInfo.headers['content-type'] || "";
			// 按照指定编码解码内容
			let ext = path.extname(resInfo.path.split('?')[0].split('#')[0]) || "";
			ext = (ext.split('.')[1] || "").toLowerCase();
			if (excludeDecodeExt.some(cur => cur === ext)) {
				ext  = "";
			}
			return decodeContent(resInfo, autoDecodeRegs.test(contentType) && !!ext)
			.then(function({charset, bodyData}) {
				let extension = mime.extension(contentType);
				let isType = typeof bodyData === 'string';
				// 如果访问的是一个html,并且成功截取到这个html的内容
				if (disCache && contentType &&  (extension === 'html' || extension === 'htm') && isType) {
					bodyData = bodyData.replace("<head>",
						`<head>
						<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
						<meta http-equiv="Pragma" content="no-cache" />
						<meta http-equiv="Expires" content="0" />`
					);
				}
				resInfo.charset = charset;
				resInfo.bodyData = bodyData;
				return resInfo;
			});
		}
		return Promise.resolve(resInfo);
	})
	.then(function(resInfo) {
		// 为什么要变成buffer主要是为了让浏览器认识，根据浏览器当前的编码解析
		if (typeof resInfo.bodyData === 'string') {
			resInfo.bodyData = iconv.encode(resInfo.bodyData, resInfo.charset || "UTF-8");
		}
		return resInfo;
	});
	// resInfo.statusCode = 302;
	// resInfo.headers['test-cjx'] = 111;
	// bodyData = "test";
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
	return result;
};

export {
	beforeReq,
	afterRes,
	beforeRes
};
