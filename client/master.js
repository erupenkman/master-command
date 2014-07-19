var masterCommand = masterCommand || {};
masterCommand.io = io;

(function() {
  var clickedByMaster = null; //prevent infinite loop
  masterCommand.socket = null;
  var deviceId = masterCommand.createOrGetCookie();

  function sayHello() {
    masterCommand.socket.emit('hello', {
      deviceId: deviceId
    });
  }
  masterCommand.reset = function() {
    var path = window.location.href;
    masterCommand.socket.emit('reset', {
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
      masterCommand.socket.emit('playMove', {
        deviceId: deviceId,
        hash: unCompletedMoves[0].hash
      });
      var move = unCompletedMoves[0];
      if (move.type === 'click') {
        masterCommand.masterClick(move.xPath);
      } else if (move.type === 'keyPress') {
        masterCommand.masterKeyPress(move);
      }
    }
  }
  masterCommand.masterKeyPress = function(move) {
    if (!move.xPath) {
      console.error('cannot replay keyPress of: ', move.xPath);
      return
    }
    var clickedNode = masterCommand.lookupElementByXPath(move.xPath);
    clickedByMaster = clickedNode;
    if (!clickedNode) {
      console.error('cannot replay click of: ', move.xPath);
      return;
    }
    console.debug('replay keypress: ', move);
    masterCommand.fakeKeyPress(clickedNode, move.keyCode);
  };
  masterCommand.recordKeyPress = function(e) {
    var keyCode = e.which;
    var xPath = masterCommand.createXPathFromElement(e.target);
    masterCommand.socket.emit('event', {
      type: 'keyPress',
      xPath: xPath,
      deviceId: deviceId,
      hash: Math.floor(Math.random() * 1000),
      keyCode: keyCode
    });
  };
  masterCommand.recordClick = function(e) {
    var xPath = masterCommand.createXPathFromElement(e.target);
    masterCommand.socket.emit('event', {
      type: 'click',
      xPath: xPath,
      deviceId: deviceId,
      hash: Math.floor(Math.random() * 1000)
    });
  };
  masterCommand.init = function(ipAddress) {
    if (!ipAddress) {
      console.error('I need the IP address of the MasterCommand server');
      return;
    }
    masterCommand.socket = masterCommand.io(ipAddress);
    masterCommand.socket.on('hello', sayHello);
    masterCommand.socket.on('update', function(data) {
      console.debug('update', data);
      masterCommand.handleMove(data);
    });
    masterCommand.socket.on('reset', function(data) {
      console.debug('reset to:', data.url);
      window.location.href = data.url;
    });
    $('*').keypress(function(e) {
      if (this !== e.target) {
        return;
      } else if (this === clickedByMaster) {
        clickedByMaster = null;
        return;
      }
      masterCommand.recordKeyPress(e);
      console.debug('pressed key: ', e);
    });
    $('*').click(function(e) {
      if (this !== e.target) {
        return;
      } else if (this === clickedByMaster) {
        clickedByMaster = null;
        return;
      }
      masterCommand.recordClick(e);

    });
  };
})();