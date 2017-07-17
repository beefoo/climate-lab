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

    this.initMode();

    // Set initial scale
    this.scale = 0.0;
    this.dataKey = this.opt.dataKey;

    // Initialize viz
    if (this.mode !== 'sender') {
      this.viz = new DataViz({el: "#pane", enableSound: this.opt.enableSound});
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
    }

    if (this.mode!=='receiver') {
      // Initialize controls
      var sliders = {
        "#scale": {
          orientation: "horizontal", min: -0.1, max: 1, step: 0.001, value: this.scale, range: "min",
          slide: function(e, ui){
            if (ui.value < 0) return false;
            // _this.onScale(ui.value);
            crosstab.broadcast('scale.change', ui.value);
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
