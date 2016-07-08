// export
"use strict";
//默认类型为http
export const DEFAULT_TYPE = 'http';
//默认代理端口为 8888
export const DEFAULT_PORT = 8888;
//https服务器启动时候需要的证书
export const  DEFAULT_HOST = "localhost";
export const DEFAULT_CRACK_HTTPS = true;
//默认配置
export default {
	type: DEFAULT_TYPE,
	port: DEFAULT_PORT,
	host: DEFAULT_HOST,
	crackHttps: DEFAULT_CRACK_HTTPS
};
