'use strict';

var Titles = (function() {
  function Titles(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Titles.prototype.init = function(){
    this.data = this.opt.data;
    this.$el = $(this.opt.el);
    this.loadView();
  };

  Titles.prototype.activate = function(i){
    var $titles = this.$el.find('.title');
    $titles.removeClass('active');
    $titles.eq(i).addClass('active');
  };

  Titles.prototype.loadView = function(){
    var $container = $('<div class="title-group"></div>');
    _.each(this.data, function(d, i){
      var $title = $('<div class="title '+d.className+'"><h2>'+d.title+'</h2><p>'+d.sub+'</p></div>');
      if (i<=0) $title.addClass('active');
      $container.append($title);
    });
    this.$el.append($container);
  };

  return Titles;

})();
