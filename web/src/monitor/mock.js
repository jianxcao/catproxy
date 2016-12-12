import {MONITOR_FILTER_TYPES} from './constant';
let data = {
	hosts: [],
	disCache: true,
	monitor: {
		monitorStatus: true,
		monitorFilterStatus: true,
		monitorFilterType: "all",
		// monitorFilterCondition: "", //不需要记录在后台
		hiddenDataUrl: false,
		monitorList: []
	}
};
// 后台给过来是个数据的monitorList，需要转换成 map
let monitorList = data.monitor.monitorList;
let testUrl = ["http://caipiao.163.com/t/index.html", "http://pimg1.126.net/caipiao", "data:imagesadasdf"];
for (var i = 0; i < 10; i++) {
	monitorList.push({
		name: testUrl[Math.floor(Math.random() * testUrl.length)],
		status: "304",
		method: "get",
		protocol: "http1.1",
		domain: "caipiao.163.com",
		size: Math.floor(Math.random() * 1000),
		time: '-',
		id: i,
		type: MONITOR_FILTER_TYPES[Math.floor(Math.random() * MONITOR_FILTER_TYPES.length)]
	});
}
export default {
	result: data,
	status: 100
};
