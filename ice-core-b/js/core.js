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
    this.$layers = $('#mask .core-layer');
    this.$mask = $('#mask');

    this.onResize();
  };

  Core.prototype.onResize = function(){
    this.windowWidth = $(window).width();
    this.baseWidth = this.$base.width();
    this.maskWidth = this.$mask.width();
  };

  Core.prototype.selectLayer = function(el){
    $('.core-layer').removeClass('selected');
    $(el).addClass('selected');
  };

  Core.prototype.updateOffsetX = function(offsetX){
    this.offsetX = offsetX;

    if (!this.baseWidth) this.onResize();
    if (!this.baseWidth) return false;

    var maskOffset = (this.windowWidth - this.maskWidth) / 2;
    var left0 = maskOffset;
    var left1 = this.windowWidth - this.baseWidth - maskOffset;
    var left = UTIL.lerp(left0, left1, offsetX);

    this.$base.css('left', left+'px');

    left = UTIL.lerp(0, left1 - maskOffset, offsetX);
    this.$layers.css('left', left+'px');

    var maskMeters = (this.maskWidth / this.baseWidth) * (this.depth[1]-this.depth[0]);
    var meters0 = UTIL.lerp(this.depth[0], this.depth[1]+maskMeters, offsetX);
    var meters1 = meters0 + maskMeters;

    var yearMeters = (this.maskWidth / this.baseWidth) * (this.yearsAgo[1]-this.yearsAgo[0]);
    var years0 = UTIL.lerp(this.yearsAgo[0], this.yearsAgo[1]+yearMeters, offsetX);
    var years1 = years0 + yearMeters;

    $('#label-left').html(UTIL.round(meters0,2) + ' meters deep<br /><span>'+ Math.round(years0)+' years ago</span>');
    $('#label-right').html(UTIL.round(meters1,2) + ' meters deep<br /><span>'+ Math.round(years1)+' years ago</span>');
  };

  return Core;

})();
