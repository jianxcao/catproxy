import reducers from '../reducers/index';
import Immutable from 'immutable';
import thunk from 'redux-thunk';
import promise from 'redux-promise';
import createLogger from 'redux-logger';
import createSagaMiddleware from 'redux-saga';
import rootSaga from '../sagas/saga';
import ws from '../../ws/ws';
import {clearMonitorList} from '../action/monitorListAction';
import {
    combineReducers
} from 'redux-immutable';

import { createStore, applyMiddleware, compose } from 'redux';

// 所有需要的状态暂时都放在这里
const initialState = new Immutable.fromJS({
	disCache: false,
	monitorStatus: false,
	monitorFilterStatus: true,
	monitorFilterType: "all",
	// monitorFilterCondition: "", //后台不保存
	hiddenDataUrl: false,
	monitorList: {},
	loading: {
		loadingPage: true
	},
	// 当前resBodydata的数据是个 arrayBuffer- utf-8编码
	curConDetailData: null
});
// 组合所有reducers 
let reducer = combineReducers(reducers);
const sagaMiddleware = createSagaMiddleware();
// 创建带有 调试和各种中间件的stroe
let middleware = [thunk, promise, sagaMiddleware];

// if (window.config.env === 'dev') {
middleware.push(createLogger());
// }
let store = createStore(reducer, initialState, compose(applyMiddleware(...middleware),
	window.devToolsExtension ? window.devToolsExtension() : f => f
));
// 重新连接，清空数据
ws().then(function(wws) {
	wws.on('disconnect', function() {
		store.dispatch(clearMonitorList());
	});
});
window.store = store;
window.Immutable = Immutable;
sagaMiddleware.run(rootSaga);
export default store;
