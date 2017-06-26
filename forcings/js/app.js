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
    this.dataIndex = -1;

    this.loadData();
    this.loadListeners();
  };

  App.prototype.loadData = function(){
    var _this = this;

    $.getJSON(this.opt.dataURL, function(data) {
      console.log('Data loaded.');
      _this.onDataLoaded(data);
    });
  };

  App.prototype.loadListeners = function(){
    var _this = this;

    $('#data-knob').on('click', function(e){
      e.preventDefault();
      _this.rotateKnob(1);
    });

    $('#data-knob').on('mousewheel', function(e) {
      if (e.deltaY > 0) _this.rotateKnob(1);
      else if (e.deltaY < 0) _this.rotateKnob(-1);
    });
  };

  App.prototype.onDataLoaded = function(data){
    var _this = this;

    // Initialize controls
    var sliders = {
      "#slider-time": {
        orientation: "horizontal", min: 0, max: 1, step: 0.001, value: 0
      }
    };
    this.$slider = $("#slider-time");

    var controls = new Controls({sliders: sliders});

    // load data
    var refData = data.data[0];
    this.data = data.data.slice(1);

    // load data viz
    this.dataViz = new DataViz({"el": "#pane", "label": data.data[1].label, "data": data.data[1].data, "domain": data.domain, "range": data.range, "refData": refData});

    // rotate knob
    this.rotateKnob(1);

    this.render();
  };

  App.prototype.render = function(){
    var _this = this;

    var value = this.$slider.slider("value");
    this.dataViz.setProgress(value);
    this.dataViz.render();

    requestAnimationFrame(function(){ _this.render(); });
  };

  App.prototype.rotateKnob = function(step){
    this.dataIndex += step;
    if (this.dataIndex >= this.data.length) this.dataIndex = 0;
    if (this.dataIndex < 0) this.dataIndex = this.data.length - 1;

    var i = this.dataIndex;
    var data = this.data[i];
    this.dataViz.setData(data.data, data.label);

    var r = -22.5 - i * 45;
    $('#dial').css('transform', 'rotate('+r+'deg)');
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
