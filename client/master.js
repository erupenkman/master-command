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
        masterCommand.socket.emit('playMove', {
          deviceId: deviceId,
          hash: unCompletedMoves[i].hash
        });
        var move = unCompletedMoves[i];
        if (move.type === 'click') {
          masterCommand.masterClick(move.xPath);
        } else if (move.type === 'keyPress') {
          masterCommand.masterKeyPress(move);
        } else if (move.type === 'scroll') {
          masterCommand.masterScroll(move);
        }
      }

    }
  }
  masterCommand.masterClick = function(xPath) {
    var clickedNode = masterCommand.getElement(xPath);
    clickedByMaster = clickedNode;
    if (!clickedNode) {
      console.error('cannot replay click of: ', xPath);
      return;
    }
    masterCommand.fakeClick(null, clickedNode);
  };

  masterCommand.masterKeyPress = function(move) {
    if (!move.xPath) {
      console.error('cannot replay keyPress of: ', move.xPath);
      return
    }
    var clickedNode = masterCommand.getElement(move.xPath);
    clickedByMaster = clickedNode;
    if (!clickedNode) {
      console.error('cannot replay click of: ', move.xPath);
      return;
    }
    console.debug('replay keypress: ', move);
    masterCommand.fakeKeyPress(clickedNode, move.newContent);
  };

  masterCommand.masterScroll = function(move) {
    if (!move.xPath) {
      console.error('cannot replay keyPress of: ', move.xPath);
      return;
    }
    var scrolledNode = masterCommand.getElement(move.xPath);
    clickedByMaster = scrolledNode;
    if (!scrolledNode) {
      console.error('cannot replay scroll of: ', move.xPath);
      return;
    }
    console.debug('replay scroll: ', move);
    masterCommand.fakeScroll(scrolledNode, move.scrollTop);
  };

  masterCommand.recordChange = function(e) {
    var newContent = $(e.target).val();
    var xPath = masterCommand.getXpath(e.target);
    masterCommand.socket.emit('event', {
      type: 'keyPress',
      xPath: xPath,
      deviceId: deviceId,
      hash: Math.floor(Math.random() * 100000),
      newContent: newContent
    });
  };
  masterCommand.recordClick = function(e) {
    var xPath = masterCommand.getXpath(e.target);
    masterCommand.socket.emit('event', {
      type: 'click',
      xPath: xPath,
      deviceId: deviceId,
      hash: Math.floor(Math.random() * 100000)
    });
  };
  masterCommand.recordScroll = function(e) {
    var xPath = masterCommand.getXpath(e.target);
    var scrollTop = $(e.target).scrollTop();
    console.log(scrollTop);
    masterCommand.socket.emit('event', {
      type: 'scroll',
      xPath: xPath,
      deviceId: deviceId,
      hash: Math.floor(Math.random() * 100000),
      scrollTop: scrollTop
    });
  };
  masterCommand.debouncedRecordScroll = masterCommand.debounce(masterCommand.recordScroll, 100);

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
    $(window).on('scroll', function(e) {
      //use document instead of this, this is window
      if (document !== e.target) {
        return;
      } else if (document === clickedByMaster) {
        clickedByMaster = null;
        return;
      }
      console.info('doScroll');
      masterCommand.debouncedRecordScroll(e);

    });
    $('*').on('scroll', function(e) {
      if (this !== e.target) {
        return;
      } else if (this === clickedByMaster) {
        clickedByMaster = null;
        return;
      }
      console.info('doScroll');
      masterCommand.debouncedRecordScroll(e);
    });
    $('*').change(function(e) {
      if (this !== e.target) {
        return;
      } else if (this === clickedByMaster) {
        clickedByMaster = null;
        return;
      }
      masterCommand.recordChange(e);
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