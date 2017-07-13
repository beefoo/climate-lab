'use strict';

var DataGraph = (function() {
  function DataGraph(options) {
    var defaults = {
      margin: [0.1, 0.02, 0.1, 0.1],
      axisTextStyle: {
        fill: "#d2d1dd",
        fontSize: 18
      }
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

    this.renderAxes();
  };

  DataGraph.prototype.lerpData = function(d1, d2, amount){
    return [
      UTIL.lerpList(d1[0], d2[0], amount),
      UTIL.lerpList(d1[1], d2[1], amount)
    ]
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
    this.marker.lineStyle(4, 0xf1a051, 0.8);

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
    var _this = this;

    // clear axes
    this.axes.clear();
    while(this.axes.children[0]) {
      this.axes.removeChild(this.axes.children[0]);
    }

    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var margin = this.opt.margin;
    var mx0 = margin[0] * w;
    var my0 = margin[1] * h;
    var mx1 = margin[2] * w;
    var my1 = margin[3] * h;
    var cw = w - mx0 - mx1;
    var ch = h - my0 - my1;
    var textStyle = this.opt.axisTextStyle;

    // draw y axis
    this.axes.lineStyle(2, 0xc4ced4);
    this.axes.moveTo(mx0, my0).lineTo(mx0, my0+ch);

    // draw horizontal lines
    var range = this.range;
    var v = range[0];
    while (v <= range[1]) {
      var p = _this._dataToPoint(0, v);

      // draw line
      if (v!=0) _this.axes.lineStyle(1, 0x56585c);
      else _this.axes.lineStyle(2, 0xffffff);
      _this.axes.moveTo(mx0, p[1]).lineTo(mx0+cw, p[1]);

      // draw label
      if (v%2===0) {
        var text = v + '°C';
        if (v > 0) text = "+"+text;
        var label = new PIXI.Text(text, textStyle);
        label.x = p[0] - 10;
        label.y = p[1];
        label.anchor.set(1, 0.5);
        _this.axes.addChild(label);
      }

      v++;
    }

    // draw x axis
    var domain = this.domain;
    v = domain[0];
    while (v <= domain[1]) {
      // draw label
      if (v%10===0 || v===domain[1] || v===domain[0]) {
        var px = UTIL.norm(v, domain[0], domain[1]);
        var p = _this._dataToPoint(px, range[0]);
        var label = new PIXI.Text(v, textStyle);
        label.x = p[0];
        label.y = p[1] + 35;
        label.anchor.set(0.5, 1);
        _this.axes.addChild(label);
      }
      v++;
    }

  };

  DataGraph.prototype.renderLabels = function(){

  };



  DataGraph.prototype.renderPlot = function(){
    var data = this.zoneData[0];
    var trend = this.zoneData[1];

    this.plot.clear();
    // while(this.plot.children[0]) {
    //   this.plot.removeChild(this.plot.children[0]);
    // }

    this.renderPlotLine(data, 2, 0x56585c);
    this.renderPlotLine(trend, 2, 0xf1a051);
  };

  DataGraph.prototype.renderPlotLine = function(data, w, color){
    var _this = this;
    var len = data.length;
    this.plot.lineStyle(w, color);

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

    var p = value * (dataLen-1);
    var i = Math.round(value * (dataLen-1));
    var diff = p - i;

    if (Math.abs(diff) > 0) {
      var d1 = false;
      var d2 = false;
      var amount = 0;

      if (diff < 0 && i>0) {
        amount = UTIL.norm(diff, -0.5, 0);
        d1 = this.data[i-1];
        d2 = this.data[i];
      } else if (diff > 0 && i<dataLen-1) {
        amount = UTIL.norm(diff, 0, 5);
        d1 = this.data[i];
        d2 = this.data[i+1];
      }

      if (d1 && d2) {
        this.zoneData = this.lerpData(d1, d2, amount);
      } else {
        this.zoneData = this.data[i];
      }

    } else {
      this.zoneData = this.data[i];
    }

    this.zone = value;
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
