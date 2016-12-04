import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import merge from 'lodash/merge';

export let keymirror = (...args) => {
	return function middle(arr) {
		return arr.reduce((result, arg) => {
			if (isArray(arg)) {
				merge(result, middle(arg));
			} else if (isString(arg)) {
				result[arg] = arg;
			}
			return result;
		}, {});
	}(args);
};

export let upperFirstLetter =  (str) => {
	if (typeof str === 'string') {
		// 不做头部去空处理哦
		return str.replace(/^.{1}/, first => first.toUpperCase());
	}
	return str;
};

export const isRegStr = /^\/.+\//;

export const isDataUrl = /^data:.+/;
