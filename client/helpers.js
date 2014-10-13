var helpers = helpers || {};
(function() {
  helpers.fakeScroll = function(node, scrollTop) {
    $(node).scrollTop(scrollTop);
  };
  helpers.fakeKeyPress = function(node, updatedContents) {
    //todo: use a real plugin here
    $(node).val(updatedContents);
    $(node).trigger({
      type: 'keypress',
      which: null
    });
  };
  // navigate to url, created to encapsulate window.location.href
  helpers.fakeNavigate = function(url) {
    if (window.location === url) {
      location.reload(true);
    } else {
      window.location = url;
    }
    console.log('reload');
  };
  helpers.getUncompletedMoves = function(data) {
    var unCompletedMoves = data.moves;
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
    return unCompletedMoves;
  };
  //from underscore.js, todo: add throttling (and don't forget calls of different type);
  helpers.debounce = function(func, wait) {
    var timeout;
    return function() {
      var context = this,
        args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        timeout = null;
        func.apply(context, args);
      }, wait);
    };
  }
  //thanks http://stackoverflow.com/questions/1421584/how-can-i-simulate-a-click-to-an-anchor-tag
  helpers.fakeClick = function(event, anchorObj) {
    if (anchorObj.click) {
      anchorObj.click()
    } else if (document.createEvent) {
      if (event.target !== anchorObj) {
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window,
          0, 0, 0, 0, 0, false, false, false, false, 0, null);
        var allowDefault = anchorObj.dispatchEvent(evt);
        // you can check allowDefault for false to see if
        // any handler called evt.preventDefault().
        // Firefox will *not* redirect to anchorObj.href
        // for you. However every other browser will.
      }
    }
  };
  helpers.getXpath = function(elm) {
    if (elm === document) {
      return 'document';
    }
    var allNodes = document.getElementsByTagName('*');
    for (var segs = []; elm && elm.nodeType == 1; elm = elm.parentNode) {
      if (elm.hasAttribute('id')) {
        var uniqueIdCount = 0;
        for (var n = 0; n < allNodes.length; n++) {
          if (allNodes[n].hasAttribute('id') && allNodes[n].id == elm.id) uniqueIdCount++;
          if (uniqueIdCount > 1) break;
        };
        if (uniqueIdCount == 1) {
          segs.unshift('id("' + elm.getAttribute('id') + '")');
          return segs.join('/');
        } else {
          segs.unshift(elm.localName.toLowerCase() + '[@id="' + elm.getAttribute('id') + '"]');
        }
      } else if (elm.hasAttribute('class')) {
        segs.unshift(elm.localName.toLowerCase() + '[@class="' + elm.getAttribute('class') + '"]');
      } else {
        for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) {
          if (sib.localName == elm.localName) i++;
        };
        segs.unshift(elm.localName.toLowerCase() + '[' + i + ']');
      };
    };
    return segs.length ? '/' + segs.join('/') : null;
  };

  helpers.getElement = function(path) {
    if (path === 'document') {
      return document;
    }
    var evaluator = new XPathEvaluator();
    var result = evaluator.evaluate(path, document.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue;
  }
  helpers.setCurrentPlayingMove = function(move) {
    $.cookie('currentPlayingMove', JSON.stringify(move));
  };
  helpers.getCurrentPlayingMove = function() {
    var val = $.cookie('currentPlayingMove');
    return val ? JSON.parse(val) : null;
  };
  helpers.createOrGetCookie = function() {
    var fromCookie = $.cookie('masterClientId');
    if (fromCookie) {
      return fromCookie;
    } else {
      var clientId = 'device_' + Math.floor(Math.random() * 100)
      $.cookie('masterClientId', clientId);
      return clientId;
    }

  };
})();