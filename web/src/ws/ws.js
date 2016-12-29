import io from 'socket.io-client';
import * as reciveType from './reciveType';
import * as reciveMsg from './reciveMsg';
import * as sendType from './sendType';
import * as status from './status';
var ws, myMessage;
var env = window.config.env;
// 处理收到的事件
// 接受处理
let distributeReciveMethod = (ws) => {
	for (let type in reciveType) {
		ws.on(reciveType[type], message => {
			console.log('收到服务器端消息，消息类型: ' + reciveType[type]);
			if (reciveMsg[type]) {
				reciveMsg[type](message, ws);
			} else {
				console.warn('收到消息后，没找到合适的处理方法: ' + reciveType[type]);
			}
		});		
	}
};
export default myMessage = () => {
	if (ws) {
		return Promise.resolve(ws);
	}
	ws = io.connect(window.config.wsServerUrl);

	return new Promise((resolve)=> {
		ws.once('connect', function () {
			distributeReciveMethod(ws);
			resolve(ws);
		});
		
		ws.on('connect_timeout', ()=> {
			console.log('connect_timeout');
		});
		
		ws.on('reconnecting', ()=> {
			console.log('reconnecting');
		});
		
		ws.on('connect_error', () => {
			console.log('connect error');
		});
		
		ws.on('close', () => {
			ws = null;
			console.log('ws关闭'); 
		});

		ws.on('error', err => console.error(err));
	});
};
/**
 * 高阶函数send 调用是 send(事件类型)(发送数据)
 * 如果有返回数据会直接promise返回数据
 * @param  {[type]} type) [description]
 * @return {[type]}       [description]
 *  * data:{
 * 	//当前请求的状态，如果不是100表示出现错误了
 * 	status: 100,
 * 	result: {'当前返回的数据'}
 * }
 */
export let send = (type) => (data) => {
	return myMessage().then(ws => {
		return new Promise((resolve, reject) => {
			// 服务器链接失败
			if (ws.disconnected) {
				return reject({
					status: status.ERROR,
					result: "服务器歇菜了，赶紧去看一眼把"
				});
			}
			console.log('向服务器发送请求, 请求类型' + sendType[type]);
			ws.emit(sendType[type], data, message => {
				console.log('收到服务器端消息，消息类型: ' + sendType[type]);
				if (message.status === status.SUCC) {
					resolve(message);
				} else {
					reject(message);
				}
			});
		});
	});
};
