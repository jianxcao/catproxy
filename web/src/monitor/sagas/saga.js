import { takeEvery, delay } from 'redux-saga';
import { call, put, fork } from 'redux-saga/effects';
import {fetchConfig} from "../../ws/sendMsg";
import {FETCH_CONFIG} from '../action/fetchType';
import {disCache, monitorStatus, monitorFilterStatus} from '../action/navAction';
import {loadingPage} from '../action/loadingAction';
import {hiddenDataUrl, monitorFilterType} from '../action/filterBarAction';
import {addMonitorList} from '../action/monitorListAction';
import Immutable from 'immutable';
import data  from '../mock';

// 调用服务取数据
function* fetchCfg(action) {
	yield put(loadingPage(true));
	yield call(delay, 200);
	// let data = yield call(fetchConfig);
	console.log(data);
	yield put(loadingPage(false));
	let {monitor} = data;
	yield put(disCache(data.disCache));
	yield put(monitorStatus(monitor.monitorStatus));
	yield put(monitorFilterStatus(monitor.monitorFilterStatus));
	yield put(hiddenDataUrl(monitor.hiddenDataUrl));
	yield put(monitorFilterType(monitor.monitorFilterType));
	yield put(addMonitorList(Immutable.fromJS(monitor.monitorList)));
	
};

// 获取配置文件
function* getALLCfg() {
	yield* takeEvery(FETCH_CONFIG, fetchCfg);
}

// 入口
export default function* root() {
	yield fork(getALLCfg);
};
