import nav from './nav';
import monitorList from './monitorList';
import filterBar from './filterBar';
import isArray from 'lodash/isArray';
import merge from 'lodash/merge';
import loading from './loading';
// 组合所有 引入的 reducer
function combineReducer(arr) {
	if (isArray(arr)) {
		return arr.reduce((map, current) => merge(map, current), {});
	}
	return {};
}
// console.log(combineReducer([nav, monitorList, filterBar]));
export default combineReducer([nav, monitorList, filterBar, loading]);
