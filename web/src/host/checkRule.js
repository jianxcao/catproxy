const ruleType = {
	host: 'host',
	localFile: 'localFile',
	localDir: 'localDir',
	remoteFile: 'remoteFile',
	weinre: 'weinre',
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
export default hosts => {
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
