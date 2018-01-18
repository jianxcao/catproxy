/**
 * 规则管理入口
 */
import * as config from './config';
import log from '../log';
import path from 'path';
import Promise from 'promise';
import URL from 'url';
import dns from 'dns';
import {getUrl} from '../tools';
let parseOneRule, parseBranch, parseOneBranch, execParse, standardUrl;
let isStringReg = /^\/.+\/$/;
let isStartHttp = /^http(s)?:\/\//;
let isStartSlash = /^\//;
let escapeReg = /(\*|\.|\?|\+|\$|\^|\[|\]|\(|\)|\{|\}|\||\\|\/)/g;

/**
 * 保存规则
 * @param  {[type]} rules 规则数据
 */
export let saveRules = (rules)=> {
	// 覆盖旧的rule
	config.set('hosts',  rules);
	// 存入文件中
	config.save('hosts');
};

/**
 * 获取规则
 * @return {[Array]} 获取到得规则对象
 */
export let getRules =()=> {
	return config.get('hosts') || [];
};

/**
 *   messageInfo 包含的信息
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
 *		originalUrl: "原始的请求地址,不包括参数,请不要修改"
 *	}
 */
export let parseRule = messageInfo => {
	let rules = getRules();
	if (!rules || !rules.length) {
		return Promise.resolve(messageInfo);
	}
	// 多个信息以|| 分割
	messageInfo.ruleInfo = [];
	return execParse(rules.map(current => {
		return {
			fun: parseOneRule,
			param: [current, messageInfo]
		};
	}))
	.then(result => {
		if (result) {
			delete result.__match;
			messageInfo.ruleInfo = 	messageInfo.ruleInfo.join('||');
			if (!messageInfo.ruleInfo) {
				delete messageInfo.ruleInfo;
			}
			return result;
		}
		return messageInfo;
	});
};

parseOneRule = (group, messageInfo) => {
	let branches;
	branches = group.branch;
	// 如果禁用这个分组直接跳出,不存在分支
	if (group.disable || !branches || !branches.length  || messageInfo.__match) {
		return;
	}
	return execParse(branches.map(current => {
		return {
			fun: parseBranch,
			param: [current, messageInfo, group.name]
		};
	})
	);
};

parseBranch = (branch, messageInfo, name) => {
	let rules = branch.rules;
	if (branch.disable || !rules || !rules.length || messageInfo.__match) {
		return;
	}
	return execParse(rules.map(current => {
		return {
			fun: parseOneBranch,
			param: [current, messageInfo, name, branch.name]
		};
	})
	);
};

