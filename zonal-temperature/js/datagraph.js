'use strict';

var DataGraph = (function() {
  function DataGraph(options) {
    var defaults = {
      margin: [0.02, 0.02, 0.02, 0.02]
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  DataGraph.prototype.init = function(){
    this.$el = $(this.opt.el);

    this.data = [];
    this.zoneData = [];
    this.time = this.opt.time;
    this.zone = this.opt.zone;

    this.loadView();
    this.loadListeners();

    this.updateTime(this.time);
  };

  DataGraph.prototype.initData = function(data, domain, range){
    this.data = data;
    this.domain = domain;
    this.range = range;
  };

  DataGraph.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(e){
      _this.onResize();
    })
  };

  DataGraph.prototype.loadView = function(){
    this.app = new PIXI.Application(this.$el.width(), this.$el.height(), {transparent : true});
    this.axes = new PIXI.Graphics();
    this.plot = new PIXI.Graphics();
    this.labels = new PIXI.Graphics();
    this.marker = new PIXI.Graphics();

    this.app.stage.addChild(this.plot, this.axes, this.marker, this.labels);

    this.$el.append(this.app.view);
  };

  DataGraph.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());

    this.renderAxes();
    this.renderLabels();
    this.renderPlot();
    this.renderMarker();
  };

  DataGraph.prototype.render = function(){

  };

  DataGraph.prototype.renderMarker = function(){
    this.marker.clear();
    this.marker.lineStyle(4, 0xe8233c, 0.8);

    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var margin = this.opt.margin;
    var marginX0 = margin[0] * w;
    var marginY0 = margin[1] * h;
    var marginX1 = margin[2] * w;
    var marginY1 = margin[3] * h;
    var cw = w - marginX0 - marginX1;
    var ch = h - marginY0 - marginY1;
    var x = cw * this.time + marginX0;

    this.marker.moveTo(x, marginY0);
    this.marker.lineTo(x, marginY0 + ch);
  };

  DataGraph.prototype.renderAxes = function(){

  };

  DataGraph.prototype.renderLabels = function(){

  };

  DataGraph.prototype.renderPlot = function(){
    var _this = this;
    var data = this.zoneData;
    var len = data.length;

    this.plot.clear();
    // while(this.plot.children[0]) {
    //   this.plot.removeChild(this.plot.children[0]);
    // }

    this.plot.lineStyle(2, 0xFFFFFF);

    _.each(data, function(d, i){
      var dx = i / (len-1);
      var p = _this._dataToPoint(dx, d);

      if (i > 0) {
        _this.plot.lineTo(p[0], p[1]);
      } else {
        _this.plot.moveTo(p[0], p[1]);
      }
    });
  };

  DataGraph.prototype.updateTime = function(value){
    this.time = value;
    this.renderMarker();
  };

  DataGraph.prototype.updateZone = function(value){
    var dataLen = this.data.length;
    if (dataLen <= 0) return false;

    var i = Math.round(value * (dataLen-1));
    this.zone = value;
    this.zoneData = this.data[i];

    this.renderPlot();
  };

  DataGraph.prototype._dataToPoint = function(dx, dy, domain, range){
    domain = domain || this.domain;
    range = range || this.range;

    // var px = UTIL.norm(dx, domain[0], domain[1]);
    var px = dx;
    var py = UTIL.norm(dy, range[0], range[1]);

    return this._percentToPoint(px, py);
  };

  DataGraph.prototype._percentToPoint = function(px, py){
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var margin = this.opt.margin;
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

  return DataGraph;

})();
