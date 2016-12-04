import monitorListType from "./monitorListType";
import camelCase from 'lodash/camelCase';	
import {createAction, createActions, combineActions} from 'redux-actions';
import Immutable, {List} from 'immutable';
let result;
export const {
	/**
	 *增加数据
	 * @param list [array] 
	*/
	addMonitorList,
	/**
	 * 更新list中得一些数据字段
	 * @param list [array] 
	*/	
	updateMonitorList,
	// 过滤器显示隐藏状态
	clearMonitorList
} = result = createActions(...Object.keys(monitorListType));
export default result;
