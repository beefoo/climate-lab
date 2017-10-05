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

    this.domain = [];
    this.time = this.opt.time;
    this.zone = this.opt.zone;

    this.loadListeners();

  };

  DataMap.prototype.initTime = function(domain) {
    this.domain = domain;

    // preload images
    for (var year=domain[0]; year<=domain[1]; year++) {
      var img =  new Image();
      img.src = this.opt.imageDir + 'frame' + year + '.png';
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
    this.time = value;

    var domain = this.domain;
    var year = Math.round(UTIL.lerp(domain[0], domain[1], value));
    this.$img[0].src = this.opt.imageDir + 'frame' + year + '.png';
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
