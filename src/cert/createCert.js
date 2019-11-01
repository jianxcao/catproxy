import forge, { pki, md, pkcs12 } from 'node-forge';
let attrs = [
	{
		name: 'countryName',
		value: 'CN'
	},
	{
		shortName: 'ST',
		value: 'CP'
	},
	{
		name: 'localityName',
		value: 'BJ'
	},
	{
		name: 'organizationName',
		value: 'catproxy'
	},
	{
		shortName: 'OU',
		value: 'CP'
	}
];
let rootAttrs = attrs.slice(0);
rootAttrs.push({
	name: 'commonName',
	value: 'catproxy'
});

let createKeyandCert = () => {
	// generate a keypair and create an X.509v3 certificate
	let keys = pki.rsa.generateKeyPair(2048);
	let cert = pki.createCertificate();
	let today = new Date().getTime();
	let tenYearMin = 1 * 365 * 24 * 60 * 60 * 1000;
	cert.publicKey = keys.publicKey;
	cert.serialNumber = '' + new Date().getTime();
	cert.validity.notBefore = new Date(today - tenYearMin);
	cert.validity.notAfter = new Date(today + tenYearMin);
	return { cert, keys };
};

let createRootCert = () => {
	let { cert, keys } = createKeyandCert();
	cert.setSubject(rootAttrs);
	// alternatively set subject from a csr
	// cert.setSubject(csr.subject.attributes);
	cert.setIssuer(rootAttrs);
	cert.setExtensions([
		{
			name: 'basicConstraints',
			cA: true
		}
	]);
	cert.sign(keys.privateKey, md.sha256.create());
	// base64-encode p12
	let p12Asn1 = pkcs12.toPkcs12Asn1(keys.privateKey, cert, '123456', {
		algorithm: '3des'
	});
	let p12Der = new Buffer(forge.asn1.toDer(p12Asn1).toHex(), 'hex');
	return {
		cert: pki.certificateToPem(cert),
		pfx: p12Der,
		privateKey: pki.privateKeyToPem(keys.privateKey),
		publicKey: pki.publicKeyToPem(keys.publicKey)
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
	let { cert, keys } = createKeyandCert();
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
	cert.setExtensions([
		// 某些电脑加这个 会爆出 证书乱码问题
		// {
		// 	name: 'basicConstraints',
		// 	cA: true
		// },
		{
			name: 'subjectAltName',
			altNames: domains.map(function(host) {
				if (host.match(/^[\d\.]+$/)) {
					return { type: 7, ip: host };
				}
				return { type: 2, value: host };
			})
		}
	]);

	cert.setSubject(
		attrs.concat([
			{
				name: 'commonName',
				value: domains[0]
			}
		])
	);
	// console.log(111111);
	// console.log(cert.getExtensions());
	cert.sign(rootKey, md.sha256.create());
	return {
		cert: pki.certificateToPem(cert),
		privateKey: pki.privateKeyToPem(keys.privateKey),
		publicKey: pki.publicKeyToPem(keys.publicKey)
	};
};

export { createRootCert, createSelfCert };
