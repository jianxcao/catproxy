export default (option) => {
	return (req, res, next)=> {
		if (req.path === '/' || req.path === '/index.html') {
			res.render("app/app", option);
		} else {
			next();
		}
	};
};
