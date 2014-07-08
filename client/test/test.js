var expect = chai.expect;
describe("master", function() {
  var sandbox = null;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    $.removeCookie('masterClientId')
  });
  afterEach(function() {
    sandbox.restore();
  });
  describe('fakeClick', function() {

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
          hash: 'h1',
          xPath: '1'
        }, {
          hash: 'h2',
          xPath: '2'
        }, {
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
      //that was the test
    });

    it("should handle shitty data", function() {
      masterCommand.handleMove('yer mum');
      //that was the test
    });
  });


});