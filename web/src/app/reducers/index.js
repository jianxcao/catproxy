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
	DISABLE_ALL
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
			let dis;
			state = state.updateIn([action.id, "disable"], (val)=> {
				return (dis = !val);
			});
			return state.updateIn([action.id, "branch"], current => current.map(current => current.set('disable', dis)));
		default:
			return state;
	}
};
let branch = (state = new List(), action = {}) => {
	switch (action.type) {
		case ADD_BRANCH:
			//能找到分组
			if (action.groupId >= 0 && action.groupId !== null) {
				return state.updateIn([action.groupId, 'branch'], 
					value=> value.push(new OrderedMap({
						disable: false,
						name: action.name,
						ruels: new List()
					})));
			} else {//找不到分组新增一个分组
				return state.push(new OrderedMap({
					disable: false,
					name: action.groupName,
					branch: Immutable.fromJS([{
						disable: false,
						name: action.name,
						ruels: []
					}])
				}));
			}
			break;
		case DEL_BRANCH:
			return state.updateIn([action.groupId, 'branch'], 
				value=> value.delete(action.id));
		case CHANGE_BRANCH_NAME:
			return state.updateIn(
				[action.groupId, "branch", action.id, "name"], 
				()=> action.name);
		case TOGGLE_BRANCH_DIS:
			 state = state.updateIn(
				[action.groupId, "branch", action.id, "disable"], 
				(val)=> !val);
			 let status = state.getIn([action.groupId, "branch"])
			 .every(current => current.get('disable') === true);
			 return state.updateIn([action.groupId, "disable"], () => status);
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
let disableAll = (state = new List(), action = {}) => {
	switch (action.type) {
		case DISABLE_ALL:
			return state.map(groups => {
				return groups.set('disable', true)
				.update("branch", current => current.map(current => current.set('disable', true)));
			});
		default:
			return state;
	}
};
export let hosts = (state = new List(), action = {}) => {
	if (/.+(?:BRANCH).*/.test(action.type)) {
		return branch(state, action);
	} else if (/.+(?:GROUP).*/.test(action.type)) {
		return group(state, action);
	} else if (action.type === RESET_HOSTS) {
		return restData(state, action);
	} else if (action.type === DISABLE_ALL) {
		return disableAll(state, action);
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
