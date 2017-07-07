'use strict';

var DataGraph = (function() {
  function DataGraph(options) {
    var defaults = {  };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  DataGraph.prototype.init = function(){
    this.$el = $(this.opt.el);

    this.loadView();
    this.loadListeners();
  };

  DataGraph.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(e){
      _this.onResize();
    })
  };

  DataGraph.prototype.loadView = function(){
    this.app = new PIXI.Application(this.$el.width(), this.$el.height(), {transparent : true});
    this.axes = new PIXI.Graphics();
    this.plot = new PIXI.Graphics();
    this.labels = new PIXI.Graphics();

    this.app.stage.addChild(this.plot, this.axes, this.labels);

    this.$el.append(this.app.view);
  };

  DataGraph.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());
  };

  DataGraph.prototype.render = function(){

  };

  DataGraph.prototype.updateTime = function(value){

  };

  return DataGraph;

})();
