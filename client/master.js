var masterCommand = masterCommand || {};

(function() {
  var clickedByMaster = null;
  var socket = null;
  var deviceId = masterCommand.createOrGetCookie();

  function sayHello() {
    socket.emit('hello', {
      deviceId: deviceId
    });
  }
  masterCommand.reset = function() {
    var path = window.location.href;
    socket.emit('reset', {
      url: path
    });
  }
  masterCommand.masterClick = function(xPath) {
    var clickedNode = masterCommand.lookupElementByXPath(xPath);
    clickedByMaster = clickedNode;
    if (!clickedNode) {
      console.error('cannot replay click of: ', xPath);
      return;
    }
    masterCommand.fakeClick(null, clickedNode);
  }
  masterCommand.handleMove = function(data) {
    if (data.moves === undefined || data.moves.length === undefined) {
      console.error('no moves recieved');
      return;
    }
    var unCompletedMoves = []; //
    if (!data.lastMoveHash) {
      unCompletedMoves = data.moves;
    } else {
      for (var i = 0; i < data.moves.length; i++) {
        var move = data.moves[i];
        if (move.hash === data.lastMoveHash) {
          unCompletedMoves = data.moves.slice(i + 1);
        }
      }
    }
    if (unCompletedMoves.length > 0) {
      //tell command about the move
      for (var i = 0; i < unCompletedMoves.length; i++) {

      }
      socket.emit('playMove', {
        deviceId: deviceId,
        hash: unCompletedMoves[0].hash
      });
      masterCommand.masterClick(unCompletedMoves[0].xPath);
    }
  }
  masterCommand.init = function(ipAddress) {
    if (!ipAddress) {
      console.error('I need the IP address of the MasterCommand server');
      return;
    }
    socket = io(ipAddress);
    socket.on('hello', sayHello);
    socket.on('update', function(data) {
      console.log('update', data);
      masterCommand.handleMove(data);
    });
    socket.on('reset', function(data) {
      console.log('reset to:', data.url);
      window.location.href = data.url;
    });
    $('*').keypress(function(e) {
      if (this !== e.target) {
        return;
      } else if (this === clickedByMaster) {
        clickedByMaster = null;
        return;
      }
      console.log(e);
    });
    $('*').click(function(e) {
      if (this !== e.target) {
        return;
      } else if (this === clickedByMaster) {
        clickedByMaster = null;
        return;
      }
      var xPath = masterCommand.createXPathFromElement(this);
      socket.emit('event', {
        xPath: xPath,
        deviceId: deviceId,
        hash: Math.floor(Math.random() * 1000)
      });

    });
  };
})();