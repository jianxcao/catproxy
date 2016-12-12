/**
 * websocket通讯入口
 * 
 *  所有接受到得消息是一个Object
 * 
 * {
 * 	path: "数据访问路径，相同type下的不同逻辑处理可以用不同的path"
 * 	param: "请求参"
 * }
 * 
 *
 * 所有发出的消息是一个Object
 * 
 * data:{
 * 	//当前请求的状态，如果不是100表示出现错误了
 * 	status: 100,
 * 	result: {'当前返回的数据'}
 * }
 * 
 */
import Promise from 'promise';
import skt from 'socket.io';
import log from '../log';
import * as receiveMsg from './receiveMsg';
import * as receiveType from './receiveType';
import webCfg from '../config/webCfg';
import monitor from '../monitor/monitor';
import sendMsg from './sendMsg';
var wss;

// 方法分发
// 会根据receiveType中定义的不同类型调用不同的事件，每个事件的方法就是receiveType的键
// 方法有三个参数message(当前客户端的消息)， ws(当前的client连接), wss (io对象)
// 方法返回值 可以是promise或者 值，如果返回值为空，则不会给客户端回写值
let recive = (ws, evtType) => {
	ws.on(receiveType[evtType], (message, callback) => {
		log.verbose('收到消息, 消息类型: ' + receiveType[evtType]);
		let method = receiveMsg[evtType];
		let result = null;
		if (method) {
			// 调用定义的方法
			result = method(message, ws, wss);
			// 需要向客户端返回结果
			if (result) {
				// 返回的是一个promise
				if (result.then) {
					result.then(msg => msg && callback(msg), msg => msg && callback(msg));
				} else {
					callback(result);
				}
			}
		} else {
			log.warn(`消息${receiveType[evtType]}查找执行方法失败`);
		}
	});
};

// 将接受到的消息映射到 receiveMsg中去处理
let distributeReciveMethod = () => {
	// 有新的客户端建立链接
	// 所有请求都在catproxy下
	wss.of(webCfg.wsPath).on('connection', (ws) => {
		for(let type in receiveType) {
			recive(ws, type);
		}
	});
};

export default (server, catproxy) => {
	if (wss) {
		return Promise.resolve(wss);
	}
	if (!server) {
		return Promise.reject('must have server');
	}
	return new Promise(resolve => {
		wss = skt(server);
		wss.on('error', (err)=> {
			log.info('err io', err);
		});
		// 初始化监控
		monitor(catproxy);
		distributeReciveMethod();
		// 初始化sendMsg
		sendMsg(wss.of(webCfg.wsPath));
		resolve(wss);
	});
};
