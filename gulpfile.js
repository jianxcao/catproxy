"use strict";
var gulp = require('gulp');
var babel = require('gulp-babel');

gulp.task('src', function() {
	return gulp.src('src/**/*.*')
		.pipe(babel({
			only: '*.js',
			presets: ['es2015', "stage-0"],
			plugins: ['transform-es2015-modules-commonjs']
		}))
		.pipe(gulp.dest('build'));
});

gulp.task('web', function() {
	return gulp.src('web/src/**/*.*')
		.pipe(babel({
			only: '*.js',
			presets: ['es2015', "stage-0"],
			plugins: ["transform-es2015-modules-amd"]
		}))
		.pipe(gulp.dest('web/build'));
});

gulp.task('default', ["src", 'web']);

var watcher = gulp.watch('src/**/*.*', ['src']);
watcher.on('change added', function(event) {
	console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
});


var watcherWeb = gulp.watch('web/src/**/*.*', ['web']);
watcherWeb.on('change added', function(event) {
	console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
});
