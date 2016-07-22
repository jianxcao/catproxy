import Immutable, {OrderedMap, Map, List} from 'Immutable';
import actionType from "../action/action-type";
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
} = actionType;
let group = (state = new List(), action = {}) => {
	switch (action.type) {
		case ADD_GROUP:
			return state.push(new OrderedMap({
				disable: false,
				name: action.name,
				branch: new List()
			}));
		case DEL_GROUP:
			return state.delete(action.id);
		case CHANGE_GROUP_NAME:
			return state.updateIn([action.id, "name"], ()=> action.name);
		case TOGGLE_GROUP_DIS:
			return state.updateIn([action.id, "disable"], (val)=> !val);
		default:
			return state;
	}
};
let branch = (state = new List(), action = {}) => {
	switch (action.type) {
		case ADD_BRANCH:
			return state.updateIn([action.groupId, 'branch'], 
				value=> value.push(new OrderedMap({
					disable: false,
					name: action.name,
					ruels: new List()
				})));
		case DEL_BRANCH:
			return state.updateIn([action.groupId, 'branch'], 
				value=> value.delete(action.id));
		case CHANGE_BRANCH_NAME:
			return state.updateIn(
				[action.groupId, "branch", action.id, "name"], 
				()=> action.name);
		case TOGGLE_BRANCH_DIS:
			return state.updateIn(
				[action.groupId, "branch", action.id, "disable"], 
				(val)=> !val);
		default:
			return state;
	}
};
let restData = (state = new List(), action = {})=> {
	switch (action.type) {
		case RESET_HOSTS:
			return Immutable.fromJS(action.hosts);
		default:
			return state;
	}
};

export let hosts = (state = new List(), action = {}) => {
	//存在groupId
	let groupId = action.groupId;
	if (/.+(?:BRANCH|GROUP).*/.test(action.type)) {
		if (groupId >= 0) {
			return branch(state, action);
		} else {
			return group(state, action);
		}
	} else if (action.type === 'RESET_HOSTS') {
		return restData(state, action);
	} else {
		return state;
	}
};

export let fetchData = (state = new Map(), action = {}) => {
	switch (action.type) {
		case FETCH:
			return state;
		case FETCH_SUCC:
			return state.set("status", "SUCC");
		case FETCH_FAILURE:
			return state.set("status", "FAIL");
		default:
			return state;
	}
};

export let drawerStatus = (state = true, action = {}) => {
	switch (action.type) {
		case DRAWERSTATUS:
			return !state;
		default:
			return state;
	}
};
//需要的数据结构
//合理的方式是把 组和host拆成2个数据结构，通过id去构造二者之间的关系
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
