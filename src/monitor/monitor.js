import log from '../log';
import fse from 'fs-extra';
import fs from 'fs';
import Promise from 'promise';
import merge from 'merge';
import isbinaryfile from 'isbinaryfile';
import crypto from 'crypto';
import {cacheFile} from './cacheFile';
import {isBinary, getReqType, isImage} from '../dataHelper';
import {addMonitor, updateMonitor} from '../ws/sendMsg';
import {weinreId} from '../tools';
import * as config from '../config/config';
import {WEINRE_PATH} from '../config/defCfg';
// 当前监控数据-- 记录文件的url和 resBodyData的文件生成的md5值
var monitorList = {};
const resBodyName = "_res_body_";
// 处理mulitpartData
/** 数据格式
 * multipart/form-data; boundary=----WebKitFormBoundaryAxMpx9qwQiovE99R 659
		content-- ------WebKitFormBoundaryAxMpx9qwQiovE99R
		Content-Disposition: form-data; name="fileName"

		说明.txt
		------WebKitFormBoundaryAxMpx9qwQiovE99R
		Content-Disposition: form-data; name="gameId"

		2010110218YX22859517
		------WebKitFormBoundaryAxMpx9qwQiovE99R
		Content-Disposition: form-data; name="formatType"

		1
		------WebKitFormBoundaryAxMpx9qwQiovE99R
		Content-Disposition: form-data; name="period"
		61202
		------WebKitFormBoundaryAxMpx9qwQiovE99R
		Content-Disposition: form-data; name="uploadFile"; filename="说明.txt"
		Content-Type: text/plain

		xbmcRemote Զ�̿��� kodi������


		homido ����ͷ������
		------WebKitFormBoundaryAxMpx9qwQiovE99R--
 */
let detailMultipartData = function(contentType, bodyData) {
	contentType = contentType || "";
	var key  = contentType.toLowerCase().split("boundary=");
	if (key && key.length > 0) {
		let reg = /Content-Disposition\s*:\s*form-data;.+;\s*filename=.*/gi;
		let isContentType = /^Content-Type.*/i;
		key = key[1];
		let data = bodyData.toString().split("\n");
		let newData = [];
		let l = data.length;
		let s = null;
		let j = null;
		if (l) {
			for (let i = 0; i < l; i++) {
				let current = data[i] || "";
				if (reg.test(current)) {
					s = true;
				}
				if (s) {
					if (!j) {
						newData.push(current);
					}
					if (isContentType.test(current)) {
						j = true;
					}
					if (current.indexOf(key) > -1) {
						j = null;
						s = null;
						newData.push(current);
					} 
				} else {
					newData.push(current);
				}
			}
		}
		return newData.join('\n');
	}
};

