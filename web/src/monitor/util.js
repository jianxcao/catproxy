import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import merge from 'lodash/merge';
import isEqual from 'is-equal';
import isPlainObject from 'lodash/isPlainObject';
// 多行匹配 
export const isJSONStr = /(^(?:\s*\[)[\s\S]*(?:\]\s*)$|(^(?:\s*\{)[\s\S]*(?:\}\s*)$))/;
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

export function getPara(str) {
	let data = {};
	let arr = ("" + str).match(/([^=&#\?]+)=[^&#]+/g) || [];
	arr.forEach((para) => {
		var d = para.split("="),
			val = (d[1]);
		if (data[d[0]] !== undefined) {
			data[d[0]] += "," + val;
		} else {
			data[d[0]] = val;
		}
	});
	return data;
};

/**
 * inlined Object.is polyfill to avoid requiring consumers ship their own
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
function is(x, y) {
	// SameValue algorithm
	if (x === y) {
		// Steps 1-5, 7-10
		// Steps 6.b-6.e: +0 != -0
		// Added the nonzero y check to make Flow happy, but it is redundant
		return x !== 0 || y !== 0 || 1 / x === 1 / y;
	} else {
		// Step 6.a: NaN == NaN
		return x !== x && y !== y;
	}
}
export function shouldEqual(objA, objB) {
	if (is(objA, objB)) {
		return true;
	}

	if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
		return false;
	}
	if (objA.equals && objB.equals && !objA.equals(objB)) {
		return false;
	}
	var keysA = Object.keys(objA);
	var keysB = Object.keys(objB);

	if (keysA.length !== keysB.length) {
		return false;
	}

	// Test for A's keys different from B.
	for (var i = 0; i < keysA.length; i++) {
		if (hasOwnProperty.call(objB, keysA[i])) {
			// 递归判断，效率低，尽量一层解决问题
			if ((isPlainObject(objA[keysA[i]]) && isPlainObject(objB[keysA[i]])) || (isArray(objA[keysA[i]]) && isArray(objB[keysA[i]])) ) {
				if (!shouldEqual(objA[keysA[i]], objB[keysA[i]])) {
					return false;
				}
			} else {
				if (!is(objA[keysA[i]], objB[keysA[i]])) {
					return false;
				}
			}
		} else {
			return false;
		}
	}
	return true;	
}

export function jsonParse(str) {
	var json = (new Function("return " + str))();
	return json;
};

