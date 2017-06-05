'use strict';

var App = (function() {
  function App(options) {
    var defaults = {
      speedRange: [0.0, 4.0]
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    this.globe = new Globe({el: "#globe"});
    this.orbit = new Orbit({el: "#orbit"});

    // Initialize controls
    var sliders = {
      "#tt-speed": {
        orientation: "horizontal", min: 0, max: 1, step: 0.01, value: 0.25,
        slide: function(e, ui){ _this.onSpeed(ui.value); }
      }
    };
    var controls = new Controls({sliders: sliders});

    this.render();
    this.loadListeners();
  };

  App.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(e){
      _this.globe.onResize();
      _this.orbit.onResize();
    });
  };

  App.prototype.onSpeed = function(value) {
    var r = this.opt.speedRange;
    this.speed = UTIL.lerp(r[0], r[1], value);
    this.globe.setSpeed(this.speed);
  };

  App.prototype.render = function(){
    var _this = this;
    var progress = this.globe.getProgress();

    this.globe.isLoaded() && this.globe.render();
    this.orbit.isLoaded() && this.orbit.render(progress);

    requestAnimationFrame(function(){
      _this.render();
    });
  }

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
