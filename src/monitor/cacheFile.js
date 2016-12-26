import log from '../log';
import fse from 'fs-extra';
import fs from 'fs';
import path from 'path';
import Promise from 'promise';
import merge from 'merge';
import isbinaryfile from 'isbinaryfile';
import crypto from 'crypto';
/**
 * 检测文件是否存在
 */
export let checkFileExits = (filePath) => {
	return new Promise((resolve, reject) => {
		fs.stat(filePath, (err, exits) => {
			if (err) {
				if (err.code === 'ENOENT') {
					// 文件不存在
					return resolve(false);
				} else {
					// 其他错误
					reject(err);
				}
			} else {
				// 文件存在
				resolve(true);
			}
		});
	});
};
export let saveFile = (filePath, data) => {
	return new Promise((resolve, reject) => {
		fse.outputFile(filePath, data, function(err) {
			if (err) {
				return reject(err);
			}
			return resolve(filePath);
		});	
	});
};
/**
 * 缓存文件
 */
export let cacheFile = async (filePath, data) => {
	let status = await checkFileExits(filePath);
	if (status) {
		return filePath;
	} else {
		return await saveFile(filePath, data);
	}
};
