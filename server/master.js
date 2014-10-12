var _ = require('underscore'),
  os = require('os');

exports.getIpAddress = function() {
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



var allDevices = [];
var moves = [];
var stopped = false;
exports.getLastMoveHash = function() {
  return (moves[moves.length - 1] || {}).hash || '';
};
exports.isStopped = function() {
  return stopped;
}
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
exports.onUpdate = function(newMove) {

  var masterDevice = exports.matchDevice(newMove.deviceId);
  if (!masterDevice) {
    console.error('device not found');
    return;
  }
  //we don't want new devices to trigger navigate.
  // only allow updates when device is completely up to date (one driver at a time!)
  if (masterDevice.lastMoveHash !== exports.getLastMoveHash()) {
    return;
  }

  if (newMove.type === 'navigate') {
    //clear history to stop it from getting too out of hand!
    console.log('navigated to: ', newMove.url);
    moves = [];
    _.forEach(allDevices, function(device) {
      device.lastMoveHash = '';
    });
  }

  masterDevice.lastMoveHash = newMove.hash;

  moves.push(newMove);
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