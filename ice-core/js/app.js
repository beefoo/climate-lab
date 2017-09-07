'use strict';

var App = (function() {
  function App(options) {
    var defaults = {
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    this.offsetX = 0;

    this.core = new Core({el: "#core", offsetX: this.offsetX});
    this.timeline = new Timeline({el: "#timeline", offsetX: this.offsetX});

    this.loadListeners();
  };

  App.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(e){
      _this.onResize();
    })
  };

  App.prototype.onResize = function(){
    this.core.onResize();
    this.timeline.onResize();
  };

  App.prototype.render = function(){
    var _this = this;

    this.core.render();
    this.timeline.render();

    requestAnimationFrame(function(){ _this.render(); });
  };

  App.prototype.updateOffsetX = function(offsetX){
    this.core.updateOffsetX(offsetX);
    this.timeline.updateOffsetX(offsetX);
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
