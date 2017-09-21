'use strict';

var Content = (function() {
  function Content(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Content.prototype.init = function(){
    this.$images = $('.content-image');
    this.imageCount = this.$images.length;
  };

  Content.prototype.updateOffsetX = function(offsetX){
    var i = Math.round(offsetX * (this.imageCount-1));
    var $image = this.$images.eq(i);

    if (!$image.hasClass('active')) {
      $('.content-image.active').removeClass('active');
      $image.addClass('active');
      var layer = $image.attr('data-layer');
      if (layer && layer.length) {
        var $layer = $(layer);
        if (!$layer.hasClass('active')) {
          $('.core-layer.active').removeClass('active');
          $layer.addClass('active');
        }
      } else {
        $('.core-layer.active').removeClass('active');
      }
    }
  };

  return Content;

})();
