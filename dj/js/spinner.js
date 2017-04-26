'use strict';

var Spinner = (function() {
  function Spinner(options) {
    var defaults = {
      el: '#spinner'
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Spinner.prototype.init = function(){
    this.$el = $(this.opt.el);

    this.loadView();
  };

  Spinner.prototype.loadView = function(){
    this.app = new PIXI.Application(this.$el.width(), this.$el.height(), {transparent : true});

    var cx = this.app.renderer.width / 2;
    var cy = this.app.renderer.height / 2;
    var pi = Math.PI;

    this.spinner = new PIXI.Graphics();
    this.spinner.beginFill(0x26A69A);
    this.spinner.moveTo(0, 0);
    this.spinner.arc(0, 0, cx, -pi/2-pi/12, pi/6-pi/2-pi/12);
    this.spinner.lineTo(0, 0);
    this.spinner.position = {x: cx, y: cy};
    this.app.stage.addChild(this.spinner);

    this.$el.append(this.app.view);
  };

  Spinner.prototype.render = function(progress){
    this.spinner.rotation = progress * (Math.PI * 2);
  };

  return Spinner;

})();
