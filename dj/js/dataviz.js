'use strict';

var DataViz = (function() {
  function DataViz(options) {
    var defaults = {
      el: '#main',
      margin: 100,
      tickLength: 10,
      pointRadius: 4,
      highlightPointRadius: [0.1, 10],
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
    this.scale = false;

    this.data = false;
    this.domain = false;
    this.range = false;
    this.sound = new Sound({});

    this.loadView();
    this.loadListeners();
  };

  DataViz.prototype.filterData = function(data, domain, range) {
    var filtered = [];
    $.each(data, function(i, t){
      var d = t[0]; // date
      var v = t[1]; // value
      if (d >= domain[0] && d <= domain[1] && (!range || v >= range[0] && v <= range[1])) {
        filtered.push([d,v]);
      }
    });
    return filtered;
  }

  DataViz.prototype.loadData = function(scale, data){
    this.scale = scale;
    var scaleData = data[scale.unit];
    scaleData = this.filterData(scaleData, scale.domain);

    this.data = scaleData;
    this.domain = scale.domain;
    this.range = scale.range;

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
    this.renderAxes();
    this.renderPlot();
    this.renderLabel();
  };

  DataViz.prototype.renderProgress = function(progress){
    if (!this.data || !this.domain || !this.range) return false;

    var _this = this;
    var points = this.data;
    var domain = this.domain;
    var range = this.range;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var margin = this.opt.margin;
    var cw = w - margin * 2;
    var ch = h - margin * 2;
    var rad = this.opt.highlightPointRadius;

    this.plotProgress.clear();
    this.plotProgress.beginFill(0xFFFFFF);

    var blurFilter = new PIXI.filters.BlurFilter();
    blurFilter.blur = 3;
    this.plotProgress.filters = [blurFilter];


    if (progress <= 0) {
      this.sound.end();
    } else {
      this.sound.start();
    }

    // draw points
    $.each(points, function(i, p){
      var px = UTIL.norm(p[0], domain[0], domain[1]);
      if (px <= progress) {
        var py = UTIL.norm(p[1], range[0], range[1]);
        var x = px * cw + margin;
        var y = h - margin - (py * ch);
        var percent = px / progress;
        var r = UTIL.lerp(rad[0], rad[1], percent);
        _this.plotProgress.drawCircle(x, y, r);
        _this.sound.change(py);
      }
    });
  };

  DataViz.prototype.renderAxes = function(xAxis, yAxis, alpha, clear){
    var _this = this;
    var xs = xAxis || this.scale.xAxis;
    var ys = yAxis || this.scale.yAxis;
    var xl = xs.length;
    var yl = ys.length;
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
    var labelText = text || this.scale.label;

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

  DataViz.prototype.renderPlot = function(dataPoints, domain, range, percent, clear){
    var _this = this;
    var points = dataPoints || this.data;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var margin = this.opt.margin;
    var cw = w - margin * 2;
    var ch = h - margin * 2;
    var rad = this.opt.pointRadius;

    domain = domain || this.domain;
    range = range || this.range;
    percent = percent || 1.0;

    // clear plot
    if (clear !== false) {
      this.plot.clear();
    }
    this.plot.beginFill(0x595454);

    // draw points
    $.each(points, function(i, p){
      var px = UTIL.norm(p[0], domain[0], domain[1]);
      var py = UTIL.norm(p[1], range[0], range[1]);
      var x = px * cw + margin;
      var y = h - margin - (py * ch);
      _this.plot.drawCircle(x, y, rad*percent);
    });
  };

  DataViz.prototype.transitionAxes = function(s1, s2, percent, data) {

  };

  DataViz.prototype.transitionData = function(s1, s2, percent, data) {
    this.transitionAxes(s1, s2, percent, data);
    this.transitionPlot(s1, s2, percent, data);
    this.transitionLabel(s1, s2, percent);
  };

  DataViz.prototype.transitionLabel = function(s1, s2, percent) {
    var w = this.app.renderer.width;
    var xc = w / 2;
    var xLeft = -200;
    var xRight = w + 200;

    var x1 = UTIL.lerp(xc, xRight, percent);
    var x2 = UTIL.lerp(xLeft, xc, percent);

    this.renderLabel(s1.label, x1);
    this.renderLabel(s2.label, x2, undefined, false);
  };

  DataViz.prototype.transitionPlot = function(s1, s2, percent, data) {
    var plotDomain = [UTIL.lerp(s1.domain[0], s2.domain[0], percent), UTIL.lerp(s1.domain[1], s2.domain[1], percent)];
    var plotRange = [UTIL.lerp(s1.range[0], s2.range[0], percent), UTIL.lerp(s1.range[1], s2.range[1], percent)];
    var plotData1 = this.filterData(data[s1.unit], plotDomain, plotRange);

    // different units of time; transition between them
    if (s1.unit != s2.unit) {
      var plotData2 = this.filterData(data[s2.unit], plotDomain, plotRange);
      this.renderPlot(plotData1, plotDomain, plotRange, 1-percent);
      this.renderPlot(plotData2, plotDomain, plotRange, percent, false);

    } else {
      this.renderPlot(plotData1, plotDomain, plotRange);
    }

    // update domain, range, and data
    this.domain = plotDomain;
    this.range = plotRange;
    if (percent < 0.5 || s1.unit == s2.unit) {
      this.data = plotData1;
    } else {
      this.data = plotData2;
    }
  };

  return DataViz;

})();
