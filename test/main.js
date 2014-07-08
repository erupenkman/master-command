/*global describe, it*/
"use strict";

var expect = require("chai").expect,
  command = require('../server.js'),
  sinon = require('sinon');

require("mocha");

var gutil = require("gulp-util");

describe("master-command", function() {
  var sandbox = null;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();
  });
  afterEach(function() {
    sandbox.restore();
  });
  describe("matchDevice", function() {
    it('should add new device', function() {
      command.matchDevice('123');
      expect(command.getDevice(0).id).to.equal('123');
    });
    it('should do nothing if passed null', function() {
      command.matchDevice(null);
      expect(command.matchDevice(null)).to.equal(null);
    });
    it('should retrieve existing device', function() {
      var newDev = command.matchDevice('123');
      newDev.lastMove = 'quest';
      var retrieved = command.matchDevice('123');
      expect(retrieved.lastMove).to.equal('quest');
    });
    it('should add new device', function() {
      command.matchDevice('123');
      expect(command.getDevice(0).id).to.equal('123');
    });
  });
});