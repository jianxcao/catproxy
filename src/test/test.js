import getLocalIps from '../getLocalIps';
import dns from 'dns';
import changeHost from '../changeHost';

//console.log(getLocalIps()); // my ip address
// dns.lookup("p1111img1.126.net", (err, address) => {
// 	if (!err) {
// 		console.log("jjjj", address);
// 	} else {
// 		console.log(err, dns.NOTFOUND);
// 	}
// });

// dns.resolve("pimg1.126.net", function(err, addresses){
// 	console.log(addresses);
// });
// 
// 
changeHost("pimg1.126.net", true)

.then(address => {
	console.log(address);
}, (err) => {
	console.log(err);
});
