import getHttpsSer from './httpsProxySer';
import Promise from 'promise';
import util from 'util';
import log from './log';
let servers = {length: 0};
let serversPromise = {};

export default (serverName, callBack) => {
	if (util.isFunction(serverName)) {
		callBack = serverName;
		serverName = undefined;
	}
	// 不传递servername则用sni
	if (!serverName) {
		serverName = 'localhost';
	}
	if (servers[serverName]) {
		return Promise.resolve(servers[serverName]);
	} else {
		serversPromise[serverName] = serversPromise[serverName] || getHttpsSer(serverName, callBack)
		.then((info) => {
			servers[serverName] = info;
			servers['length'] += 1;
			log.debug("当前代理服务器数据：" + servers.length);
			delete serversPromise[serverName];
			return info;
		});
		return serversPromise[serverName];
	}

};
