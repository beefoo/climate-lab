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

    // Set initial scale
    this.scale = 0.0;
    this.dataKey = this.opt.dataKey;

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
    this.render();
  };

  App.prototype.onScale = function(value) {
    value = UTIL.easeInOutSin(value);
    var d0 = this.domain[0];
    var d1 = Math.round(UTIL.lerp(this.domain[0], this.domain[1], value));
    var domain = [d0, d1];

    var filtered = _.filter(this.data, function(d){ return d[0] >= d0 && d[0] <= d1; });
    var mapped = _.map(filtered, function(d){ return {year: d[0], value: d[1], color: d[2], norm: d[3], record: d[4]}; });
    var values = _.pluck(mapped, 'value');
    var range = [_.min(values), _.max(values)];

    this.viz.update(mapped, domain, range);
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
