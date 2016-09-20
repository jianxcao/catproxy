// 收到数据后从这里处理
import store from '../store/store';
import * as status from './status';
import {resetHosts} from '../action/actions';
export let monitorData = (message)=> {

};

export let updateRule = (message)=> {
	// console.log(message);
	if (message && message.status === status.SUCC) {
		store.dispatch(resetHosts(message.result.hosts));
	}
};

export default {
	monitorData,
	updateRule
};
