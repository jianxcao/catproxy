import actionType from "./action-type";
import sendMsg from '../../ws/sendMsg';
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
	ADD_RULE,
	DEL_RULE,
	TOGGLE_RULE_DIS,
	UPDATE_RULE,
	TOGGLE_FLOD,
	SWITCH_BRANCH,
	SWITCH_GROUP,
	SWITCH_RULE,
	UPDATE_CURRENT_RULE,
	DIS_CACHE,
	CACHE_FLUSH,
	REMOTE_UPDATE_RULE_URL
} = actionType;

// ------分支控制相关开始-----//
export let disableAll = () => {
	return {
		type: DISABLE_ALL
	};
};

export let resetHosts = (hosts) => {
	return {
		type: RESET_HOSTS,
		hosts
	};
};

export let addBranch = (groupId, groupName, name) =>{
	return {
		type: ADD_BRANCH,
		groupId,
		groupName,
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
// status为undefined或者null取反原来的状态
export let toggleGroupDis = (id, status) => {
	return {
		type: TOGGLE_GROUP_DIS,
		id,
		status
	};
};
// status为undefined或者null取反原来的状态
export let toggleBranchDis = (groupId, id, status) => {
	return {
		type: TOGGLE_BRANCH_DIS,
		groupId,
		id,
		status
	};
};

export let fetchSucc = (data) => {
	return {
		data,
		type: FETCH_SUCC
	};
};

export let fetchFail = (error) => {
	return {
		error,
		type: FETCH_FAILURE
	};
};
// ------分支控制相关结束-----//

// 初次获取数据
export let fetchRule = () => {
	return {
		type: FETCH,
		promise: sendMsg.fetchConfig()
	};
};

// 切换左侧列表的显示状态
export let drawerStatus = (status) => {
	return {
		type: DRAWERSTATUS,
		status
	};
};


// 规则相关 -----------------------
// 新增规则
export let addRule = (groupId, branchId, rule) => {
	return {
		type: ADD_RULE,
		groupId,
		branchId,
		rule
	};
};

// 删除规则
export let delRule = (groupId, branchId, ruleId) => {
	return {
		type: DEL_RULE,
		groupId,
		branchId,
		ruleId
	};
};

// 禁止使用规则
export let toggleRuleDis = (groupId, branchId, ruleId) => {
	return {
		type: TOGGLE_RULE_DIS,
		groupId,
		branchId,
		ruleId
	};
};

// 更新规则
export let updateRule = (groupId, branchId, ruleId, rule) => {
	return {
		type: UPDATE_RULE,
		groupId,
		branchId,
		ruleId,
		rule
	};
};

// 切换 折叠
export let toggleFlod = (groupId) => {
	return {
		type: TOGGLE_FLOD,
		groupId
	};
};

// 换组或者 分支的顺序
export let switchBranch = (groupId, sourceBranchId, branchId) => {
	return {
		type: SWITCH_BRANCH,
		groupId,
		sourceBranchId,
		branchId
	};
};

// 只能是同一个分组下的顺序
export let switchGroup = (sourceGroupId, groupId) => {
	return {
		type: SWITCH_GROUP,
		groupId,
		sourceGroupId
	};
};

// 切换规则
export let switchRule = (groupId, branchId, sourceId, id) => {
	return {
		type: SWITCH_RULE,
		groupId,
		branchId,
		sourceId,
		id
	};
};

// 更新当前选中的规则
export let updateSelectRule = (groupId, branchId) => {
	return {
		type: UPDATE_CURRENT_RULE,
		groupId,
		branchId
	};
};


// 禁止缓存
export let disCache = (status) => {
	return {
		type: DIS_CACHE,
		status
	};
};

// 禁止缓存
export let cacheFlush = (status) => {
	return {
		type: CACHE_FLUSH,
		status
	};
};

// 远程url
export let remoteUpdateRuleUrl = (url) => {
	return {url, type: REMOTE_UPDATE_RULE_URL};
};
