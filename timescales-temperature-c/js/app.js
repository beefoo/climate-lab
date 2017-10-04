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
    this.scale = 0.5;
    this.time = 0.5;
    this.dataKey = this.opt.dataKey;

    this.initMode();

    // Initialize viz
    if (this.mode !== 'sender') {
      this.loadData();
    }

    this.loadListeners();
  };

  App.prototype.initMode = function(){
    var q = UTIL.parseQuery();

    this.mode = 'default';

    if (_.has(q, 'mode')) this.mode = q.mode;

    $('.app').addClass(this.mode);

    // pop out a new window if receiver
    if (this.mode==='receiver') {
      var url = window.location.href.split('?')[0] + '?mode=sender';
      window.open(url);
    }
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

    if (this.mode!=='sender') {
      crosstab.on('scale.change', function(message) {
        _this.onScale(message.data);
      });
      crosstab.on('time.change', function(message) {
        _this.onTime(message.data);
      });
    }

    if (this.mode!=='receiver') {
      // Initialize controls
      var sliders = {
        "#scale": {
          orientation: "vertical", min: 0, max: 1, step: 0.001, value: this.scale, gamepad: 0,
          slide: function(e, ui){
            // _this.onScale(1-ui.value);
            crosstab.broadcast('scale.change', 1-ui.value);
          }
        },
        "#time": {
          orientation: "horizontal", min: 0, max: 1, step: 0.001, value: this.time, gamepad: 1,
          slide: function(e, ui){
            // _this.onTime(ui.value);
            crosstab.broadcast('time.change', ui.value);
          }
        }
      };
      var controls = new Controls({sliders: sliders});
    }
  };

  App.prototype.onDataLoaded = function(data){
    var d = data[this.dataKey];

    this.data = d.data;
    this.domain = d.domain;
    this.range = d.range;

    // Initialize viz
    this.viz = new DataViz({
      el: "#pane",
      enableSound: this.opt.enableSound,
      data: this.data,
      domain: this.domain,
      range: this.range,
      scale: this.scale,
      time: this.time,
      minDomainCount: this.opt.minDomainCount
    });

    this.messages = new Messages({
      el: "#messages",
      messages: this.opt.messages,
      scale: this.scale,
      domain: this.domain,
      minDomainCount: this.opt.minDomainCount
    });

    this.render();
  };

  App.prototype.onScale = function(value) {
    this.scale = UTIL.easeInOutSin(value);
    this.viz.updateScale(this.scale);
    this.messages.updateScale(this.scale);
  };

  App.prototype.onTime = function(value) {
    this.time = value;
    this.viz.updateTime(this.time);
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
