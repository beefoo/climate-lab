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
    this.$img = this.$el.find('#video-temperature').first();
    this.$helper = this.$el.find('.helper').first();
    this.$worldmap = this.$el.find('#worldmap').first();

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
      img.src = this.opt.imageDir + 'frame' + UTIL.pad(frame, 5) + '.png';
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
    this.updateZone(this.zone);
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
    this.$img[0].src = this.opt.imageDir + 'frame' + frame + '.png';
  };

  DataMap.prototype.updateZone = function(value){
    this.zone = value;

    var h = this.$el.height();
    var hh = this.$helper.height();
    var maxTop = (h - hh) / h * 100;
    var top = this.zone * maxTop;

    this.$helper.css('top', top + '%');

    var hw = this.$helper.width();
    var y0 = top / 100 * h;
    var y1 = y0 + hh;
    this.$worldmap.css('clip', 'rect('+y0+'px,'+hw+'px,'+y1+'px,0px)');
  };

  return DataMap;

})();
