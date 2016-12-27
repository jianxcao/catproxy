import Immutable, {OrderedMap, Map, List} from 'immutable';
import keys from 'lodash/keys';
import camelCase from 'lodash/camelCase';
import {handleActions} from 'redux-actions';
import monitorListType from "../action/monitorListType";
export default {
	monitorList: handleActions({
			// 增加数据
		ADD_MONITOR_LIST: (state , {payload: arrData}) => {
			// 数据量限定在5000
			if (state.size > 5000) {
				state = new Map();
			}
			let ids = [];
			if (arrData && arrData.length) {
				for(let val of arrData) {
					let cur = state.get(val.id);
					// 这证明 已经有这条数据了，可能是update先回来了
					// 如果不是，那证明数据有问题
					// 证明证明是不是update先回来？ update数据是米有name字段的
					if (cur && !cur.get('name')) {
						state = state.set(val.id, cur.merge(Immutable.fromJS(val)));
					} else {
						state = state.set(val.id, Immutable.fromJS(val));
					}
					ids.push(val.id);
				}
			}
			let mySeq = state.get("mySeq");
			mySeq = mySeq || new List();
			mySeq = mySeq.concat(ids);
			state = state.set('mySeq', mySeq);
			return state;
		},
		// 更新list中得一些数据字段
		UPDATE_MONITOR_LIST: (state, {payload: arrData}) => {
			if (arrData && arrData.length) {
				for(let val of arrData) {
					let cur = state.get(val.id);
					// 这里在更新数据的时候，如果发现数据的 add还没回来，先回来得时 update，则先将update数据保存
					// 但是这个时候没有 seq对象，所以迭代不出这条数据，只有等add发生有seq的时候才能迭代
					if (cur) {
						state = state.set(val.id, cur.merge(Immutable.fromJS(val)));
					} else {
						state = state.set(val.id, Immutable.fromJS(val));
					}
				}
			}
			return state;
		},
		// 过滤器显示隐藏状态
		CLEAR_MONITOR_LIST:(state, action) => {
			// 直接清空所有数据
			return new Map();
		}
	}, [])
};
