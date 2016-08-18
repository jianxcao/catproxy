import Immutable, {OrderedMap, Map, List} from 'Immutable';
import actionType from "../action/action-type";
import {rule, syncDis} from "./rule";
let  {
	FETCH_FAILURE,
	FETCH_SUCC,
	FETCH,
	RESET_HOSTS,
	ADD_GROUP,
	DEL_GROUP,
	ADD_BRANCH,
	DEL_BRANCH,
	CHANGE_GROUP_NAME,
	CHANGE_BRANCH_NAME,
	TOGGLE_BRANCH_DIS,
	TOGGLE_GROUP_DIS,
	DRAWERSTATUS,
	DISABLE_ALL,
	TOGGLE_FLOD,
	SWITCH_BRANCH,
	SWITCH_GROUP,
	UPDATE_CURRENT_RULE,
	DIS_CACHE
} = actionType;

let group = (state = new List(), action = {}) => {
	switch (action.type) {
		case ADD_GROUP:
			return state.push(new OrderedMap({
				disable: false,
				isOpen: true,
				name: action.name,
				branch: new List()
			}));
		case DEL_GROUP:
			return state.delete(action.id);
		case CHANGE_GROUP_NAME:
			return state.updateIn([action.id, "name"], ()=> action.name);
		case TOGGLE_GROUP_DIS:
			let dis;
			state = state.updateIn([action.id, "disable"], val => dis = !val);
			return state.updateIn([action.id, "branch"], branch => branch.map(branch => {
				return branch.set('disable', dis)
				.update('rules', rules=> rules.map(rule => rule.set('disable', dis)));
			}));
		case SWITCH_GROUP:
				let old = state.get(action.sourceGroupId);
				return state.set(action.sourceGroupId, state.get(action.groupId)).set(action.groupId, old);
		default:
			return state;
	}
};

let branch = (state = new List(), action = {}) => {
	switch (action.type) {
		case ADD_BRANCH:
			//能找到分组
			if (action.groupId >= 0 && action.groupId !== null) {
				state = state.updateIn([action.groupId, 'branch'], 
					value=> value.push(new OrderedMap({
						disable: false,
						name: action.name,
						rules: new List()
					})));
				return syncDis(state, action.groupId);
			} else {//找不到分组新增一个分组
				state = state.push(new OrderedMap({
					disable: false,
					name: action.groupName,
					branch: Immutable.fromJS([{
						disable: false,
						name: action.name,
						rules: []
					}])
				}));
				return state;
			}
		case DEL_BRANCH:
			state =  state.updateIn([action.groupId, 'branch'], 
				value=> value.delete(action.id));
			return syncDis(state, action.groupId);
		case CHANGE_BRANCH_NAME:
			return state.updateIn(
				[action.groupId, "branch", action.id, "name"], 
				()=> action.name);
		case TOGGLE_BRANCH_DIS:
			state = state.updateIn([action.groupId, "branch", action.id], 
				branch => {
					let status = !branch.get('disable');
					return branch.set('disable', status)
					.update('rules', rules => rules.map(rule => rule.set('disable', status)));
				});
		 		return syncDis(state, action.groupId);
		case SWITCH_BRANCH:
			return state.updateIn([action.groupId, "branch"], branchs => {
				let old = branchs.get(action.sourceBranchId);
				return branchs.set(action.sourceBranchId, branchs.get(action.branchId)).set(action.branchId, old);
			});
		default:
			return state;
	}
};

let restData = (state = new List(), action = {})=> {
	switch (action.type) {
		case RESET_HOSTS:
			let newState = Immutable.fromJS(action.hosts);
			return newState.equals(state) ? state : newState;
		default:
			return state;
	}
};

let disableAll = (state = new List(), action = {}) => {
	switch (action.type) {
		case DISABLE_ALL:
			return state.map(groups => {
				return groups.set('disable', true)
				.update("branch", branch => branch.map(branch => {
					return branch.set('disable', true)
					.update('rules', rules=>rules.map(rule => rule.set('disable', true)));
				}));
			});
		default:
			return state;
	}
};

let toggleFlod = (state = new List(), action = {}) => {
	switch (action.type) {
		case TOGGLE_FLOD:
			return state.updateIn([action.groupId, "isOpen"], isOpen => !isOpen);
		default:
			return state;
	}
};

//控制所欲规则
export let hosts = (state = new List(), action = {}) => {
	if (/.+(?:BRANCH).*/.test(action.type)) {
		return branch(state, action);
	} else if (/.+(?:GROUP).*/.test(action.type)) {
		return group(state, action);
	} else if (/.+(?:RULE).*/.test(action.type)) {
		return rule(state, action);
	} else if (action.type === RESET_HOSTS) {
		return restData(state, action);
	} else if (action.type === DISABLE_ALL) {
		return disableAll(state, action);
	} else if (action.type === TOGGLE_FLOD) {
		return toggleFlod(state, action);
	} else {
		return state;
	}
};

//初次获取规则
export let fetchRule = (state = new Map(), action = {}) => {
	switch (action.type) {
		case FETCH:
			return state;
		case FETCH_SUCC:
			return state.set("type", "SUCC").set('data', action.result);
		case FETCH_FAILURE:
			return state.set("type", "FAIL").set('data', action.error);
		default:
			return state;
	}
};

//左侧菜单状态
export let drawerStatus = (state = false, action = {}) => {
	switch (action.type) {
		case DRAWERSTATUS:
			return !!action.status;
		default:
			return state;
	}
};

//当前选中规则
export let selectRule = (state = new Map(), action = {}) => {
	switch (action.type) {
		case UPDATE_CURRENT_RULE:
			return state.set('groupId', action.groupId).set('branchId', action.branchId);
		default:
			return state;
	}
};

//禁止缓存
export let disCache = (state = true, action = {}) => {
	switch (action.type) {
		case DIS_CACHE:
			return action.status;
		default:
			return state;
	}
};

//需要的数据结构
// [{
// 		name: "caipiao",
// 		branch: [{
// 			name: "test1",
// 			rules: [{
// 				test: /test/,
// 				exec: ""
// 			}]
// 		}],
// 	},{
// 		name: "guobao",
// 		branch: [],
// }]
// 
// 
