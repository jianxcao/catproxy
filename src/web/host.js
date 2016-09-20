export default (option) => {
	return (req, res, next)=> {
		if (req.path === '/' || req.path === '/index.html') {
			res.render("host/app", option);
		} else {
			next();
		}
	};
};
