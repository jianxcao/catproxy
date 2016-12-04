import filterBarType from "./filterBarType";
import camelCase from 'lodash/camelCase';	
import {createAction, createActions, combineActions} from 'redux-actions';

const result = createActions(...Object.keys(filterBarType));
export const {
	/**
	 * 过滤条件
	 * @param string  必须是以下的其中一个 all doc xhr js css img media font WS mainifest other
	 * 
	*/
	monitorFilterType,
	/**
	 * 过滤条件，可以使正则，多个条件用,分割
	 * @param string
	*/
	monitorFilterCondition,
	/**
	 * 是否隐藏 data url
	 * @param boolean
	*/
	hiddenDataUrl,
} = result;

export default result;


