import Immutable, {OrderedMap, Map, List} from 'immutable';
import keys from 'lodash/keys';
import camelCase from 'lodash/camelCase';
import {handleActions} from 'redux-actions';
import monitorListType from "../action/monitorListType";
export default {
	monitorList: handleActions({
			// 增加数据
		ADD_MONITOR_LIST: (state , {payload: newData}) => {
			return state.merge(newData);
		},
		// 更新list中得一些数据字段
		UPDATE_MONITOR_LIST: (state, {payload: newData}) => {
			return state.mergeDeep(newData);
		},
		// 过滤器显示隐藏状态
		CLEAR_MONITOR_LIST:(state, action) => {
			// 直接清空所有数据
			return new Map();
		}
	}, new List())
};
