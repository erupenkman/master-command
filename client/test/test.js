var expect = chai.expect;
var assert = sinon.assert;
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
  });
  afterEach(function() {
    sandbox.restore();
  });
  describe('recordChange', function() {
    it('should emit a correct keypress event', function() {
      sandbox.stub(masterCommand, 'getXpath', function() {
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
  describe('recordScroll', function() {
    it('should emit a correct scroll event', function() {
      sandbox.stub(masterCommand, 'getXpath', function() {
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
  describe('recordClick', function() {
    it('should emit a correct click event', function() {
      sandbox.stub(masterCommand, 'getXpath', function() {
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
      var id = masterCommand.createOrGetCookie();
      expect(jQuery.cookie.calledWith('masterClientId')).to.equal(true);
      expect(id).to.exist;
    });
  });
  describe('handleMove', function() {

    it("should repeat the correct move", function() {
      sandbox.stub(masterCommand, 'masterClick');
      masterCommand.handleMove({
        lastMoveHash: 'h2',
        moves: [{
          type: 'click',
          hash: 'h1',
          xPath: '1'
        }, {
          type: 'click',
          hash: 'h2',
          xPath: '2'
        }, {
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
      masterCommand.handleMove({
        moves: []
      });
      expect(masterCommand.masterClick.called).to.equal(false);
    });

    it("should handle shitty data", function() {
      masterCommand.handleMove('yer mum');
      //that was the test
    });
  });
  describe('masterScroll', function() {
    it("should call fakeScroll", function() {
      sandbox.stub(masterCommand, 'fakeScroll');
      var thedocument = masterCommand.masterScroll({
        xPath: 'document',
        scrollTop: 7
      });
      assert.calledWith(masterCommand.fakeScroll, document, 7);
    });
  });
  describe('getXpath', function() {
    it("should handle document", function() {
      var xPath = masterCommand.getXpath(document);
      expect(xPath).to.equal('document');
    });
  });
  describe('getElement', function() {
    it("should handle document", function() {
      var thedocument = masterCommand.getElement('document');
      expect(thedocument).to.equal(document);
    });
  });

});