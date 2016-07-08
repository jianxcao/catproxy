//事件触发中心
import log from './log';
/**
 * 该方法主要是处理在响应前的所有事情，可以用来替换header，替换头部数据等操作
 * @param reqInfo 请求信息
 * @param res 响应对象
 * @returns {*}
 */
var beforeReq = function(reqInfo, res) {
	this.emit('beforeReq', reqInfo);
	return reqInfo;
};

/**
 * 该方法主要是请求响应后的处理操作，主要是可以查看请求数据，
 * 注意这时候请求已经结束了，无法在做其他的处理
 * @param resInfo
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

