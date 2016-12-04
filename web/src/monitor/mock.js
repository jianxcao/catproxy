import {MONITOR_FILTER_TYPES} from './constant';
let data = {
	hosts: [],
	disCache: false,
	monitor: {
		monitorStatus: true,
		monitorFilterStatus: true,
		monitorFilterType: "js",
		// monitorFilterCondition: "", //不需要记录在后台
		hiddenDataUrl: false,
		monitorList: {}
	}
};
let monitorList = data.monitor.monitorList;
let testUrl = ["http://caipiao.163.com/t/index.html", "http://pimg1.126.net/caipiao", "data:imagesadasdf"];
for (var i = 0; i < 10; i++) {
	monitorList[i] = {
		name: testUrl[Math.floor(Math.random() * testUrl.length)],
		status: "304",
		method: "get",
		protocol: "http1.1",
		domain: "caipiao.163.com",
		size: Math.floor(Math.random() * 1000),
		time: '-',
		id: i,
		type: MONITOR_FILTER_TYPES[Math.floor(Math.random() * MONITOR_FILTER_TYPES.length)]
	};
}
export default data;
