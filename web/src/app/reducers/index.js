import  {combineReducers} from 'redux';
import {OrderedMap, List} from 'Immutable';
import actionType from "../action/action-type";
let  {
	FETCH_REQUEST,
	FETCH_FAILURE,
	FETCH_SUCC,
	ADD_GROUP,
	DEL_GROUP,
	ADD_BRANCH,
	DEL_BRANCH,
	CHANGE_GROUP_NAME,
	CHANGE_BRANCH_NAME
} = actionType;
let group = (state = new List(), action = {}) => {
		switch (action.type) {
		case ADD_GROUP:
			return state.push(new OrderedMap({
				name: action.name,
				branch: new List()
			}));
		case DEL_GROUP:
			return state.delete(action.id);
		case CHANGE_GROUP_NAME:
			return state.updateIn([action.id, "name"], ()=> action.name);
		default:
			return state;
	}
};
let branch = (state = new List(), action = {}) => {
		switch (action.type) {
		case ADD_BRANCH:
			return state.updateIn([action.groupId, 'branch'], 
				value=> value.push({name: action.name, ruels: []}));
		case DEL_BRANCH:
			return state.updateIn([action.groupId, 'branch'], 
				value=> value.delete(action.id));
		case CHANGE_BRANCH_NAME:
			return state.updateIn(
				[action.groupId, "branch", action.id, "name"], 
				()=> action.name);
		default:
			return state;
	}
};

let hosts = (state = new List(), action = {}) => {
	//存在groupId
	let groupId = action.groupId;
	if (groupId >= 0) {
		return branch(state, action);
	} else {
		return group(state, action);
	}
};

export default combineReducers({
  hosts
});

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
// 
// 
// 
