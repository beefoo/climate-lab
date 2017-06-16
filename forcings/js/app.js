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

    this.data = [];
    this.progress = 0;

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
    var _this = this;

    // Initialize controls
    var sliders = {
      "#slider-time": {
        orientation: "horizontal", min: 0, max: 1, step: 0.001, value: 0,
        start: function( event, ui ) { _this.transitioning = true; },
        slide: function(e, ui){
          _this.onSlide(ui.value);
        },
        stop: function( event, ui ) { _this.transitioning = false; }
      },
      "#slider-data": {
        orientation: "vertical", min: 0, max: data.data.length-2, step: 1, value: data.data.length-2,
        start: function( event, ui ) { _this.transitioning = true; },
        slide: function(e, ui){
          _this.onDataSelect(ui.value);
        },
        stop: function( event, ui ) { _this.transitioning = false; }
      }
    };

    var controls = new Controls({sliders: sliders});

    // load data
    this.data = data.data.slice(1);

    // load data viz
    this.dataVizLeft = new DataViz({"el": "#pane-left", "label": data.data[1].label, "data": data.data[1].data, "domain": data.domain, "range": data.range, "stereo": 0.0});
    this.dataVizRight = new DataViz({"el": "#pane-right", "label": data.data[0].label, "data": data.data[0].data, "domain": data.domain, "range": data.range, "soundDir": "audio/acoustic_grand_piano-mp3/", "stereo": 1.0});

    this.render();
  };

  App.prototype.onDataSelect = function(value) {
    var i = this.data.length - 1 - value;
    var data = this.data[i];
    this.dataVizLeft.setData(data.data, data.label);
  };

  App.prototype.onSlide = function(value) {
    this.progress = value;
  };

  App.prototype.render = function(){
    var _this = this;

    this.dataVizLeft.render(this.progress);
    this.dataVizRight.render(this.progress);

  	requestAnimationFrame(function(){ _this.render(); });
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
