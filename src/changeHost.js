// 针对访问如果是 访问的本机，死循环，则切换host如果切换失败就返回失败
import ip from 'ip';
import net from 'net';
import dns from 'dns';
import Promise from 'promise';
import {localIps} from './getLocalIps';
export default (hostname, isServerPort) => {
	if (net.isIP(hostname)) {
		return Promise.resolve(hostname);
	}
	//取当前启动的port
	return new Promise((resolve, reject) => {
		dns.lookup(hostname, (err, address) => {
			if (err || !address) {
				reject(err || '为找到合适的ip');
			} else {
				resolve(address);
			}
		});
	})
	.then(visitIp => {
		return new Promise((resolve, reject) => {
			//是一个本地的ip
			if (ip.isPrivate(visitIp)) {
				//如果解析的ip和当前服务器开的ip一样
				if (localIps.some(current => ip.isEqual(current, visitIp)) && isServerPort) {
					dns.resolve(hostname, function(err, addresses) {
						if (err || !addresses || !addresses.length) {
							reject(err.code || " 为找到合适的ip");
						} else {
							resolve(addresses[0]);
						}
					});
				} else {
					resolve(visitIp);
				}
			} else {
				 resolve(visitIp);
			}
		});
	});
};
