'use strict';

var App = (function() {
  function App(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    this.globe = new Globe({el: "#globe"});
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
