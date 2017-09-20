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

    this.depth = this.opt.depth;
    this.yearsAgo = this.opt.yearsAgo;

    this.$base = $('#base');
    this.$layers = $('.core-layer');

    this.onResize();
  };

  Core.prototype.onResize = function(){
    this.windowWidth = $(window).width();
    this.baseWidth = this.$base.width();
  };

  Core.prototype.selectLayer = function(el){
    $('.core-layer').removeClass('selected');
    $(el).addClass('selected');
  };

  Core.prototype.updateOffsetX = function(offsetX){
    this.offsetX = offsetX;

    if (!this.baseWidth) this.onResize();
    if (!this.baseWidth) return false;

    var startOffset = this.windowWidth * 0.5;
    var left = UTIL.lerp(startOffset, startOffset-this.baseWidth, offsetX);

    this.$base.css('left', left+'px');
    this.$layers.css('left', left+'px');

    var meters = UTIL.lerp(this.depth[0], this.depth[1], offsetX);
    var years = UTIL.lerp(this.yearsAgo[0], this.yearsAgo[1], offsetX);

    $('#label').html(UTIL.round(meters,2) + ' meters deep<br /><span>'+ Math.round(years).toLocaleString()+' years ago</span>');
  };

  return Core;

})();
