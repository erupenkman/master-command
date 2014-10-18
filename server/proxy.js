var httpProxy = require('http-proxy'),
  http = require('http'),
  os = require('os');

///
/// Actually run the main server, intercept requests and inject our feindish mastercommand scripts
///

var proxy = httpProxy.createProxyServer({});
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

}

proxy.on('proxyReq', function(proxyReq, req, res, options) {
  proxyReq.setHeader('accept-encoding', '*;q=1,gzip=0');
});
// force uncompresed
proxy.on('proxyRes', function(proxyRes, req, res) {
  var _write = res.write,
    _writeHead = res.writeHead,
    isHtml = false;
  var injectHtml = injectMaster.replace(/_IP_ADDRESS_/g, getIpAddress());
  res.writeHead = function(code, headers) {
    isHtml = proxyRes.headers['content-type'] && proxyRes.headers['content-type'].match('text/html');
    if (isHtml) {
      length = parseInt(proxyRes.headers['content-length']) + injectHtml.length;
      res.setHeader('content-length', length);
    }
    _writeHead.apply(this, arguments);
  }

  res.write = function(chunk) {
    if (isHtml) {
      chunk = chunk.toString().replace(/(<\/html[^>]*>)/, "$1" + injectHtml);
    }
    _write.call(res, chunk);
  }
});

proxy.on('error', function(proxyRes, req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });
  res.write('Error : ' + proxyRes.message);
  res.end();
});

var server = http.createServer(function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  proxy.web(req, res, {
    target: 'http://en.wikipedia.org/wiki/Main_Page'
  });
});
server.listen(5050);