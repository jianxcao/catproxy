import {keymirror as km} from "../util";
let result;
export const {
	// 禁止缓存
	DIS_CACHE,
	// 刷新缓存
	CACHE_FLUSH,
	// 录制状态
	MONITOR_STATUS,
	// 过滤器显示隐藏状态
	MONITOR_FILTER_STATUS
} = result = km([
	// 禁止缓存
	"DIS_CACHE",
	// 刷新缓存
	"CACHE_FLUSH",
	// 录制状态
	"MONITOR_STATUS",
	// 过滤器显示隐藏状态
	"MONITOR_FILTER_STATUS"
]);
export default result;
