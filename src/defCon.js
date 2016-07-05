// export
// export
"use strict";
//默认类型为http
export const DEFAULT_TYPE = 'http';
//默认代理端口为 8888
export const DEFAULT_PORT = 8888;
export const DEFAULT_HTTP_PORT = 80;
export const DEFAULT_HTTPS_PORT = 443;
//默认模式为 host模式 还有proxy模式(代理模式)
export const DEFAULT_MODEL = "proxy";
//默认配置
export default {
	type: DEFAULT_TYPE,
	port: DEFAULT_PORT,
	httpPort: DEFAULT_HTTP_PORT,
	httpsPort: DEFAULT_HTTPS_PORT,
	model: DEFAULT_MODEL
};
