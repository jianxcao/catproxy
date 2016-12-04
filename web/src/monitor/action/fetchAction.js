import fetchType from "./fetchType";
import camelCase from 'lodash/camelCase';	
import {createAction, createActions, combineActions} from 'redux-actions';

const result = createActions(...Object.keys(fetchType));
export const {
	/**
	 * 过滤条件
	 * 获取配置
	*/
	fetchConfig
} = result;
export default result;


