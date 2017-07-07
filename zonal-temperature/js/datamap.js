'use strict';

var DataMap = (function() {
  function DataMap(options) {
    var defaults = {  };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  DataMap.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.$video = this.$el.find('video').first();
    this.video = this.$video[0];
    this.$helper = this.$el.find('.helper').first();

    this.time = this.opt.time;
    this.zone = this.opt.zone;

    this.loadListeners();
  };

  DataMap.prototype.initZones = function(zoneCount) {
    var height = (1/zoneCount * 100);

    this.$helper.css({
      height: height + "%",
      display: "block",
      marginTop: "-" + (height/2) + "%"
    });

    this.updateZone(this.zone);
  };

  DataMap.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(e){
      _this.onResize();
    })

    this.video.addEventListener('loadeddata', function(e){
      _this.onVideoLoaded();
    });
  };

  DataMap.prototype.onResize = function(){
  };

  DataMap.prototype.onVideoLoaded = function(){
  };

  DataMap.prototype.render = function(){

  };

  DataMap.prototype.updateTime = function(value){
    if (!this.video || !this.video.duration) return false;

    this.time = value;

    var dur = this.video.duration;
    var time = dur * value;
    this.video.currentTime = time;
    this.video.pause();
  };

  DataMap.prototype.updateZone = function(value){
    this.zone = value;
    var top = this.zone * 100;

    this.$helper.css('top', top + '%');
  };

  return DataMap;

})();
