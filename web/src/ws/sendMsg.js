// 像服务器发送消息，如果有消息返回则接受
// 暴露出发送消息的各个方法
/*
 * 
 *  所有接受到得消息是一个Object
 * 
 * {
 * 	path: "数据访问路径，相同type下的不同逻辑处理可以用不同的path"
 * 	param: "请求参"
 * }
 */
import {send} from './ws';



// 获取config
export let fetchConfig = () => {
	return send('fetchConfig')();
};

// 更新rule
export let updateRule = (data) => {
	if (data && data.length >= 0) {
		let result = {
			param: {
				rules: data
			},
			path: "rule"
		};
		return send('saveConfig')(result);
	}
};

// 更新远程地址
export let remoteUpdateRule = (url) => {
	if (url) {
		let result = {
			param: {
				url: url
			},
			path: "remoteUpdateRule"
		};
		return send('remoteUpdateRule')(result);
	}
};

// 更新缓存
export let disCache =(status) => {
	status = !!status;
	let result = {
		param: {
			status: status
		},
		path: "disCache"
	};
	return send('saveConfig')(result);
};

// 更新监控状态
export let monitorStatus = (status) => {
	status = !!status;
	let result = {
		param: {
			monitorStatus: status
		},
		path: "monitor"
	};
	return send('saveConfig')(result);
};

// 更新过滤状态
export let monitorFilterStatus = (status) => {
	status = !!status;
	let result = {
		param: {
			monitorFilterStatus: status
		},
		path: "monitor"
	};
	return send('saveConfig')(result);
};

// 更新过滤类型
export let monitorFilterType = (type) => {
	status = !!status;
	let result = {
		param: {
			monitorFilterType: type
		},
		path: "monitor"
	};
	return send('saveConfig')(result);
};

// 更新是否隐藏 dataUrl，暂时无用
export let hiddenDataUrl = (status) => {
	status = !!status;
	let result = {
		param: {
			hiddenDataUrl: status
		},
		path: "monitor"
	};
	return send('saveConfig')(result);
};

export let getConDetail = (id) => {
	let result = {
		param: {
			id: id
		},
		path: "getConDetail"
	};
	return send('getConDetail')(result);
};

export default {
	fetchConfig,
	updateRule,
	disCache,
	remoteUpdateRule,
	monitorStatus,
	monitorFilterStatus,
	monitorFilterType,
	hiddenDataUrl
};
