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
const ruleType = {
	host: "host",
	localFile: "localFile",
	localDir: "localDir",
	remoteFile: "remoteFile",
	redirect: 'redirect'
};

let checkRules = (branch) => {
	let rules = branch.rules;
	if (rules && rules.length >= 0 && typeof rules === 'object') {
		//空数组是合法的
		if (rules.length === 0) {
			return true;
		}
		let newRule = [];
		for (let rule of rules) {
			if (rule.type && ruleType[rule.type] && rule.test) {
				rule.type = rule.type.trim();
				rule.exec = rule.exec.trim();
				rule.test = rule.test.trim();
				newRule.push(rule);
			}
		}
		branch.rules = newRule;
		return true;
	}
};

let checkBranch = (branchs) => {
	if (branchs && branchs.length >= 0 && typeof branchs === 'object') {
		//空数组是合法的
		if (branchs.length === 0) {
			return true;
		}
		for (let branch of branchs) {
			//名字是必须得字段
			if (branch && branch.name !== undefined) {
				//没定义这个字段
				if (branch.rules === undefined || branch.rules === null) {
					//定义一个空得
					branch.rules = [];
				}
				if (!checkRules(branch)) {
					return false;
				}
			} else {
				return false;
			}
		}
		return true;
	}
};

/**
 * 检测传进来的规则是否是是符合规范的规则
 * @param  {[type]} rules 规则
 *[{
 *	name: "caipiao",
 *	isOpen: true,
 *	branch: [{
 *		name: "test1",
 *		rules: [{
 *			type: "host",
 *			test: "test",
 *			exec: "192.168.199.100"
 *		}]
 *	}],
 * }, {
 *	name: "guobao",
 *	disable: true,
 *	branch: [],
 *}]
 * @return {[type]}       如果是就返回true，其他都不是
 */
export let checkHosts = (hosts) => {
	if (hosts && hosts.length >= 0 && typeof hosts === 'object') {
		//空数组是合法的
		if (hosts.length === 0) {
			return true;
		}
		for (let host of hosts) {
			if (host && host.name !== undefined) {
				//没定义这个字段
				if (host.branch === undefined || host.branch === null) {
					//定义一个空得
					host.branch = [];
				}
				if (!checkBranch(host.branch)) {
					return false;
				}
			} else {
				return false;
			}
		}
		return true;
	}
};

/**
 * 保存规则
 * @param  {[type]} rules 规则数据
 */
export let saveRules = (rules)=> {
	if (checkHosts(rules)) {
		//覆盖旧的rule
		config.set("hosts",  rules);
		//存入文件中
		config.save();
	} else {
		throw "存入规则文件出现错误，规则文件非法";
	}
};

/**
 * 获取规则
 * @return {[Array]} 获取到得规则对象
 */
export let getRules =()=> {
	return config.get("hosts") || [];
};

/**
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
 *		原始地址仅供查看，无法修改
 *	}
 */
export let parseRule = reqInfo => {
	let rules = getRules();
	if (!rules || !rules.length) {
		return Promise.resolve(reqInfo);
	}
	return execParse(rules.map(current => {
		return {
			fun: parseOneRule,
			param: [current, reqInfo]
		};
	}))
	.then(result => result ? result : reqInfo);
};

parseOneRule = (group, reqInfo) => {
	let branches;
	branches = group.branch;
	// 如果禁用这个分组直接跳出,不存在分支
	if (group.disable || !branches || !branches.length) {
		return;
	}
	return execParse(branches.map(current => {
			return {
				fun: parseBranch,
				param: [current, reqInfo]
			};
		})
	);
};

parseBranch = (branch, reqInfo) => {
	let rules = branch.rules;
	if (branch.disable || !rules || !rules.length) {
		return;
	}
	return execParse(rules.map(current => {
			return {
				fun: parseOneBranch,
				param: [current, reqInfo]
			};
		})
	);
};

