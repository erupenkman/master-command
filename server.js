var express = require('express'),
  http = require('http'),
  corsMiddleware = require('cors'),
  app = express(),
  master = require('./server/master.js');


var envPort = process.env.PORT || 8001;


var server = require('http').createServer(app);
var io = require('socket.io').listen(server, {
  origins: '*:*'
});

server.listen(envPort, function() {
  console.log('Listening on port %d', server.address().port);
});

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
    console.log('move repeated: ', data.deviceId, data.hash, data.type);
    if (master.isStopped()) {
      return;
    }
    var device = master.matchDevice(data.deviceId, socket);
    if (device) {
      device.lastMoveHash = data.hash;
    }
  });
  socket.on('reset', function(data) {
    if (!data) {
      data = {};
    }
    console.log('reset');
    master.reset(data);
  });
  socket.on('stop', function(data) {
    console.log('stop');
    master.stop();
  });
  socket.on('start', function(data) {
    if (!data) {
      data = {};
    }
    master.reset(data);
  });
});
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers",
    'Content-Type, Accept, Origin, Cookie, X-Requested-With,' +
    'X-DevTools-Emulate-Network-Conditions-Client-Id, Access-Control-Request-Headers, Access-Control-Request-Method, Referer'
  );
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});
app.options('*', function(req, res) {
  res.send(' ');
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