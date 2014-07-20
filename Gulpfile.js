var gulp = require('gulp'),
  nodemon = require('gulp-nodemon'),
  connect = require('gulp-connect'),
  inject = require('connect-injector');

var injectMaster =
  '<script src="http://_IP_ADDRESS_:35729/livereload.js"></script>' +
  '<script src="http://_IP_ADDRESS_:8001/jquery"></script>' +
  '<script src="http://_IP_ADDRESS_:8001/jquery.cookie"></script>' +
  '<script src="http://_IP_ADDRESS_:8001/socket.js-client"></script>' +

  '<script src="http://_IP_ADDRESS_:8001/helpers"></script>' +
  '<script src="http://_IP_ADDRESS_:8001/master-command"></script>' +
  '<style>' +
  '   .master-bar {' +
  '     font-size: 12px;' +
  '     position: fixed;' +
  '     bottom: 0;' +
  '     left: 0;' +
  '     background: white;' +
  '   }' +
  '</style>' +
  '<div class="master-bar"> Reflector ' +
  '   <a href="javascript:masterCommand.reset()">Reset</a>' +
  '   <a href="javascript:masterCommand.stop()">Stop</a>' +
  '   <a href="javascript:masterCommand.stop()">Start</a>' +
  '</div>' +
  '<script>' +
  '   masterCommand.init(\'http://_IP_ADDRESS_:8001\');' +
  '</script>'
var getIpAddress = function() {
  //thanks dude http://jbavari.github.io/blog/2013/12/04/automating-local-ip-lookup-with-grunt-and-node/
  var os = require('os');
  var ifaces = os.networkInterfaces();
  var lookupIpAddress = 'localhost';
  for (var dev in ifaces) {
    if (dev != "en1" && dev != "en0") {
      continue;
    }
    for (var i in ifaces[dev]) {
      var details = ifaces[dev][i];
      if (details.family == 'IPv4') {
        lookupIpAddress = details.address;
        break;
      }
    }
  }
  return lookupIpAddress;
};

gulp.task('command', function() {
  nodemon({
    script: 'server.js',
    ext: 'js',
    ignore: ['test/**/*', 'master.js'],
    nodeArgs: ['--debug']
  })
    .on('restart', function() {

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
    port: 8000,
    middleware: function(connect, opt) {
      return [inject(function when(req, res) {
        var contetType = res.getHeader('content-type');
        var isHtml = contetType && contetType.indexOf('html') !== -1;
        return isHtml;
      }, function converter(callback, content, req, res) {
        var ipAddress = getIpAddress();
        callback(null, content + injectMaster.replace(/_IP_ADDRESS_/g, ipAddress));
      })];
    }
  });
});

gulp.task('watch', function() {
  gulp.watch(['./client/**/*'], ['reload']);
});
gulp.task('server', ['connect', 'watch']);
gulp.task('both', function() {
  gulp.start('command', 'server');
});