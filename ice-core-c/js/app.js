'use strict';

var App = (function() {
  function App(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    this.offsetX = 0;

    this.cores = this.opt.cores;
    this.core = new Core({el: "#core", offsetX: this.offsetX, yearsAgo: this.opt.yearsAgo, depth: this.opt.depth});
    this.content = new Content();

    this.loadListeners();
  };

  App.prototype.loadListeners = function(){
    var _this = this;
    var scrollStep = this.opt.scrollStep;

    $(window).on('resize', function(e){
      _this.onResize();
    });

    $(window).mousewheel(function(e) {
      var delta = e.deltaY * scrollStep * -1;
      var offsetX = _this.offsetX + delta;
      offsetX = UTIL.lim(offsetX, 0, 1);
      _this.updateOffsetX(offsetX);
    });
  };

  App.prototype.onResize = function(){
    this.core.onResize();
  };

  App.prototype.updateOffsetX = function(offsetX){
    this.offsetX = offsetX;
    this.core.updateOffsetX(offsetX);
    this.content.updateOffsetX(offsetX);
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
