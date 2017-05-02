'use strict';

var Controls = (function() {
  function Controls(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Controls.prototype.init = function(){
    this.loadListeners();
  };

  Controls.prototype.loadListeners = function(){
    var _this = this;

    this.loadSlider("#tt-crossfade", "horizontal", 0.5, function(event, ui){
      // console.log(ui.value);
    });

    this.loadSlider("#tt-speed", "vertical", 0, function(event, ui){
      // console.log(ui.value);
    });

    this.loadSlider("#tt-scale", "vertical", 0, function(event, ui){
      // console.log(ui.value);
    });

  };

  Controls.prototype.loadSlider = function(el, orientation, value, onSlide){
    if (!$(el).length) return false;
    
    $(el).slider({
      orientation: orientation,
      min: 0,
      max: 1,
      step: 0.01,
      value: value,
      slide: onSlide
    });

  };

  return Controls;

})();
