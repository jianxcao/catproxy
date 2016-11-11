// 一个中间件类
import util from 'util';
import log from './log';
import {sendErr} from './tools';
var requestHandlers = [];
// 最终掉用
var finalReq = finalCallback => {
	return function	(err, req, res){
		var com  = this;
		if (err) {
			sendErr(res, err, req.url);
		} else {
			if (util.isFunction(finalCallback)) {
				finalCallback.call(com, req, res);
			}
		}
	};
};

// request请求调用
var requestFun = finalCallback => {
	return function(req, res) {
		var com  = this;
		requestHandlers.reduceRight((next, current) => {
			return function my(err) {
				// 参数为4个，如果当前有错就调用，没有错误，就跳过
				if (current.length === 4) {
					if (err) {
						try {
							current.call(com, err, req, res, next);
						} catch(e) {
							next(e);
						}
					} else {
						next(err);
					}
				} else {
					if (err) {
						next(err);
					} else {
						try {
							current.call(com, req, res, next);
						} catch(e) {
							next(e);
						}
					}
				}
			};
		}, err => {
			finalReq(finalCallback).call(com, err, req, res);
		})();
	};
};

// 添加一个中间件
export let use = (handle) => {
	if (util.isFunction(handle)) {
		requestHandlers.push(handle);
	}
};

// 删除或者清空某个中间件
export let unuse = (handle) => {
	if (util.isFunction(handle)) {
		var current = null;
		var is = requestHandlers.some((cur, index) => {
			current = index; 
			return cur === handle;
		});
		if (is) {
			requestHandlers.splice(current, 1);
		}
	} else if(handle === undefined) {
		requestHandlers = [];
	}
};
// 中间件入口
export let middleWare = requestFun;
