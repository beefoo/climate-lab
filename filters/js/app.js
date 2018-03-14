'use strict';

var App = (function() {
  function App(options) {
    var defaults = {
      transitionMs: 3000,
      restMs: 3000,
      pixelSize: 10,
      pixelSpace: 10,
      circleStep: 1
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    this.$el = $("#app");
    this.startTime = new Date();

    this.loadView();
    this.loadListeners();
    this.render();
  };

  App.prototype.loadListeners = function(){
    var _this = this;

    var resize = function(){
      _this.onResize();
    };
    $(window).on('resize', resize);
  };

  App.prototype.loadView = function(){
    var w = this.$el.width();
    var h = this.$el.height();
    var app = new PIXI.Application(w, h, {backgroundColor : 0x000000, antialias: true});
    var pixelSize = this.opt.pixelSize;
    var pixelSpace = this.opt.pixelSpace;

    // load graph
    var graph = PIXI.Sprite.fromImage('img/graph.png');
    graph.anchor.set(0.5, 0.5);
    graph.x = w / 2;
    graph.y = h / 2;
    graph.width = w / 2;
    graph.height = (w / 2) * (773/1200);

    // apply filter to graph
    var fragSrc = $("#graph-fragment-shader").text();
    var graphFilter = new PIXI.Filter(null, fragSrc);
    graphFilter.uniforms.size[0] = pixelSize;
    graphFilter.uniforms.size[1] = pixelSize;
    graphFilter.uniforms.spacing[0] = pixelSpace;
    graphFilter.uniforms.spacing[1] = pixelSpace;
    graphFilter.uniforms.progress = 0;
    graphFilter.uniforms.threshold = 0.3;
    graph.filters = [graphFilter];

    // load circle
    var circle = PIXI.Sprite.fromImage('img/circle.png');
    var circleW = w / 6;
    circle.anchor.set(0.5, 0.5);
    circle.width = circleW;
    circle.height = circleW;
    circle.x = _.random(circleW, w - circleW);
    circle.y = _.random(circleW, h - circleW);
    var circleFilter = new PIXI.Filter(null, fragSrc);
    circleFilter.uniforms.size[0] = pixelSize;
    circleFilter.uniforms.size[1] = pixelSize;
    circleFilter.uniforms.spacing[0] = pixelSpace;
    circleFilter.uniforms.spacing[1] = pixelSpace;
    circleFilter.uniforms.progress = 1.0;
    circleFilter.uniforms.threshold = 0.0;
    circle.filters = [circleFilter];

    var circleStep = this.opt.circleStep;
    this.circleDirection = [circleStep, circleStep];
    this.circleRadius = circleW * 0.5;

    // add to document
    app.stage.addChild(circle, graph);
    document.body.appendChild(app.view);

    this.app = app;
    this.graphFilter = graphFilter;
    this.circle = circle;
    this.graph = graph;
  };

  App.prototype.onResize = function(){
    var w = this.$el.width();
    var h = this.$el.height();
    this.app.renderer.resize(w, h);
  };

  App.prototype.render = function(){
    var _this = this;

    var transitionMs = this.opt.transitionMs;
    var restMs = this.opt.restMs;
    var halfMs = restMs + transitionMs
    var totalMs = halfMs * 2;
    var now = new Date();
    var delta = now - this.startTime;
    var progress = delta % totalMs;

    // determine progress
    var restProgress = 0.0;
    if (progress > halfMs) {
      progress = progress - halfMs;
      restProgress = 1.0;
    }
    if (progress > restMs) {
      progress = (progress-restMs) / transitionMs;
      if (restProgress > 0.0) progress = 1.0 - progress;
    } else {
      progress = restProgress;
    }

    progress = UTIL.easeInOutSin(progress);
    this.graphFilter.uniforms.progress = progress;

    var w = this.app.screen.width;
    var h = this.app.screen.height;
    var circle = this.circle;
    var circleRadius = this.circleRadius;
    var circleDirection = this.circleDirection;
    var circleStep = this.opt.circleStep;
    circle.alpha = progress;
    var x = circle.x + circleDirection[0];
    var y = circle.y + circleDirection[1];
    if ((x-circleRadius) < 0) {
      x = circleRadius;
      circleDirection[0] = circleStep;
    }
    else if ((x+circleRadius) >= w) {
      x = w - circleRadius - 1;
      circleDirection[0] = -circleStep;
    }
    if ((y-circleRadius) < 0) {
      y = circleRadius;
      circleDirection[1] = circleStep;
    }
    else if ((y+circleRadius) >= h) {
      y = h - circleRadius - 1;
      circleDirection[1] = -circleStep;
    }
    circle.x = x;
    circle.y = y;
    this.circleDirection = circleDirection;

    requestAnimationFrame(function(){ _this.render(); });
  };

  return App;

})();

$(function() {
  var app = new App({});
});
