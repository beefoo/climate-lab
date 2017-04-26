'use strict';

var DataViz = (function() {
  function DataViz(options) {
    var defaults = {
      el: '#main'
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  DataViz.prototype.init = function(){
    this.$el = $(this.opt.el);

    this.loadView();
    this.loadListeners();
  };

  DataViz.prototype.loadListeners = function(){
    var _this = this;

    $.subscribe('data.loaded', function(e, data){
      console.log('Viz received data');
      _this.onDataLoaded(data);
    });

    $(window).on('resize', function(e){
      _this.onResize();
    })
  };

  DataViz.prototype.loadView = function(){
    this.app = new PIXI.Application(this.$el.width(), this.$el.height(), {transparent : true});
    this.$el.append(this.app.view);
  };

  DataViz.prototype.onDataLoaded = function(data){

  };

  DataViz.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());
  };

  DataViz.prototype.render = function(progress){

  };

  return DataViz;

})();
