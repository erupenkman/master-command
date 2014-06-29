var express = require('express'),
  http = require('http'),
  app = express();

var ipAddress = (function() {
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
})();

var server = app.listen(8001, function() {
  console.log('Listening on port %d', server.address().port);
});

var io = require('socket.io')(server);
io.on('connection', function(socket) {
  socket.on('hello', function(data) {
    console.log(data + ' connected');
  });

  socket.on('click', function(data) {
    console.log('it hapened', data);
    socket.broadcast.emit('master-clicked', data);
  });
});


app.get('/socket.js-client', function(req, res) {
  res.sendfile(__dirname + '/node_modules/socket.io-client/socket.io.js');
});
app.get('/master-command', function(req, res) {
  res.sendfile(__dirname + '/master.js');
});


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", ipAddress + ":*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});