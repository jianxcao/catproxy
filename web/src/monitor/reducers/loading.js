import Immutable, {OrderedMap, Map, List} from 'immutable';
import keys from 'lodash/keys';
import {handleAction, combineActions} from 'redux-actions';
import loadingType from "../action/loadingType";
import camelCase from 'lodash/camelCase';	

/**
 * 返回object为reducer对象
 *  loading
 */
export default {
	loading: handleAction(combineActions(...Object.keys(loadingType)), (state, {type, payload: loading}) => {
		return state.set(camelCase(type), loading);
	}, Immutable.fromJS({
		loadingPage: true,
		loadingReqContent:false
	}))
};


