//像服务器发送消息，如果有消息返回则接受
//暴露出发送消息的各个方法
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



//获取config
export let fetchConfig = (data) => {
 return send('fetchConfig')(data);
};

//更新rule
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

export default {
	fetchConfig,
	updateRule,
	disCache
};
