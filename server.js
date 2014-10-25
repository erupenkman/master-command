var express = require('express'),
  http = require('http'),
  master = require('./server/master.js');

var envPort = process.env.PORT || 8001;
var server = http.createServer();
var io = require('socket.io').listen(server, {
  origins: '*:*'
});

server.listen(envPort, function() {
  console.log('Listening on port %d', server.address().port);
});

io.on('connection', function(socket) {
  console.log('connected');
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