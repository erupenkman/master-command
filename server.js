var express = require('express'),
  http = require('http'),
  _ = require('underscore'),
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
var allDevices = [];
var moves = [];
exports.getMoves = function() {
  return moves;
}
exports.matchDevice = function(id, socket) {
  if (id === null || id === undefined) {
    return null;
  }
  // if you have a cookie match with existing device
  var matchedDevice = _.find(allDevices, function(item) {
    return item.id === id;
  });
  if (matchedDevice) {
    if (socket) {
      matchedDevice.socket = socket;
    }
    return matchedDevice;
  } else {
    // if no cookie create a new device
    if (!socket) {
      console.error('cannot save device, socket is undefined');
      return
    }
    var newDevice = {
      id: id,
      lastMoveHash: '',
      socket: socket
    };
    allDevices.push(newDevice);
    return newDevice;
  }
}

exports.getDevice = function(index) {
  return allDevices[index];
}

exports.onUpdate = function(data) {
  console.log('it hapened', data);
  var masterDevice = exports.matchDevice(data.deviceId);
  if (!masterDevice) {
    console.error('device not found');
    return;
  }
  masterDevice.lastMoveHash = data.hash;

  moves.push({
    xPath: data.xPath,
    hash: data.hash
  });
  for (var i = 0; i < allDevices.length; i++) {
    var device = allDevices[i];
    device.socket.emit('update', {
      moves: moves,
      lastMoveHash: device.lastMoveHash
    });
  }
}
io.on('connection', function(socket) {
  socket.on('hello', function(data) {
    console.log('deviceId', data.deviceId);
    if (!data.deviceId) {
      console.error('device attempted to connect without an id');
      return;
    }
    var device = exports.matchDevice(data.deviceId, socket);
    socket.emit('update', {
      moves: moves,
      lastMoveHash: device.lastMoveHash
    });
  });
  socket.on('click', function(data) {
    exports.onUpdate(data);
  });
  socket.on('playMove', function(data) {
    var device = exports.matchDevice(data.deviceId);
    device.lastMoveHash = data.hash;

  });
});

//todo: break these out
app.get('/socket.js-client', function(req, res) {
  res.sendfile(__dirname + '/node_modules/socket.io-client/socket.io.js');
});
app.get('/helpers', function(req, res) {
  res.sendfile(__dirname + '/client/helpers.js');
});
app.get('/master-command', function(req, res) {
  res.sendfile(__dirname + '/client/master.js');
});


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", ipAddress + ":*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});