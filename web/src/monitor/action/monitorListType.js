import {keymirror as km} from "../util";
let result;
export const {
	// 增加数据
	ADD_MONITOR_LIST,
	// 更新list中得一些数据字段
	UPDATE_MONITOR_LIST,
	// 过滤器显示隐藏状态
	CLEAR_MONITOR_LIST,
	// 当前打开详情的数据
	CUR_CON_DETAIL_DATA
} = result = km([
	// 禁止缓存
	"ADD_MONITOR_LIST",
	// 录制状态
	"UPDATE_MONITOR_LIST",
	// 过滤器显示隐藏状态
	"CLEAR_MONITOR_LIST",
	// 当前打开详情的数据
	"CUR_CON_DETAIL_DATA"
]);
export default result;
