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
var stopped = false;
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

exports.onUpdate = function(lastMove) {
  var masterDevice = exports.matchDevice(lastMove.deviceId);
  if (!masterDevice) {
    console.error('device not found');
    return;
  }
  masterDevice.lastMoveHash = lastMove.hash;

  moves.push(lastMove);
  for (var i = 0; i < allDevices.length; i++) {
    var device = allDevices[i];
    device.socket.emit('update', {
      moves: moves,
      lastMoveHash: device.lastMoveHash
    });
  }
}

exports.reset = function(url) {
  stopped = false;
  _.forEach(allDevices, function(device) {
    console.log('reset device: ', device.id);
    device.socket.emit('reset', {
      url: url
    });
  });
  allDevices = [];
  moves = [];
};

exports.stop = function() {
  stopped = true;
  for (var i = 0; i < allDevices.length; i++) {
    var device = allDevices[i];
    device.lastMoveHash = '';
    device.socket.emit('stop');
  }
  moves = [];
};

io.on('connection', function(socket) {
  //if existing servers are open..
  socket.emit('hello', {
    stopped: stopped
  });
  socket.on('hello', function(data) {
    console.log('hello ', data.deviceId);
    if (!data.deviceId) {
      console.error('device attempted to connect without an id');
      return;
    }
    var device = exports.matchDevice(data.deviceId, socket);
    if (stopped) {
      //must match with the device before returning
      return;
    }
    socket.emit('update', {
      moves: moves,
      lastMoveHash: device.lastMoveHash
    });
  });
  socket.on('event', function(data) {
    if (stopped) {
      return;
    }
    console.log('update recieved: ', data.deviceId, data.hash, data.type);
    exports.onUpdate(data);
  });
  socket.on('playMove', function(data) {
    console.log('move repeated: ', data.deviceId, data.hash);
    if (stopped) {
      return;
    }
    var device = exports.matchDevice(data.deviceId);
    device.lastMoveHash = data.hash;
  });
  socket.on('reset', function(data) {
    if (!data) {
      data = {};
    }
    exports.reset(data.url);
  });
  socket.on('stop', function(data) {
    console.log('stop');
    exports.stop();
  });
  socket.on('start', function(data) {
    if (!data) {
      data = {};
    }
    exports.reset(data.url);
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


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", ipAddress + ":*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});