import merge from 'merge';
import config from './config';
export default () => {
	return (req, res, next)=> {
		if (req.path === '/' || req.path === '/index.html') {
			res.render("app/app", merge({}, config));
		} else {
			next();
		}
	};
};
