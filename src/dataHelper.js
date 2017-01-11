import zlib from 'zlib';
import log from './log';
import {Buffer} from 'buffer';
import mime from 'mime';
import iconv from 'iconv-lite';
import isbinaryfile from 'isbinaryfile';
import path from 'path';
import betuify from 'js-beautify';
import Promise from 'promise';
// <meta charset="gb2312">
// <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
var checkMetaCharset = /<meta(?:\s)+.*charset(?:\s)*=(?:[\s'"])*([^"']+)/i;
export const isJSONStr = /(^(?:\s*\[)[\s\S]*(?:\]\s*)$|(^(?:\s*\{)[\s\S]*(?:\}\s*)$))/;
export const isFont = /(^font\/.+)|(^application\/x-font.+)|(^application\/font.+)/;
export const isXml =/^\s*\<\?xml.*/;
export const isDataUrl = /^data:.+/;
export const isImage = /^image\/.+/;
export const isMedia = /(^video\/.+)|(^audio\/.+)/;
// 这么判断并不准确，最好是用ast，语法树，但是怕性能有问题，就用这个了
// ()中间的参数并不匹配??
export const isJSONP = /^\s*[a-zA-Z$_]+[\w$]*\s*\(([\s\S]*)(\)|(?:\)[\s;]*))$/;

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
	let headers = result.reqHeaders;
	let ext = result.ext;
	if(headers['x-requested-with']) {
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

const supportEncode = ["UTF-8", "GBK", "GB2312", "UTF8"];
const supportBetuifyType = {
	js: ["javascript", "js", "es6", "jsx", "json", "jsonp"],
	css: ["css", "less", "scass"],
	html: ["html", 'htm', "ejs"]
};
/**
 * 按照指定格式美化代码 js-betuify
 */
export let betuifyCode = function(code, ext) {
	let some = current => ext === current;
	let is = "";
	for (let type in supportBetuifyType) {
		if (supportBetuifyType[type].some(some)) {
			is = type;
			break;
		}
	}
	if (is === 'js') {
		return betuify(code);
	} else if (is === 'css') {
		return betuify.css(code);
	} else if (is === 'html') {
		return betuify.html(code);
	} else {
		return code;
	}
};

export let updateExt = function(ext, contentType, data = "") {
	if (isJSONStr.test(data)) {
		return "json";
	} else if (isJSONP.test(data)) {
		return "jsonp";
	} else if (isXml.test(data)) {
		return 'xml';
	}
	return ext;
};
/**
 * 按照指定编码解码文件
 * 
 */
export let decodeData = (data, charset = "utf8") => {
	return new Promise(function(resolve, reject) {
		let is = supportEncode.some(cur => charset.toUpperCase() === cur);
		if (!is) {
			reject("不支持当前的编码方式：" + charset);
		}
		try {
			resolve(iconv.decode(data, charset));
		} catch(e) {
			reject("解码数据出错");
		}
	});
};
