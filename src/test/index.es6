import Promise from 'promise';

Promise.resolve(null)
.then(function(result) {
	return result.test;
})
.then(null, function(err) {
	console.log('in therere', err);
});
