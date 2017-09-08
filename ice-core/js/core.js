'use strict';

var Core = (function() {
  function Core(options) {
    var defaults = {
      imageH: 0.8,
      imageY: 0.2,
      annotationsH: 0.2
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Core.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.offsetX = this.opt.offsetX;
    this.core = false;

    this.loadView();
  };

  Core.prototype.loadCore = function(core){

    this.core = core;
    this.coreSprite = new PIXI.Sprite.fromImage(core.image);

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
    if (!this.core) return false;

    var ratio = this.core.imageW / this.core.imageH;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height * this.opt.imageH;
    var cw = h * ratio;
    var y = this.app.renderer.height * this.opt.imageY;
    var x = -1 * this.offsetX * (cw - w);

    this.image.clear();
    while(this.image.children[0]) {
      this.image.removeChild(this.image.children[0]);
    }

    this.image.beginFill(0x32383d);
    this.image.drawRect(0, y, w, h);
    this.image.endFill();

    this.coreSprite.x = x;
    this.coreSprite.y = y;
    this.coreSprite.width = h * ratio;
    this.coreSprite.height = h;

    this.image.addChild(this.coreSprite);
  };

  Core.prototype.renderAnnotations = function(){
    var w = this.app.renderer.width;
    var h = this.app.renderer.height * this.opt.annotationsH;
    var y = this.app.renderer.height * this.opt.imageY - h;

    this.annotations.clear();
    while(this.annotations.children[0]) {
      this.annotations.removeChild(this.annotations.children[0]);
    }


  };

  Core.prototype.updateOffsetX = function(offsetX){
    this.offsetX = offsetX;
    this.render();
  };

  return Core;

})();
