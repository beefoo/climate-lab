'use strict';

var DataViz = (function() {
  function DataViz(options) {
    var defaults = {
      el: '#main',
      margin: 100,
      tickLength: 10,
      pointRadius: [4, 1],
      highlightPointRadius: [0.2, 1],
      axisTextStyle: {
        fill: "#ffffff",
        fontSize: 16
      },
      labelTextStyle: {
        fill: "#ffffff",
        fontSize: 24,
        fontWeight: "bold"
      },
      enableSound: true
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  DataViz.prototype.init = function(){
    this.$el = $(this.opt.el);

    this.plotData = false;
    this.plotPlay = false;
    this.domain = false;
    this.range = false;
    this.sound = false;

    if (this.opt.enableSound) this.sound = new Sound({});

    this.loadView();
    this.loadListeners();
  };

  DataViz.prototype.getXAxis = function(domain){
    var axis = [];
    var d0 = new Date(domain[0]*1000);
    var d1 = new Date(domain[1]*1000);
    var label = UTIL.dateDiff(d0, d1);

    axis.push({label: label, value: 0.0, anchor: 0.0});
    axis.push({label: "Today", value: 1.0, anchor: 1.0});

    return axis;
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

    this.app.stage.addChild(this.axes, this.plot, this.plotProgress);

    this.$el.append(this.app.view);
  };

  DataViz.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());
    this.renderAxes();
    this.renderPlot();
  };

  DataViz.prototype.renderProgress = function(progress){
    if (!this.plotData || !this.domain || !this.range) return false;

    var _this = this;
    var points = this.plotData;
    var domain = this.domain;
    var range = this.range;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var margin = this.opt.margin;
    var cw = w - margin * 2;
    var ch = h - margin * 2;
    var percent = UTIL.norm(range[1]-range[0], this.minRange, this.maxRange);
    var rad = UTIL.lerp(this.opt.pointRadius[0], this.opt.pointRadius[1], percent);
    var hPercent = this.opt.highlightPointRadius;

    this.plotProgress.clear();
    this.plotProgress.beginFill(0xFFFFFF);

    // start/stop sound
    if (progress <= 0) {
      this.sound && this.sound.end();
    } else {
      this.sound && this.sound.start();
    }

    // draw points
    var lastPy = false;
    $.each(points, function(i, p){
      var px = UTIL.norm(p.x, domain[0], domain[1]);
      if (px <= progress) {
        var py = UTIL.norm(p.y, range[0], range[1]);
        var x = px * cw + margin;
        var y = h - margin - (py * ch);
        var xPercent = px / progress;
        var r = UTIL.lerp(hPercent[0], hPercent[1], xPercent) * rad;
        _this.plotProgress.drawCircle(x, y, r);
        lastPy = py;
      }
    });

    if (lastPy !== false) {
      this.sound && this.sound.change(lastPy);
    }

  };

  DataViz.prototype.renderAxes = function(domain, range, alpha, clear){
    var _this = this;
    var domain = domain || this.domain;
    var range = range || this.range;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var margin = this.opt.margin;
    var cw = w - margin * 2;
    var ch = h - margin * 2;
    var len = this.opt.tickLength;
    alpha = alpha || 1.0;

    var textStyle = new PIXI.TextStyle(this.opt.axisTextStyle);

    // clear axes
    if (clear !== false) {
      this.axes.clear();
      while(this.axes.children[0]) {
        this.axes.removeChild(this.axes.children[0]);
      }
    }
    this.axes.lineStyle(2, 0x595454);

    // draw x ticks/labels
    var y = h - margin;
    var x = margin;
    var x0 = domain[0];
    var x1 = domain[1];
    var xs = this.getXAxis(domain);

    $.each(xs, function(i, value){
      var px = value.value;
      x = margin + px * cw;

      // draw tick
      _this.axes.moveTo(x, y).lineTo(x, y+len);

      // draw label
      if (value.label !== "") {
        var label = new PIXI.Text(value.label, textStyle);
        label.x = x;
        label.y = y+len+20;
        label.anchor.set(value.anchor, 0.0);
        _this.axes.addChild(label);
      }
    });

    // draw y ticks/labels
    var y0 = Math.ceil(range[0]);
    var y1 = Math.floor(range[1]);
    var value = y0;
    var tickEvery = 10;
    x = margin;

    while(value <= y1) {
      var py = UTIL.norm(value, y0, y1);
      py = UTIL.lim(py, 0, 1);
      y = h - margin - (py * ch);
      _this.axes.moveTo(x, y).lineTo(x-len, y);
      if (value % tickEvery === 0 || value==y0 || value==y1) {
        var label = new PIXI.Text(value, textStyle);
        label.x = x-len-20;
        label.y = y;
        label.anchor.set(1.0, 0.5);
        _this.axes.addChild(label);
      }
      value += 1;
    }
  };

  DataViz.prototype.renderPlot = function(dataPoints, domain, range, clear){
    var _this = this;
    var points = dataPoints || this.plotData;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var margin = this.opt.margin;
    var cw = w - margin * 2;
    var ch = h - margin * 2;

    domain = domain || this.domain;
    range = range || this.range;
    var percent = UTIL.norm(range[1]-range[0], this.minRange, this.maxRange);
    var rad = UTIL.lerp(this.opt.pointRadius[0], this.opt.pointRadius[1], percent);

    // clear plot
    if (clear !== false) {
      this.plot.clear();
    }
    this.plot.beginFill(0x595454);
    // this.plot.lineStyle(2, 0x595454);

    // draw points
    $.each(points, function(i, p){
      var px = UTIL.norm(p.x, domain[0], domain[1]);
      var py = UTIL.norm(p.y, range[0], range[1]);
      px = UTIL.lim(px, 0, 1);
      py = UTIL.lim(py, 0, 1);
      var x = px * cw + margin;
      var y = h - margin - (py * ch);
      // if (i <= 0) {
      //   _this.plot.moveTo(x, y);
      // } else {
      //   _this.plot.lineTo(x, y);
      // }
      _this.plot.drawCircle(x, y, rad);
    });
  };

  DataViz.prototype.setRangeMinMax = function(minRange, maxRange) {
    this.minRange = minRange;
    this.maxRange = maxRange;
  };

  DataViz.prototype.update = function(data, domain, range){
    this.plotData = data;
    this.domain = domain;
    this.range = range;

    this.renderAxes();
    this.renderPlot();
  };

  return DataViz;

})();
