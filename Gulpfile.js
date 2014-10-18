var gulp = require('gulp'),
  nodemon = require('gulp-nodemon'),
  connect = require('gulp-connect');

gulp.task('command', function() {
  nodemon({
    script: 'server.js',
    ext: 'js',
    ignore: ['test/**/*', 'client/**/*'],
    nodeArgs: ['--debug=5858']
  });
});

gulp.task('proxy', function() {
  nodemon({
    script: 'server/proxy.js',
    ext: 'js',
    ignore: ['test/**/*', 'client/**/*'],
    nodeArgs: ['--debug=5859']
  })
});

gulp.task('reload', function() {

  gulp.src(['./client/**/*.html'])
    .pipe(connect.reload());
});


gulp.task('connect', function() {
  connect.server({
    root: './client',
    livereload: true,
    port: 8100
  });
});

gulp.task('watch', function() {
  gulp.watch(['./client/**/*'], ['reload']);
});
gulp.task('server', ['connect', 'watch']);
gulp.task('both', function() {
  gulp.start('command', 'server');
});