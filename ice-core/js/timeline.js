'use strict';

var Timeline = (function() {
  function Timeline(options) {
    var defaults = {
      highlight: [0.04, 0, 0.92, 0.5],
      timeline: [0.04, 0.5, 0.92, 0.5],
      nav: [0.04, 0.55, 0.92, 0.27],
      navTextStyle: {
        fill: "#343538",
        fontSize: 22,
        fontWeight: "bold"
      },
      navSubtextStyle: {
        fill: "#343538",
        fontSize: 18,
        align: "center"
      }
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
    this.navLabels = [];
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
    this.app.stage.addChild(this.timeline, this.nav, this.highlight);

    this.loadHotspots();

    this.$el.append(this.app.view);
  };

  Timeline.prototype.loadHotspots = function(){
    var _this = this;

    var x = this.app.renderer.width * this.opt.nav[0];
    var y = this.app.renderer.height * this.opt.nav[1];
    var w = this.app.renderer.width * this.opt.nav[2];
    var h = this.app.renderer.height * this.opt.nav[3];

    var labelW = w * 0.1;
    var labelH = h;
    var depth = this.depth;

    _.each(this.cores, function(core, i){
      var x0 = UTIL.norm(core.depthEnd, depth, 0) * w + x;
      var x1 = UTIL.norm(core.depthStart, depth, 0) * w + x;
      var xp = (x1 - x0) / 2 + x0;

      var hotspot = new PIXI.Graphics();
      hotspot.hitArea = new PIXI.Rectangle(xp-labelW/2, y, labelW, labelH);
      hotspot.interactive = true;
      hotspot.buttonMode = true;
      hotspot.on('pointerdown', function(){
        $.publish('core.load', i);
      });

      _this.app.stage.addChild(hotspot);
    });
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

    var circleRadius = h * 0.12;
    var neckH = h * 0.2;
    var triangleH = h - h * 0.07 - neckH;
    var neckW = w * 0.01;

    var x0 = UTIL.norm(this.core.depthEnd, this.depth, 0) * w + x;
    var x1 = UTIL.norm(this.core.depthStart, this.depth, 0) * w + x;
    var xp = (x1 - x0) / 2 + x0;

    this.highlight.clear();
    this.highlight.lineStyle(0);
    this.highlight.beginFill(0x32383d);
    this.highlight.moveTo(0, y);
    this.highlight.lineTo(this.app.renderer.width, y);
    this.highlight.lineTo(xp + neckW/2, y + triangleH);
    this.highlight.lineTo(xp + neckW/2, y + triangleH + neckH);
    this.highlight.lineTo(xp - neckW/2, y + triangleH + neckH);
    this.highlight.lineTo(xp - neckW/2, y + triangleH);
    this.highlight.lineTo(0, y);
    this.highlight.endFill();


    this.highlight.lineStyle(8, 0x32383d);
    this.highlight.drawCircle(xp, y + triangleH + neckH + circleRadius, circleRadius);
  };

  Timeline.prototype.renderNav = function(){
    var _this = this;
    var x = this.app.renderer.width * this.opt.nav[0];
    var y = this.app.renderer.height * this.opt.nav[1];
    var w = this.app.renderer.width * this.opt.nav[2];
    var h = this.app.renderer.height * this.opt.nav[3];

    this.nav.clear();
    while(this.nav.children[0]) {
      this.nav.removeChild(this.nav.children[0]);
    }

    var activeCore = this.core;
    var arrowH = h * 0.15;
    var labelH = h - arrowH;
    var labelW = w * 0.1;
    var depth = this.depth;
    var textStyle = this.opt.navTextStyle;
    var subtextStyle = this.opt.navSubtextStyle;
    var labelPad = labelW * 0.04;

    textStyle.fontSize = w * 0.011;
    subtextStyle.fontSize = w * 0.007;

    _.each(this.cores, function(core, i){
      var active = activeCore && activeCore.id == core.id;
      var x0 = UTIL.norm(core.depthEnd, depth, 0) * w + x;
      var x1 = UTIL.norm(core.depthStart, depth, 0) * w + x;
      var xp = (x1 - x0) / 2 + x0;
      var yOffset = 0;
      var fillColor = 0xcc8b00;

      if (active) {
        fillColor = 0xffcc68;
        yOffset = h * 0.17;
      }

      _this.nav.beginFill(fillColor);
      _this.nav.drawRoundedRect(xp-labelW/2, y + arrowH + yOffset, labelW, labelH, labelH*0.1);
      _this.nav.moveTo(xp, y + yOffset);
      _this.nav.lineTo(xp-arrowH, y+arrowH + yOffset);
      _this.nav.lineTo(xp+arrowH, y+arrowH + yOffset);
      _this.nav.lineTo(xp, y + yOffset);
      _this.nav.endFill();

      var label = new PIXI.Text(core.label, textStyle);
      label.x = xp;
      label.y = y + arrowH + yOffset + labelPad;
      label.anchor.set(0.5, 0);
      _this.nav.addChild(label);

      label = new PIXI.Text(core.title, subtextStyle);
      label.x = xp;
      label.y = y + arrowH + yOffset + labelPad * 2 + textStyle.fontSize;
      label.anchor.set(0.5, 0);
      _this.nav.addChild(label);
    });
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

    var coreH = h * 0.1;

    this.timeline.lineStyle(0);
    this.timeline.beginFill(0x6195a2);
    this.timeline.drawRoundedRect(x, y, w, coreH, coreH * 0.5);
    this.timeline.endFill();

    // var marginY = h * 0.2;
    // var labelH = h - coreH - marginY * 3;
    // var marginX = w * 0.002;
    // this.timeline.lineStyle(2, 0x565b5b);
    // this.timeline.moveTo(x+marginX, y+marginY+coreH);
    // this.timeline.lineTo(x+marginX, y+marginY+coreH+labelH);
    // this.timeline.lineTo(x+w-marginX, y+marginY+coreH+labelH);
    // this.timeline.lineTo(x+w-marginX, y+marginY+coreH);
    // this.timeline.moveTo(this.app.renderer.width * 0.5, y+marginY+coreH+labelH);
    // this.timeline.lineTo(this.app.renderer.width * 0.5, y+marginY*1.5+coreH+labelH);
    //
    // var textStyle = this.opt.navTextStyle;
    // var label = new PIXI.Text("3 kilometers (1.9 miles)", textStyle);
    // label.x = this.app.renderer.width * 0.5;
    // label.y = y+marginY*1.6+coreH+labelH;
    // label.anchor.set(0.5, 0);
    // this.timeline.addChild(label);
  };

  Timeline.prototype.updateOffsetX = function(offsetX){
    this.offsetX = offsetX;
    this.render();
  };

  return Timeline;

})();
