'use strict';

var DataMap = (function() {
  function DataMap(options) {
    var defaults = {
      imageDir: 'img/map/'
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  DataMap.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.$img = this.$el.find('img').first();
    this.$helper = this.$el.find('.helper').first();

    this.frameCount = 0;
    this.time = this.opt.time;
    this.zone = this.opt.zone;

    this.loadListeners();

  };

  DataMap.prototype.initTime = function(frameCount) {
    this.frameCount = frameCount;

    // preload images
    for (var frame=1; frame<=frameCount; frame++) {
      var img =  new Image();
      img.src = this.opt.imageDir + 'frame' + UTIL.pad(frame, 5) + '.jpg';
    }

    this.updateTime(this.time);
  };

  DataMap.prototype.initZones = function(zoneCount) {
    var height = (1/zoneCount * 100);

    this.$helper.css({
      height: height + "%",
      display: "block"
    });

    this.updateZone(this.zone);
  };

  DataMap.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(e){
      _this.onResize();
    });
  };

  DataMap.prototype.onResize = function(){
  };

  DataMap.prototype.onVideoLoaded = function(){
  };

  DataMap.prototype.render = function(){

  };

  DataMap.prototype.updateTime = function(value){
    if (this.frameCount <= 0) return false;

    this.time = value;

    var frame = Math.round(value * (this.frameCount - 1)) + 1;
    frame = UTIL.pad(frame, 5);
    this.$img[0].src = this.opt.imageDir + 'frame' + frame + '.jpg';
  };

  DataMap.prototype.updateZone = function(value){
    this.zone = value;

    var h = this.$el.height();
    var hh = this.$helper.height();
    var maxTop = (h - hh) / h * 100;
    var top = this.zone * maxTop;

    this.$helper.css('top', top + '%');
  };

  return DataMap;

})();
