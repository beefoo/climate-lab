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

    $('.radio[name="time"]').on('change', function(e){
      console.log('Change time', this.value);
    });

    $('.radio[name="data"]').on('change', function(e){
      console.log('Change data', this.value);
    });
  };

  return Controls;

})();
