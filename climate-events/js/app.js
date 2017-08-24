'use strict';

var App = (function() {
  function App(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    // Init
    this.time = 0;

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
      crosstab.on('time.change', function(message) {
        _this.onTime(message.data);
      });
    }

    if (this.mode!=='receiver') {
      // Initialize controls
      var sliders = {
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

  App.prototype.onDataLoaded = function(d){

    // Initialize viz
    this.viz = new DataViz({
      el: "#pane",
      data: d.data,
      domain: d.domain,
      time: this.time,
      categories: d.categories,
      groupEvery: d.groupEvery
    });

    this.render();
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