export default function(catproxy) {
	if (!catproxy || !catproxy.onBeforeReq) {
		throw new Error("catproxy是必须得");
	}
	var monitorBeforeReq,
		monitorBeforeRes,
		monitorAfterRes;
	// 检测是不是本地的一个服务器
	// 只要ip是localhost ui服务器 或者是weinre的请求就忽略
	let checkIsInnerServer = (originalUrl) => {
		return catproxy.localUiReg.test(originalUrl) || originalUrl.toLowerCase().indexOf(WEINRE_PATH + "/" + weinreId) >= 0;
	};
	// 请求发送前
	monitorBeforeReq = (result) => {
		if (result && result.id && config.get('monitor:monitorStatus') && !checkIsInnerServer(result.originalUrl)) {
			/**
			 * 
			 * 目前没有把请求数据直接保存到文件，后期可以考虑
				请求头部数据一共三种，一种是  post提交数据 一种是  get提交数据， 还有一种是表单提交数据，表单提交数据如果带 二进制就存储，否则直接返回
				contentType 的三种情况
				application/x-www-form-urlencoded	在发送前编码所有字符（默认）// 转换成 form data   & 符号链接的数据，   <xml 数据  等等， 直接返回json ？？？
				text/plain	空格转换为 "+" 加号，但不对特殊字符编码。		// 转换成form data  任意不是二进制的数据 -- 可以检查  是不是{}或者 []开始判断是不是json
				上面2种类似
				multipart/form-data	不对字符编码。在使用包含文件上传控件的表单时，必须使用该值。 去掉二进制数据转换  multipart request payload
				
			**/	
			let contentType = result.headers['content-type'];
			let addMontiorData = {
				id: result.id,
				name: result.originalFullUrl,
				protocol: result.protocol,
				method: result.method,
				reqHeaders: result.headers,
				startTime: result.startTime
			};
			if (result.ruleInfo) {
				addMontiorData.reqRuleInfo = result.ruleInfo;
			}
			let bodyData = result.bodyData;
			if (result.bodyData) {
				let isb = isBinary(result.bodyData);
				addMontiorData.isReqBinary = isb;
				if (isb) {
					if (contentType) {
						// 混合流，里面有二进制的文件数据也有 字段数据，需要解析下
						if (contentType.indexOf('boundary=') > -1) {
							bodyData = detailMultipartData(contentType, bodyData);
						} else {
							// 不认识的二进制数据忽略
							bodyData = "二进制数据!!!";
						}
					} else {
						bodyData = "二进制数据!!!";
					}
				}
				addMontiorData.reqBodyData = (bodyData || "").toString();
				// log.debug(contentType, "************\n" ,result.bodyData.length, "**************\n", result.originalFullUrl);
				// log.debug("isBinary", isb);
				// log.debug('content--', addMontiorData.bodyData);
				// 先记录到缓存中
				monitorList[result.id] = addMontiorData;
			}
		}				
	};
	// 准备发送请求
	monitorBeforeRes = result => {
		if (result && result.id && config.get('monitor:monitorStatus') && !checkIsInnerServer(result.originalUrl)) {
			let addMontiorData = merge(monitorList[result.id], {
				ext: result.ext,
				resHeaders: result.headers,
				serverIp: result.serverIp
			});
			let type = getReqType(addMontiorData, result.ext) || "other";
			addMontiorData.type = type;
			// 当所有用户调用结束在看是否是二进制数据
			result.isBinary = isBinary(result.bodyData);
			addMontiorData.isResbinary = result.isBinary;
			// 修改缓存数据
			monitorList[result.id] = {
				startTime: addMontiorData.startTime
			};
			// startTime不需要传递到前端
			delete addMontiorData.startTime;
			// 调用数据增加
			addMonitor(addMontiorData);				
		}
	};
	// 请求发送后
	monitorAfterRes = result => {
		if (result && +result.id && config.get('monitor:monitorStatus') && !checkIsInnerServer(result.originalUrl)) {
			if (monitorList[result.id]) {
				let startTime = monitorList[result.id].startTime;
				let {bodyData} = result;
				let fileName;
				let resBodyData;
				if (bodyData && bodyData.length) {
					let contentType = result.headers['content-type'];
					// 是二进制数据并且是图片，或者不是二进制数据
					if (!result.isBinary || (result.isBinary && isImage.test(contentType))) {
						let md5 = crypto.createHash('md5');
						md5.update(bodyData);
						fileName = md5.digest('hex');
						fileName = resBodyName + fileName;
						// 缓存文件
						cacheFile(fileName, bodyData);
					} else {
						resBodyData = "二进制数据!!!";
					}
				} else {
					if (result.bodyDataErr) {
						resBodyData = result.bodyDataErr;
					} else {
						// 可能是 302，等请求没有响应内容
						resBodyData = "";
					}
				}
				let updateData = {
					id: result.id,
					time: result.endTime - startTime,
					status: result.statusCode,
					size: bodyData ? bodyData.length : 0,
				};
				if (result.charset) {
					updateData.resCharset = result.charset;
				}
				if (fileName) {
					updateData.resBodyDataId = fileName;
				}
				if (resBodyData !== undefined) {
					updateData.resBodyData = resBodyData;
				}
				delete monitorList[result.id];
				updateMonitor(updateData);
			}
		}
	};
	// 动态添加到数组中，因为这些方法在用户调用 on事件后才能被调用
	catproxy.__monitorBeforeReq = monitorBeforeReq;
	catproxy.__monitorBeforeRes = monitorBeforeRes;
	catproxy.__monitorAfterRes = monitorAfterRes;
	// 管道调用
	catproxy.onPipeRequest(result => {
		// 后面判断带得协议不准确，但是仅仅是为了通过正则，测试，正则中并不关系，请求的类型是ws还是wss
		if (result && result.id && config.get('monitor:monitorStatus') && !checkIsInnerServer(`ws://${result.host}`)) {
			let addMontiorData = {
				id: result.id,
				name: (result.host || "").split(":")[0],
				protocol: result.protocol,
				method: "CONNECT",
				time: "-",
				status: 200,
				size: 0,
				type: result.protocol === 'ws' || result.protocol === 'wss' ? "ws" : "other"
			};
			// 调用数据增加
			addMonitor(addMontiorData);
		}
	});
};



