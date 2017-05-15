import {pki, md} from 'node-forge';
let attrs  = [{
	name: 'countryName',
	value: 'CN'
}, {
	shortName: 'ST',
	value: 'CP'
}, {
	name: 'localityName',
	value: 'BJ'
}, {
	name: 'organizationName',
	value: 'catproxy'
}, {
	shortName: 'OU',
	value: 'CP'
}];
let rootAttrs = attrs.slice(0);
rootAttrs.push({
	name: 'commonName',
	value: 'catproxy'
});


let createKeyandCert = ()=> {
	// generate a keypair and create an X.509v3 certificate
	let keys = pki.rsa.generateKeyPair(1024);
	let cert = pki.createCertificate();
	let today = new Date().getTime();
	let tenYearMin = 10 * 365 * 24 * 60 * 60 * 1000;
	cert.publicKey = keys.publicKey;
	cert.serialNumber = '' + new Date().getTime();
	cert.validity.notBefore = new Date(today - tenYearMin);
	cert.validity.notAfter = new Date(today + tenYearMin);
	return {cert, keys};
};

let createRootCert = () => {
	let {cert, keys} = createKeyandCert();
	cert.setSubject(rootAttrs);
	// alternatively set subject from a csr
	// cert.setSubject(csr.subject.attributes);
	cert.setIssuer(rootAttrs);
	cert.setExtensions([{
		name: 'basicConstraints',
		cA: true
	}]);
	cert.sign(keys.privateKey, md.sha256.create());
	// console.log(cert.subject.attributes);
	return {
		cert: pki.certificateToPem(cert),
		privateKey: pki.privateKeyToPem(keys.privateKey),
		publicKey: pki.publicKeyToPem(keys.publicKey),
	};
};

let createSelfCert = (domains, rootOpt) => {
	if (!domains) {
		return {};
	}
	if (typeof domains === 'string') {
		domains = [domains];
	}
	let rootKey = pki.privateKeyFromPem(rootOpt.privateKey);
	let {cert, keys} = createKeyandCert();
	// rootCert.subject.attributes
	cert.setIssuer(rootAttrs);

// ,{
// 		name: 'subjectAltName',
// 		altNames: domains.map(function(host) {
// 			if (host.match(/^[\d\.]+$/)) {
// 				return {type: 7, ip: host};
// 			}
// 			return {type: 2, value: host};
// 		})
// 	}
	cert.setExtensions([{
		name: 'basicConstraints',
		cA: true
	}, {
		name: 'keyUsage',
		keyCertSign: true,
		digitalSignature: true,
		nonRepudiation: true,
		keyEncipherment: true,
		dataEncipherment: true
	}, {
		name: 'extKeyUsage',
		serverAuth: true,
		clientAuth: true,
		codeSigning: true,
		emailProtection: true,
		timeStamping: true
	}, {
		name: 'nsCertType',
		client: true,
		server: true,
		email: true,
		objsign: true,
		sslCA: true,
		emailCA: true,
		objCA: true
	},{
		name: 'subjectAltName',
		altNames: domains.map(function(host) {
			if (host.match(/^[\d\.]+$/)) {
				return {type: 7, ip: host};
			}
			return {type: 2, value: host};
		})
	}, {
		name: 'subjectKeyIdentifier'
	}]);

	cert.setSubject(attrs.concat([{
		name: 'commonName',
		value: domains[0]
	}]));
	// console.log(111111);
	// console.log(cert.getExtensions());
	cert.sign(rootKey, md.sha256.create());
	return {
		cert: pki.certificateToPem(cert),
		privateKey: pki.privateKeyToPem(keys.privateKey),
		publicKey: pki.publicKeyToPem(keys.publicKey),
	};
};

export {createRootCert, createSelfCert};
