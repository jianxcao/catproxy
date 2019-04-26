import fs from 'fs';
import path from 'path';
import log from '../log';
import merge from 'merge';
import checkConfig from './checkConfig';
import isEqual from 'is-equal';
import clone from 'clone';
// 数据对象直接require后直接返回一个对象，init方法只能调用一次，一个进程公用一个config
var	data = {};
var oldData = null;
var saveProps = null;
var isInit = false;
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
		fs.mkdirSync(dirPath);
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
	if (exits) {
		var bufData = fs.readFileSync(filePath, 'utf-8');
		try {
			currentData = JSON.parse(bufData);
		} catch(e) {
			log.error(e);
			currentData = {};
		}
	}
	return currentData;
};

// 获取一个值
export let get = (key) => {
	if (!isInit) {
		throw new Error('请先初始化配置');
	}
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
export let set = (key, val, isRecursive) => {
	if (!isInit) {
		throw new Error('请先初始化配置');
	}
	if (!key) {
		return false;
	}
	let current;
	let type = typeof key;
	if (type === 'string') {
		current = {[key]: val};
	} else if (type === 'object') {
		current = key;
	}
	if (current) {
		current = checkConfig(current);
		if (isRecursive) {
			data = merge.recursive(data, current);
		} else {
			data = merge(data, current);
		}
		return true;
	}
};
export let del = (key) => {
	if (!isInit) {
		throw new Error('请先初始化配置');
	}
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

export let setRecursive = (key, val) => {
	set(key, val, true);
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
	if (!isInit) {
		throw new Error('请先初始化配置');
	}
	key = key || saveProps;
	var saveData;
	if (!key) {
		// 全部覆盖
		saveData = clone(data);
	} else {
		saveData = clone(oldData);
		if (typeof key === 'string') {
			key  = [key];
		}
		// 全部转换成数组处理
		if (Object.prototype.toString.call(key) === '[object Array]') {
			key.forEach(function(cur) {
				if (data[cur] !== undefined) {
					saveData[cur] = clone(data[cur]);
				}
			});
		}
	}
	// 如果数据完全一样，不调用
	if (isEqual(saveData, oldData)) {
		return;
	}
	var myData = JSON.stringify(saveData);
	var filePath = getPath();
	log.debug('保存规则文件路径:' + filePath);
	try {
		var fd = fs.openSync(filePath, 'w+', '777');
		fs.writeSync(fd, myData, null, 'utf-8');
		fs.closeSync(fd);
		oldData = saveData;
	} catch(e) {
		throw e;
	}
};

export default function() {
	isInit = true;
	log.info('配置文件加载中, 加载路径: ' + getPath());
	data = loadingData();
	// 浅拷贝数据
	oldData = clone(data);
	log.info('配置文件加载成功');
};
