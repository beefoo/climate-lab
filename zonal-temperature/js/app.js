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
    this.time = 0.5;
    this.zone = 0.5;

    this.initMode();

    // Initialize viz
    if (this.mode !== 'sender') {
      this.map = new DataMap({el: "#map", time: this.time, zone: this.zone});
      this.graph = new DataGraph({el: "#graph", time: this.time, zone: this.zone});
      this.label = new Label({el: "#label", time: this.time, zone: this.zone});
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
      crosstab.on('zone.change', function(message) {
        _this.onZoneChange(message.data);
      });
      crosstab.on('time.change', function(message) {
        _this.onTimeChange(message.data);
      });
    }

    if (this.mode!=='receiver') {
      // Initialize controls
      var sliders = {
        "#zone": {
          orientation: "vertical", min: 0, max: 1, step: 0.001, value: this.zone, gamepad: 0,
          slide: function(e, ui){
            // _this.onZoneChange(1-ui.value);
            crosstab.broadcast('zone.change', 1-ui.value);
          }
        },
        "#time": {
          orientation: "horizontal", min: 0, max: 1, step: 0.001, value: this.time, gamepad: 1,
          slide: function(e, ui){
            // _this.onTimeChange(ui.value);
            crosstab.broadcast('time.change', ui.value);
          }
        }
      };
      var controls = new Controls({sliders: sliders});
    }
  };

  App.prototype.onDataLoaded = function(data){
    this.data = data.zoneData;
    this.domain = data.domain;
    this.range = data.range;
    var frames = this.data[0][0].length;

    this.map.initZones(this.data.length);
    this.map.initTime(frames);
    this.graph.initData(this.data, this.domain, this.range);
    this.graph.updateZone(this.zone);
    this.label.initTime(this.domain, frames);
    this.label.initZone(this.data.length, this.zone);
    // this.render();
  };

  App.prototype.onTimeChange = function(value) {
    this.map.updateTime(value);
    this.graph.updateTime(value);
    this.label.updateTime(value);
  };

  App.prototype.onZoneChange = function(value) {
    this.map.updateZone(value);
    this.graph.updateZone(value);
    this.label.updateZone(value);
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
