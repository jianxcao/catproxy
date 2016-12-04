export default (option) => {
	return (req, res, next)=> {
		res.render("monitor/monitor", option);
	};
};
