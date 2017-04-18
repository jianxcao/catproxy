import navType from "./navType";
import camelCase from 'lodash/camelCase';	
import {createAction, createActions} from 'redux-actions';
let result;
/**  建立action action返回数据类似
{
	// action类型
	type: navType,
	// action动作数据
	payload: result,
}
*/
export const {
	/**
	 *禁止缓存
	 *@param boolean 是否禁止缓存
	*/
	disCache,
	/**
	 *禁止缓存
	 *@param boolean 是否打开录制
	*/	
	monitorStatus,
	/**
	 *是否打开过滤器
	 *@param boolean 是否打开过滤器
	*/	
	monitorFilterStatus,
	/**
	 * 刷新缓存，插入 meta标签只有 contentType是text/html时候管用
	 */
	cacheFlush
} = result = createActions(...Object.keys(navType));
export default result; 
