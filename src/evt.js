//事件触发中心
import log from './log';
import {Buffer} from 'buffer';
/**
 * 该方法主要是处理在响应前的所有事情，可以用来替换header，替换头部数据等操作
 * 可以直接像res中写数据结束请求
 * 如果是异步请返回promise对象
 * 替换statusCode 在resInfo添加statusCode即可以替换
 * @param reqInfo 请求信息 可以修改请求代理的form数据和 请求代理的头部数据
 * @param {resInfo} 响应投信息可以修改响应投的header
 * @param res 响应对象
 * @returns {*}
 *   reqInfo 包含的信息
 *  {
 *    headers: "请求头"
 *		host: "请求地址"
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
 *    reqInfo.bodyData = "请求数据"
 * 
 *  * resInfo包含的信息
 *  {
 *  	statusCode: "响应状态码, 可以修改"
 *    headers: "请求头,可修改"
 *    ---注意如果有bodyData则会直接用bodyData的数据返回，reqInfo的修改就没有效果了，本地文件拦截也将没有效果
 *		bodyData: "buffer 数据，body参数，可以修改",
 *		//这个时候 reqInfo无效,bodyData无效
 *		bodyDataFile: "绝对值路径的文件"， 如果这个字段存在则会直接调用这个文件返回
 *		res: res 不可以修改，可以调用 (可以直接自己调用法返回想返回的值，但是如果是异步的，请返回promise)
 *	}
 *	
 *   举例说明可以修改响应的地方/
 *  	resInfo.headers['test-cjx'] = 111;
 * 
 */
var beforeReq = function(reqInfo, resInfo) {
	// reqInfo.headers['test-cjx'] = 111;
	// reqInfo.path = '/hyg/mobile/common/base/base.34b37a3c0b.js';
	// reqInfo.port = 9090;
	// reqInfo.protocol = "https";
	// reqInfo.path = "/a/b?c=d";
	// reqInfo.method = "post";
	// reqInfo.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
	// reqInfo.bodyData = new Buffer('a=b&c=d');	
	resInfo.headers['cache-control'] = "no-store";
	resInfo.headers['expires'] = "0";
	delete resInfo.headers['etag'];
	delete resInfo.headers['last-modifed'];
	// resInfo.statusCode = 200;
	// resInfo.headers['test-cjx'] = 111;
	// resInfo.bodyData = "test";

	// resInfo.bodyDataFile = "D:/project/gitWork/catproxy/bin.js";
	// log.debug(reqInfo.headers);
	// log.debug(reqInfo.bodyData.toString());

	if (reqInfo.host.indexOf('163.com') > -1) {
		reqInfo.host = '114.113.198.187';
	} else if(reqInfo.host.indexOf('lmlc.com') > -1) {
		reqInfo.host = "223.252.195.134";
	} else {
		reqInfo.host = "175.25.168.40";
	}
	this.emit('beforeReq', reqInfo);
	return reqInfo;
};

//请求发出前调用
var beforeRes = function() {

};

/**
 * 该方法主要是请求响应后的处理操作，主要是可以查看请求数据，
 * 注意这时候请求已经结束了，无法在做其他的处理
 * @param resInfo
 * 所有字段不可以修改,只可以查看
 *  * resInfo包含的信息
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
var afterRes = function(resInfo) {
	this.emit('afterRes', resInfo);
	return resInfo;
};

export {
	beforeReq,
	afterRes
};

//=============注意看，请求出错的是的错误和bodyData
//====================检查reqInfo和resinfo

//测试修改请求，响应的头部数据和body数据看是否正常
//响应头添加statusCode
