var gulp = require('gulp'),
  nodemon = require('gulp-nodemon'),
  connect = require('gulp-connect');

gulp.task('command', function() {
  nodemon({
    script: 'command.js',
    ext: 'html js',
    ignore: ['ignored.js'],
    nodeArgs: ['--debug']
  })
    .on('restart', function() {
      console.log('restarted!')
    })
});

gulp.task('reload', function() {
  gulp.src('./test/fixtures/*.*')
    .pipe(connect.reload());
});


gulp.task('connect', function() {
  connect.server({
    root: './test/fixtures/',
    livereload: true,
    port: 8000
  });
});

gulp.task('watch', function() {
  gulp.watch(['./test/fixtures/*.*'], ['reload']);
});
gulp.task('server', ['connect', 'watch']);
gulp.task('both', function() {
  gulp.start('command', 'server');
});