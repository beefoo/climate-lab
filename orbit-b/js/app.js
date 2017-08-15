'use strict';

var App = (function() {
  function App(options) {
    var defaults = {
      speedRange: [0.0, 3.0]
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    this.masterGlobe = false;
    this.globes = [];
    var promises = [];

    $('.video').each(function(){
      var $el = $(this);

      if ($el.hasClass('master')) {
        _this.masterGlobe = new Globe({el: $el.attr('data-target'), video: $el[0], master: true});
        promises.push(_this.masterGlobe.load());
      } else {
        var i = _this.globes.length;
        _this.globes.push(new Globe({el: $el.attr('data-target'), video: $el[0]}));
        promises.push(_this.globes[i].load());
      }
    });

    this.orbit = new Orbit({el: "#orbit"});
    this.label = new Label({el: "#label"});
    var speed = 0.5;

    // Initialize controls
    var sliders = {
      "#speed": {
        orientation: "horizontal", min: 0, max: 1, step: 0.01, value: speed,
        slide: function(e, ui){ _this.onSpeed(ui.value); }
      }
    };
    var controls = new Controls({sliders: sliders});

    $.when.apply($, promises).then(function(){
      _this.reset();
      _this.onSpeed(speed);
      _this.render();
      _this.loadListeners();
    });
  };

  App.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(e){
      _this.masterGlobe.onResize();
      _.each(_this.globes, function(g){ g.onResize(); });
      _this.orbit.onResize();
    });
  };

  App.prototype.onSpeed = function(value) {
    var r = this.opt.speedRange;
    var speed = UTIL.lerp(r[0], r[1], value);
    this.speed = speed;
    this.masterGlobe.setSpeed(speed);
    _.each(this.globes, function(g){ g.setSpeed(speed); });
  };

  App.prototype.render = function(){
    var _this = this;

    if (this.masterGlobe.ended()) this.reset();

    var progress = this.masterGlobe.getProgress();
    this.masterGlobe.render(progress);
    this.orbit.isLoaded() && this.orbit.render(progress);
    this.label.render(progress);

    _.each(this.globes, function(g){
      g.render(progress);
    });

    requestAnimationFrame(function(){
      _this.render();
    });
  };

  App.prototype.reset = function(){
    this.masterGlobe.setProgress(0);

    _.each(this.globes, function(g){
      g.setProgress(0);
    });
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
