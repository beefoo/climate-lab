'use strict';

var Timeline = (function() {
  function Timeline(options) {
    var defaults = {
      highlight: [0, 0, 1, 0.4],
      timeline: [0, 0.4, 1, 0.6],
      timelineTextStyle: {
        fill: "#fff",
        fontSize: 16,
        fontWeight: "bold"
      },
      timelineSubtextStyle: {
        fill: "#fff",
        fontSize: 14
      }
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Timeline.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.offsetX = this.opt.offsetX;
    this.width = this.opt.width;
    this.markers = this.opt.markers;
    this.targetDepth = this.markers[0];

    var data = this.opt.data;
    this.axisLabels = data.axisLabels;
    this.depthRange = data.depthRange;
    this.events = data.events;

    this.loadView();
    this.renderAll();
  };

  Timeline.prototype.loadView = function(){
    this.app = new PIXI.Application(this.$el.width(), this.$el.height(), {transparent : true, antialias: true});
    this.timeline = new PIXI.Graphics();
    this.highlight = new PIXI.Graphics();
    this.marker = new PIXI.Graphics();
    this.app.stage.addChild(this.highlight, this.timeline, this.marker);

    this.$el.append(this.app.view);
  };

  Timeline.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());
    this.renderAll();
  };

  Timeline.prototype.render = function(){
    this.renderHighlight();
    this.renderMarker();
  };

  Timeline.prototype.renderAll = function(){
    this.renderHighlight();
    this.renderMarker();
    this.renderTimeline();
  };

  Timeline.prototype.renderHighlight = function(){
    var targetDepth = this.targetDepth;
    if (targetDepth === false) {
      this.highlight.clear();
      return false;
    }

    var x = this.app.renderer.width * this.opt.highlight[0];
    var y = this.app.renderer.height * this.opt.highlight[1];
    var w = this.app.renderer.width * this.opt.highlight[2];
    var h = this.app.renderer.height * this.opt.highlight[3];
    var depthRange = this.depthRange;

    var circleRadius = h * 0.1;
    var xh = x + w * 0.5;
    var xn = UTIL.norm(targetDepth, depthRange[0], depthRange[1]);
    var xp = x + xn * w;

    this.highlight.clear();

    this.highlight.lineStyle(h * 0.03, 0x8dd64d);
    this.highlight.moveTo(xh, y+circleRadius);
    this.highlight.lineTo(xp, y+h);

    this.highlight.lineStyle(0);
    this.highlight.beginFill(0x8dd64d);
    this.highlight.drawCircle(xh, y+circleRadius, circleRadius);
    this.highlight.endFill();

  };

  Timeline.prototype.renderMarker = function(){
    var _this = this;
    var x = this.app.renderer.width * this.opt.timeline[0];
    var y = this.app.renderer.height * this.opt.timeline[1];
    var w = this.app.renderer.width * this.opt.timeline[2];
    var h = this.app.renderer.height * this.opt.timeline[3];
    var depthRange = this.depthRange;
    var targetDepth = this.targetDepth;

    var windowRatio = this.app.renderer.width / this.width;
    var d0 = UTIL.lerp(0, 1-windowRatio, this.offsetX);

    var rx = d0 * w + x;
    var ry = y;
    var rw = windowRatio * w;
    var rh = h * 0.25;
    var markerW = w * 0.01;

    this.marker.clear();
    this.marker.lineStyle(0);

    _.each(this.markers, function(depth, i){
      _this.marker.beginFill(0xffd83d, 0.8);
      if (depth === targetDepth) {
        _this.marker.beginFill(0x8dd64d, 0.8);
      }
      var xn = UTIL.norm(depth, depthRange[0], depthRange[1]);
      var xp = x + xn * w - markerW/2;
      _this.marker.drawRect(xp, ry, markerW, rh);
      _this.marker.endFill();
    });


    this.marker.lineStyle(h * 0.03, 0xffffff);
    this.marker.beginFill(0xffffff, 0.2);
    this.marker.drawRect(rx, ry, rw, rh);
    this.marker.endFill();
  };

  Timeline.prototype.renderTimeline = function(){
    var _this = this;
    var x = this.app.renderer.width * this.opt.timeline[0];
    var y = this.app.renderer.height * this.opt.timeline[1];
    var w = this.app.renderer.width * this.opt.timeline[2];
    var h = this.app.renderer.height * this.opt.timeline[3];

    this.timeline.clear();
    while(this.timeline.children[0]) {
      this.timeline.removeChild(this.timeline.children[0]);
    }

    var depthRange = this.depthRange;
    var coreH = h * 0.25;
    var coreY = y;
    var lineH = h * 0.1;
    var lineY = coreY + coreH;
    var labelY = lineY + lineH + h * 0.02;
    var labelH = h * 0.1;
    var sublabelY = labelY + labelH + h * 0.03;
    var sublabelH = h * 0.08;

    this.timeline.lineStyle(0);
    this.timeline.beginFill(0x6195a2);
    this.timeline.drawRoundedRect(x, coreY, w, coreH, coreH * 0.5);
    this.timeline.endFill();

    var textStyle = this.opt.timelineTextStyle;
    var subtextStyle = this.opt.timelineSubtextStyle;
    var count = this.axisLabels.length;

    textStyle.fontSize = labelH;
    subtextStyle.fontSize = sublabelH;

    _.each(this.axisLabels, function(l, i){
      var xn = UTIL.norm(l.depth, depthRange[0], depthRange[1]);
      var xp = x + xn * w;

      var label = new PIXI.Text(l.depth + " meters", textStyle);
      var sublabel = new PIXI.Text(l.yearsBP.toLocaleString() + " years ago", subtextStyle);

      label.x = xp;
      label.y = labelY;
      sublabel.x = xp;
      sublabel.y = sublabelY;

      var anchorX = 0.5;
      // draw beginning cap
      if (i <= 0) {
        anchorX = 0;
        var xw = w * 0.01
        xp += xw;
      }
      // draw ending cap
      if (i >= count-1) {
        anchorX = 1;
        var xw = w * 0.01
        xp -= xw;
      }
      label.anchor.set(anchorX, 0);
      sublabel.anchor.set(anchorX, 0);

      _this.timeline.lineStyle(h * 0.03, 0x565b5b);
      _this.timeline.moveTo(xp, lineY);
      _this.timeline.lineTo(xp, lineY + lineH);
      _this.timeline.addChild(label);
      _this.timeline.addChild(sublabel);

    });
  };

  Timeline.prototype.updateDepth = function(depth){
    this.targetDepth = depth;
  };

  Timeline.prototype.updateOffsetX = function(offsetX){
    this.offsetX = offsetX;
    this.render();
  };

  return Timeline;

})();
