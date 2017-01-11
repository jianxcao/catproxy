import weinre from 'weinre';
import {localIps} from './getLocalIps';
import {Buffer} from 'buffer';
import path from 'path';
import * as config from './config/config';
import iconv from 'iconv-lite';
import {weinreId} from './tools';

// weinre下这个方法有问题，重写成系统默认的
Error.prepareStackTrace  =  undefined;

var server;
const headReg = /<head>|<head\s[^<]*>/gi;
const createServer = function(port) {
	port = +port;
	return new Promise(function(resolve, reject) {
		let weinreServer = weinre.run({
			httpPort: port,
			boundHost: '-all-',
			verbose: false,
			debug: false,
			readTimeout: 5,
			deathTimeout: 15
		});
		weinreServer.___port = port;
		server = weinreServer;
		weinreServer.on('listening', function() {
			resolve(weinreServer);
		});
	});
};
// 创建werinre 服务器
export const weinreServer = async function() {
	if (server) {
		return server;
	} else {
		return createServer(config.get('weinrePort'));
	}
};

/**
 * 管道调用
 */
let getScriptStr = (baseUrl) => (match) => {
	let port = (server || {}).___port || "";
	let ip = localIps[0];
	return match + `
		<script>window.WeinreServerURL="${baseUrl}/${weinreId}/"</script>
		<script src="${baseUrl}/${weinreId}/target/target-script-min.js#anonymous"></script>
		`;
};
/**
 * 插入weinre代码
 */
export let insertWeinreScript = async function(data = "", charset = "UTF-8", baseUrl = "") {
	let strData = iconv.decode(data, charset);
	if (headReg.test(strData)) {
		if (!server) {
			let server = await weinreServer();
		}
		return iconv.encode(strData.replace(headReg, getScriptStr(baseUrl)), charset);
	}
	return data;
};
