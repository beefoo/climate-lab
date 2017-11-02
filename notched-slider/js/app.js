'use strict';

var App = (function() {
  function App(options) {
    var defaults = {
      stops: 4,
      notchesLeft: 0.75,
      marginTop: 0.15,
      radius: 0.18,
      transitionMs: 1000
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    this.slideAmount = 0.5;
    var activeStop = Math.round(this.slideAmount * (this.opt.stops - 1));
    this.stop = activeStop;
    this.transitionStart = false;

    var stops = [];
    _(this.opt.stops).times(function(n){
      var isActive = (n === activeStop);
      var d = false;
      if (isActive) d = new Date();
      stops.push({
        transitionStart: d,
        active: isActive,
        start: 0,
        end: 1.0,
        current: 0
      })
    });
    this.stops = stops;

    this.$el = $('#canvas');

    this.loadListeners();
    this.loadView();

    this.render();
  };

  App.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(e){
      _this.onResize();
    });

    $('#slider').slider({
      orientation: "vertical",
      min: 0,
      max: 1,
      step: 0.001,
      value: this.slideAmount,
      slide: function(e, ui){
        _this.onSlide(1-ui.value);
      }
    });
  };

  App.prototype.loadView = function(){
    this.app = new PIXI.Application(this.$el.width(), this.$el.height(), {antialias: true});
    this.notches = new PIXI.Graphics();
    this.marker = new PIXI.Graphics();
    this.app.stage.addChild(this.notches, this.marker);
    this.$el.append(this.app.view);
  };

  App.prototype.onResize = function(){
    var _this = this;

    this.app.renderer.resize(this.$el.width(), this.$el.height());
  };

  App.prototype.onSlide = function(amount){
    var _this = this;
    var transitionMs = this.opt.transitionMs;

    this.slideAmount = amount;
    var activeStop = Math.round(this.slideAmount * (this.opt.stops - 1));
    var now = new Date();

    if (activeStop != this.stop) {

      this.transitionStart = now;
      this.fromStop = this.stop;
      this.toStop = activeStop;

      _.each(this.stops, function(stop, i){
        if (stop.active) {

          _this.stops[i].active = false;
          if (stop.transitionStart) {
            _this.stops[i].start = stop.current;
            _this.stops[i].end = 0;
            var delta = now - stop.transitionStart;
            _this.stops[i].transitionStart = now - (transitionMs - delta);

          } else {
            _this.stops[i].start = 1;
            _this.stops[i].end = 0;
            _this.stops[i].transitionStart = now;
          }

        } else if (i===activeStop) {

          _this.stops[i].active = true;
          if (stop.transitionStart) {
            _this.stops[i].start = stop.current;
            _this.stops[i].end = 1;
            var delta = now - stop.transitionStart;
            _this.stops[i].transitionStart = now - (transitionMs - delta);

          } else {
            _this.stops[i].start = 0;
            _this.stops[i].end = 1;
            _this.stops[i].transitionStart = now;
          }
        }
      });

    }

    this.stop = activeStop;
  };

  App.prototype.render = function(){
    var _this = this;

    this.renderNotches();
    this.renderMarker();

    requestAnimationFrame(function(){ _this.render(); });
  };

  App.prototype.renderMarker = function(){
    var _this = this;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var stops = this.opt.stops;

    var activeStop = Math.round(this.slideAmount * (stops - 1));
    var x1 = w * this.opt.notchesLeft - w * 0.01;
    var y0 = h * this.opt.marginTop;
    var cw = x1;
    var ch = h - y0 * 2;
    var x0 = cw * 0.5;
    var stopH = ch / (stops-1);
    var radius = (w - x1) * this.opt.radius * 0.667;
    var y = UTIL.lerp(y0, y0+ch, this.slideAmount);
    var yn = y0 + activeStop/(stops-1) * ch;

    if (this.transitionStart) {
      var now = new Date();
      var delta = now - this.transitionStart;
      var progress = delta / this.opt.transitionMs;
      if (progress > 1) progress = 1.0;

      progress = UTIL.easeInElastic(progress);
      var stop = UTIL.lerp(this.fromStop, this.toStop, progress);
      yn = y0 + stop/(stops-1) * ch;

      if (progress >= 1.0) {
        this.transitionStart = false;
      }
    }

    this.marker.clear();

    // draw triangle
    this.marker.lineStyle(0);
    this.marker.beginFill(0xffffff);
    this.marker.moveTo(x1, yn);
    this.marker.lineTo(x1-radius, yn-radius * 0.8);
    this.marker.lineTo(x1-radius, yn+radius * 0.8);
    this.marker.closePath();
    this.marker.endFill();

    // draw line
    var xmid = (x1 - x0) / 2 + x0;
    this.marker.lineStyle(cw * 0.01, 0xffffff);
    this.marker.moveTo(x0, y);
    this.marker.quadraticCurveTo(xmid, y, x1-radius, yn);
    this.marker.lineTo(x1-radius/2, yn);
  };

  App.prototype.renderNotches = function(){
    var _this = this;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var stops = this.opt.stops;
    var transitionMs = this.opt.transitionMs;
    var textStyle = {};

    var activeStop = Math.round(this.slideAmount * (stops - 1));
    var x0 = w * this.opt.notchesLeft;
    var y0 = h * this.opt.marginTop;
    var cw = w - x0;
    var ch = h - y0 * 2;
    var stopH = ch / (stops-1);
    var radius = cw * this.opt.radius;
    var r1 = radius;
    var r2 = radius * 1.2;

    textStyle.fontSize = cw * 0.15;

    this.notches.clear();
    while(this.notches.children[0]) {
      this.notches.removeChild(this.notches.children[0]);
    }

    var now = new Date();

    _.each(this.stops, function(stop, i){
      var text = stops - i;
      var x = x0 + radius;
      var y = y0 + i * stopH;
      var ts = _.extend({}, textStyle, {fill: "#919e9c"});

      var r = r1;

      if (stop.active) r = r2;

      if (stop.transitionStart) {
        var delta = now - stop.transitionStart;
        var progress = delta/transitionMs;
        if (progress > 1) progress = 1.0;

        var p = UTIL.lerp(stop.start, stop.end, progress);
        if (stop.end > stop.start) {
          p = UTIL.easeInElastic(p);
        } else {
          p = UTIL.easeInOutCubic(p);
        }

        var r = UTIL.lerp(r1, r2, p);

        if (progress >= 1.0) {
          _this.stops[i].transitionStart = false;
        }
        _this.stops[i].current = progress;
      }

      _this.notches.beginFill(0x393f3f);
      if (i===activeStop) {
        _this.notches.beginFill(0x00897b);
        ts.fill = "#ffffff";
        ts.fontWeight = "bold";
      }
      _this.notches.drawCircle(x, y, r);
      var label = new PIXI.Text(text, ts);
      label.x = x;
      label.y = y;
      label.anchor.set(0.5, 0.5);
      _this.notches.addChild(label);
    });


  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
