// 如果没有flex则认为flex为1
// 如果有排除列，则直接排除
export let getFlexGrow = (columns, exculudeColumnKeys) => {
	if (typeof lockColumnKeys === 'string') {
		exculudeColumnKeys = [exculudeColumnKeys];
	}
	columns = columns || [];
	return columns.reduce((all, current) => {
		if (exculudeColumnKeys && exculudeColumnKeys.length && exculudeColumnKeys.indexOf(current.shortName) > -1) {
			return all;
		}
		let flex = +current.flex || 1;
		all += flex;
		return all;
	}, 0);
};

// 获取已经存在列的宽度
export let getTotalWidth = columns => {
	columns = columns || [];
	return columns.reduce((all, current) => {
		let width = +current.width || 0;
		all += width;
		return all;
	}, 0);
};

// 自动缩小列宽度
export let adjustColumnWidth = (columns, minWidth, tableWidth, lockColumnKeys) => {
	if (typeof lockColumnKeys === 'string') {
		lockColumnKeys = [lockColumnKeys];
	}
	// 锁定列，即这一列的宽度不能改变
	let totalWidth = getTotalWidth(columns);
	let totalFlexGrow = getFlexGrow(columns, lockColumnKeys);
	let cha = tableWidth - totalWidth;
	return columns.map(current => {
		if (lockColumnKeys && lockColumnKeys.length && lockColumnKeys.indexOf(current.shortName) > -1) {
			return { ...current };
		} else {
			let flex = +current.flex || 1;
			let width = Math.floor(current.width + (cha * flex) / totalFlexGrow);
			if (width < minWidth) {
				width = minWidth;
			}
			return { ...current, width };
		}
	});
	return columns;
};

export let computeColumnWidth = (columns, minWidth, tableWidth) => {
	let totalFlexGrow = getFlexGrow(columns);
	return columns.map(current => {
		let flex = +current.flex || 1;
		let width = Math.floor((flex / totalFlexGrow) * tableWidth);
		if (width < minWidth) {
			width = minWidth;
		}
		return {
			...current,
			width,
		};
	});
};
