'use strict';

var DataGraph = (function() {
  function DataGraph(options) {
    var defaults = {
      margin: [0.125, 0.12, 0.04, 0.15],
      axisTextStyle: {
        fill: "#8f8f9b",
        fontSize: 12
      },
      markerTextStyle: {
        fill: "#f1a051",
        fontSize: 14,
        fontWeight: "bold"
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
  };

  DataGraph.prototype.initData = function(data, domain, range){
    this.data = data;
    this.domain = domain;
    this.range = range;

    this.updateTime(this.time);
    this.renderAxes();
  };

  DataGraph.prototype.lerpData = function(d1, d2, amount){
    var d1v = _.map(d1, function(d){ return d[0]; });
    var d2v = _.map(d2, function(d){ return d[0]; });
    var dv = UTIL.lerpList(d1v, d2v, amount);
    var dc = [];
    if (amount < 0.5) dc = _.map(d1, function(d){ return d[1]; });
    else dc = _.map(d2, function(d){ return d[1]; });
    return _.zip(dv, dc);
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
        var df = v;
        var dc = Math.round(v * 5 / 9.0);
        var text = df + '°F';
        if (v > 0) text = "+"+text;
        else if (v===0) text = "average";
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
    var tickEvery = 5;
    this.axes.lineStyle(1, 0x56585c);
    while (v <= domain[1]) {
      var showLabel = (v%20===0 || v===domain[1] || v===domain[0]);
      var showTick = (v%tickEvery===0);
      var px, p;
      if (showLabel || showTick) {
        px = UTIL.norm(v, domain[0], domain[1]);
        p = _this._dataToPoint(px, range[0]);
      }
      // draw label
      if (showLabel) {
        var label = new PIXI.Text(v, textStyle);
        var ax = 0.5;
        if (v===domain[0]) ax = 0;
        else if (v===domain[1]) ax = 1;
        label.x = p[0];
        label.y = p[1] + my1 * 0.8;
        label.anchor.set(ax, 1);
        _this.axes.addChild(label);
      }
      if (showTick) {
        this.axes.moveTo(p[0], p[1]).lineTo(p[0], p[1] + my1 * 0.15);
      }
      v++;
    }

  };

  DataGraph.prototype.renderLabels = function(){

  };

  DataGraph.prototype.renderMarker = function(){
    this.marker.clear();
    while(this.marker.children[0]) {
      this.marker.removeChild(this.marker.children[0]);
    }

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

    var zones = this.data.length;
    var data = this.data[Math.round((zones-1) * this.zone)]
    var domain = this.domain;
    var year = Math.round(UTIL.lerp(domain[0], domain[1], this.time))
    var yearIndex = year - domain[0];
    var value = data[yearIndex][0];
    var color = data[yearIndex][1];
    var textStyle = this.opt.markerTextStyle;

    var text = year;
    var label = new PIXI.Text(text, textStyle);
    var ly = marginY0 * 0.8;
    label.x = x - 2;
    label.y = ly;
    label.anchor.set(1, 1);

    var df = UTIL.round(value, 1);
    var dc = UTIL.round(value * 5 / 9.0, 1);
    if (value > 0){
      df = "+" + df;
      dc = "+" + dc;
    }
    text = df + "°F ("+dc+" °C)";
    textStyle = _.clone(textStyle);
    textStyle.fill = color;
    textStyle.fontSize *= 0.9;
    var label2 = new PIXI.Text(text, textStyle);
    label2.x = x + 2;
    label2.y = ly;
    label2.anchor.set(0, 1);

    var lw = label.width;
    var lw2 = label2.width;
    var left = x - marginX0;
    var right = cw + marginX0 - x;

    if (lw > left) {
      var delta = lw - left;
      label.x += delta;
      label2.x += delta;

    } else if (lw2 > right) {
      var delta = lw2 - right;
      label.x -= delta;
      label2.x -= delta;
    }

    this.marker.addChild(label);
    this.marker.addChild(label2);
  };

  DataGraph.prototype.renderPlot = function(){
    var data = this.zoneData;

    this.plot.clear();
    // while(this.plot.children[0]) {
    //   this.plot.removeChild(this.plot.children[0]);
    // }

    this.renderBars(data);
  };

  DataGraph.prototype.renderBars = function(data){
    var _this = this;
    var len = data.length;
    var range = this.range;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var m = this.opt.margin;
    var mx0 = m[0] * w;
    var my0 = m[1] * h;
    var mx1 = m[2] * w;
    var my1 = m[3] * h;
    var cw = w - mx0 - mx1;
    var ch = h - my0 - my1;

    var barW = cw / len;

    var rangeRatio = range[1] / (range[1]-range[0]);
    this.plot.lineStyle(1, 0x212121);

    _.each(data, function(d, i){
      var value = d[0];
      var color = d[1];
      var x = i * barW + mx0;
      var y = 0;
      var barH = 0;

      if (value > 0) {
        barH = (value / range[1]) * ch * rangeRatio;
        y = my0 + ch * rangeRatio - barH;
      } else {
        barH = (value / range[0] )* ch * (1-rangeRatio);
        y = my0 + ch * rangeRatio;
      }

      _this.plot.beginFill(color);
      _this.plot.drawRect(x, y, barW, barH);
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
    this.renderMarker();
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
