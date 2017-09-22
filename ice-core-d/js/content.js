'use strict';

var Content = (function() {
  function Content(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Content.prototype.init = function(){
  };

  Content.prototype.onResize = function(){};

  Content.prototype.updateDepth = function(depth){
    if (depth === false) {
      $('.content-image.active').removeClass('active');

    } else {
      var $image = $('.content-image[data-depth="'+depth+'"]');
      if (!$image.hasClass('active')) {
        $('.content-image.active').removeClass('active');
        $image.addClass('active');
      }
    }

  };

  return Content;

})();
