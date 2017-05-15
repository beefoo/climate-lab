'use strict';

var DataViz = (function() {
  function DataViz(options) {
    var defaults = {
      el: '#main',
      margin: 100,
      tickLength: 10,
      pointRadius: 2,
      highlightPointRadius: [0.1, 2],
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

    this.plotData = false;
    this.plotTrend = false;
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
  };

  DataViz.prototype.getXAxis = function(domain){
    var d0 = new Date(domain[0]*1000);
    var d1 = new Date(domain[1]*1000);
    var days = (domain[1] - domain[0]) / 60 / 60 / 24;
    var year0 = d0.getUTCFullYear();
    var year1 = d1.getUTCFullYear();
    var years = year1 - year0;
    var axis = [];
    var d = d0;
    var value, label;
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

    // Mode: years
    if (years > 2) {
      while (d < d1) {
        value = d.getTime() / 1000;
        label = d.getUTCFullYear();
        // if (label % 5 > 0 && axis.length) label = "";
        if (axis.length) label = "";
        axis.push({value: value, label: label});
        d.setUTCFullYear(d.getUTCFullYear() + 1);
      }

    // Mode: months
    } else if (days > 60) {
      while (d < d1) {
        value = d.getTime() / 1000;
        // label = monthNames[d.getUTCMonth()];
        // if (label=="Jan") label = d.getUTCFullYear();
        // else if (d.getUTCMonth() % 6 > 0) label = "";
        label = d.getUTCFullYear();
        if (axis.length) label = "";
        axis.push({value: value, label: label});
        d.setUTCMonth(d.getUTCMonth() + 1);
      }

    // Mode: days
    } else if (days > 2) {
      while (d < d1) {
        value = d.getTime() / 1000;
        label = "";
        // if (d.getUTCDate()===1) label = monthNames[d.getUTCMonth()] + " " + d.getUTCFullYear();
        if (d.getUTCDate()===1) label = monthNames[d.getUTCMonth()] + " 1";
        axis.push({value: value, label: label});
        d.setUTCDate(d.getUTCDate() + 1);
      }

    // Mode: hours
    } else {

    }

    axis.push({value: domain[1], label: "Today"});

    return axis;
  };

  DataViz.prototype.loadData = function(scale, data){
    this.scale = scale;
    var plot = data[scale.unit].plot;
    var trend = data[scale.unit].trend;

    plot = this.filterData(plot, scale.domain);
    trend = this.filterData(trend, scale.domain);

    this.plotData = plot;
    this.plotTrend = trend;
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
    this.plotProgressTrend = new PIXI.Graphics();
    this.labels = new PIXI.Graphics();

    this.app.stage.addChild(this.axes, this.plot, this.plotProgress, this.plotProgressTrend, this.labels);

    this.$el.append(this.app.view);
  };

  DataViz.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());
    this.renderAxes();
    this.renderPlot();
    this.renderLabel();
  };

  DataViz.prototype.renderProgress = function(progress){
    if (!this.plotData || !this.domain || !this.range) return false;

    var _this = this;
    var points = this.plotData;
    var trend = this.plotTrend;
    var domain = this.domain;
    var range = this.range;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var margin = this.opt.margin;
    var cw = w - margin * 2;
    var ch = h - margin * 2;
    var rad = this.opt.highlightPointRadius;

    this.plotProgress.clear();
    this.plotProgress.beginFill(0x686363);

    // start/stop sound
    if (progress <= 0) {
      this.sound && this.sound.end();
    } else {
      this.sound && this.sound.start();
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
      }
    });

    // draw trend line
    this.plotProgressTrend.clear();
    if (!trend) return false;

    // add blur filter
    var blurFilter = new PIXI.filters.BlurFilter();
    blurFilter.blur = 2;
    this.plotProgressTrend.filters = [blurFilter];
    var prev = false;
    var lastPy = false;

    // draw trend line
    $.each(trend, function(i, p){
      var px = UTIL.norm(p[0], domain[0], domain[1]);
      var py = UTIL.norm(p[1], range[0], range[1]);
      if (px <= progress) {
        var x = px * cw + margin;
        var y = h - margin - (py * ch);
        var percent = px / progress;
        if (!prev) {
          prev = [x, y];
        } else {
          _this.plotProgressTrend.lineStyle(10, 0xFFFFFF, percent);
          _this.plotProgressTrend.moveTo(prev[0], prev[1]);
          _this.plotProgressTrend.lineTo(x, y);
          prev = [x, y];
        }
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
      var px = UTIL.norm(value.value, x0, x1);
      x = margin + px * cw;

      // draw tick
      _this.axes.moveTo(x, y).lineTo(x, y+len);

      // draw label
      if (value.label !== "") {
        var label = new PIXI.Text(value.label, textStyle);
        label.x = x;
        label.y = y+len+20;
        label.anchor.set(0.5, 0.0);
        _this.axes.addChild(label);
      }
    });

    // draw y ticks/labels
    var y0 = range[0];
    var y1 = range[1];
    var value = Math.ceil(y0);
    var tickEvery = 10;
    x = margin;

    while(value <= y1) {
      var py = UTIL.norm(value, y0, y1);
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
    var points = dataPoints || this.plotData;
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
    var plotDomain = [UTIL.lerp(s1.domain[0], s2.domain[0], percent), UTIL.lerp(s1.domain[1], s2.domain[1], percent)];
    var plotRange = [UTIL.lerp(s1.range[0], s2.range[0], percent), UTIL.lerp(s1.range[1], s2.range[1], percent)];

    this.renderAxes(plotDomain, plotRange);
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

    var plot1 = this.filterData(data[s1.unit].plot, plotDomain, plotRange);

    // different units of time; transition between them
    if (s1.unit != s2.unit) {
      var plot2 = this.filterData(data[s2.unit].plot, plotDomain, plotRange);
      this.renderPlot(plot1, plotDomain, plotRange, 1-percent);
      this.renderPlot(plot2, plotDomain, plotRange, percent, false);

    } else {
      this.renderPlot(plot1, plotDomain, plotRange);
    }

    // update domain, range, and data
    this.domain = plotDomain;
    this.range = plotRange;
    if (percent < 0.5 || s1.unit == s2.unit) {
      this.plotData = plot1;
    } else {
      this.plotData = plot2;
    }
  };

  return DataViz;

})();
