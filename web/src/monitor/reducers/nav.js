import Immutable, {OrderedMap, Map, List} from 'immutable';
import keys from 'lodash/keys';
import camelCase from 'lodash/camelCase';
import {handleAction} from 'redux-actions';
import navType from "../action/navType";

// 总共三个  reducer都是 返回 payload， payload为bool类型
let booleanReducer = (state, action) => {
	return !!action.payload;
};
/**
 * 返回object为reducer对象
 * {
 *  disCache: booleanReducer,
 *  recordStatus: booleanReducer,
 *  filterStatus: booleanReducer
 * }
 */
export default keys(navType).reduce((map, type)=> {
	map[camelCase(type)] = handleAction(type, booleanReducer, true);
	return map;
}, {});
