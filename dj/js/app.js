'use strict';

var App = (function() {
  function App(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var controls = new Controls({});
    this.viz = new DataViz({el: "#pane"});
    this.spinner = new Spinner({el: "#spinner"});

    // this.spinnerLeft.render(0);
    // this.spinnerRight.render(0);

    this.loadData();
  };

  App.prototype.loadData = function(){
    var _this = this;

    $.getJSON(this.opt.dataURL, function(data) {
      console.log('Data loaded.');
      _this.parseData(data);
      _this.startDate = Date.now();
      // _this.render();
    });
  };

  App.prototype.parseData = function(d){
    $.each(d, function(key, data){

    });
    $.publish('data.loaded', d);
  };

  App.prototype.render = function(){
    var _this = this;

    var d = Date.now();
    var elapsed = d - this.startDate;
    var progress = 0;

    this.viz.render(progress);
    this.spinner.render(progress);
  	requestAnimationFrame(function(){ _this.render(); });
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
