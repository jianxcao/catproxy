import loadingType from "./loadingType";
import {createAction, createActions, combineActions} from 'redux-actions';

const result = createActions(...Object.keys(loadingType));
export const {
	/**
	 *  页面加载状态
	 * @param boolean 是否正在加载
	*/
	loadingPage,
	/**
	 *  请求内容状态
	 * @param boolean 是否正在加载
	*/	
	loadingReqContent,
} = result;

export default result;


