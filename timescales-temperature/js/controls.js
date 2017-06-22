'use strict';

var Controls = (function() {
  function Controls(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Controls.prototype.init = function(){
    this.loadSliders(this.opt.sliders);
  };

  Controls.prototype.loadSliders = function(sliders){
    $.each(sliders, function(el, options){
      $(el).slider(options);
    })
  };

  return Controls;

})();
