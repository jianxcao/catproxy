import { takeEvery, delay } from 'redux-saga';
import { call, put, fork } from 'redux-saga/effects';
import { fetchConfig, getConDetail } from '../../ws/sendMsg';
import { FETCH_CONFIG, FETCH_CON_DATA } from '../action/fetchType';
import { disCache as disCacheAction, cacheFlush as cacheFlushAction, monitorStatus, monitorFilterStatus } from '../action/navAction';
import { loadingPage, loadingConData } from '../action/loadingAction';
import { hiddenDataUrl, monitorFilterType } from '../action/filterBarAction';
import Immutable from 'immutable';

// 调用服务取数据
function* fetchCfg(action) {
	yield put(loadingPage(true));
	yield call(delay, 200);
	let data = {};
	try {
		data = yield call(fetchConfig);
	} catch (e) {
		console.error(e);
	}
	// console.log(data);
	yield put(loadingPage(false));
	// 测试真实数据disCache对不对
	let {
		result: { monitor, disCache, cacheFlush },
	} = data;
	monitor = monitor || {};
	// console.log("monitor", monitor);
	yield put(disCacheAction(!!disCache));
	yield put(cacheFlushAction(!!cacheFlush));
	yield put(monitorStatus(monitor.monitorStatus));
	yield put(monitorFilterStatus(monitor.monitorFilterStatus));
	yield put(hiddenDataUrl(monitor.hiddenDataUrl));
	yield put(monitorFilterType(monitor.monitorFilterType));
}

function* fetchConData(action) {
	try {
		// 只是发送请求，接受数据由ws中得getConDetail 接受
		yield getConDetail(action.payload);
	} catch (e) {
		console.error(e);
	}
}
// 获取配置文件
function* getALLCfg() {
	yield* takeEvery(FETCH_CONFIG, fetchCfg);
}
function* getConData() {
	yield* takeEvery(FETCH_CON_DATA, fetchConData);
}

// 入口
export default function* root() {
	yield fork(getALLCfg);
	yield fork(getConData);
}
