import Immutable, {OrderedMap, Map, List} from 'immutable';
import actionType from "../action/action-type";
let  {
	ADD_RULE,
	DEL_RULE,
	TOGGLE_RULE_DIS,
	UPDATE_RULE,
	SWITCH_RULE
} = actionType;

const methodMap = {
	ADD_RULE: (state, action) => {
		let rule = action.rule;
		if (rule) {;
			state =  state.updateIn(
				[action.groupId, "branch", action.branchId, "rules"], 
				rules => rules.push(Immutable.fromJS(Object.assign({}, {
					type: "host",
					disable: false,
					test: "",
					exec: ""
				}, rule))));
			return syncDis(state, action.groupId);
		} else {
			return state;
		}
	},

	DEL_RULE: (state, action) => {
		state = state.updateIn(
				[action.groupId, "branch", action.branchId, "rules"], 
				rules => rules.delete(action.ruleId));
		return syncDis(state, action.groupId);
	},

	TOGGLE_RULE_DIS: (state, action) => {
 		state = state.updateIn(
				[action.groupId, "branch", action.branchId, "rules", action.ruleId, "disable"], 
				val => !val);
		return syncDis(state, action.groupId);
	},

	UPDATE_RULE: (state, action) => {
		let rule = action.rule;
		if (rule) {
				return state.updateIn(
			[action.groupId, "branch", action.branchId, "rules", action.ruleId], 
			(rule) => rule.merge(Immutable.fromJS(action.rule))
			); 
		} else {
			return state;
		}
	},

	SWITCH_RULE: (state, action) => {
		return state.updateIn(
			[action.groupId, "branch", action.branchId, "rules"], 
			rules => {
				let old = rules.get(action.sourceId);
				return rules.set(action.sourceId, rules.get(action.id)).set(action.id, old);
			});
	}
}

export let rule = (state = new List(), action = {}) => {
	if (methodMap[action.type]) {
		return methodMap[action.type].call(null, state, action);
	} else {
		return state;
	}
}

//同步禁止状态，会从rule下开始逐渐像外同步
export let syncDis = (state, groupId) => {
	if (groupId >= 0) {
		let branchs = state.getIn([groupId, "branch"]);
		let branchsStatus = [];
		branchs.forEach((branch, index) => {
			let rules = branch.get('rules');
			// console.log(branch.get('disable'), index, branch.toJS())
			let status = rules.size ? rules.every(rule => !!rule.get('disable')) : branch.get('disable');
			branchsStatus[index] = status;
		});
		branchs = branchs.map((branch, index) => branch.set('disable', branchsStatus[index]));
		return state.updateIn([groupId, "branch"], current => branchs)
					 .updateIn([groupId, "disable"], dis => branchsStatus.every(cur=> cur === true));
	}
	return state;
}
