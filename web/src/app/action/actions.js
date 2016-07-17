import actionType from "./action-type";
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
export let addBranch = (groupId, name) =>{
	return {
		type: ADD_BRANCH,
		groupId,
		name
	};
};

export let delBranch = (groupId, id) =>{
	return {
		type: DEL_BRANCH,
		groupId,
		id
	};
};

export let addGroup = (name) =>{
	return {
		type: ADD_GROUP,
		name
	};
};

export let delGroup = (id) =>{
	return {
		type: DEL_GROUP,
		id
	};
};

export let changeGroupName = (id, name) => {
	return {
		type: CHANGE_GROUP_NAME,
		id,
		name
	};
};
export let changeBranchName = (groupId, id, name) => {
	return {
		type: CHANGE_BRANCH_NAME,
		groupId,
		id,
		name
	};
};
