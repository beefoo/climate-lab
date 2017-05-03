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
        orientation: "horizontal", min: 0, max: 1, step: 0.001, value: 0,
        slide: function(e, ui){ _this.onSpeed(ui.value); }
      },
      "#tt-scale": {
        orientation: "horizontal", min: 0, max: 1, step: 0.001, value: 0,
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
    this.currentData = data[this.dataKey];
    this.scaleCount = this.currentData.scales.length;

    this.onScale(this.scale);
    // this.startDate = Date.now();
    // this.render();
  };

  App.prototype.onScale = function(value) {
    var percentPerScale = 1.0 / this.scaleCount;
    var tp = this.opt.transitionPercent * percentPerScale;
    var halfTp = tp / 2;

    // determine current and closest index
    var scaleIndex = Math.min(Math.floor(value * this.scaleCount), this.scaleCount-1);
    var closestIndex = Math.round(value * this.scaleCount);
    var d1 = this.currentData["scales"][scaleIndex];
    var d2 = false;

    // determine if we are transitioning between two scales
    var transitionAmount = 0;
    var closestValue = closestIndex * percentPerScale;
    var diff = Math.abs(value - closestValue);
    if (closestIndex > 0 && closestIndex < this.scaleCount && diff < halfTp) {
      transitionAmount = (value - closestValue + halfTp) / tp;

      // determine the other scope we are transitioning to
      if (value > closestValue) {
        d2 = d1;
        d1 = this.currentData["scales"][scaleIndex-1];
      } else {
        d2 = this.currentData["scales"][scaleIndex+1];
      }
      this.viz.transitionData(d1, d2, transitionAmount);

    // we are showing one scale
    } else {
      this.viz.loadData(d1);
    }
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
