import ip from 'ip';
import os from 'os';
import log from './log';
export default function getIps() {
	var interfaces = os.networkInterfaces();
	var all = Object.keys(interfaces)
		.map(function(nic) {
			var addresses = interfaces[nic].filter(function(details) {
				details.family = details.family.toLowerCase();
				if (details.family !== 'ipv4' || ip.isLoopback(details.address)) {
					return false;
				}
				return true;
			});
			return addresses.length ? addresses[0].address : undefined;
		})
		.filter(Boolean);
	return !all.length ? [] : all;
}

export let localIps = getIps();
localIps.push(ip.loopback('ipv4'));
