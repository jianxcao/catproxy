"use strict";
var gulp = require('gulp');
var babel = require('gulp-babel');
var webpack = require('gulp-webpack');
var plumber = require('gulp-plumber');
var fse = require('fs-extra');
var webpackCfg = require('./webpack.config');
var webpackPubCfg = require('./webpack.pub');

// 后台代码编译成es5
gulp.task('src', function() {
	return gulp.src('src/**/*.*')
	 	.pipe(plumber()) // plumber给pipe打补丁
		.pipe(babel({
			only: '*.js',
			presets: ['es2015', "stage-0"],
			plugins: ['transform-es2015-modules-commonjs']
		}))
		.pipe(gulp.dest('build'));
});


// 前端代码编译
gulp.task('webpack:watch', function() {
	return gulp.src('web/src/host/app.jsx')
		.pipe(webpack(webpackCfg))
		.pipe(gulp.dest('web/build/host'));
});
gulp.task('webpack:publish', function() {
	return gulp.src('web/src/host/app.jsx')
		.pipe(webpack(webpackPubCfg))
		.pipe(gulp.dest('web/build/host'));
});

gulp.task('web-dest', function() {
	return gulp.src('web/src/**/+(*.html|*.ejs|*.css|*.eot|*.svg|*.ttf|*.woff)')
		.pipe(gulp.dest('web/build'));
});

// 监控
gulp.task('watch', function() {
	gulp.watch('web/src/**/*.*', ['web-dest']);
	gulp.watch('./src/**/*.*', ['src']);
});

gulp.task('clean', function(cb) {
	fse.emptyDirSync('./build');
	fse.emptyDirSync('./web/build');
	cb();
});

// 编译文件
gulp.task('publish', ["clean", "src", 'web-dest', 'webpack:publish']);

gulp.task('build', ["src", 'web-dest', 'webpack:watch', "watch"]);

process.on('uncaughtException', function(err) {
	console.log(err);
});
