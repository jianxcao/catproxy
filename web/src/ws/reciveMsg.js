// 收到数据后从这里处理
import * as status from './status';
import hostStore from '../host/store/store';
import monitorStore from '../monitor/store/store';
import {resetHosts} from '../host/action/actions';
import {addMonitorList, updateMonitorList} from '../monitor/action/monitorListAction';
// 增加监控数据
export let addMonitorData = (message)=> {
	if (message && message.status === status.SUCC) {
		monitorStore.dispatch(addMonitorList(message.result));
	}
};

// 更新数据
export let updateMonitorData = (message)=> {
	if (message && message.status === status.SUCC) {
		monitorStore.dispatch(updateMonitorList(message.result));
	}
};

export let updateRule = (message)=> {
	if (message && message.status === status.SUCC) {
		hostStore.dispatch(resetHosts(message.result.hosts));
	}
};

export default {
	addMonitorData,
	updateMonitorData,
	updateRule
};
