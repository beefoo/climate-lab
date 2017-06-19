'use strict';

var App = (function() {
  function App(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    this.loadListeners();
  };

  App.prototype.loadListeners = function(){
    var _this = this;

    $('.button-next').on('click', function(e){
      _this.next();
    });

    // Initialize controls
    var sliders = {
      "#slider": {
        orientation: "horizontal", min: 0, max: 100, step: 0.1, value: 50,
        slide: function(e, ui){
          _this.onSlide(ui.value);
        }
      }
    };

    var controls = new Controls({sliders: sliders});
  };

  App.prototype.next = function(){
    var $pairs = $('.image-pair');
    var pairCount = $pairs.length;
    var $selected = $('.image-pair.active').first();
    var i = $pairs.index($selected);
    var next = i + 1;

    if (next >= pairCount) next = 0;
    $pairs.removeClass('active');
    $pairs.eq(next).addClass('active');
  };

  App.prototype.onSlide = function(value) {
    var left = value;
    var width = 100 - value;

    $('.image-right').css({
      left: left + '%',
      width: width + '%'
    })
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
