'use strict';

var Timeline = (function() {
  function Timeline(options) {
    var defaults = {
      highlight: [0.03, 0, 0.94, 0.5],
      timeline: [0.03, 0.5, 0.94, 0.3],
      nav: [0.03, 0.8, 0.94, 0.2]
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Timeline.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.offsetX = this.opt.offsetX;
    this.cores = this.opt.cores;
    this.yearsAgo = this.opt.yearsAgo;
    this.depth = this.opt.depth;
    this.core = false;

    this.loadView();
  };

  Timeline.prototype.loadCore = function(i){
    this.core = this.cores[i];
    this.render();
  };

  Timeline.prototype.loadView = function(){
    this.app = new PIXI.Application(this.$el.width(), this.$el.height(), {transparent : true, antialias: true});
    this.timeline = new PIXI.Graphics();
    this.highlight = new PIXI.Graphics();
    this.nav = new PIXI.Graphics();

    this.app.stage.addChild(this.highlight, this.timeline, this.nav);

    this.$el.append(this.app.view);
  };

  Timeline.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());
    this.render();
  };

  Timeline.prototype.render = function(){
    this.renderHighlight();
    this.renderTimeline();
    this.renderNav();
  };

  Timeline.prototype.renderHighlight = function(){
    var x = this.app.renderer.width * this.opt.highlight[0];
    var y = this.app.renderer.height * this.opt.highlight[1];
    var w = this.app.renderer.width * this.opt.highlight[2];
    var h = this.app.renderer.height * this.opt.highlight[3];

    var arrowH = h * 0.1;
    var neckH = h * 0.2;
    var triangleH = h - arrowH - neckH;
    var neckW = w * 0.01;
    var triangleW = w * 0.02;

    var x0 = UTIL.norm(this.core.depthEnd, this.depth, 0) * w + x;
    var x1 = UTIL.norm(this.core.depthStart, this.depth, 0) * w + x;
    var xp = (x1 - x0) / 2 + x0;

    this.highlight.clear();
    this.highlight.beginFill(0x32383d);
    this.highlight.moveTo(0, y);
    this.highlight.lineTo(this.app.renderer.width, y);
    this.highlight.lineTo(xp + neckW/2, y + triangleH);
    this.highlight.lineTo(xp + neckW/2, y + triangleH + neckH);
    this.highlight.lineTo(xp + triangleW/2, y + triangleH + neckH);
    this.highlight.lineTo(xp, h);
    this.highlight.lineTo(xp - triangleW/2, y + triangleH + neckH);
    this.highlight.lineTo(xp - neckW/2, y + triangleH + neckH);
    this.highlight.lineTo(xp - neckW/2, y + triangleH);
    this.highlight.lineTo(0, y);
    this.highlight.endFill();
  };

  Timeline.prototype.renderNav = function(){
    var x = this.app.renderer.width * this.opt.nav[0];
    var y = this.app.renderer.height * this.opt.nav[1];
    var w = this.app.renderer.width * this.opt.nav[2];
    var h = this.app.renderer.height * this.opt.nav[3];

    this.nav.clear();
    while(this.nav.children[0]) {
      this.nav.removeChild(this.nav.children[0]);
    }

    // this.nav.beginFill(0x00676d);
    // this.nav.drawRect(x, y, w, h);
    // this.nav.endFill();
  };

  Timeline.prototype.renderTimeline = function(){
    var x = this.app.renderer.width * this.opt.timeline[0];
    var y = this.app.renderer.height * this.opt.timeline[1];
    var w = this.app.renderer.width * this.opt.timeline[2];
    var h = this.app.renderer.height * this.opt.timeline[3];

    this.timeline.clear();
    while(this.timeline.children[0]) {
      this.timeline.removeChild(this.timeline.children[0]);
    }

    var coreH = h * 0.2;

    this.timeline.beginFill(0x6195a2);
    this.timeline.drawRoundedRect(x, y, w, coreH, coreH * 0.5);
    this.timeline.endFill();
  };

  Timeline.prototype.updateOffsetX = function(offsetX){
    this.offsetX = offsetX;
    this.render();
  };

  return Timeline;

})();
