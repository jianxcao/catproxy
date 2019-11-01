import configProps, { monitorType } from './configProps';
import log from '../log';
const isUrl = /^https?:\/\/.+/;
const ruleType = {
	host: 'host',
	localFile: 'localFile',
	localDir: 'localDir',
	remoteFile: 'remoteFile',
	redirect: 'redirect',
	weinre: 'weinre',
	regReplace: 'regReplace',
};
let checkRules = branch => {
	let rules = branch.rules;
	if (rules && rules.length >= 0 && typeof rules === 'object') {
		// 空数组是合法的
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

let checkBranch = branchs => {
	if (branchs && branchs.length >= 0 && typeof branchs === 'object') {
		// 空数组是合法的
		if (branchs.length === 0) {
			return true;
		}
		for (let branch of branchs) {
			// 名字是必须得字段
			if (branch && branch.name !== undefined) {
				// 没定义这个字段
				if (branch.rules === undefined || branch.rules === null) {
					// 定义一个空得
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
let checkHosts = hosts => {
	if (hosts && hosts.length >= 0 && typeof hosts === 'object') {
		// 空数组是合法的
		if (hosts.length === 0) {
			return true;
		}
		for (let host of hosts) {
			if (host && host.name !== undefined) {
				// 没定义这个字段
				if (host.branch === undefined || host.branch === null) {
					// 定义一个空得
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

const valCheck = {
	sni: {
		1: true,
		2: true,
	},
	type: {
		all: true,
		http: true,
		https: true,
	},
	log: {
		error: true,
		warn: true,
		info: true,
		verbose: true,
		debug: true,
		silly: true,
	},
};
let checkMonitor = monitor => {
	let keys = {
		monitorStatus: true,
		monitorFilterStatus: true,
		monitorFilterType: true,
		hiddenDataUrl: true,
	};
	if (typeof monitor === 'object') {
		for (var m in monitor) {
			if (!keys[m]) {
				delete monitor[m];
			}
			if (m == 'monitorFilterType') {
				if (!monitorType.some(c => c === monitor[m])) {
					delete monitor[m];
				}
			}
		}
		return true;
	}
	return false;
};

// 检测配置字段是否合法
export default function(cfg) {
	var data = {};
	if (cfg) {
		// 只能是指定的字段，字段不能是undefined
		configProps.forEach(function(cur) {
			var status = false;
			if (cfg[cur] !== undefined) {
				if (cur === 'hosts') {
					status = !!checkHosts(cfg[cur]);
				} else if (cur === 'port' || cur === 'httpsPort' || cur === 'uiPort' || cur === 'weinrePort') {
					cfg[cur] = +cfg[cur];
					status = !isNaN(cfg[cur]);
				} else if (cur === 'type' || cur === 'log' || cur === 'sni') {
					status = !!valCheck[cur][cfg[cur]];
				} else if (cur === 'disCache' || cur === 'autoOpen' || cur === 'cacheFlush') {
					status = typeof cfg[cur] === 'boolean';
				} else if (cur === 'breakHttps') {
					let list = cfg[cur];
					if (Array.isArray(list)) {
						let result = list.reduce((all, current) => {
							if (typeof current === 'string' || Object.prototype.toString.call(current) === '[object RegExp]') {
								all.push(current.toString().replace(/^\/|\/$/g, ''));
								return all;
							}
						}, []);
						if (result && result.length) {
							cfg[cur] = result;
							status = true;
						}
					} else if (typeof list === 'boolean') {
						status = true;
					}
				} else if (cur === 'excludeHttps') {
					let list = cfg[cur];
					if (Array.isArray(list)) {
						let result = list.reduce((all, current) => {
							if (typeof current === 'string' || Object.prototype.toString.call(current) === '[object RegExp]') {
								all.push(current.toString().replace(/^\/|\/$/g, ''));
								return all;
							}
						}, []);
						if (result && result.length) {
							cfg[cur] = result;
							status = true;
						}
					} else if (list === '') {
						status = true;
					}
				} else if (cur === 'remoteRuleUrl') {
					if (cfg[cur] && isUrl.test(cfg[cur])) {
						status = true;
					}
				} else if (cur === 'monitor') {
					// 检测监控数据
					status = checkMonitor(cfg[cur]);
				}
				if (status) {
					data[cur] = cfg[cur];
				} else {
					log.warn(`设置数据被忽略，数据键:${cur},数据值:` + cfg[cur]);
				}
			}
		});
	}
	return data;
}
