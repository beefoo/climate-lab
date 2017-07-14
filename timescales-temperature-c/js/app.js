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

    // Set initial scale
    this.scale = 0;
    this.time = 1;
    this.dataKey = this.opt.dataKey;

    // Initialize controls
    var sliders = {
      "#scale": {
        orientation: "vertical", min: 0, max: 1, step: 0.001, value: this.scale,
        slide: function(e, ui){
          if (ui.value < 0) return false;
          _this.onScale(ui.value);
        }
      },
      "#time": {
        orientation: "horizontal", min: 0, max: 1, step: 0.001, value: this.time,
        slide: function(e, ui){
          if (ui.value < 0) return false;
          _this.onTime(ui.value);
        }
      }
    };
    var controls = new Controls({sliders: sliders});

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

    this.onScale(this.scale);
    this.onTime(this.time);
    this.render();
  };

  App.prototype.onDelta = function() {
    var domain = this.domain;
    var d0 = domain[0];
    var d1 = domain[1];

    var mapped = _.map(this.data, function(d,i){ return {x: i+domain[0], y: d}; });
    var filtered = _.filter(mapped, function(d){ return d.x >= d0 && d.x <= d1; });

    var values = _.pluck(filtered, 'value');
    var range = [_.min(values), _.max(values)];

    this.viz.update(filtered, domain, range);
  };

  App.prototype.onScale = function(value) {
    this.scale = UTIL.easeInOutSin(value);
    this.onDelta();
  };

  App.prototype.onTime = function(value) {
    this.time = value;
    this.onDelta();
  };

  App.prototype.render = function(){
    var _this = this;

    this.viz.render();

    requestAnimationFrame(function(){ _this.render(); });
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
