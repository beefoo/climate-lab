'use strict';

var Core = (function() {
  function Core(options) {
    var defaults = {
      imageH: 0.5,
      imageY: 0.5,
      annotationsH: 0.3
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Core.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.offsetX = this.opt.offsetX;

    this.loadView();
    this.render();
  };

  Core.prototype.loadView = function(){
    this.app = new PIXI.Application(this.$el.width(), this.$el.height(), {transparent : true});
    this.image = new PIXI.Graphics();
    this.annotations = new PIXI.Graphics();

    this.app.stage.addChild(this.image, this.annotations);

    this.$el.append(this.app.view);
  };

  Core.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());

    this.render();
  };

  Core.prototype.render = function(){
    this.renderImage();
    this.renderAnnotations();
  };

  Core.prototype.renderImage = function(){
    var w = this.app.renderer.width;
    var h = this.app.renderer.height * this.opt.imageH;
    var y = this.app.renderer.height * this.opt.imageY;

    this.image.clear();

    this.image.beginFill(0x84dae8);
    this.image.drawRect(0, y, w, h);
    this.image.endFill();
  };

  Core.prototype.renderAnnotations = function(){
    var w = this.app.renderer.width;
    var h = this.app.renderer.height * this.opt.annotationsH;
    var y = this.app.renderer.height * this.opt.imageY - h;

    this.annotations.clear();
    while(this.annotations.children[0]) {
      this.annotations.removeChild(this.annotations.children[0]);
    }

    this.annotations.beginFill(0xddb95d);
    this.annotations.drawRect(0, y, w, h);
    this.annotations.endFill();
  };

  Core.prototype.updateOffsetX = function(offsetX){
    this.offsetX = offsetX;
    this.render();
  };

  return Core;

})();
