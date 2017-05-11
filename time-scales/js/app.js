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
    this.render();
  };

  App.prototype.onScale = function(value) {
    var percentPerScale = 1.0 / this.scaleCount;
    var tp = this.opt.transitionPercent * percentPerScale;
    var halfTp = tp / 2;

    // determine current and closest index
    var scaleIndex = Math.min(Math.floor(value * this.scaleCount), this.scaleCount-1);
    var closestIndex = Math.round(value * this.scaleCount);
    var s1 = this.currentData.scales[scaleIndex];
    var s2 = false;
    var data = this.currentData.data;

    // determine if we are transitioning between two scales
    var transitionAmount = 0;
    var closestValue = closestIndex * percentPerScale;
    var diff = Math.abs(value - closestValue);
    if (closestIndex > 0 && closestIndex < this.scaleCount && diff < halfTp) {
      transitionAmount = (value - closestValue + halfTp) / tp;

      // determine the other scope we are transitioning to
      if (value >= closestValue) {
        s2 = s1;
        s1 = this.currentData["scales"][scaleIndex-1];
      } else {
        s2 = this.currentData["scales"][scaleIndex+1];
      }
      this.viz.transitionData(s1, s2, transitionAmount, data);
      this.startDate = Date.now();
      this.transitioning = true;

    // we are showing one scale
    } else {
      this.viz.loadData(s1, data);
      this.transitioning = false;
    }
  };

  App.prototype.onSpeed = function(value) {
    var r = this.opt.durationRange;
    this.duration = UTIL.lerp(r[0], r[1], value);
    this.startDate = Date.now();
  };

  App.prototype.render = function(){
    var _this = this;

    if (this.startDate==undefined) {
      this.startDate = Date.now();
    }
    var d = Date.now();
    var elapsed = d - this.startDate;
    var hold = this.opt.durationHold;
    var dur = this.duration + hold;
    var nonHold = this.duration / dur;
    var progress = elapsed % dur / dur;

    // logic for determining if we should hold the last note
    if (progress >= nonHold) {
      progress = 1.0;
    } else {
      progress = UTIL.norm(progress, 0, nonHold);
    }

    if (this.transitioning) {
      this.viz.renderProgress(0);
    } else {
      this.viz.renderProgress(progress);
    }

    // this.spinner.render(progress);
  	requestAnimationFrame(function(){ _this.render(); });
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
