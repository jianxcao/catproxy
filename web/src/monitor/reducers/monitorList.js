import Immutable, {OrderedMap, Map, List} from 'immutable';
import keys from 'lodash/keys';
import camelCase from 'lodash/camelCase';
import {handleActions} from 'redux-actions';
import monitorListType from "../action/monitorListType";
export default {
	monitorList: handleActions({
			// 增加数据
		ADD_MONITOR_LIST: (state , {payload: arrData}) => {
			let ids = [];
			if (arrData && arrData.length) {
				for(let val of arrData) {
					state = state.set(val.id, Immutable.fromJS(val));
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
					if (cur) {
						state = state.set(val.id, cur.merge(Immutable.fromJS(val)));
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
