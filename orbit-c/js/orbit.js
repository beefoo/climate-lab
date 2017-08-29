'use strict';

var Orbit = (function() {
  function Orbit(options) {
    var defaults = {
      el: '#orbit'
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Orbit.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.selectSeason(this.opt.season);
  };

  Orbit.prototype.onResize = function(){
  };

  Orbit.prototype.render = function(){
  };

  Orbit.prototype.selectSeason = function(season){
    var $image = $('.orbit-image[data-value="'+season+'"]');
    var active = $image.hasClass('active');

    if (!active) {
      $('.orbit-image').removeClass('active');
      $image.addClass('active');
    }
  };

  return Orbit;

})();
