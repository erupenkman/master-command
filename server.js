var express = require('express'),
  http = require('http'),
  app = express(),
  httpProxy = require('http-proxy'),
  master = require('./server/master.js');

var ipAddress = master.getIpAddress();

var server = app.listen(8001, function() {
  console.log('Listening on port %d', server.address().port);
});


io = require('socket.io')(server);

io.on('connection', function(socket) {
  //if existing servers are open..
  socket.emit('hello', {
    stopped: master.isStopped()
  });
  socket.on('hello', function(data) {
    console.log('hello ', data.deviceId);
    if (!data.deviceId) {
      console.error('device attempted to connect without an id');
      return;
    }
    var device = master.matchDevice(data.deviceId, socket);
    if (master.isStopped()) {
      //must match with the device before returning
      return;
    }
    socket.emit('update', {
      moves: master.getMoves(),
      lastMoveHash: device.lastMoveHash
    });
  });
  socket.on('event', function(data) {
    if (master.isStopped()) {
      return;
    }
    console.log('update recieved: ', data.deviceId, data.hash, data.type);
    master.onUpdate(data);
  });
  socket.on('playMove', function(data) {
    console.log('move repeated: ', data.deviceId, data.hash);
    if (master.isStopped()) {
      return;
    }
    var device = master.matchDevice(data.deviceId);
    device.lastMoveHash = data.hash;
  });
  socket.on('reset', function(data) {
    if (!data) {
      data = {};
    }
    master.reset(data.url);
  });
  socket.on('stop', function(data) {
    console.log('stop');
    master.stop();
  });
  socket.on('start', function(data) {
    if (!data) {
      data = {};
    }
    master.reset(data.url);
  });
});

//todo: break these out
app.get('/jquery', function(req, res) {
  res.sendfile(__dirname + '/node_modules/jquery/dist/jquery.js');
});
app.get('/jquery.cookie', function(req, res) {
  res.sendfile(__dirname + '/node_modules/jquery.cookie/jquery.cookie.js');
});
app.get('/socket.js-client', function(req, res) {
  res.sendfile(__dirname + '/node_modules/socket.io-client/socket.io.js');
});
app.get('/helpers', function(req, res) {
  res.sendfile(__dirname + '/client/helpers.js');
});
app.get('/master-command', function(req, res) {
  res.sendfile(__dirname + '/client/master.js');
});

var proxy = httpProxy.createProxyServer({});
var server = require('http').createServer(function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  proxy.web(req, res, {
    target: 'http://www.google.com'
  });
});
server.listen(5050);


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", ipAddress + ":*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});