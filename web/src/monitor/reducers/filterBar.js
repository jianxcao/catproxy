import { handleAction } from 'redux-actions';
import Immutable from 'immutable';
import { MONITOR_FILTER_TYPE, MONITOR_FILTER_CONDITION, HIDDEN_DATA_URL } from '../action/filterBarType';
import { MONITOR_FILTER_TYPES } from '../constant';
/**
 * 过滤条件
 * @param string  必须是以下的其中一个 all doc xhr js css img media font WS mainifest other
 *
 */
export const monitorFilterType = handleAction(
	MONITOR_FILTER_TYPE,
	(state, { payload: type }) => {
		if (MONITOR_FILTER_TYPES.some(current => current === type)) {
			return type;
		} else {
			return state;
		}
	},
	'all'
);
/**
 * 过滤条件，可以使正则，多个条件用,分割
 * @param string
 */
export const monitorFilterCondition = handleAction(
	MONITOR_FILTER_CONDITION,
	(state, { payload: condition }) => {
		return condition;
	},
	''
);

/**
 * 是否隐藏 data url
 * @param boolean
 */
export const hiddenDataUrl = handleAction(
	HIDDEN_DATA_URL,
	(state, { payload: isHide }) => {
		return !!isHide;
	},
	false
);

export default {
	monitorFilterType,
	monitorFilterCondition,
	hiddenDataUrl,
};
