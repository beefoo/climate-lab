'use strict';

var DataViz = (function() {
  function DataViz(options) {
    var defaults = {
      el: '#main',
      margin: [50,50,50,50],
      enableSound: true,
      transitionMs: 500
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
    this.annotations = new PIXI.Graphics();

    this.app.stage.addChild(this.axes, this.plot, this.plotProgress, this.labels, this.annotations);

    this.$el.append(this.app.view);
  };

  DataViz.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());
    this.renderAxes();
    this.renderPlot();
    this.renderLabels();
    this.renderAnnotations();
  };

  DataViz.prototype.render = function(progress){
    if (!this.plotData || !this.domain || !this.range) return false;

    this.transition();

    this.renderPlot();
    this.renderProgress(progress);
  };

  DataViz.prototype.renderAnnotations = function(){

  };

  DataViz.prototype.renderAxes = function(domain, range){

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

    var dataW = plotW / data.length;

    this.plot.clear();

    if (data.length==1) {
      var d = data[0];
      this.plot.beginFill(parseInt(d.color.substring(1), 16));
      this.plot.drawRect(m[0], m[1], plotW, plotH);
      return false;
    }

    _.each(data, function(d){
      var p = _this._dataToPoint(d.year, d.value, domain, range);
      _this.plot.beginFill(parseInt(d.color.substring(1), 16));
      _this.plot.drawRect(p[0], p[1], dataW, plotH-p[1]);
    });

  };

  DataViz.prototype.transition = function(){
    // check if we need to transition
    var domainEqual = _.isEqual(this.domain, this.toDomain);
    var rangeEqual = _.isEqual(this.range, this.toRange);
    if (domainEqual && rangeEqual) return false;

    // check for transition
    var now = new Date();
    var transitionMs = this.opt.transitionMs;
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

    if (!this.domain) this.domain = toDomain;
    if (!this.range) this.range = toRange;

    this.fromDomain = this.domain;
    this.fromRange = this.range;
    this.toDomain = toDomain;
    this.toRange = toRange;
    this.transitionStart = new Date();
  };

  DataViz.prototype.updateAnnotations = function(annotations){
    this.plotAnnotations = annotations;
  };

  DataViz.prototype._dataToPoint = function(dx, dy, domain, range){
    domain = domain || this.domain;
    range = range || this.range;

    var px = UTIL.norm(dx, domain[0], domain[1]+1);
    var py = UTIL.norm(dy, range[0], range[1]);

    px = UTIL.lim(px, 0, 1);
    py = UTIL.lim(py, 0, 1);

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
