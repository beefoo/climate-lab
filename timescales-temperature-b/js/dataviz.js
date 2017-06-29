'use strict';

var DataViz = (function() {
  function DataViz(options) {
    var defaults = {
      el: '#main',
      margin: [50,50,50,50],
      enableSound: true,
      transitionAxesMs: 500,
      transitionPlotMs: 500,
      minRange: [-0.25, 0.25],
      yAxisStep: 0.25
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  DataViz.prototype.init = function(){
    this.$el = $(this.opt.el);

    this.plotData = false;

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

    this.app.stage.addChild(this.plot, this.plotProgress, this.axes, this.labels);

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
    this.renderProgress(progress);
  };

  DataViz.prototype.renderAxes = function(){
    this.axes.clear();

    var _this = this;
    var domain = this.domain;
    var range = this.range;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var m = this.opt.margin;
    var yAxisStep = this.opt.yAxisStep;

    var plotW = w - m[0] - m[2];
    var x0 = m[0];
    var x1 = x0 + plotW;
    var ym0 = UTIL.ceilToNearest(range[0], yAxisStep);
    var ym1 = UTIL.floorToNearest(range[1], yAxisStep);
    var value = ym0;

    while(value <= ym1) {
      var p = _this._dataToPoint(0, value, domain, range);
      var y = p[1];

      // draw line
      if (value===0) _this.axes.lineStyle(3, 0xffffff);
      else if (value<0) _this.axes.lineStyle(1, 0x54799b);
      else _this.axes.lineStyle(1, 0x845b5b);

      _this.axes.moveTo(x0, y).lineTo(x1, y);

      value += yAxisStep;
    }
  };

  DataViz.prototype.renderLabels = function(){

  };

  DataViz.prototype.renderProgress = function(progress){

  };

  DataViz.prototype.renderPlot = function(){
    var data = this.plotData;
    var domain = this.domain;
    var range = this.range;

    var _this = this;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var m = this.opt.margin;

    var plotW = w - m[0] - m[2];
    var plotH = h - m[1] - m[3];
    var x0 = m[0];
    var x1 = x0 + plotW;
    var y0 = m[1];
    var y1 = y0 + plotH;

    var dataW = plotW / data.length;

    this.plot.clear();

    var baseline = _this._dataToPoint(0, 0, domain, range);
    _.each(data, function(d){
      var p = _this._dataToPoint(d.year, d.value, domain, range);

      // if (UTIL.within(p[0], x0, x1) && UTIL.within(p[1], y0, y1)) {}
      _this.plot.beginFill(parseInt(d.color.substring(1), 16));

      // positive value
      if (p[1] < baseline[1]) {
        _this.plot.drawRect(p[0], p[1], dataW, baseline[1]-p[1]);

      // negative value
      } else if (p[1] > baseline[1]) {
        _this.plot.drawRect(p[0], baseline[1], dataW, p[1]-baseline[1]);
      }
    });

  };

  DataViz.prototype.transition = function(){
    this.domain = this.toDomain;
    this.range = this.toRange;
    return false;

    // check if we need to transition
    var domainEqual = _.isEqual(this.domain, this.toDomain);
    var rangeEqual = _.isEqual(this.range, this.toRange);
    if (domainEqual && rangeEqual) return false;

    // check for transition
    var now = new Date();
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
    this.plotData = data;

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

    var px = UTIL.norm(dx, domain[0], domain[1]+1);
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
