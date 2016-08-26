import * as config from '../config/config';
export default () => (req, res, next) => {
	let rules = config.get('hosts');
	res.set('Content-Disposition', 'attachment; filename="rule.json"');
	res.set('Content-Type', 'application/json');
	res.set('Accept-Ranges', 'bytes');
	if (rules && rules.length) {
		res.json(rules);
		res.download(config.getPath());
	} else {
		next('没有可用的配置')	;
	}
};
