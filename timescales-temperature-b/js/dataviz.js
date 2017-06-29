'use strict';

var DataViz = (function() {
  function DataViz(options) {
    var defaults = {
      el: '#main',
      margin: [220,100,50,100],
      enableSound: true,
      transitionAxesMs: 500,
      transitionPlotMs: 1000,
      minRange: [-0.25, 0.25],
      yAxisStep: 0.25,
      plotDataMaxW: 200,
      labelTextStyle: {
        fill: "#ffffff",
        fontSize: 28,
        fontWeight: "bold"
      },
      plotTextStyle: {
        fill: "#ffffff",
        fontSize: 36,
        fontWeight: "bold"
      },
      plotSubtextStyle: {
        fill: "#ffffff",
        fontSize: 18,
        align: "center"
      },
      axisTextStyle: {
        fill: "#d2d1dd",
        fontSize: 18
      }
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  DataViz.prototype.init = function(){
    this.$el = $(this.opt.el);

    this.plotData = [];

    this.domain = false;
    this.range = false;
    this.fromDomain = false;
    this.fromRange = false;
    this.toDomain = false;
    this.toRange = false;

    this.sound = false;
    if (this.opt.enableSound) this.sound = new Sound({});

    this.loadView();
    this.loadListeners();
  };

  DataViz.prototype.isMiniMode = function(){
    var w = this.app.renderer.width;
    var m = this.opt.margin;
    var plotW = w - m[0] - m[2];

    return (this.plotData.length * this.opt.plotDataMaxW < plotW);
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
    this.labels = new PIXI.Graphics();

    this.app.stage.addChild(this.plot, this.axes, this.labels);

    this.$el.append(this.app.view);
  };

  DataViz.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());
    this.renderAxes();
    this.renderPlot();
    this.renderLabels();
  };

  DataViz.prototype.render = function(progress){
    if (!this.plotData || !this.domain || !this.range) return false;

    this.transition();

    this.renderPlot();
    this.renderAxes();
    this.renderLabels();
  };

  DataViz.prototype.renderAxes = function(){
    var _this = this;
    var domain = this.domain;
    var range = this.range;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var m = this.opt.margin;
    var yAxisStep = this.opt.yAxisStep;
    var textStyle = this.opt.axisTextStyle;

    var plotW = w - m[0] - m[2];
    var x0 = m[0];
    var x1 = x0 + plotW;
    var ym0 = UTIL.ceilToNearest(range[0], yAxisStep);
    var ym1 = UTIL.floorToNearest(range[1], yAxisStep);
    var value = ym0;
    var miniMode = this.isMiniMode();

    this.axes.clear();
    while(this.axes.children[0]) {
      this.axes.removeChild(this.axes.children[0]);
    }

    // draw domain axis
    if (!miniMode) {
      _.each(this.domain, function(d,i){
        var text = d;
        var ts = _.clone(textStyle);
        ts.fontSize = 28;
        var label = new PIXI.Text(text, ts);
        var y = h - m[3];
        label.x = x0;
        label.y = y + 10;
        label.anchor.set(0, 0);
        if (i > 0) {
          label.x = x1;
          label.anchor.set(1, 0);
        }
        _this.axes.addChild(label);
      });
    }

    // draw range axis
    while(value <= ym1) {
      var p = _this._dataToPoint(0, value, domain, range);
      var y = p[1];

      // draw line
      if (value===0) _this.axes.lineStyle(3, 0xffffff);
      else if (value<0) _this.axes.lineStyle(2, 0x54799b);
      else _this.axes.lineStyle(2, 0x845b5b);

      var text = "20th century average temperature";
      if (value > 0) text = "+" + value + "°C ("+UTIL.round(value*1.8,1)+"°F)";
      else if (value < 0) text = value + "°C ("+UTIL.round(value*1.8,1)+"°F)";
      else {
        textStyle.wordWrap = true;
        textStyle.wordWrapWidth = x0 - 40;
        textStyle.align = 'right';
      }

      if (!miniMode || value===0) {
        var label = new PIXI.Text(text, textStyle);
        label.x = x0 - 20;
        label.y = y;
        label.anchor.set(1.0, 0.5);
        this.axes.addChild(label);
        _this.axes.moveTo(x0, y).lineTo(x1, y);
      }

      value += yAxisStep;
    }
  };

  DataViz.prototype.renderLabels = function(){
    var domain = this.domain;
    var textStyle = this.opt.labelTextStyle;
    var text = "Annual Global Land and Ocean Temperature Anomalies";
    if (domain[0]==domain[1]) text += " ("+domain[0]+")";
    else text += " ("+domain[0]+"-"+domain[1]+")";

    var x = this.app.renderer.width / 2;
    var y = 20;

    this.labels.clear();
    while(this.labels.children[0]) {
      this.labels.removeChild(this.labels.children[0]);
    }

    var label = new PIXI.Text(text, textStyle);
    label.x = x;
    label.y = y;
    label.anchor.set(0.5, 0);
    this.labels.addChild(label);
  };

  DataViz.prototype.renderPlot = function(){
    var data = this.plotData;
    var domain = this.domain;
    var range = this.range;

    var _this = this;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var m = this.opt.margin;
    var textStyle = this.opt.plotTextStyle;
    var subtextStyle = this.opt.plotSubtextStyle;

    var plotW = w - m[0] - m[2];
    var plotH = h - m[1] - m[3];
    var x0 = m[0];
    var x1 = x0 + plotW;
    var y0 = m[1];
    var y1 = y0 + plotH;
    var dataW = plotW / data.length;
    var dataMargin = 0.5;
    var offsetX = 0;
    var miniMode = this.isMiniMode();

    var plotDataMaxW = this.opt.plotDataMaxW;
    if (dataW > plotDataMaxW) {
      dataW = plotDataMaxW;
      var innerPlotW = dataW * data.length;
      offsetX = (plotW - innerPlotW) / 2;
    }
    offsetX += dataMargin + x0;

    this.plot.clear();
    while(this.plot.children[0]) {
      this.plot.removeChild(this.plot.children[0]);
    }

    this.plot.lineStyle(2, 0x212121);

    var baseline = _this._dataToPoint(0, 0, domain, range);
    _.each(data, function(d, i){
      var p = _this._dataToPoint(d.year, d.currentValue, domain, range);
      var px = UTIL.norm(d.year, domain[0], domain[1]+1);
      var x = i * dataW + offsetX;
      var y = p[1];

      // if (UTIL.within(p[0], x0, x1) && UTIL.within(p[1], y0, y1)) {}
      _this.plot.beginFill(parseInt(d.color.substring(1), 16));

      // positive value
      if (p[1] < baseline[1]) {
        _this.plot.drawRect(x, p[1], dataW-dataMargin*2, baseline[1]-p[1]);

      // negative value
      } else if (p[1] > baseline[1]) {
        _this.plot.drawRect(x, baseline[1], dataW-dataMargin*2, p[1]-baseline[1]);
      }

      if (miniMode) {
        var label = new PIXI.Text(d.year, textStyle);
        var text = Math.abs(d.value) + "°C";
        text += " ("+UTIL.round(Math.abs(d.value)*1.8,1)+"°F)"
        if (d.value < 0) text += " below 20th century average";
        else text += " above 20th century average";
        subtextStyle.wordWrap = true;
        subtextStyle.wordWrapWidth = plotDataMaxW * 0.8;
        subtextStyle.fill = d.color;
        var sublabel = new PIXI.Text(text, subtextStyle);

        label.x = x + dataW/2;
        label.y = y + 10;
        label.anchor.set(0.5, 0);
        _this.plot.addChild(label);

        sublabel.x = x + dataW/2;
        sublabel.y = label.y + 48;
        sublabel.anchor.set(0.5, 0);
        _this.plot.addChild(sublabel);
      }
    });

  };

  DataViz.prototype.transition = function(){
    var _this = this;
    var now = new Date();
    var transitionPlotMs = this.opt.transitionPlotMs;

    // transition data
    _.each(this.plotData, function(d,i){
      if (d.transitionValueStart) {
        var timeSince = now - d.transitionValueStart;
        if (timeSince > transitionPlotMs) {
          _this.plotData[i].currentValue = d.value;
        } else {
          var progress = timeSince / transitionPlotMs;
          progress = UTIL.easeInElastic(progress);
          _this.plotData[i].currentValue = d.value * progress;
        }
      }
    });

    // comment/uncomment to enable/disable domain/range transition
    this.domain = this.toDomain;
    this.range = this.toRange;
    return false;

    // check if we need to transition
    var domainEqual = _.isEqual(this.domain, this.toDomain);
    var rangeEqual = _.isEqual(this.range, this.toRange);
    if (domainEqual && rangeEqual) return false;

    // check for transition
    var transitionMs = this.opt.transitionAxesMs;
    var timeSince = transitionMs + 1;
    if (this.transitionStart) timeSince = now - this.transitionStart;

    // end transition
    if (timeSince > transitionMs) {
      this.domain = this.toDomain;
      this.range = this.toRange;
      return false;
    }

    // interpolate
    var progress = timeSince / transitionMs;
    progress = UTIL.easeInOutSin(progress);

    var x0 = UTIL.lerp(this.fromDomain[0], this.toDomain[0], progress);
    var x1 = UTIL.lerp(this.fromDomain[1], this.toDomain[1], progress);
    this.domain = [x0, x1];

    var y0 = UTIL.lerp(this.fromRange[0], this.toRange[0], progress);
    var y1 = UTIL.lerp(this.fromRange[1], this.toRange[1], progress);
    this.range = [y0, y1];
  };

  DataViz.prototype.update = function(data, toDomain, toRange){
    var _this = this;

    // add to dataset
    if (data.length > this.plotData.length) {
      var addData = data.slice(this.plotData.length);
      _.each(addData, function(d,i){
        addData[i].currentValue = 0;
        addData[i].transitionValueStart = new Date();
        _this.sound && _this.sound.play(d.norm);
      });
      this.plotData = this.plotData.concat(addData);

    // reduce dataset
    } else {
      this.plotData = this.plotData.slice(0, data.length);
    }

    var minRange = this.opt.minRange;
    if (toRange[0] > minRange[0]) toRange[0] = minRange[0];
    if (toRange[1] < minRange[1]) toRange[1] = minRange[1];

    if (!this.domain) this.domain = toDomain.slice(0);
    if (!this.range) this.range = toRange.slice(0);

    // if (this.toDomain) this.domain = this.toDomain.slice(0);
    // if (this.toRange) this.range = this.toRange.slice(0);

    this.fromDomain = this.domain.slice(0);
    this.fromRange = this.range.slice(0);
    this.toDomain = toDomain;
    this.toRange = toRange;
    this.transitionStart = new Date();
  };

  DataViz.prototype._dataToPoint = function(dx, dy, domain, range){
    domain = domain || this.domain;
    range = range || this.range;

    var px = UTIL.norm(dx, domain[0], domain[1]);
    var py = UTIL.norm(dy, range[0], range[1]);

    return this._percentToPoint(px, py);
  };

  DataViz.prototype._percentToPoint = function(px, py, margin){
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    margin = margin || this.opt.margin;
    var marginX0 = margin[0];
    var marginY0 = margin[1];
    var marginX1 = margin[2];
    var marginY1 = margin[3];
    var cw = w - marginX0 - marginX1;
    var ch = h - marginY0 - marginY1;

    var x = px * cw + marginX0;
    var y = h - marginY1 - (py * ch);

    return [x, y];
  };

  return DataViz;

})();
