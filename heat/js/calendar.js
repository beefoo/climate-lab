'use strict';

var Calendar = (function() {
  function Calendar(options) {
    var defaults = {
      el: '#main',
      margin: [0.1, 0.2, 0.1, 0],
      textStyle: {
        fill: "#666666"
      },
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Calendar.prototype.init = function(){
    var _this = this;
    this.$el = $(this.opt.el);
    this.time = 0;

    this.loadView();
  };

  Calendar.prototype.loadView = function(){
    this.app = new PIXI.Application(this.$el.width(), this.$el.height(), {transparent : true, antialias: true});
    this.labels = new PIXI.Graphics();
    this.marker = new PIXI.Graphics();

    this.app.stage.addChild(this.labels, this.marker);
    this.$el.append(this.app.view);

    this.onResize();
  };

  Calendar.prototype.onResize = function(){
    var w = this.$el.width();
    var h = this.$el.height();

    this.app.renderer.resize(w, h);
    var m = this.opt.margin;
    this.margin = [w*m[0], h*m[1], w*m[2], h*m[3]];

    this.renderLabels();
    this.renderMarker();
  };

  Calendar.prototype.render = function(progress){
    var _this = this;

    this.time = progress;

    this.renderLabels();
    this.renderMarker();
  };

  Calendar.prototype.renderLabels = function(){
    var _this = this;
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var currentMonth = months[Math.round(this.time * 11)];
    var w = this.$el.width();
    var h = this.$el.height();
    var m = this.margin;
    var cw = w - m[0] - m[2];
    var ch = h - m[1] - m[3];
    var textStyle = this.opt.textStyle;

    this.labels.clear();
    while(this.labels.children[0]) {
      this.labels.removeChild(this.labels.children[0]);
    }

    textStyle.fontSize = h * 0.2;

    _.each(months, function(month, i){
      var ts = textStyle;
      if (month===currentMonth) {
        ts = _.extend({}, textStyle, {fill: "#FFFFFF"});
      }
      var label = new PIXI.Text(month, ts);
      label.x = (i / 12 + (1 / 24)) * cw + m[0];
      label.y = ch * 0.5 + m[1];
      label.anchor.set(0.5, 0.5);
      _this.labels.addChild(label);
    });
  };

  Calendar.prototype.renderMarker = function(){
    this.marker.clear();

    var w = this.$el.width();
    var h = this.$el.height();
    var m = this.margin;
    var cw = w - m[0] - m[2];
    var x0 = m[0] + cw / 24;
    var x1 = m[0] + cw - cw / 24;
    var x = UTIL.lerp(x0, x1, this.time);
    var markerW = h * 0.15;
    var y = m[1] + markerW;

    this.marker.beginFill(0xFFFFFF);
    this.marker.moveTo(x, y);
    this.marker.lineTo(x + markerW/2, y-markerW);
    this.marker.lineTo(x - markerW/2, y-markerW);
    this.marker.closePath();
    this.marker.endFill();
  };

  return Calendar;

})();
