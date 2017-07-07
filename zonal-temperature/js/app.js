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

    // Initialize
    this.time = 1;
    this.zone = 0.5;
    this.dataKey = this.opt.dataKey;

    // Initialize controls
    var sliders = {
      "#zone": {
        orientation: "vertical", min: 0, max: 1, step: 0.001, value: this.zone,
        slide: function(e, ui){
          _this.onZoneChange(1-ui.value);
        }
      },
      "#time": {
        orientation: "horizontal", min: 0, max: 1, step: 0.001, value: this.time,
        slide: function(e, ui){
          _this.onTimeChange(ui.value);
        }
      }
    };
    var controls = new Controls({sliders: sliders});



    // Initialize viz
    this.map = new DataMap({el: "#pane-left", time: this.time, zone: this.zone});
    this.graph = new DataGraph({el: "#pane-right", time: this.time, zone: this.zone});

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

    this.map.initZones(this.data.length);

    this.render();
  };

  App.prototype.onTimeChange = function(value) {
    // this.map.updateTime(value);
    this.graph.updateTime(value);
  };

  App.prototype.onZoneChange = function(value) {
    this.map.updateZone(value);
  };

  App.prototype.render = function(){
    var _this = this;

    // this.map.render();
    this.graph.render();

    requestAnimationFrame(function(){ _this.render(); });
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
