'use strict';

var DataViz = (function() {
  function DataViz(options) {
    var defaults = {
      el: '#main',
      margin: [50,50,50,50],
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

  DataViz.prototype.renderAnnotations = function(){

  };

  DataViz.prototype.renderAxes = function(domain, range){

  };

  DataViz.prototype.renderLabels = function(){

  };

  DataViz.prototype.renderProgress = function(progress){
    if (!this.plotData || !this.domain || !this.range) return false;


  };

  DataViz.prototype.renderPlot = function(data, domain, range){
    data = data || this.plotData;
    domain = domain || this.domain;
    range = range || this.range;

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

  DataViz.prototype.update = function(data, domain, range){
    this.plotData = data;
    this.domain = domain;
    this.range = range;
    this.renderAxes();
    this.renderPlot();
    this.renderLabels();
    this.renderAnnotations();
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
