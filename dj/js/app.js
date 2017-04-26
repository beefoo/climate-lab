'use strict';

var App = (function() {
  function App(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var controls = new Controls({});
    var vizLeft = new DataViz({el: "#pane-left"});
    var vizRight = new DataViz({el: "#pane-right"});
    
    this.loadData();
  };

  App.prototype.loadData = function(){
    $.getJSON(this.opt.dataURL, function(data) {
      console.log('Data loaded.')
      $.publish('data.loaded', data);
    });
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
