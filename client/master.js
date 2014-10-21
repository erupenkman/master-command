var masterCommand = masterCommand || {};
masterCommand.io = io;
console.debug = console.debug || function() {};
(function() {
  var clickedByMaster = null; //prevent infinite loop
  masterCommand.socket = null;
  var deviceId = helpers.createOrGetCookie();


  function newHash() {
    return Math.floor(Math.random() * 100000);
  }

  function sayHello() {
    masterCommand.socket.emit('hello', {
      deviceId: deviceId
    });
  }
  masterCommand.reset = function() {
    var path = window.location.href;
    masterCommand.socket.emit('reset', {
      type: 'reset',
      deviceId: deviceId,
      hash: newHash(),
      url: path
    });
  }
  masterCommand.handleMoves = function(data) {
    if (data.moves === undefined || data.moves.length === undefined) {
      console.error('no moves recieved');
      return;
    }
    var unCompletedMoves = helpers.getUncompletedMoves(data);
    if (unCompletedMoves.length > 0) {
      //tell command about the move
      for (var i = 0; i < unCompletedMoves.length; i++) {

        var move = unCompletedMoves[i];
        helpers.setCurrentPlayingMove(move);
        switch (move.type) {
          case 'click':
            masterCommand.masterClick(move.xPath, function() {
              masterCommand.emitPlayMove(move);
            });
            break;
          case 'keyPress':
            masterCommand.masterKeyPress(move);
            masterCommand.emitPlayMove(move);
            break;
          case 'scroll':
            masterCommand.masterScroll(move);
            masterCommand.emitPlayMove(move);
            break;
          case 'navigate':
            masterCommand.masterNavigate(move);
            break;
          case 'reset':
            masterCommand.masterNavigate(move);
            break;
        }
      }
    }
  }
  masterCommand.emitPlayMove = function(move) {
    helpers.setCurrentPlayingMove(null);
    masterCommand.socket.emit('playMove', {
      deviceId: deviceId,
      hash: move.hash,
      type: move.type
    });
  };
  masterCommand.handleCurrentPlayingMove = function() {
    currentMove = helpers.getCurrentPlayingMove();
    if (currentMove == null) {
      masterCommand.recordNavigate({
        url: window.location.href
      });
    } else {
      masterCommand.emitPlayMove(currentMove);
    }
  };
  masterCommand.masterClick = function(xPath, onClickFinished) {
    var clickedNode = helpers.getElement(xPath);
    clickedByMaster = clickedNode;
    $(clickedNode).one('click', function() {
      //This is liable to break..
      setTimeout(onClickFinished, 1000);
    });
    if (!clickedNode) {
      console.error('cannot replay click of: ', xPath);
      return;
    }
    helpers.fakeClick(null, clickedNode);
  };

  masterCommand.masterKeyPress = function(move) {
    if (!move.xPath) {
      console.error('cannot replay keyPress of: ', move.xPath);
      return
    }
    var clickedNode = helpers.getElement(move.xPath);
    clickedByMaster = clickedNode;
    if (!clickedNode) {
      console.error('cannot replay click of: ', move.xPath);
      return;
    }
    console.debug('replay keypress: ', move);
    helpers.fakeKeyPress(clickedNode, move.newContent);
  };

  masterCommand.masterScroll = function(move) {
    if (!move.xPath) {
      console.error('cannot replay keyPress of: ', move.xPath);
      return;
    }
    var scrolledNode = helpers.getElement(move.xPath);
    clickedByMaster = scrolledNode;
    if (!scrolledNode) {
      console.error('cannot replay scroll of: ', move.xPath);
      return;
    }
    console.debug('replay scroll: ', move);
    helpers.fakeScroll(scrolledNode, move.scrollTop);
  };
  masterCommand.masterNavigate = function(move) {
    helpers.fakeNavigate(move.url);
  };
  masterCommand.recordNavigate = function(args) {
    //if is not joining an existing sesion
    //and it hasn't just been reloaded by master

    masterCommand.socket.emit('event', {
      type: 'navigate',
      deviceId: deviceId,
      hash: newHash(),
      url: args.url
    });
  };

  masterCommand.recordChange = function(e) {
    var newContent = $(e.target).val();
    var xPath = helpers.getXpath(e.target);
    masterCommand.socket.emit('event', {
      type: 'keyPress',
      xPath: xPath,
      deviceId: deviceId,
      hash: newHash(),
      newContent: newContent
    });
  };
  masterCommand.recordHoverStart = function(e) {
    var xPath = helpers.getXpath(e.target);
    masterCommand.socket.emit('event', {
      type: 'hoverStart',
      xPath: xPath,
      deviceId: deviceId,
      hash: newHash()
    });
  };
  masterCommand.recordClick = function(e) {
    var xPath = helpers.getXpath(e.target);
    masterCommand.socket.emit('event', {
      type: 'click',
      xPath: xPath,
      deviceId: deviceId,
      hash: newHash()
    });
  };
  masterCommand.recordScroll = function(e) {
    var xPath = helpers.getXpath(e.target);
    var scrollTop = $(e.target).scrollTop();
    console.log(scrollTop);
    masterCommand.socket.emit('event', {
      type: 'scroll',
      xPath: xPath,
      deviceId: deviceId,
      hash: newHash(),
      scrollTop: scrollTop
    });
  };
  masterCommand.stop = function() {
    masterCommand.socket.emit('stop');
  };
  masterCommand.debouncedRecordScroll = helpers.debounce(masterCommand.recordScroll, 100);

  masterCommand.init = function(ipAddress) {
    if (!ipAddress) {
      console.error('I need the IP address of the MasterCommand server');
      return;
    }
    masterCommand.socket = masterCommand.io(ipAddress);
    masterCommand.handleCurrentPlayingMove();
    masterCommand.socket.on('hello', function(data) {
      if (data.stopped) {
        $('.master-bar').addClass('stopped');
      }
      sayHello();
    });
    masterCommand.socket.on('update', function(data) {
      console.debug('update', data);
      masterCommand.handleMoves(data);
    });
    masterCommand.socket.on('stop', function() {
      $('.master-bar').addClass('stopped');
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
    $('#mc-reset').on('click', function(e) {
      masterCommand.reset();
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    });
    $('#mc-stop').on('click', function(e) {
      masterCommand.stop();
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    });
    $('#mc-start').on('click', function(e) {
      masterCommand.reset();
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    });

    console.log('ttt');
    $('*').on('mouseover', function(e) {
      // console.log('hover on');
    });
    $('*').on('mouseout', function(e) {
      // console.log('hover off');
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
    $(window).on('beforeunload', function() {
      masterCommand.socket.close();
    });
  };
})();