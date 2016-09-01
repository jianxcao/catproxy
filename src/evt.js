//事件触发中心
import log from './log';
import {parseRule} from './config/rule';
import * as config from './config/config';
import mime from 'mime';
import iconv from 'iconv-lite';
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
		this.emit('beforeReq', reqInfo);
		return reqInfo;
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
 *	}
 *	
 *   举例说明可以修改响应的地方/
 *  	resInfo.headers['test-cjx'] = 111;
 * @return {[type]}         [description]
 */
var beforeRes = function(resInfo) {
	if (config.get('disCache')) {
		resInfo.headers['cache-control'] = "no-store";
		resInfo.headers.expires = "0";
		delete resInfo.headers.etag;
		delete resInfo.headers['last-modifed'];
		let bodyData = resInfo.bodyData;
		let contentType = resInfo.headers['content-type'];
		
		//如果访问的是一个html,并且成功截取到这个html的内容
		if (contentType &&  
			mime.extension(contentType) === 'html' && 
			bodyData) {
			let charset = contentType.match(/charset=([^;]+)/);
			if (charset && charset.length > 0) {
				charset = charset[1].toUpperCase();
			} else {
				charset = 'UTF-8';
			}
			if (Buffer.isBuffer(bodyData)) {
				if (charset === 'GBK' || charset === "GB2312") {
					bodyData = iconv.decode(bodyData, 'GBK');
				} else {
					bodyData = bodyData.toString();
				}
			}
			bodyData = bodyData.replace("<head>",
			 `<head>
				<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
				<meta http-equiv="Pragma" content="no-cache" />
				<meta http-equiv="Expires" content="0" />`
			);
			resInfo.bodyData = bodyData;
		}
	}
	// throw new Error('调用resize错误');
	// resInfo.statusCode = 302;
	// resInfo.headers['test-cjx'] = 111;
	// bodyData = "test";
	// this.emit('beforeRes', resInfo);
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
	// log.debug('after', result);
	this.emit('afterRes', result);
	return result;
};

export {
	beforeReq,
	afterRes,
	beforeRes
};

//=============注意看，请求出错的是的错误和bodyData
//====================检查reqInfo和resinfo

//测试修改请求，响应的头部数据和body数据看是否正常
//响应头添加statusCode
