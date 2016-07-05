//事件触发中心
import log from './log';
//请求建立前
var beforeReq = function(reqInfo) {
	this.emit('beforeReq', reqInfo);
	log.debug(reqInfo.path, reqInfo.host);
	return reqInfo;
};

//请求接受到后
var afterRes = function(resInfo) {
	this.emit('afterRes', resInfo);
	log.debug(resInfo.path, resInfo.host);
	return resInfo;
};

export {
	beforeReq,
	afterRes
};

