import monitorListType from './monitorListType';
import camelCase from 'lodash/camelCase';
import { createAction, createActions, combineActions } from 'redux-actions';
import Immutable, { List } from 'immutable';
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
	/**
	 * 过滤器显示隐藏状态
	 * @param id 数据的id
	 */
	clearMonitorList,
	/**
	 *  详情页面数据
	 * @param object | string
	 * {
	 *  id: 数据id
	 *  data: arraybuffer 数据
	 * }
	 *  string (错误字符串)
	 * */
	curConDetailData,
} = (result = createActions(...Object.keys(monitorListType)));
export default result;
