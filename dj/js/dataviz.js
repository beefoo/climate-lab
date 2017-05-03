'use strict';

var DataViz = (function() {
  function DataViz(options) {
    var defaults = {
      el: '#main',
      margin: 100,
      tickLength: 10,
      pointRadius: 4,
      axisTextStyle: {
        fill: "#ffffff",
        fontSize: 16
      },
      labelTextStyle: {
        fill: "#ffffff",
        fontSize: 24,
        fontWeight: "bold"
      }
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  DataViz.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.data = false;

    this.loadView();
    this.loadListeners();
  };

  DataViz.prototype.loadData = function(data){
    this.data = data;

    this.renderAxes();
    this.renderPlot();
    this.renderLabel();
  };

  DataViz.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(e){
      _this.onResize();
    })
  };

  DataViz.prototype.loadView = function(){
    this.app = new PIXI.Application(this.$el.width(), this.$el.height(), {transparent : true});
    this.axes = new PIXI.Graphics();
    this.plot = new PIXI.Graphics();
    this.plotProgress = new PIXI.Graphics();
    this.labels = new PIXI.Graphics();

    this.app.stage.addChild(this.axes, this.plot, this.plotProgress, this.labels);

    this.$el.append(this.app.view);
  };

  DataViz.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());
  };

  DataViz.prototype.render = function(progress){
    this.plotProgress.clear();
  };

  DataViz.prototype.renderAxes = function(){
    var _this = this;
    var xs = this.data.xAxis;
    var ys = this.data.yAxis;
    var xl = xs.length;
    var yl = ys.length;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var margin = this.opt.margin;
    var cw = w - margin * 2;
    var ch = h - margin * 2;
    var len = this.opt.tickLength;

    var textStyle = new PIXI.TextStyle(this.opt.axisTextStyle);

    // clear axes
    this.axes.clear();
    this.axes.lineStyle(2, 0x595454);
    while(this.axes.children[0]) {
      this.axes.removeChild(this.axes.children[0]);
    }

    // draw x ticks/labels
    var y = h - margin;
    var x = margin;
    $.each(xs, function(i, value){
      x = margin + (i / (xl-1)) * cw;

      // draw tick
      if (value.length) {
        _this.axes.moveTo(x, y).lineTo(x, y+len);
      }

      // draw label
      if (value.length && value != "-") {
        var label = new PIXI.Text(value, textStyle);
        label.x = x;
        label.y = y+len+20;
        label.anchor.set(0.5, 0.0);
        _this.axes.addChild(label);
      }
    });

    // draw y ticks/labels
    x = margin
    $.each(ys, function(i, value){
      y = h - margin - ((i / (yl-1)) * ch);
      _this.axes.moveTo(x, y).lineTo(x-len, y);

      if (i==0 || i >= yl-1) {
        var label = new PIXI.Text(value, textStyle);
        label.x = x-len-20;
        label.y = y;
        label.anchor.set(1.0, 0.5);
        _this.axes.addChild(label);
      }
    });
  };

  DataViz.prototype.renderLabel = function(text, x, y, clear){
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var margin = this.opt.margin;
    var labelText = text || this.data.label;

    // clear labels
    if (clear !== false) {
      this.labels.clear();
      while(this.labels.children[0]) {
        this.labels.removeChild(this.labels.children[0]);
      }
    }

    var textStyle = new PIXI.TextStyle(this.opt.labelTextStyle);
    var label = new PIXI.Text(labelText, textStyle);
    label.x = x==undefined ? w / 2 : x;
    label.y = y==undefined ? margin / 2 : y;
    label.anchor.set(0.5, 0.5);
    this.labels.addChild(label);
  };

  DataViz.prototype.renderPlot = function(dataPoints, targetWidth, targetHeight, targetLeft, targetTop, clear){
    var _this = this;
    var points = dataPoints || this.data.data;
    var w = targetWidth || this.app.renderer.width;
    var h = targetHeight || this.app.renderer.height;
    var xOffset = targetLeft || 0;
    var yOffset = targetTop || 0;
    var margin = this.opt.margin;
    var cw = w - margin * 2;
    var ch = h - margin * 2;
    var rad = this.opt.pointRadius;

    // clear plot
    if (clear !== false) {
      this.plot.clear();
    }
    this.plot.beginFill(0x595454);

    // draw points
    $.each(points, function(i, p){
      var x = p[0] * cw + margin + xOffset;
      var y = h - margin - (p[1] * ch) + yOffset;
      if (x >= margin && x <= w-margin && y >= margin && y <= h-margin) {
        _this.plot.drawCircle(x, y, rad);
      }
    });
  };

  DataViz.prototype.transitionAxes = function(d1, d2, percent) {

  }

  DataViz.prototype.transitionData = function(d1, d2, percent) {
    this.transitionAxes(d1, d2, percent);
    this.transitionPlot(d1, d2, percent);
    this.transitionLabel(d1, d2, percent);
  }

  DataViz.prototype.transitionLabel = function(d1, d2, percent) {
    var w = this.app.renderer.width;
    var xc = w / 2;
    var xLeft = -200;
    var xRight = w + 200;

    var x1 = UTIL.lerp(xc, xRight, percent);
    var x2 = UTIL.lerp(xLeft, xc, percent);

    this.renderLabel(d1.label, x1);
    this.renderLabel(d2.label, x2, undefined, false);
  }

  DataViz.prototype.transitionPlot = function(d1, d2, percent) {
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var margin = this.opt.margin;

    // determine the amount of years each data scale covers
    var domain1 = d1.domain[1][0] - d1.domain[0][0];
    var domain2 = d2.domain[1][0] - d2.domain[0][0];
    // use time if after 1970
    if (d2.domain[0][0] >= 1970) {
      domain1 = UTIL.dateTupleToInt(d1.domain[1]) - UTIL.dateTupleToInt(d1.domain[0]);
      domain2 = UTIL.dateTupleToInt(d2.domain[1]) - UTIL.dateTupleToInt(d2.domain[0]);
    }
    // domain 1 ratio to domain 2
    var domainRatio = domain1 / domain2;

    // determine width/position of span1
    var w1 = UTIL.lerp(w, w*domainRatio, percent);
    var x1 = w - w1;

    // determine width/position of span2
    var w2 = w1 / domainRatio;
    var x2 = w - w2;

    // get ranges
    var rangeFrom = d1.range;
    var rangeTo = d2.range;
    var rangeMin = UTIL.lerp(rangeFrom[0], rangeTo[0], percent);
    var rangeMax = UTIL.lerp(rangeFrom[1], rangeTo[1], percent);
    var rangeTotal = rangeMax - rangeMin;

    // determine height/position of range1
    var rangeRatio1 = (rangeFrom[1]-rangeFrom[0]) / rangeTotal;
    var h1 = h * rangeRatio1;
    var y1 = (rangeMax - rangeFrom[1]) / rangeTotal * h;

    // determine height/position of range2
    var rangeRatio2 = (rangeTo[1]-rangeTo[0]) / rangeTotal;
    var h2 = h * rangeRatio2;
    var y2 = (rangeMax - rangeTo[1]) / rangeTotal * h;

    this.renderPlot(d1.data, w1, h1, x1, y1);
    this.renderPlot(d2.data, w2, h2, x2, y2, false);
  }

  return DataViz;

})();