parseOneBranch = (rule, messageInfo, groupName, branchName) => {
	let {test, exec, type, virtualPath = ''} = rule;
	if (isStringReg.test(test)) {
		test = test.slice(1, test.length -1);
	} else {
		test = isStartHttp.test(test) ? test : (messageInfo.protocol === 'https' ? "https://" + test : "http://" + test);
		test = test.replace(escapeReg, '\\$1');
		test = '^' + test;
	}
	// 将test转换成正则
	test = new RegExp(test);
	// 如果url被替换过，则使用replaceUrl
	let currentUrl = messageInfo.replaceUrl || messageInfo.originalFullUrl;
	// 测试没有通过
	if (!test.test(currentUrl) || rule.disable) {
		return;
	}
	// 设置了 weinre
	if (type === 'weinre') {
		messageInfo.weinre = true;
		return;
	}
	// 正则替换，即用正则替换url
	// 替换后还可以执行下一个规则
	// 使用exec替换test
	if (type === 'regReplace') {
		let newUrl = currentUrl.replace(test, exec);
		log.debug('replace url:' + newUrl);
		let execObj = standardUrl(newUrl, messageInfo.protocol);
		messageInfo.host = execObj.host;
		messageInfo.protocol = execObj.protocol.split(':')[0];
		messageInfo.port = execObj.port ? execObj.port : (messageInfo.protocol === 'https' ? 443 : 80);
		messageInfo.path = type === 'host' ? messageInfo.path : execObj.path;	
		messageInfo.replaceUrl = execObj.href;
		messageInfo.ruleInfo.push( `正则替换url：${newUrl}`);
		return;
	}
	// 已经匹配了
	if (messageInfo.__match) {
		return;
	}
	messageInfo.__match = true;
	log.debug(`解析规则,当前url:${currentUrl}, 规则类型:${type},规则正则${test},规则执行${exec}`);
	switch(type){
		// host模式下只能修改 host protocol port
	case('host'):
		// 远程文件替换整个url路径包括参数
	case('remoteFile'):
		if (exec) {
				// 转换成一个url的对象
			let execObj = standardUrl(exec, messageInfo.protocol);
			messageInfo.host = execObj.host;
			messageInfo.protocol = execObj.protocol.split(':')[0];
			messageInfo.port = execObj.port ? execObj.port : (messageInfo.protocol === 'https' ? 443 : 80);
			messageInfo.path = type === 'host' ? messageInfo.path : execObj.path;
			// log.debug('', messageInfo.protocol, messageInfo.port, exec);
			messageInfo.ruleInfo.push(`分组:${groupName}-分支:${branchName}-规则类型:${type}-规则正则:${test}-规则执行:${exec}`);
		} else  {
				// 没有配置exec如果是 host就访问线上，如果是 remoteFile就跳过
			if (type === 'host') {
				return new Promise((resolve, reject) => {
					dns.resolve(messageInfo.host.split(':')[0], function(err, addresses) {
						if (err || !addresses || !addresses.length) {
							log.error(`规则解析中, dns解析出现错误，规则类型:${type},规则正则${test}`);
							reject(messageInfo);
						} else {
							messageInfo.host = addresses[0];
							resolve(messageInfo);
						}
					});
				});
			}
		}
		break;
	case('redirect') :
		if (exec) {
			messageInfo.redirect = isStartHttp.test(exec) ? exec : messageInfo.protocol + '://' + exec;
			messageInfo.ruleInfo.push(`分组:${groupName}-分支:${branchName}-规则类型:${type}-规则正则:${test}-规则执行:${exec}`);
		}
		break;
	case('localFile'):
		if (exec) {
			messageInfo.sendToFile = exec;
			messageInfo.ruleInfo.push(`分组:${groupName}-分支:${branchName}-规则类型:${type}-规则正则:${test}-规则执行:${exec}`);
		}
		break;
	case('localDir'):
		if (exec) {
				// 去掉hash和param
			let p = messageInfo.path.split('?')[0];
			p = messageInfo.path.split('#')[0];
			if (!isStartSlash.test(virtualPath)) {
				virtualPath = '/' + virtualPath;
			}
			p = p.replace(new RegExp('^' + virtualPath), '');
			messageInfo.sendToFile = path.join(exec, p);
			messageInfo.ruleInfo.push(`分组:${groupName}-分支:${branchName}-规则类型:${type}-规则正则:${test}-规则执行:${exec}`);
		}
		break;
	default:
	}
	return messageInfo;
};
// 转换url为一个标准对象
standardUrl = (originalUrl, protocol) => {
	originalUrl = isStartHttp.test(originalUrl) ? originalUrl : protocol + '://' + originalUrl;
	return URL.parse(originalUrl);
};

/**
 * 按tasks的顺序执行promise
 * 
 * @param  {[array]} tasks  [任务列表]
 * [{
 * 	fun: fun,
 * 	param: [param]
 * }]
 * index 从第几个开始执行
 * 每个函数会得到多个参数，参数的最后一个是 前一个 任务得执行结果
 * @return {[promise]}        [promise]
 */
execParse = (tasks, index, preResult) => {
	if (!tasks || !tasks.length) {
		return Promise.resolve();
	}
	if (!index) {
		index = 0;
	}
	let current = tasks[index];
	let next = tasks[index + 1];
	let result = null;
	if (typeof current === 'function') {
		if (preResult) {
			result = current.apply(null, [preResult]);
		} else {
			result = current.apply(null, []);
		}
	} else {
		let param = current.param || [];
		if (preResult) {
			param.push(preResult);
		}
		result = current.fun.apply(null, param);
	}
	result = Promise.resolve(result);
	return result.then(res => {
		return next ? execParse(tasks, index + 1, res) : res;
	});
};
// test===========

// let messageInfo = {
// 	headers: {},
// 	host: "g.caipiao.163.com",
// 	protocol: "http",
// 	port: 80,
// 	path: "/caipiao/test/mm/bb.html",
// 	originalFullUrl: "http://g.caipiao.163.com/caipiao/test/mm/bb.html"
// };
// parseRule(messageInfo)
// .then((result) => {
// 	log.debug(result);
// });

// parseOneBranch({
// 	type: "host",
// 	test: '/zhuhu.com/test/',
// 	exec: "http://192.168.199.100/test?aaa"
// }, messageInfo);


// parseOneBranch({
// 	type: "remoteFile",
// 	test: '/zhuhu.com/test/',
// 	exec: "http://192.168.199.100/test?aaa"
// }, messageInfo);
// 

// parseOneBranch({
// 	type: "localFile",
// 	test: '/zhuhu.com/test/',
// 	exec: "D:/test/1111/1222"
// }, messageInfo);


// parseOneBranch({
// 	type: "localDir",
// 	test: '/zhuhu.com/test/',
// 	exec: "D:/test/1111/cjx",
// 	virtualPath: "/test/"
// }, messageInfo);


// console.log(standardUrl("test:8080?a=1"));

