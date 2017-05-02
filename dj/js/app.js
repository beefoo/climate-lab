'use strict';

var App = (function() {
  function App(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;
    
    // Initialize controls
    var sliders = {
      "#tt-speed": {
        orientation: "vertical", min: 0, max: 1, step: 0.01, value: 0,
        slide: function(e, ui){ _this.onSpeed(ui.value); }
      },
      "#tt-scale": {
        orientation: "vertical", min: 0, max: 8, step: 1, value: 0,
        slide: function(e, ui){ _this.onScale(ui.value); }
      }
    };
    var controls = new Controls({sliders: sliders});

    // Set initial speed and scale
    this.speed = 0;
    this.scale = 0;
    this.dataKey = "co2";
    this.onSpeed(this.speed);

    // Initialize viz and spinners
    this.viz = new DataViz({el: "#pane"});
    this.spinner = new Spinner({el: "#spinner"});

    this.loadData();
  };

  App.prototype.loadData = function(){
    var _this = this;

    $.getJSON(this.opt.dataURL, function(data) {
      console.log('Data loaded.');
      _this.onDataLoaded(data);
    });
  };

  App.prototype.onDataLoaded = function(data){
    this.data = data;
    this.onScale(this.scale);
    // this.startDate = Date.now();
    // this.render();
  };

  App.prototype.onScale = function(value) {
    var dataScale = this.data[this.dataKey]["scales"][value];
    this.viz.loadData(dataScale);
  };

  App.prototype.onSpeed = function(value) {
    var r = this.opt.durationRange;
    this.duration = UTIL.lerp(r[0], r[1], value);
  };

  App.prototype.render = function(){
    var _this = this;

    var d = Date.now();
    var elapsed = d - this.startDate;
    var progress = elapsed / this.duration % 1;

    this.viz.render(progress);
    // this.spinner.render(progress);
  	requestAnimationFrame(function(){ _this.render(); });
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
