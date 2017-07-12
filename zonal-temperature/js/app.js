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
    this.map = new DataMap({el: "#map", time: this.time, zone: this.zone});
    this.graph = new DataGraph({el: "#graph", time: this.time, zone: this.zone});

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
    this.data = data.zoneData;
    this.domain = data.domain;
    this.range = data.range;

    this.map.initZones(this.data.length);
    this.map.initTime(this.data[0].length);
    this.graph.initData(this.data, this.domain, this.range);
    this.graph.updateZone(this.zone);

    // this.render();
  };

  App.prototype.onTimeChange = function(value) {
    this.map.updateTime(value);
    this.graph.updateTime(value);
  };

  App.prototype.onZoneChange = function(value) {
    this.map.updateZone(value);
    this.graph.updateZone(value);
  };

  App.prototype.render = function(){
    var _this = this;

    this.map.render();
    this.graph.render();

    requestAnimationFrame(function(){ _this.render(); });
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
