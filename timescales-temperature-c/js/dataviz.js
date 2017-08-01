'use strict';

var DataViz = (function() {
  function DataViz(options) {
    var defaults = {
      el: '#main',
      margin: [0.1, 0.15, 0.1, 0.1],
      enableSound: true,
      transitionPlotMs: 1000,
      minDomainCount: 5,
      yAxisStep: 0.1,
      axisTextStyle: {
        fill: "#d2d1dd",
        fontSize: 18
      },
      markerTextStyle: {
        fill: "#d2d1dd",
        fontSize: 22
      }
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  DataViz.prototype.init = function(){
    this.$el = $(this.opt.el);

    this.domain = this.opt.domain;
    this.range = this.opt.range;

    // re-map data
    var d0 = this.domain[0];
    this.data = _.map(this.opt.data, function(d,i){
      return {
        year: d0 + i,
        value: d[0],
        color: d[1],
        index: i
      };
    });

    this.time = this.opt.time;
    this.scale = this.opt.scale;
    this.dataLen = this.data.length;

    this.sound = false;
    if (this.opt.enableSound) this.sound = new Sound({});

    // init plot
    this.plotData = [];
    this.plotDomain = this.domain.slice(0);
    this.plotRange = this.range.slice(0);
    this.plotIndex = 0;
    this.plotYear = {};

    this.loadView();
    this.loadListeners();

    this.updateTime(this.time);
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
    this.marker = new PIXI.Graphics();

    this.app.stage.addChild(this.plot, this.axes, this.labels, this.marker);

    this.$el.append(this.app.view);
  };

  DataViz.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());
    this.renderAxes();
    this.renderPlot();
    this.renderLabels();
    this.renderMarker();
  };

  DataViz.prototype.render = function(progress){
    if (!this.plotData || !this.domain || !this.range) return false;




  };

  DataViz.prototype.renderAxes = function(){
    var _this = this;
    var domain = this.plotDomain;
    var range = this.plotRange;
    var textStyle = this.opt.axisTextStyle;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var m = this.opt.margin;
    var mx0 = m[0] * w;
    var mx1 = m[2] * w;

    this.axes.clear();
    while(this.axes.children[0]) {
      this.axes.removeChild(this.axes.children[0]);
    }

    // draw y axis
    var delta = range[1] - range[0];
    var yAxisStep = this.opt.yAxisStep;
    var count = delta / yAxisStep;
    var x0 = w * m[0];
    var x1 = w - m[2] * w;
    var showEvery = 1;
    if (count > 10) showEvery = 2;
    this.axes.lineStyle(1, 0xffffff, 0.333);
    var value = range[0];
    var i=0;
    while(value <= range[1]) {
      if (i % showEvery === 0) {
        var p = _this._dataToPoint(0, value, domain, range);
        var y = p[1];
        var text = UTIL.round(value, 1) + "°F";
        var label = new PIXI.Text(text, textStyle);
        label.x = x0 - 20;
        label.y = y;
        label.anchor.set(1.0, 0.5);
        this.axes.addChild(label);
        this.axes.moveTo(x0, y).lineTo(x1, y);
      }
      value += yAxisStep;
      i++;
    }

    // draw x axis
    count = domain[1] - domain[0];
    showEvery = 1;
    if (count > 10) showEvery = 5;
    if (count > 30) showEvery = 10;
    if (count > 80) showEvery = 20;
    value = domain[0];
    i = 0;
    var cw = w - mx0 - mx1;
    var dataW = cw / (count+1);
    while (value <= domain[1]) {
      var delta1 = domain[1] - value;
      var delta2 = value - domain[0];
      var valid = (value === domain[0] || value === domain[1] || value % showEvery === 0) && (delta1 >= showEvery/2 || delta1 <= 0) && (delta2 >= showEvery/2 || delta2 <= 0);
      if (!valid) {
        value++;
        i++;
        continue;
      }
      var p = _this._dataToPoint(value, range[0], domain, range);
      var px = UTIL.norm(value, domain[0], domain[1]+1);
      var x = i * dataW + mx0 + dataW * 0.5;
      var text = value;
      var ts = _.clone(textStyle);
      ts.fontSize = 22;
      var label = new PIXI.Text(text, ts);
      label.x = x;
      label.y = p[1] + m[3] * h / 5;
      label.anchor.set(0.5, 0);
      this.axes.addChild(label);
      value++;
      i++;
    }
  };

  DataViz.prototype.renderLabels = function(){
    // this.labels.clear();
    // while(this.labels.children[0]) {
    //   this.labels.removeChild(this.labels.children[0]);
    // }
  };

  DataViz.prototype.renderMarker = function(){
    // draw plot marker
    var domain = this.plotDomain;
    var range = this.plotRange;
    var year = this.plotYear;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var m = this.opt.margin;
    var mx0 = m[0] * w;
    var my0 = m[1] * h;
    var mx1 = m[2] * w;
    var my1 = m[3] * h;

    this.marker.clear();
    while(this.marker.children[0]) {
      this.marker.removeChild(this.marker.children[0]);
    }

    var cw = w - mx0 - mx1;
    var count = this.plotData.length
    var dataW = cw / count;
    var px = UTIL.norm(year.year, domain[0], domain[1]+1);
    var i = year.year - domain[0];
    var x = i * dataW + mx0;
    if (count % 2 > 0) x += dataW * 0.5
    this.marker.lineStyle(5, 0xf1a051, 0.7);
    this.marker.moveTo(x, my0).lineTo(x, h-my1);

    var textStyle = this.opt.markerTextStyle;
    var text = UTIL.round(year.value, 1) + "°F";
    var label = new PIXI.Text(text, textStyle);
    label.x = x + 10;
    label.y = my0;
    label.anchor.set(0.0, 0.0);
    this.marker.addChild(label);

    textStyle = _.clone(textStyle);
    textStyle.fontSize *= 0.9;
    label = new PIXI.Text(year.year, textStyle);
    label.x = x + 10;
    label.y = my0 + textStyle.fontSize * 1.5;
    label.anchor.set(0.0, 0.0);
    this.marker.addChild(label);
  };

  DataViz.prototype.renderPlot = function(){
    var _this = this;
    var data = this.plotData;
    var domain = this.plotDomain;
    var range = this.plotRange;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var m = this.opt.margin;
    var mx0 = m[0] * w;
    var my0 = m[1] * h;
    var mx1 = m[2] * w;
    var my1 = m[3] * h;

    this.plot.clear();
    // while(this.plot.children[0]) {
    //   this.plot.removeChild(this.plot.children[0]);
    // }

    var cw = w - mx0 - mx1;
    var ch = h - my0 - my1;
    var dataW = cw / data.length;
    var dataMargin = 0.5;
    _.each(data, function(d, i){
      var p = _this._dataToPoint(d.year, d.value, domain, range);
      var px = UTIL.norm(d.year, domain[0], domain[1]+1);
      var x = i * dataW + mx0 + dataMargin;
      var y = p[1];
      _this.plot.beginFill(d.color);
      _this.plot.drawRect(x, y, dataW-dataMargin*2, h-y- my1);
      // _this.plot.drawCircle(x, y, 5)
    });
  };

  DataViz.prototype.update = function(){
    var _this = this;

    var minDomainCount = this.opt.minDomainCount;
    var maxDomainCount = this.dataLen;
    var domainCount = Math.round(UTIL.lerp(minDomainCount, maxDomainCount, this.scale));

    var add = Math.round(domainCount/2);
    var minIndex = this.plotIndex - add;
    var maxIndex = this.plotIndex + add;

    if (minIndex < 0) {
      maxIndex += (minIndex*-1);
      minIndex = 0;
    }

    if (maxIndex >= maxDomainCount) {
      minIndex -= (maxIndex-maxDomainCount+1)
      maxIndex = maxDomainCount - 1;
    }

    minIndex = Math.max(minIndex, 0);
    maxIndex = Math.min(maxIndex, maxDomainCount - 1);

    var d0 = this.domain[0];
    var domain = [d0+minIndex, d0+maxIndex];
    this.plotDomain = domain;

    this.plotData = _.filter(this.data, function(d, i){ return i >= minIndex && i<= maxIndex; });
    var values = _.pluck(this.plotData, "value");

    var yAxisStep = this.opt.yAxisStep;
    var minRange = UTIL.floorToNearest(_.min(values), yAxisStep);
    var maxRange = UTIL.ceilToNearest(_.max(values), yAxisStep);
    this.plotRange = [minRange, maxRange];

    this.renderAxes();
    this.renderPlot();
    this.renderLabels();
    this.renderMarker();
  };

  DataViz.prototype.updateScale = function(scale){
    this.scale = scale;
    this.update();
  };

  DataViz.prototype.updateTime = function(time){
    this.plotIndex = Math.round(time*(this.dataLen-1));
    this.plotYear = this.data[this.plotIndex];
    this.update();
  };

  DataViz.prototype._dataToPoint = function(dx, dy, domain, range){
    domain = domain || this.plotDomain;
    range = range || this.plotRange;

    var px = UTIL.norm(dx, domain[0], domain[1]);
    var py = UTIL.norm(dy, range[0], range[1]);

    return this._percentToPoint(px, py);
  };

  DataViz.prototype._percentToPoint = function(px, py, margin){
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    margin = margin || this.opt.margin;
    var marginX0 = margin[0] * w;
    var marginY0 = margin[1] * h;
    var marginX1 = margin[2] * w;
    var marginY1 = margin[3] * h;
    var cw = w - marginX0 - marginX1;
    var ch = h - marginY0 - marginY1;

    var x = px * cw + marginX0;
    var y = h - marginY1 - (py * ch);

    return [x, y];
  };

  return DataViz;

})();
