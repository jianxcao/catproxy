import * as reducers from '../reducers/index';
import * as rule from '../reducers/rule';
import Immutable from 'Immutable';
import {
    combineReducers
} from 'redux-immutable';
import actionType from "../action/action-type";
let  {
	FETCH_FAILURE,
	FETCH_SUCC,
	FETCH
} = actionType;
import { createStore, applyMiddleware, compose } from 'redux';
/**
 * 记录所有被发起的 action 以及产生的新的 state。
 */
const logger = store => next => action => {
	console.group(action.type);
	console.info('dispatching', action);
	let result = next(action);
	console.log('next state', store.getState());
	console.groupEnd(action.type);
	return result;
};

/**
 * 在 state 更新完成和 listener 被通知之后发送崩溃报告。
 */
const crashReporter = store => next => action => {
	try {
		return next(action);
	} catch (err) {
		console.error('Caught an exception!', err);
		console.error('action', action);
		console.error('state', store.getState());
		throw err;
	}
};

/**
 * 使你除了 action 之外还可以发起 promise。
 * 如果这个 promise 被 resolved，他的结果将被作为 action 发起。
 * 这个 promise 会被 `dispatch` 返回，因此调用者可以处理 rejection。
 */
const vanillaPromise = store => next => action => {
	if (typeof action.then !== 'function') {
		return next(action);
	}
	return Promise.resolve(action).then(store.dispatch);
};

/**
 * 让你可以发起带有一个 { promise } 属性的特殊 action。
 *
 * 这个 middleware 会在开始时发起一个 action，并在这个 `promise` resolve 时发起另一个成功（或失败）的 action。
 *
 * 为了方便起见，`dispatch` 会返回这个 promise 让调用者可以等待。
 */
const readyStatePromise = store => next => action => {
	if (!action.promise) {
		return next(action);
	}
	function makeAction(type, data) {
		let newAction = Object.assign({}, action, { type }, data);
		delete newAction.promise;
		return newAction;
	}
	next(makeAction(FETCH));
	return action.promise.then(
		result => next(makeAction(FETCH_SUCC, { result })),
		error => next(makeAction(FETCH_FAILURE, { error }))
	);
};

/**
 * 让你可以发起一个函数来替代 action。
 * 这个函数接收 `dispatch` 和 `getState` 作为参数。
 *
 * 对于（根据 `getState()` 的情况）提前退出，或者异步控制流（ `dispatch()` 一些其他东西）来说，这非常有用。
 *
 * `dispatch` 会返回被发起函数的返回值。
 */
const thunk = store => next => action =>
	typeof action === 'function' ?
		action(store.dispatch, store.getState) :
		next(action);
const initialState = new Immutable.fromJS({
	hosts: [],
	fetchData: {}
});
//组合所有reducers
let toDo = combineReducers(reducers);
//创建带有 调试和各种中间件的stroe
let store = createStore(toDo, initialState, compose(
	applyMiddleware(thunk, vanillaPromise, readyStatePromise, logger, crashReporter),
	window.devToolsExtension ? window.devToolsExtension() : f => f
));



export default store;
