// 收到数据后从这里处理
import * as status from './status';
import hostStore from '../host/store/store';
import {resetHosts} from '../host/action/actions';

// 增加监控数据
export let addMonitorData = (message)=> {

};

// 更新数据
export let updateMonitorData = (message)=> {

};

export let updateRule = (message)=> {
	if (message && message.status === status.SUCC) {
		hostStore.dispatch(resetHosts(message.result.hosts));
	}
};

export default {
	addMonitorData,
	updateRule
};
