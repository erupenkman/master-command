var expect = chai.expect;
var assert = sinon.assert;
var NAVIGATE_COOKIE_NAME = 'masterNavigateUrl';
var CLICK_MOVE = {
  type: 'click',
  hash: 'h1',
  xPath: '1'
};
Object.freeze(CLICK_MOVE);
describe("master", function() {
  var sandbox = null;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    sandbox.stub(masterCommand.socket, 'emit', function() {
      console.log('emit', arguments);
    });
    sandbox.stub(masterCommand.socket, 'on', function() {
      console.log('on', arguments);
    });
    $.removeCookie('masterClientId')
    $.removeCookie(NAVIGATE_COOKIE_NAME)
  });
  afterEach(function() {
    sandbox.restore();
  });
  describe('recordChange', function() {
    it('should emit a correct keypress event', function() {
      sandbox.stub(helpers, 'getXpath', function() {
        return 'testXPath';
      })
      var fakeInput = $('<input/>');
      fakeInput.val('theVal');
      masterCommand.recordChange({
        target: fakeInput
      });

      assert.calledWithMatch(masterCommand.socket.emit, function(arg1) {
        return arg1 === 'event';
      }, function(arg2) {
        return arg2.xPath === 'testXPath' && arg2.newContent === 'theVal';
      });

    });
  });
  describe('recordNavigate', function() {
    it('should emit a correct navigate event', function() {
      masterCommand.recordNavigate({
        url: 'http://test.com'
      });
      assert.calledWithMatch(masterCommand.socket.emit, function(arg1) {
        return arg1 === 'event';
      }, function(arg2) {
        return arg2.type === 'navigate' && arg2.url === 'http://test.com';
      });
    });
  });
  describe('recordScroll', function() {
    it('should emit a correct scroll event', function() {
      sandbox.stub(helpers, 'getXpath', function() {
        return 'window';
      })
      masterCommand.recordScroll({
        target: window
      });
      assert.calledWithMatch(masterCommand.socket.emit, function(arg1) {
        return arg1 === 'event';
      }, function(arg2) {
        return arg2.xPath === 'window';
      });

    });
  });
  describe('recordHoverStart', function() {
    it('should emit a correct hoverStart event', function() {
      sandbox.stub(helpers, 'getXpath', function() {
        return 'testXPath';
      });

      var fakeDiv = $('<div>');
      masterCommand.recordHoverStart({
        target: fakeDiv
      });
      assert.calledWithMatch(masterCommand.socket.emit, function(arg1) {
        return arg1 === 'event';
      }, function(arg2) {
        return arg2.xPath === 'testXPath' && arg2.type === 'hoverStart';
      });
    });
  });
  describe('recordClick', function() {
    it('should emit a correct click event', function() {
      sandbox.stub(helpers, 'getXpath', function() {
        return 'testXPath';
      })
      masterCommand.recordClick({});

      assert.calledWithMatch(masterCommand.socket.emit, function(arg1) {
        return arg1 === 'event';
      }, function(arg2) {
        return arg2.xPath === 'testXPath' && arg2.type === 'click' && arg2.newContent === undefined;
      });
    });
  });
  describe('masterKeyPress', function() {

  });
  describe('createOrGetCookie', function() {
    it("should create a new cookie", function() {
      sandbox.stub(jQuery, "cookie", function(arg1, arg2) {
        if (arg2 == null) {
          return null;
        }
      });
      var id = helpers.createOrGetCookie();
      expect(jQuery.cookie.calledWith('masterClientId')).to.equal(true);
      expect(id).to.exist;
    });
  });
  describe('getUncompletedMoves', function() {
    it('should get the last move', function() {
      var uncompleted = helpers.getUncompletedMoves({
        moves: [CLICK_MOVE, {
          type: 'click',
          hash: 'h2',
          xPath: '2'
        }, {
          type: 'click',
          hash: 'h3',
          xPath: '3'
        }],
        lastMoveHash: 'h2'
      });
      expect(uncompleted.length).to.equal(1);
      expect(uncompleted[0].hash).to.equal('h3');
    })
    it('should get all moves', function() {
      var uncompleted = helpers.getUncompletedMoves({
        moves: [
          CLICK_MOVE, {
            type: 'click',
            hash: 'h2',
            xPath: '2'
          }, {
            type: 'click',
            hash: 'h3',
            xPath: '3'
          }
        ],
        lastMoveHash: 'h0'
      });
      expect(uncompleted.length).to.equal(3);
      expect(uncompleted[2].hash).to.equal('h3');
    })
  });
  describe('handleMoves', function() {

    it("should repeat the correct move", function() {
      sandbox.stub(masterCommand, 'masterClick');
      masterCommand.handleMoves({
        lastMoveHash: '',
        moves: [{
          type: 'click',
          hash: 'h3',
          xPath: '3'
        }]
      });
      expect(masterCommand.masterClick.calledWith('3')).to.equal(true);
      //that was the test
    });
    it("should do nothing when 0 moves", function() {
      sandbox.stub(masterCommand, 'masterClick');
      masterCommand.handleMoves({
        moves: []
      });
      expect(masterCommand.masterClick.called).to.equal(false);
    });
    it("should notify the server when move is complete", function() {
      sandbox.stub(masterCommand, 'masterClick', function(move, callback) {
        callback();
      });
      masterCommand.handleMoves({
        lastMoveHash: '',
        moves: [CLICK_MOVE]
      });
      assert.calledWithMatch(masterCommand.socket.emit, function(arg1) {
        return arg1 === 'playMove';
      }, function(arg2) {
        return arg2.hash === 'h1';
      });
    });
    it("should not notify the server when move fails", function() {
      sandbox.stub(masterCommand, 'masterClick');
      try {
        masterCommand.handleMoves({
          lastMoveHash: '',
          moves: [CLICK_MOVE]
        });
      } catch (e) {}
      assert.neverCalledWithMatch(masterCommand.socket.emit, function(arg1) {
        return arg1 === 'playMove';
      }, function(arg2) {
        return arg2.hash === 'h1';
      });
    });
    it("should save the move it's playing into a cookie", function() {
      var currentPlayingMove;
      sandbox.stub(masterCommand, 'masterClick', function(move) {
        currentPlayingMove = helpers.getCurrentPlayingMove();
      });
      masterCommand.handleMoves({
        lastMoveHash: '',
        moves: [CLICK_MOVE]
      });
      expect(currentPlayingMove.hash).to.equal('h1');
    });
    it("should pass a callback to clear the currentPlayingMove cookie", function() {
      sandbox.stub(masterCommand, 'masterClick', function(move, callback) {
        callback();
      });
      masterCommand.handleMoves({
        lastMoveHash: '',
        moves: [CLICK_MOVE]
      });
      var currentPlayingMove = helpers.getCurrentPlayingMove();
      expect(currentPlayingMove).to.equal(null);
    });

    it("should handle shitty data", function() {
      // masterCommand.handleMoves('yer mum');
      //that was the test
    });
  });
  describe('handleCurrentPlayingMove', function() {
    it("should record navigate if move is null", function() {
      sandbox.stub(masterCommand, 'recordNavigate');
      sandbox.stub(helpers, 'getCurrentPlayingMove', function() {
        return null;
      });
      masterCommand.handleCurrentPlayingMove();
      assert.called(masterCommand.recordNavigate);
    });
  });
  describe('masterScroll', function() {
    it("should call fakeScroll", function() {
      sandbox.stub(helpers, 'fakeScroll');
      var thedocument = masterCommand.masterScroll({
        xPath: 'document',
        scrollTop: 7
      });
      assert.calledWith(helpers.fakeScroll, document, 7);
    });
  });
  describe('masterNavigte', function() {
    it("should  reload", function() {
      sandbox.stub(helpers, 'fakeNavigate');
      masterCommand.masterNavigate({
        url: 'test.com'
      });
      assert.calledWith(helpers.fakeNavigate, 'test.com');
    });
  });
  describe('getXpath ', function() {
    it("should handle document", function() {
      var xPath = helpers.getXpath(document);
      expect(xPath).to.equal('document');
    });
  });
  describe('getElement ', function() {
    it("should handle document", function() {
      var thedocument = helpers.getElement('document');
      expect(thedocument).to.equal(document);
    });
  });

});