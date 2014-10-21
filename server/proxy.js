var httpProxy = require('http-proxy'),
  http = require('http'),
  connect = require('connect'),
  os = require('os'),
  injector = require('connect-injector'),
  url = require('url');

///
/// Actually run the main server, intercept requests and inject our feindish mastercommand scripts
///

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
  '   .master-bar.stopped {' +
  '     background: #FCC;' +
  '   }' +
  '</style>' +
  '<div class="master-bar"> Reflector ' +
  '   <a href="javascript:;"id="mc-reset">Reset</a>' +
  '   <a href="javascript:;" id="mc-stop">Stop</a>' +
  '   <a href="javascript:;" id="mc-start">Start</a>' +
  '</div>' +
  '<script>' +
  '   masterCommand.init(\'http://_IP_ADDRESS_:8001\');' +
  '</script>';
getIpAddress = function() {
  //thanks dude http://jbavari.github.io/blog/2013/12/04/automating-local-ip-lookup-with-grunt-and-node/

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

var middleware = injector(function when(req, res) {
  var contetType = res.getHeader('content-type');
  var isHtml = contetType && contetType.indexOf('html') !== -1;
  return isHtml;
}, function converter(callback, content, req, res) {
  var ipAddress = getIpAddress();
  callback(null, content + injectMaster.replace(/_IP_ADDRESS_/g, ipAddress));
});
var app = connect();
app.use(middleware);
var currentTarget = '';
app.use(function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  var parsedUrl = url.parse(req.url, true);
  if (parsedUrl && parsedUrl.query && typeof parsedUrl.query.masterTargetSite === 'string') {
    currentTarget = parsedUrl.query.masterTargetSite;
  }
  proxy.web(req, res, {
    target: currentTarget
  });
});
var proxy = httpProxy.createProxyServer(middleware);
proxy.on('proxyReq', function(proxyReq, req, res, options) {
  proxyReq.setHeader('accept-encoding', 'identity');
});

proxy.on('proxyRes', function(proxyRes, req, res) {

});

proxy.on('error', function(proxyRes, req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });
  res.write('Error : ' + proxyRes.message);
  res.end();
});

http.createServer(app).listen(5050);