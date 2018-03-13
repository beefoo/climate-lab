'use strict';

var App = (function() {
  function App(options) {
    var defaults = {
      "scrollStep": 0.0001,
      "labelHeight": 0.26,
      "coreHeight": 0.15,
      "transition": 0.03,
      "annotations": [
        {"x": 0.333, "w": 0.01, "el": "#content1"},
        {"x": 0.4, "w": 0.02, "el": "#content2"}
      ],
      "markers": [
        {"x": 0.01, "w": 0.01},
        {"x": 0.1, "w": 0.01},
        {"x": 0.22, "w": 0.02},
        {"x": 0.5, "w": 0.03},
        {"x": 0.667, "w": 0.01},
        {"x": 0.75, "w": 0.02},
        {"x": 0.85, "w": 0.01},
        {"x": 0.9, "w": 0.02},
        {"x": 0.95, "w": 0.01}
      ]
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    this.loadAnnotations(this.opt.annotations);
    this.loadTimeline();
    this.loadListeners();

    this.annotation = this.annotations[0];

    this.onResize();
  };

  App.prototype.loadAnnotations = function(annotations){
    var start = 0;
    _.each(annotations, function(a, i){
      var end = 1;
      if (i < annotations.length-1) {
        var next = annotations[i+1];
        end = (next.x - a.x) * 0.5 + a.x;
      }
      annotations[i].start = start;
      annotations[i].end = end;
      annotations[i].index = i;
      annotations[i].$el = $(a.el);
      start = end;
    });

    this.annotations = annotations;
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

  App.prototype.loadTimeline = function(){
    this.$timeline = $('#timeline-canvas');
    this.app = new PIXI.Application(this.$timeline.width(), this.$timeline.height(), {antialias: true, transparent: true});
    this.indicator = new PIXI.Graphics();
    this.timeline = new PIXI.Graphics();
    this.app.stage.addChild(this.timeline, this.indicator);

    // buffer labels
    var g = this.timeline;
    var tdata = this.opt.timelineData;
    var labels = tdata.depthMarkers.length + tdata.timeMarkers.length;
    for (var i=0; i<labels; i++) {
      var label = new PIXI.Text("");
      g.addChild(label);
    }

    this.$timeline.append(this.app.view);
  };

  App.prototype.onResize = function() {
    this.timelineHeight = $("#timeline-canvas").height();
    this.timelineWidth = $("#timeline-canvas").width();
    this.timelineNodeX = this.timelineWidth * (991.0 / 2914.0);

    this.nodeOffset = $('#node').offset();

    this.app.renderer.resize(this.$timeline.width(), this.$timeline.height());

    this.renderTimeline();
    this.onScroll();
  };

  App.prototype.onScroll = function(offsetX) {
    if (!offsetX && this.offsetX) offsetX = this.offsetX;
    else if (!offsetX) offsetX = 0.0;

    // update globe
    var frame = "" + parseInt(Math.round(offsetX * 74));
    $('#globe-image').attr('src', "img/sea_ice/frame_"+frame.padStart(5, "0")+".png");

    // update dashboard
    var yearsago = Math.round(UTIL.lerp(19000, 10000, offsetX)).toLocaleString();
    var depth = Math.round(UTIL.lerp(1860, 1500, offsetX)).toLocaleString();
    var co2 = UTIL.round(UTIL.lerp(216, 148, offsetX), 1);
    var temp = UTIL.round(UTIL.lerp(5.4, 1.6, offsetX), 1);
    var sl = UTIL.round(UTIL.lerp(120.2, 60.2, offsetX), 1);
    var population = UTIL.round(UTIL.lerp(1.1, 1.9, offsetX), 1);
    $('#years-ago').text(yearsago);
    $('#depth').text(depth);
    $('#co2').text(co2);
    $('#temperature').text(temp);
    $('#sea_level').text(sl);
    $('#population').text(population);

    var pIndex = this.annotation.index;
    var aIndex = this.annotations.length-1;
    _.each(this.annotations, function(a, i){
      if (offsetX >= a.start && offsetX < a.end) {
        aIndex = i;
      }
    });
    this.annotation = this.annotations[aIndex];
    var changed = (pIndex !== aIndex);

    if (changed) {
      $('.content').removeClass('active');
      this.annotation.$el.addClass('active');
    }

    this.renderIndicator(offsetX);

    this.offsetX = offsetX;
  };

  App.prototype.renderIndicator = function(offsetX){
    // draw indicator
    var width = this.app.renderer.width;
    var height = this.app.renderer.height;
    var ann = this.annotation;

    var labelHeight = this.opt.labelHeight * height;
    var coreHeight = this.opt.coreHeight * height;
    var h = height - labelHeight - coreHeight;

    var x0 = this.nodeOffset.left + 14;
    var x1 = ann.x * width;

    var transition = this.opt.transition;
    if (ann.index > 0 && (offsetX-ann.start) < transition) {
      x1 = UTIL.lerp(this.annotations[ann.index-1].x, ann.x, (offsetX-ann.start) / transition) * width;
    }

    var y0 = 0;
    var y1 = h;

    this.indicator.clear();

    var ann0 = this.annotations[0];
    var ann1 = this.annotations[1];
    var lx = UTIL.lerp(ann0.x * width, ann1.x * width, offsetX);
    this.indicator.beginFill(0xffcc00);
    this.indicator.drawRect(lx, y1, width * 0.005, coreHeight);
    this.indicator.endFill();

    var xmid = (x1 - x0) / 2 + x0;
    var ymid = (y1 - y0) / 2 + y0;

    this.indicator.lineStyle(width * 0.005, 0x61859e);
    this.indicator.moveTo(x0, y0);
    this.indicator.quadraticCurveTo(x0, ymid, xmid, ymid);
    this.indicator.quadraticCurveTo(x1, ymid, x1, y1);

    this.indicator.lineStyle(0);
    this.indicator.beginFill(0x8caaba);
    this.indicator.drawCircle(x1, y1, width * 0.005);
    this.indicator.endFill();
  };

  App.prototype.renderTimeline = function(){
    var timeline = this.timeline;

    // draw indicator
    var width = this.app.renderer.width;
    var height = this.app.renderer.height;

    var labelHeight = this.opt.labelHeight * height;
    var coreHeight = this.opt.coreHeight * height;

    var bottomLabelY = height - labelHeight;
    var coreY = bottomLabelY - coreHeight;
    var topLabelY = coreY - labelHeight;

    timeline.clear();

    timeline.lineStyle(0);
    timeline.beginFill(0x41617c);
    timeline.drawRect(0, coreY, width, coreHeight);
    timeline.endFill();

    timeline.beginFill(0x61859e);
    var markers = []
    markers = markers.concat(this.annotations, this.opt.markers);
    _.each(markers, function(a, i){
      var w = a.w * width;
      var x = a.x * width - w * 0.5;
      timeline.drawRect(x, coreY, w, coreHeight);
    });
    timeline.endFill();

    var tdata = this.opt.timelineData;
    var depths = tdata.depthMarkers;
    var times = tdata.timeMarkers;
    var labelIndex = 0;
    var textStyle = {
      "align": "center",
      "fill": "#ffffff",
      "fontSize": width * 0.0075,
      "wordWrap": true,
      "wordWrapWidth": width * 0.05
    }
    var lineHeight = coreHeight * 0.333;

    timeline.lineStyle(width * 0.001, 0x73777a);
    _.each(depths, function(d, i){
      var x = d.x * width;
      timeline.moveTo(x, bottomLabelY);
      timeline.lineTo(x, bottomLabelY + lineHeight);

      var label = timeline.children[labelIndex];
      label.text = d.label;
      label.style = textStyle;
      label.x = x;
      label.y = bottomLabelY + lineHeight * 1.5;
      label.anchor.set(0.5, 0.0);
      labelIndex++;
    });

    _.each(times, function(d, i){
      var x = d.x * width;
      timeline.moveTo(x, coreY);
      timeline.lineTo(x, coreY - lineHeight);

      var label = timeline.children[labelIndex];
      label.text = d.label;
      label.style = textStyle;
      label.x = x;
      label.y = coreY - (lineHeight * 1.5);
      label.anchor.set(0.5, 1.0);
      labelIndex++;
    });

  };

  return App;

})();

$(function() {
  $.getJSON("data/timeline.json", function(data) {
    var app = new App({
      timelineData: data
    });
  });

});
