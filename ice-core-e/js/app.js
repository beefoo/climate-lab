'use strict';

var App = (function() {
  function App(options) {
    var defaults = {
      "scrollStep": 0.0001
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    this.loadTimelineIndicator();
    this.loadListeners();

    this.onResize();
  };

  App.prototype.loadListeners = function(){
    var _this = this;
    var scrollStep = this.opt.scrollStep;
    var offsetX = 0.0;
    var scrolling = false;
    var timeout = false;

    $(window).on('resize', function(e){
      _this.onResize();

    });

    $(window).mousewheel(function(e) {
      var delta = e.deltaY * scrollStep * -1;
      scrolling = true;
      if (timeout) clearTimeout(timeout);
      $('#ice-core').css('opacity', 0);
      timeout = setTimeout(function(){
        scrolling = false;
        $('#ice-core').css('opacity', 1);
      }, 1000);
      offsetX += delta;
      offsetX = UTIL.lim(offsetX, 0, 1);
      _this.onScroll(offsetX);
    });
  };

  App.prototype.loadTimelineIndicator = function(){
    this.$timelineIndicator = $('#timeline-indicator');
    this.indicatorApp = new PIXI.Application(this.$timelineIndicator.width(), this.$timelineIndicator.height(), {antialias: true, transparent: true});
    this.indicator = new PIXI.Graphics();
    this.indicatorApp.stage.addChild(this.indicator);
    this.$timelineIndicator.append(this.indicatorApp.view);
  };

  App.prototype.onResize = function() {
    this.width = $(window).width();
    this.timelineHeight = $("#timeline").height();
    this.timelineWidth = this.timelineHeight * (2914.0 / 170.0);
    this.timelineNodeX = this.timelineWidth * (991.0 / 2914.0);
    this.timelineDelta = this.timelineWidth - this.width;

    this.nodeOffset = $('#node').offset();

    this.indicatorApp.renderer.resize(this.$timelineIndicator.width(), this.$timelineIndicator.height());

    this.onScroll();
  };

  App.prototype.onScroll = function(offsetX) {
    if (!offsetX && this.offsetX) offsetX = this.offsetX;
    else if (!offsetX) offsetX = 0.0;

    // update timeline
    var deltaX = -offsetX * this.timelineDelta;
    $('#timeline-image').css('left', deltaX + 'px');

    // update globe
    var frame = "" + parseInt(Math.round(offsetX * 74));
    $('#globe-image').attr('src', "img/sea_ice/frame_"+frame.padStart(5, "0")+".png");

    // update dashboard
    var yearsago = Math.round(UTIL.lerp(19000, 10000, offsetX)).toLocaleString();
    var depth = Math.round(UTIL.lerp(1860, 1500, offsetX)).toLocaleString();
    var co2 = UTIL.round(UTIL.lerp(216, 148, offsetX), 1);
    var temp = UTIL.round(UTIL.lerp(5.4, 1.6, offsetX), 1);
    var sl = UTIL.round(UTIL.lerp(120.2, 60.2, offsetX), 1);
    $('#years-ago').text(yearsago);
    $('#depth').text(depth);
    $('#co2').text(co2);
    $('#temperature').text(temp);
    $('#sea_level').text(sl);

    // draw indicator
    var w = this.indicatorApp.renderer.width;
    var h = this.indicatorApp.renderer.height;
    var x0 = this.nodeOffset.left + 14;
    var x1 = this.timelineNodeX + deltaX;
    var y0 = 0;
    var y1 = h;
    var xmid = (x1 - x0) / 2 + x0;
    var ymid = (y1 - y0) / 2 + y0;
    this.indicator.clear();
    this.indicator.lineStyle(w * 0.005, 0x61859e);
    this.indicator.moveTo(x0, y0);
    this.indicator.quadraticCurveTo(x0, ymid, xmid, ymid);
    this.indicator.quadraticCurveTo(x1, ymid, x1, y1);
    this.offsetX = offsetX;
  };

  return App;

})();

$(function() {
  var app = new App({});
});