parseOneBranch = (rule, reqInfo) => {
	let {test, exec, type, virtualPath = ""} = rule;
	if (isStringReg.test(test)) {
		test = test.slice(1, test.length -1);
	}
	test = isStartHttp.test(test) ? test : 'http://' + test;
	//将test转换成正则
	test = new RegExp(test);
	let currentUrl = getUrl(reqInfo);
	//测试没有通过
	if (!test.test(currentUrl) || rule.disable) {
		return;
	}
	log.verbose(`解析规则,当前url:${currentUrl}, 规则类型:${type},规则正则${test},规则执行${exec}`);
	switch(type){
		//host模式下只能修改 host protocol port
		case('host'):
		//远程文件替换整个url路径包括参数
		case('remoteFile'):
			if (exec) {
				//转换成一个url的对象
				let execObj = standardUrl(exec);
				reqInfo.host = execObj.host;
				reqInfo.protocol = execObj.protocol.split(':')[0];
				reqInfo.port = execObj.port ? execObj.port : (reqInfo.protocol === 'https' ? 443 : 80);
				reqInfo.path = type === 'host' ? reqInfo.path : execObj.path;
			} else  {
				//没有配置exec如果是 host就访问线上，如果是 remoteFile就跳过
				if (type === 'host') {
					return new Promise((resolve, reject) => {
						dns.resolve(reqInfo.host.split(':')[0], function(err, addresses) {
							if (err || !addresses || !addresses.length) {
								log.error(`规则解析中, dns解析出现错误，规则类型:${type},规则正则${test}`);
								reject(reqInfo);
							} else {
								reqInfo.host = addresses[0];
								resolve(reqInfo);
							}
						});
					});
				}
			}
		break;
		case('redirect') :
			if (exec) {
				reqInfo.redirect = isStartHttp.test(exec) ? exec : "http://" + exec;
			}
		break;
		case('localFile'):
			if (exec) {
				reqInfo.sendToFile = exec;
			}
		break;
		case('localDir'):
			if (exec) {
				//去掉hash和param
				let p = reqInfo.path.split('?')[0];
				p = reqInfo.path.split('#')[0];
				if (!isStartSlash.test(virtualPath)) {
					virtualPath = "/" + virtualPath;
				}
				p = p.replace(new RegExp('^' + virtualPath), "");
				reqInfo.sendToFile = path.join(exec, p);
			}
		break;
		default:
	}
	return reqInfo;
};
//转换url为一个标准对象
standardUrl = (originalUrl) => {
	originalUrl = isStartHttp.test(originalUrl) ? originalUrl : "http://" + originalUrl;
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
 * @return {[promise]}        [promise]
 */
execParse = (tasks, index) => {
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
		result = current();
	} else {
		result = current.fun.apply(null, current.param);
	}
	//如果当前任务有返回结果，并且结果不是一个promise
	if (result !== null && result !== undefined && !result.then) {
		return Promise.resolve(result);
	}
	if (result === undefined || result === null) {
		result = Promise.resolve(result);
	}
	return result.then(res => {
		return res!== null && res !== undefined  ? res : (next ? execParse(tasks, index + 1) : undefined);
	});
};

//test===========

// let reqInfo = {
// 	headers: {},
// 	host: "g.caipiao.163.com",
// 	protocol: "http",
// 	port: 80,
// 	path: "/caipiao/test/mm/bb.html",
// 	originalFullUrl: "http://g.caipiao.163.com/caipiao/test/mm/bb.html"
// };
// parseRule(reqInfo)
// .then((result) => {
// 	log.debug(result);
// });

// parseOneBranch({
// 	type: "host",
// 	test: '/zhuhu.com/test/',
// 	exec: "http://192.168.199.100/test?aaa"
// }, reqInfo);


// parseOneBranch({
// 	type: "remoteFile",
// 	test: '/zhuhu.com/test/',
// 	exec: "http://192.168.199.100/test?aaa"
// }, reqInfo);
// 

// parseOneBranch({
// 	type: "localFile",
// 	test: '/zhuhu.com/test/',
// 	exec: "D:/test/1111/1222"
// }, reqInfo);


// parseOneBranch({
// 	type: "localDir",
// 	test: '/zhuhu.com/test/',
// 	exec: "D:/test/1111/cjx",
// 	virtualPath: "/test/"
// }, reqInfo);


// console.log(standardUrl("test:8080?a=1"));

