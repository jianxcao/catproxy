import actionType from "./action-type";
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
	DRAWERSTATUS
} = actionType;

// ------分支控制相关开始-----//
export let resetHosts = (hosts) => {
	return {
		type: RESET_HOSTS,
		hosts
	};
};

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

export let toggleGroupDis = (id) => {
	return {
		type: TOGGLE_BRANCH_DIS,
		id
	};
};

export let toggleBranchDis = (groupId, id) => {
	return {
		type: TOGGLE_GROUP_DIS,
		groupId,
		id
	};
};

export let fetchSucc = ()=> {
	return {
		type: FETCH_SUCC
	};
};

export let fetchFail = ()=> {
	return {
		type: FETCH_FAILURE
	};
};
// ------分支控制相关结束-----//

//初次获取数据
export let fetchData = (fetchUrl) => {
	return {
		type: FETCH,
		fetchUrl,
		promise: new Promise(function(resolve, reject) {
			window.setTimeout(() => {
				resolve({
					hosts: [{
						name: "caipiao",
						branch: [{
							name: "test1",
							rules: [{
								test: /test/,
								exec: ""
							}]
						}],
					}, {
						name: "guobao",
						branch: [],
					}]
				});
			}, 300);
		})
	};
};

//切换左侧列表的显示状态
export let drawerStatus = () => {
	return {
		type: DRAWERSTATUS
	};
};
