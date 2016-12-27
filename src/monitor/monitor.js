import log from '../log';
import fse from 'fs-extra';
import fs from 'fs';
import path from 'path';
import Promise from 'promise';
import merge from 'merge';
import isbinaryfile from 'isbinaryfile';
import crypto from 'crypto';
import {cacheFile} from './cacheFile';
import {isBinary, getReqType} from '../dataHelper';
import {addMonitor, updateMonitor} from '../ws/sendMsg';
import * as config from '../config/config';
// 当前监控数据-- 记录文件的url和 resBodyData的文件生成的md5值
var monitorList = {};
export const fileCache = path.resolve('./fileCache');
const resBodyName = "_res_body_";
// 数据库缓存大小
// 确定db目录存在
fse.ensureDirSync(fileCache);
// 清空db目录
fse.emptyDirSync(fileCache);




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
	// 检测是不是本地的一个服务器
	// 只要ip是localhost就忽略
	let checkIsInnerServer = (originalUrl) => {
		return catproxy.localUiReg.test(originalUrl);
	};
	// 请求发送前
	catproxy.onBeforeReq((result) => {
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
							bodyData = "";
						}
					} else {
						bodyData = "";
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
	});
	// 准备发送请求
	catproxy.onBeforeRes(result => {
		if (result && result.id && config.get('monitor:monitorStatus') && !checkIsInnerServer(result.originalUrl)) {
			let addMontiorData = merge(monitorList[result.id], {
				ext: result.ext,
				resHeaders: result.headers,
				serverIp: result.serverIp
			});
			let type = getReqType(addMontiorData, result.ext) || "other";
			addMontiorData.type = type;
			addMontiorData.isResinary = result.isBinary;
			// 修改缓存数据
			monitorList[result.id] = {
				startTime: addMontiorData.startTime
			};
			// startTime不需要传递到前端
			delete addMontiorData.startTime;
			// 调用数据增加
			addMonitor(addMontiorData);				
		}
	});
	// 请求发送后
	catproxy.onAfterRes(result => {
		if (result && +result.id && config.get('monitor:monitorStatus') && !checkIsInnerServer(result.originalUrl)) {
			if (monitorList[result.id]) {
				let startTime = monitorList[result.id].startTime;
				let {bodyData} = result;
				let fileName;
				if (bodyData && bodyData.length) {
					let md5 = crypto.createHash('md5');
					md5.update(bodyData);
					fileName = md5.digest('hex');
					fileName = resBodyName + fileName;
					cacheFile(path.resolve(fileCache, fileName), bodyData)
					.then(fileName => {
						// 修改缓存数据
						monitorList[result.id] = {
							_cacheName: fileName
						};
					});
				}
				let updateData = {
					id: result.id,
					time: result.endTime - startTime,
					status: result.statusCode,
					size: bodyData ? bodyData.length : 0,
					resBodyDataId: fileName
				};
				updateMonitor(updateData);
			}
		}
	});

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



