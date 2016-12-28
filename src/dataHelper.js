import zlib from 'zlib';
import log from './log';
import {Buffer} from 'buffer';
import mime from 'mime';
import iconv from 'iconv-lite';
import isbinaryfile from 'isbinaryfile';
import path from 'path';
// <meta charset="gb2312">
// <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
var checkMetaCharset = /<meta(?:\s)+.*charset(?:\s)*=(?:[\s'"])*([^"']+)/i;

export const isFont = /(^font\/.+)|(^application\/x-font.+)|(^application\/font.+)/;
export const isDataUrl = /^data:.+/;
export const isImage = /^image\/.+/;
export const isMedia = /(^video\/.+)|(^audio\/.+)/;
// 解压数据
export const decodeCompress = (bodyData, encode) =>{
	if (!Buffer.isBuffer(bodyData) || !encode) {
		return Promise.reject(bodyData);
	}
	return new Promise(function(resolve, reject) {
		// 成功的取到bodyData
		let isZip = /gzip/i.test(encode);
		let isDeflate = /deflate/i.test(encode);
		if (isZip) {
			zlib.gunzip(bodyData, function(err, buff) {
				if (err) {
					log.error(err);
					reject('decompress err: ', err.message);
				} else {
					resolve(buff);
				}
			});
		} else if(isDeflate) {
			zlib.inflateRaw(bodyData, function(err, buff) {
				if (err) {
					log.error(err);
					reject('decompress err: ', err.message);
				} else {
					resolve(buff);
				}
			});
		} else {
			reject("未知的编码");
		}
	});
};

export const isBinary = (buffer) => {
	let data;
	if (Buffer.isBuffer(buffer)) {
		let l = Math.min(512, buffer.length);
		data = new Buffer(l);
		buffer.copy(data, 0, 0, l);
		return isbinaryfile.sync(data, l);
	} else if (typeof buffer === 'string') { // 通过文件名称判断是否是buffer
		return false;
	}
	return false;
};

export const getCharset = (resInfo) => {
	let charset = 'UTF-8';
	let contentType = resInfo.headers['content-type'] || "";
	let ext = resInfo.ext;
	
	// 在取一次编码
	if(contentType) {
		// 如果contenttype上又编码，则重新设置编码
		let tmp = contentType.match(/charset=([^;]+)/);
		if (tmp && tmp.length > 0) {
			charset = tmp[1].toUpperCase();
			return charset;
		}
	}
	// gbk  gb2312文件编码怎么解析？？
	return charset;
};

// 根据请求获取请求的类型主要类型在 config/configProps 下地  monitorType
export const getReqType = (result) => {
	let contentType = result.resHeaders['content-type'] || "";
	let type = "other";
	let ext = result.ext;
	if(result.reqHeaders['x-requested-with']) {
		type = 'xhr';
	} else if (isImage.test(contentType)) {
		type = 'img';
	} else if (contentType === 'text/cache-manifest') {
		type = "mainifest";
	} else if (result.protocol === "ws" || result.protocol == "wss") {
		type = "ws";
	} else if (isFont.test(contentType) || ext === 'ttf' || ext ==='woff' ) { // svg不能算是字体文件，因为svg可能是别的文件
		// font/woff2  application/x-font-ttf 2种都是font
		type = "font";
	} else if (ext === 'js' || ext === 'jsx' || ext === 'es6'|| ext === 'json' || ext === 'map') {
		type = "js";
	} else if (ext === 'css' || ext === 'less' || ext === "sass") {
		type = "css";
	} else if (isMedia.test(contentType)) { // 视频 ，音频
		type = "media";
	} else if (ext === "xhtml" || ext === "html" || ext === "hltm") {
		type = "doc";
	}
	return type;
};

/**
 *  解码数据--- 暂时无用
 */
var decodeContent = (resInfo) => {
	let bodyData = resInfo.bodyData;
	let contentType = resInfo.headers['content-type'] || "";
	return Promise.resolve(bodyData)
	.then(function(bodyData) {
		// 默认编码是utf8
		let charset = 'UTF-8', tmp;
		let ext = resInfo.ext;
		// 在取一次编码
		if(contentType) {
			// 如果contenttype上又编码，则重新设置编码
			tmp = contentType.match(/charset=([^;]+)/);
			if (tmp && tmp.length > 0) {
				charset = tmp[1].toUpperCase();
			}
		}
		if (Buffer.isBuffer(bodyData)) {
			// 其他编码先尝试用 iconv去解码
			if (charset !== 'UTF-8' && iconv.encodingExists(charset)) {
				bodyData = iconv.decode(bodyData, charset);
				// 如果是一个文档，在取一次编码
			} else if(contentType &&  (ext === 'html' || ext === 'htm')) {
				let strBodyData = bodyData.toString();
				// 在内容中再次找寻编码
				let tmp = strBodyData.match(checkMetaCharset);
				if (tmp && tmp[1]) {
					tmp[1] = tmp[1].toUpperCase();
					if (tmp[1]!== "UTF-8" && iconv.encodingExists(tmp[1])) {
						charset = tmp[1];
						bodyData = iconv.decode(bodyData, tmp[1]);
					} else {
						bodyData = strBodyData;
					}
				} else {
					bodyData = strBodyData;
				}
			} else {
				bodyData = bodyData.toString();
			}
		}
		// 再次加编码传递到页面
		return {
			bodyData,
			charset
		};
	});
};
