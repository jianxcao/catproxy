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

var webpack = require('gulp-webpack');
gulp.task('webpack', function() {
	return gulp.src('web/src/app/app.jsx')
		.pipe(webpack(require('./webpack.config.js')))
		.pipe(gulp.dest('web/build/app'));
});

gulp.task('web-js', function() {
	return gulp.src(['web/src/**/*.jsx', 'web/src/**/*.js'])
		.pipe(babel({
			presets: ['es2015', "stage-0", "react"],
			plugins: ["transform-es2015-modules-amd"]
		}))
		.pipe(gulp.dest('web/build'));
});

gulp.task('web-dest', function() {
	return gulp.src('web/src/**/+(*.html|*.ejs)')
		.pipe(gulp.dest('web/build'));
});

gulp.task('web', ['web-dest', 'webpack']);

gulp.task('default', ["src", "web"]);


var watcher = gulp.watch('./src/**/*.*', ['src']);
watcher.on('change added', function(event) {
	console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
});

var watcherWeb = gulp.watch('web/src/**/*.*', ['web-dest']);
watcherWeb.on('change added', function(event) {
	console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
});
