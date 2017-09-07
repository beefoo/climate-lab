'use strict';

var Timeline = (function() {
  function Timeline(options) {
    var defaults = {
      highlightH: 0.4,
      timelineH: 0.6
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Timeline.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.offsetX = this.opt.offsetX;

    this.loadView();
    this.render();
  };

  Timeline.prototype.loadView = function(){
    this.app = new PIXI.Application(this.$el.width(), this.$el.height(), {transparent : true});
    this.timeline = new PIXI.Graphics();
    this.highlight = new PIXI.Graphics();

    this.app.stage.addChild(this.highlight, this.timeline);

    this.$el.append(this.app.view);
  };

  Timeline.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());
    this.render();
  };

  Timeline.prototype.render = function(){
    this.renderHighlight();
    this.renderTimeline();
  };

  Timeline.prototype.renderHighlight = function(){
    var w = this.app.renderer.width;
    var h = this.app.renderer.height * this.opt.highlightH;
    var y = 0;

    this.highlight.clear();

    this.highlight.beginFill(0x4b4966);
    this.highlight.drawRect(0, y, w, h);
    this.highlight.endFill();
  };

  Timeline.prototype.renderTimeline = function(){
    var w = this.app.renderer.width;
    var h = this.app.renderer.height * this.opt.timelineH;
    var y = this.app.renderer.height * this.opt.highlightH;

    this.timeline.clear();
    while(this.timeline.children[0]) {
      this.timeline.removeChild(this.timeline.children[0]);
    }

    this.timeline.beginFill(0xbc5edb);
    this.timeline.drawRect(0, y, w, h);
    this.timeline.endFill();
  };

  Timeline.prototype.updateOffsetX = function(offsetX){
    this.offsetX = offsetX;
    this.render();
  };

  return Timeline;

})();
