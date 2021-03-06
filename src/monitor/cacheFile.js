import log from '../log';
import fse from 'fs-extra';
import fs from 'fs';
import path from 'path';
import Promise from 'promise';
import merge from 'merge';
import crypto from 'crypto';
import os from 'os';
//  放到临时目录中
export const fileCache = path.join(os.tmpdir(), './catproxy.cache.fileCache');
// 数据库缓存大小
// 确定db目录存在
fse.ensureDirSync(fileCache);
// 清空db目录
fse.emptyDirSync(fileCache);

/**
 * 检测文件是否存在
 */
let checkFileExits = filePath => {
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
let saveFile = (filePath, data) => {
	return new Promise((resolve, reject) => {
		fs.writeFile(filePath, data, function(err) {
			if (err) {
				return reject(err);
			}
			return resolve(filePath);
		});
	});
};
/**
 * 缓存文件
 * id 文件名称
 */
export let cacheFile = async (id, data) => {
	let filePath = path.resolve(fileCache, id);
	let status = await checkFileExits(filePath);
	if (status) {
		return filePath;
	} else {
		return await saveFile(filePath, data);
	}
};
/**
 * id 文件名称
 * encode指定编码打开文件
 */
export let getCacheFile = id => {
	return new Promise(function(resolve, reject) {
		let filePath = path.resolve(fileCache, id);
		fs.readFile(filePath, (err, data) => {
			if (err) {
				reject(err.message);
			}
			resolve(data);
		});
	});
};

process.on('beforeExit', () => {
	fse.removeSync(fileCache);
});
