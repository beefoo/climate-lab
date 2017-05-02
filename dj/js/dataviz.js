'use strict';

var DataViz = (function() {
  function DataViz(options) {
    var defaults = {
      el: '#main',
      margin: 100,
      tickLength: 10,
      pointRadius: 4
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  DataViz.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.data = false;

    this.loadView();
    this.loadListeners();
  };

  DataViz.prototype.loadData = function(data){
    this.data = data;

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
    this.label = new PIXI.Text('');

    this.app.stage.addChild(this.axes, this.plot, this.plotProgress, this.label);

    this.$el.append(this.app.view);
  };

  DataViz.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());
  };

  DataViz.prototype.render = function(progress){
    this.plotProgress.clear();
  };

  DataViz.prototype.renderAxes = function(){
    var _this = this;
    var xs = this.data.xAxis;
    var ys = this.data.yAxis;
    var xl = xs.length;
    var yl = ys.length;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var margin = this.opt.margin;
    var cw = w - margin * 2;
    var ch = h - margin * 2;
    var len = this.opt.tickLength;

    var textStyle = new PIXI.TextStyle({
      fill: "#ffffff",
      fontSize: 16
    });

    // clear axes
    this.axes.clear();
    this.axes.lineStyle(2, 0x595454);
    while(this.axes.children[0]) {
      this.axes.removeChild(this.axes.children[0]);
    }

    // draw x ticks/labels
    var y = h - margin;
    var x = margin;
    $.each(xs, function(i, value){
      x = margin + (i / (xl-1)) * cw;

      // draw tick
      if (value.length) {
        _this.axes.moveTo(x, y).lineTo(x, y+len);
      }

      // draw label
      if (value.length && value != "-") {
        var label = new PIXI.Text(value, textStyle);
        label.x = x;
        label.y = y+len+20;
        label.anchor.set(0.5, 0.0);
        _this.axes.addChild(label);
      }
    });

    // draw y ticks/labels
    x = margin
    $.each(ys, function(i, value){
      y = h - margin - ((i / (yl-1)) * ch);
      _this.axes.moveTo(x, y).lineTo(x-len, y);

      if (i==0 || i >= yl-1) {
        var label = new PIXI.Text(value, textStyle);
        label.x = x-len-20;
        label.y = y;
        label.anchor.set(1.0, 0.5);
        _this.axes.addChild(label);
      }
    });
  };

  DataViz.prototype.renderLabel = function(){
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var margin = this.opt.margin;
    var label = this.data.label;

    this.label.x = w / 2;
    this.label.y = margin / 2;
    this.label.anchor.set(0.5, 0.5);
    this.label.style = new PIXI.TextStyle({
      fill: "#ffffff",
      fontSize: 24,
      fontWeight: "bold"
    });
    this.label.text = label;
  };

  DataViz.prototype.renderPlot = function(){
    var _this = this;
    var points = this.data.data;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var margin = this.opt.margin;
    var cw = w - margin * 2;
    var ch = h - margin * 2;
    var rad = this.opt.pointRadius;

    this.plot.clear();
    this.plot.beginFill(0x595454);

    // draw points
    $.each(points, function(i, p){
      var x = p[0] * cw + margin;
      var y = h - margin - (p[1] * ch);
      _this.plot.drawCircle(x, y, rad);
    });
  };

  return DataViz;

})();
