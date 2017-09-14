'use strict';

var Core = (function() {
  function Core(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Core.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.offsetX = this.opt.offsetX;

    this.onResize();
  };

  Core.prototype.onResize = function(){
    this.windowWidth = $(window).width();
    this.baseWidth = $('#base').width();
  };

  Core.prototype.selectLayer = function(el){
    $('.core-layer').removeClass('selected');
    $(el).addClass('selected');
  };

  Core.prototype.updateOffsetX = function(offsetX){
    this.offsetX = offsetX;

    if (!this.baseWidth) this.baseWidth = $('#base').width();
    if (!this.baseWidth) return false;

    var left0 = 0;
    var left1 = this.windowWidth - this.baseWidth;
    var left = UTIL.lerp(left0, left1, offsetX);

    this.$el.css('left', left+'px');

  };

  return Core;

})();
