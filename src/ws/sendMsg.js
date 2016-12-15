import log from '../log';
import webCfg from '../config/webCfg';
import {SUCC} from './status';
import {addMonitorData, updateMonitorData} from './sendType';
let addMonitorArr = [];
let updateMonitorArr = [];
let addMonitorTimer;
let updateMonitorTimer;
let wss = null;

let sendAddMonitor = (data) => {
	if (wss) {
		let result = {
			result: data,
			status: SUCC
		};
		wss.emit(addMonitorData, result);
	}
};
let sendUpdateMonitor = (data) => {
	if (wss) {
		let result = {
			result: data,
			status: SUCC
		};		
		wss.emit(updateMonitorData, result);
	}
};

export let addMonitor = (data) => {
	if (!wss) {
		log.error("清先初始化monitor");
		return;
	}
	if (typeof data === 'object' && data.id >= 0) {
		addMonitorArr.push(data);
	}
	if (addMonitorTimer) {
		clearTimeout(addMonitorTimer);
	}
	addMonitorTimer = setTimeout(() => {
		let data = addMonitorArr;
		addMonitorArr = [];
		sendAddMonitor(data);
	}, 300);	
};

export let updateMonitor = (data) => {
	if (!wss) {
		log.error("清先初始化monitor");
		return;
	}
	if (typeof data === 'object' && data.id >= 0) {
		updateMonitorArr.push(data);
	}
	if (updateMonitorTimer) {
		clearTimeout(updateMonitorTimer);
	}
	updateMonitorTimer = setTimeout(() => {
		let data = updateMonitorArr;
		updateMonitorArr = [];
		sendUpdateMonitor(data);
	}, 300);
};

// 启动项目的时候需要  群发一个消息，清除掉当前页面的记录，否则id会冲突--- 为了以防万一，id前面带个随机数？？

/**
 * 必须先调init，即default方法才能使用
 */
export default (webSocket) => {
	wss = webSocket;
};
