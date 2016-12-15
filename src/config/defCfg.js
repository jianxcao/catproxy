// export
'use strict';
// 默认类型为http
export const DEFAULT_TYPE = 'http';
// 默认代理端口为 8888
export const DEFAULT_PORT = 80;
export const DEFAULT_HTTPS_PORT = 443;
export const DEFAULT_UI_PORT = 8001;
// https服务器启动时候需要的证书
export const  DEFAULT_CERT_HOST = 'localhost';
export const DEFAULT_BREAK_HTTPS = true;
export const LIMIT_SIZE = 1024 * 1024 * 1;
export const SIN = 1;
// 自动打开管理界面
export const AUTO_OPEN = true;
export const STATUS = {
	// request错误
	LIMIT_ERROR: 1
};
// 录制状态
export const MONITOR_STATUS = true;
// 录制过滤状态
export const MONITOR_FILTER_STATUS = true;
// 录制类型
export const MONITOR_FILTER_TYPE =  "all";
// 隐藏显示 dataurl
export const HIDDEN_DATA_URL = false;
// 默认配置
export default {
	type: DEFAULT_TYPE,
	port: DEFAULT_PORT,
	httpsPort: DEFAULT_HTTPS_PORT,
	certHost: DEFAULT_CERT_HOST,
	breakHttps: DEFAULT_BREAK_HTTPS,
	uiPort: DEFAULT_UI_PORT,
	autoOpen: AUTO_OPEN,
	sni: SIN,
	monitor: {
		monitorStatus: MONITOR_STATUS,
		monitorFilterStatus: MONITOR_FILTER_STATUS,
		monitorFilterType: MONITOR_FILTER_TYPE,
		hiddenDataUrl: HIDDEN_DATA_URL		
	}
};

