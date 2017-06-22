'use strict';

var DataViz = (function() {
  function DataViz(options) {
    var defaults = {
      el: '#main',
      margin: [100, 100],
      tickLength: 10,
      pointRadius: [4, 1.5],
      highlightPointRadius: [0.2, 2],
      axisTextStyle: {
        fill: "#ffffff",
        fontSize: 18
      },
      annTextStyle: {
        fill: "#ffffff",
        fontSize: 24
      },
      labelTextStyle: {
        fill: "#ffffff",
        fontSize: 28,
        fontWeight: "bold"
      },
      labelSubtextStyle: {
        fill: "#ffffff",
        fontSize: 20
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
    axis.push({label: "Last month", value: 1.0, anchor: 1.0});

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
    // this.axes = new PIXI.Graphics();
    this.plot = new PIXI.Graphics();
    this.plotProgress = new PIXI.Graphics();
    this.labels = new PIXI.Graphics();
    this.annotations = new PIXI.Graphics();

    this.app.stage.addChild(this.plot, this.plotProgress, this.labels, this.annotations);

    this.$el.append(this.app.view);
  };

  DataViz.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());
    // this.renderAxes();
    this.renderPlot();
    this.renderLabels();
    this.renderAnnotations();
  };

  DataViz.prototype.renderAnnotation = function(x, y, ann){
    var textStyle = this.opt.annTextStyle;

    if (ann.pointRadius) {
      this.annotations.lineStyle(2, 0x03fc1be);
      this.annotations.drawCircle(x, y, ann.pointRadius);
    }

    if (ann.text) {
      var label = new PIXI.Text(ann.text, textStyle);
      if (ann.offset) {
        x += ann.offset[0];
        y += ann.offset[1];
      }
      label.x = x;
      label.y = y;
      if (ann.anchor) {
        label.anchor.set(ann.anchor[0], ann.anchor[1]);
      }
      this.annotations.addChild(label);
    }

  };

  DataViz.prototype.renderAnnotations = function(){
    var _this = this;
    var annotations = this.plotAnnotations;
    var points = this.plotData;

    // clear annotations
    this.annotations.clear();
    while(this.annotations.children[0]) {
      this.annotations.removeChild(this.annotations.children[0]);
    }

    $.each(annotations, function(i, ann){
      if (_.has(ann, "position")) {
        var pp = ann.position;
        var xy = _this._percentToPoint(pp[0], pp[1], [_this.opt.margin[0], 90]);
        _this.renderAnnotation(xy[0], xy[1], ann);

      } else if (_.has(ann, "datePosition")) {
        var dp = ann.datePosition;
        var sorted = _.sortBy(points, function(p){ return Math.abs(p.x - dp); });
        var closest = sorted[0];
        var xy = _this._dataToPoint(closest.x, closest.y);
        _this.renderAnnotation(xy[0], xy[1], ann);
      }

    });
  };

  DataViz.prototype.renderLabel = function(labelPoint, line, text, subtext, anchor){
    var textStyle = this.opt.labelTextStyle;
    var label = new PIXI.Text(text, textStyle);
    var x = labelPoint[0];
    var y = labelPoint[1];

    label.x = x;
    label.y = y;
    label.anchor.set(anchor[0], anchor[1]);
    this.labels.addChild(label);

    if (subtext) {
      var subtextStyle = this.opt.labelSubtextStyle;
      var sublabel = new PIXI.Text(subtext, subtextStyle);
      sublabel.x = x;
      sublabel.y = y + textStyle.fontSize + 10;
      sublabel.anchor.set(anchor[0], anchor[1]);
      this.labels.addChild(sublabel);
    }

    this.labels.lineStyle(2, 0x00676d);
    this.labels.moveTo(line[0][0], line[0][1]).lineTo(line[1][0], line[1][1]);

    this.labels.beginFill(0x00676d);
    this.labels.drawCircle(line[1][0], line[1][1], 5);
  };

  DataViz.prototype.renderLabels = function(){
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var marginX = this.opt.margin[0];
    var marginY = this.opt.margin[1];
    var domain = this.domain;
    var range = this.range;

    var ch = h - marginY * 2;
    var points = this.plotData;
    var first = points[0];
    var last = points[points.length-1];

    // clear labels
    this.labels.clear();
    while(this.labels.children[0]) {
      this.labels.removeChild(this.labels.children[0]);
    }

    // first label
    var text = UTIL.round(first.y,2) + "°F";
    if (first.y > 0) text = "+" + text
    var subtext = this._dateDiff(new Date(first.x*1000), new Date(last.x*1000));
    var line = [
      [marginX, h - marginY * 0.95],
      [marginX, h - marginY - UTIL.norm(first.y, range[0], range[1]) * ch]
    ];
    this.renderLabel([marginX, line[0][1]+10], line, text, subtext, [0, 0]);

    // second label
    text = UTIL.round(last.y,2) + "°F";
    if (last.y > 0) text = "+" + text
    subtext = "Last month";
    line = [
      [w - marginX, marginY*0.95],
      [w - marginX, h - marginY - UTIL.norm(last.y, range[0], range[1]) * ch]
    ];
    this.renderLabel([w - marginX, marginY * 0.25], line, text, subtext, [1, 0]);
  };

  DataViz.prototype.renderProgress = function(progress){
    if (!this.plotData || !this.domain || !this.range) return false;

    var _this = this;
    var points = this.plotData;
    var domain = this.domain;
    var range = this.range;
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
      // draw points
      var lastPy = false;
      $.each(points, function(i, p){
        var px = UTIL.norm(p.x, domain[0], domain[1]);
        if (px <= progress) {
          var py = UTIL.norm(p.y, range[0], range[1]);
          var xy = _this._dataToPoint(p.x, p.y, domain, range);
          var xPercent = px / progress;
          var r = UTIL.lerp(hPercent[0], hPercent[1], xPercent) * rad;
          _this.plotProgress.drawCircle(xy[0], xy[1], r);
          lastPy = py;
        }
      });

      if (lastPy !== false) {
        this.sound && this.sound.change(lastPy);
      }
    }
  };

  DataViz.prototype.renderAxes = function(domain, range, alpha, clear){
    var _this = this;
    var domain = domain || this.domain;
    var range = range || this.range;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var marginX = this.opt.margin[0];
    var marginY = this.opt.margin[1];
    var cw = w - marginX * 2;
    var ch = h - marginY * 2;
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
    var y = h - marginY;
    var x = marginX;
    var x0 = domain[0];
    var x1 = domain[1];
    var xs = this.getXAxis(domain);

    $.each(xs, function(i, value){
      var px = value.value;
      x = marginX + px * cw;

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
    x = marginX;

    while(value <= y1) {
      var py = UTIL.norm(value, y0, y1);
      py = UTIL.lim(py, 0, 1);
      y = h - marginY - (py * ch);
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
      var xy = _this._dataToPoint(p.x, p.y, domain, range);
      _this.plot.drawCircle(xy[0], xy[1], rad);
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
    // this.renderAxes();
    this.renderPlot();
    this.renderLabels();
    this.renderAnnotations();

  };

  DataViz.prototype.updateAnnotations = function(annotations){
    this.plotAnnotations = annotations;
  };

  DataViz.prototype._dateDiff = function(d1, d2) {
    var months = (d2.getUTCFullYear() - d1.getUTCFullYear()) * 12;
    months -= d1.getUTCMonth() + 1;
    months += d2.getUTCMonth() + 1;
    months += 1

    // console.log(d1.toUTCString(), d2.toUTCString())

    var years = Math.floor(months/12);
    months = months % 12;

    var message = [];
    if (years > 1) message.push(years + " years");
    else if (years > 0) message.push(years + " year");
    if (months > 1) message.push(months + " months");
    else if (months > 0) message.push(months + " month");

    message = message.join(", ");
    message += " ago";

    return message;
  };

  DataViz.prototype._dataToPoint = function(dx, dy, domain, range){
    domain = domain || this.domain;
    range = range || this.range;

    var px = UTIL.norm(dx, domain[0], domain[1]);
    var py = UTIL.norm(dy, range[0], range[1]);

    px = UTIL.lim(px, 0, 1);
    py = UTIL.lim(py, 0, 1);

    return this._percentToPoint(px, py);
  };

  DataViz.prototype._percentToPoint = function(px, py, margin){
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    margin = margin || this.opt.margin;
    var marginX = margin[0];
    var marginY = margin[1];
    var cw = w - marginX * 2;
    var ch = h - marginY * 2;

    var x = px * cw + marginX;
    var y = h - marginY - (py * ch);

    return [x, y];
  };

  return DataViz;

})();
