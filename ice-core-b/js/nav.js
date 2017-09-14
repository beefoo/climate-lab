'use strict';

var Nav = (function() {
  function Nav(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Nav.prototype.init = function(){
  };

  Nav.prototype.selectLayer = function($el){
    $('#nav button').removeClass('selected');
    $el.addClass('selected');
  };

  return Nav;

})();
