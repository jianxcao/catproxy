import * as status from './status';
import log from '../log';
import * as config from '../config/config';
import * as rule from '../config/rule';
import * as sendType from './sendType';
import url from 'url';
import http from 'http';
import https from 'https';
import Promise from 'promise';
import {Buffer} from 'buffer';
import {sendConnDetail} from './sendMsg';
import {getCacheFile} from '../monitor/cacheFile';
import {decodeData, isBinary, betuifyCode, updateExt} from '../dataHelper';
/*
 * 
 *  所有接受到得消息是一个Object
 * 
 * data:{
 * 	path: "数据访问路径，相同type下的不同逻辑处理可以用不同的path",
 * 	param: "相同type下相同的path，不同的参数可以通过这个处理"
 * }
 * 
 *
 * 所有发出的消息是一个Object
 * 
 * data:{
 * 	//当前请求的状态，如果不是100表示出现错误了
 * 	status: 100,
 * 	result: {'当前返回的数据'}
 * }
 * 
 */
export let error = (msg) => {
	msg = msg || "出现系统异常，请稍后再试";
	let data = {
		status: status.ERROR,
		result: msg
	};
	log.error(msg);
	return data;
};

export let success = (msg) => {
	msg = msg || "成功";
	let data = {
		status: status.SUCC,
		result: msg
	};
	return data;
};

/**
 * 请求数据，返回所有的数据
 * @return {[object]} [请求到得 config数据]
 */
export let fetchConfig = ()=> {
	let data = {
		status: status.SUCC
	};
	try {
		data.result = config.get();
		if (data.result.cacheFlush === 'undefined') {
			data.result.cacheFlush = false;
		}
		if (data.result.disCache === 'undefined') {
			data.result.disCache = true;
		}		
		if (!data.result.hosts) {
			data.result.hosts = [];
		}
		return data;
	} catch(e) {
		return error();
	}
};

let updateRule = (rules, ws) => {
	try {
		rule.saveRules(rules);
		return success('更新规则成功');
	} catch(e) {
		log.error(e);
		return error('更新规则失败');
	}
};
let disCache = (status, ws) => {
	try {
		config.set('disCache', status);
		config.save('disCache');
		return success('更新配置成功');
	} catch(e) {
		log.error(e);
		return error('更新配置失败');
	}
};
let cacheFlush = (status, ws) => {
	try {
		config.set('cacheFlush', status);
		config.save('cacheFlush');
		return success('更新配置成功');
	} catch(e) {
		log.error(e);
		return error('更新配置失败');
	}
};
let monitor = (monitor, ws) => {
	try {
		config.setRecursive('monitor', monitor);
		config.save('monitor');
		return success('更新配置成功');
	} catch(e) {
		log.error(e);
		return error('更新配置失败');
	}
};

export let getConDetail = (msg = {param: {}}, ws = {}) => {
	let {param: {id, ext, contentType, charset, formatCode}} = msg;
	if (id) {
		getCacheFile(id)
			.then(data => {
			// 不是2进制数据就解码数据
				return isBinary(data) ? data : decodeData(data, charset);
			})
			.then(function(data) {
				if (typeof data === 'string' && data) {
					ext = updateExt(ext, contentType, data);
				}
				return data;
			})
			.then(function(data) {
				if (typeof data === 'string' && formatCode) {
					return betuifyCode(data, ext);
				}
				data = data || "";
				return data;
			})
			.then(function(data) {
				data = data || "";
				sendConnDetail({
					id,
					data,
					ext
				});
			}, function(data) {
				data = data || "";
				sendConnDetail({
					id,
					data,
					ext
				});
			});
	}
};

export let saveConfig = (msg = {}, ws = {}) => {
	let {path, param} = msg;
	if (path) {
		switch(msg.path) {
		case("rule"):
			if (param && param.rules) {
				return updateRule(param.rules, ws);
			} else {
				return error('更新规则必须有rules属性');
			}
		case('disCache'):
			return disCache(!!param.status, ws);
		case('cacheFlush'):
			return cacheFlush(!!param.status, ws);
		case('monitor'):
			return monitor(param, ws);
		default:
			return error('未知的保存数据');
		}
	} else {
		return error('未知的保存数据');
	}
};

// 通过远程地址更新文档
export let remoteUpdateRule = (msg = {}, ws = {}) => {
	let {url: visUrl} = msg.param;
	return new Promise((resolve, reject) => {
		config.set('remoteRuleUrl', visUrl);
		visUrl = url.parse(visUrl);
		let req = (visUrl.protocol === 'http:' ? http : https)
			.request({
				hostname: visUrl.hostname,
				port: visUrl.port ? visUrl.port : (visUrl.protocol === 'http:' ? 80 : 443),
				path: visUrl.path,
				method: 'GET',
				headers: {}
			}, (res) => {
				if (+res.statusCode !== 200) {
					return reject(error('服务器获取数据错误'));
				}
				res.setEncoding('utf8');
				let data = [];
			
				res.on('data', (chunk) => {
					data.push(chunk);
				});
				res.on('end', () => {
					let isBuffer = Buffer.isBuffer(data[0]);
					let result = isBuffer ? Buffer.concat(data) : data.join('');
					try {
						result = JSON.parse(result);
						config.set("hosts", result);
						config.save(["hosts", "remoteRuleUrl"]);
						return resolve(success({
							data: result,
							msg: "更新数据成功"
						}));
					} catch(e) {
						log.error(e.message);
						return reject(error('数据格式错误'));
					}
				});
			});
		req.on('error', (e) => {
			log.error(e.message);
			reject(error(e.message));
		});
		req.end();
	});
};
