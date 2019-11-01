import log from '../log';
import webCfg from '../config/webCfg';
import { SUCC } from './status';
import { addMonitorData, updateMonitorData, getConDetail } from './sendType';
let addMonitorArr = [];
let updateMonitorArr = [];
let addMonitorTimer;
let updateMonitorTimer;
let wss = null;

let sendAddMonitor = data => {
	if (wss) {
		let result = {
			result: data,
			status: SUCC,
		};
		wss.emit(addMonitorData, result);
	}
};
let sendUpdateMonitor = data => {
	if (wss) {
		let result = {
			result: data,
			status: SUCC,
		};
		wss.emit(updateMonitorData, result);
	}
};
// 添加监控数据
export let addMonitor = data => {
	if (!wss) {
		log.error('清先初始化monitor');
		return;
	}
	if (typeof data === 'object' && data.id) {
		addMonitorArr.push(data);
	}
	if (addMonitorTimer) {
		clearTimeout(addMonitorTimer);
	}
	// 延迟比 update短点，保证先触发，如果后触发前端也会有特殊处理
	addMonitorTimer = setTimeout(() => {
		let data = addMonitorArr;
		addMonitorArr = [];
		sendAddMonitor(data);
	}, 100);
};
// 更新监控数据
export let updateMonitor = data => {
	if (!wss) {
		log.error('清先初始化monitor');
		return;
	}
	if (typeof data === 'object' && data.id) {
		updateMonitorArr.push(data);
	}
	if (updateMonitorTimer) {
		clearTimeout(updateMonitorTimer);
	}
	updateMonitorTimer = setTimeout(() => {
		let data = updateMonitorArr;
		updateMonitorArr = [];
		sendUpdateMonitor(data);
	}, 150);
};
// 发送监控详情数据
export let sendConnDetail = data => {
	if (wss) {
		let result = {
			result: data,
			status: SUCC,
		};
		wss.emit(getConDetail, result);
	}
};
// 启动项目的时候需要  群发一个消息，清除掉当前页面的记录，否则id会冲突--- 为了以防万一，id前面带个随机数？？

/**
 * 必须先调init，即default方法才能使用
 */
export default webSocket => {
	wss = webSocket;
};
