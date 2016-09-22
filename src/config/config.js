import fs from 'fs';
import path from 'path';
import log from '../log';
import merge from 'merge';
var	data = {};
var saveProps = null;
// 获取配置路径
export let getPath = () => {
	let dirPath, filePath;
		// The expected result is:
	// OS X - '/Users/user/Library/Preferences'
	// Windows 8 - 'C:\Users\User\AppData\Roaming'
	// Windows XP - 'C:\Documents and Settings\User\Application Data'
	// Linux - '/var/local'
	// 获取系统临时目录
	var tmpPath = process.env.APPDATA;
	if (!tmpPath || tmpPath === 'undefined') {
		tmpPath = (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library/Preferences') : '/var/local');
	}
	dirPath = path.resolve(tmpPath, 'catproxy');
	var exits = fs.existsSync(dirPath);
	// 目录不存在
	if (!exits) {
		fs.mkdir(dirPath);
	}
	// 临时文件存放位置
	filePath = path.resolve(dirPath, 'rule.json');
	return filePath;
};

let loadingData = () => {
	let filePath = getPath();
	let currentData = {};
	// 判断是否存在临时文件
	let exits = fs.existsSync(filePath);
	log.info('配置文件加载中');
	if (exits) {
		var bufData = fs.readFileSync(filePath, 'utf-8');
		try {
			currentData = JSON.parse(bufData);
			log.info('配置文件加载成功');
		} catch(e) {
			currentData = {};
		}
	}
	return currentData;
};


// 获取一个值
export let get = (key) => {
	var tmp = data;
	if (!key) {
		return data;
	} else {
		key = key.split(':');
		for(var i = 0; i < key.length; i++) {
			if (tmp[key[i]] !== undefined) {
				tmp = tmp[key[i]];
			} else  {
				return null;
			}
		}
		return tmp;
	}
};

// 设置一个直接
export let set = (key, val) => {
	if (!key) {
		return false;
	}
	if (typeof key === 'object') {
		data = merge(data, key);
		return true;
	}
	var tmp = data, keys;
	keys = key.split(':');
	key = keys[keys.length - 1];
	if (keys.length > 1) {
		for(var i = 0; i < keys.length - 1; i++) {
			if (typeof tmp === 'object') {
				if (tmp[keys[i]]) {
					tmp = tmp[keys[i]];
				} else  {
					tmp = null;
					return false;
				}
			} else {
				tmp = null;
				return false;
			}
		}
	}
	if (tmp) {
		tmp[key] = val;
		return true;
	}
};
export let del = (key) => {
	// 不传递key删除所有
	if (!key) {
		data = {};
	}
	// key 必须是字符串
	if (typeof key !== 'string') {
		return;
	}
	var tmp = data, keys;
	keys = key.split(':');
	key = keys[keys.length - 1];
	if (keys.length > 1) {
		for(var i = 0; i < keys.length - 1; i++) {
			if (typeof tmp === 'object') {
				if (tmp[keys[i]]) {
					tmp = tmp[keys[i]];
				} else  {
					tmp = null;
					return false;
				}
			} else {
				tmp = null;
				return false;
			}
		}
	}
	if (tmp) {
		delete tmp[key];
		return true;
	}
};

export let setSaveProp = (...keys) => {
	saveProps = keys;
};
// 保存到文件
/**
 * key  如果传递，则只更新对应key的数据到文件中，否则全部更新
 * key 可以是数组或者字符串只可以更新顶级的字段，字段下面的字段不行
 */
export let save = (key) => {
	key = key || saveProps;
	var oldData = loadingData();
	var saveData;
	if (!key) {
		// 全部覆盖
		saveData = data;
	} else {
		saveData = oldData;
		if (typeof key === 'string') {
			key  = [key];
		}
		// 全部转换成数组处理
		if (Object.prototype.toString.call(key) === '[object Array]') {
			key.forEach(function(cur) {
				if (data[cur] !== undefined) {
					saveData[cur] = data[cur];
				}
			});
		}
	}
	var myData = JSON.stringify(saveData);
	var filePath = getPath();
	log.info('规则文件路径:' + filePath);
	try {
		var fd = fs.openSync(filePath, 'w+', '777');
		fs.writeSync(fd, myData, null, 'utf-8');
		fs.closeSync(fd);
	} catch(e) {
		throw e;
	}
};

export default function() {
	data = loadingData();
};
