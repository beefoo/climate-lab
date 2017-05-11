'use strict';

var App = (function() {
  function App(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var sliders = {
      "#tt-speed": {
        orientation: "vertical", min: 0, max: 1, step: 0.01, value: 0,
        slide: function(e, ui){},
        stop: function(e, ui){}
      },
      "#tt-scale": {
        orientation: "vertical", min: 0, max: 1, step: 0.01, value: 0,
        slide: function(e, ui){},
        stop: function(e, ui){}
      },
      "#tt-crossfade": {
        orientation: "horizontal", min: 0, max: 1, step: 0.01, value: 0.5,
        slide: function(e, ui){},
        stop: function(e, ui){}
      }
    };

    var controls = new Controls({sliders: sliders});
    this.vizLeft = new DataViz({el: "#pane-left"});
    this.vizRight = new DataViz({el: "#pane-right"});
    this.spinnerLeft = new Spinner({el: "#spinner-left"});
    this.spinnerRight = new Spinner({el: "#spinner-right"});

    // this.spinnerLeft.render(0);
    // this.spinnerRight.render(0);

    this.loadData();
  };

  App.prototype.loadData = function(){
    var _this = this;

    $.getJSON(this.opt.dataURL, function(data) {
      console.log('Data loaded.');
      $.publish('data.loaded', data);
      _this.startDate = Date.now();
      // _this.render();
    });
  };

  App.prototype.render = function(){
    var _this = this;

    var d = Date.now();
    var elapsed = d - this.startDate;
    var progress = 0;

    this.vizLeft.render(progress);
    this.vizRight.render(progress);
    this.spinnerLeft.render(progress);
    this.spinnerRight.render(progress);
  	requestAnimationFrame(function(){ _this.render(); });
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
