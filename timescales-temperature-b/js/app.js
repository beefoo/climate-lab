'use strict';

var App = (function() {
  function App(options) {
    var defaults = {
      enableSound: true
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    // Initialize controls
    var sliders = {
      "#scale": {
        orientation: "horizontal", min: -0.1, max: 1, step: 0.001, value: 0, range: "min",
        start: function( event, ui ) { _this.transitioning = true; },
        slide: function(e, ui){
          if (ui.value < 0) return false;
          _this.onScale(ui.value);
        },
        stop: function( event, ui ) { _this.transitioning = false; }
      }
    };
    var controls = new Controls({sliders: sliders});

    // Set initial speed and scale
    this.speed = this.opt.speed;
    this.scale = 0.0;
    this.dataKey = this.opt.dataKey;
    this.annotations = [];
    this.onSpeed(this.speed);

    // Initialize viz and spinners
    this.viz = new DataViz({el: "#pane", enableSound: this.opt.enableSound});

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
    var d = data[this.dataKey];

    this.data = d.data;
    this.domain = d.domain;
    this.range = d.range;

    // check for annotations
    if (_.has(data,"annotations")) {
      this.annotations = data["annotations"][this.dataKey];
    }

    this.onScale(this.scale);
    this.render();
  };

  App.prototype.onScale = function(value) {
    value = UTIL.easeInOutSin(value);
    var d0 = this.domain[0];
    var d1 = Math.round(UTIL.lerp(this.domain[0], this.domain[1], value));
    var domain = [d0, d1];

    var filtered = _.filter(this.data, function(d){ return d[0] >= d0 && d[0] <= d1; });
    var mapped = _.map(filtered, function(d){ return {year: d[0], value: d[1], color: d[2], record: d[3]}; });
    var values = _.pluck(mapped, 'value');
    var range = [_.min(values), _.max(values)];

    // var annotations = _.filter(this.annotations, function(a){ return d0 >= a.startDate && d0 <= a.endDate; });
    // this.viz.updateAnnotations(annotations);

    this.startDate = Date.now();
    this.viz.update(mapped, domain, range);
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

    // only play through once
    if (elapsed > dur) {
      progress = 0.0;
    // logic for determining if we should hold the last note
    } else if (progress >= nonHold) {
      progress = 1.0;
    } else {
      progress = UTIL.norm(progress, 0, nonHold);
    }

    if (this.transitioning) {
      this.viz.render(0);
    } else {
      this.viz.render(progress);
    }

    requestAnimationFrame(function(){ _this.render(); });
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
