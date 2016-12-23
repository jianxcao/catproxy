import fetchType from "./fetchType";
import camelCase from 'lodash/camelCase';	
import {createAction, createActions, combineActions} from 'redux-actions';

const result = createActions(...Object.keys(fetchType));
export const {
	/**
	 * 获取配置
	*/
	fetchConfig,
	/**
	 * 获取某个请求的详细数据，主要是resBodyData
	 */
	fetchConData,
} = result;
export default result;


