'use strict';

var App = (function() {
  function App(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var controls = new Controls({});
    this.vizLeft = new DataViz({el: "#pane-left"});
    this.vizRight = new DataViz({el: "#pane-right"});
    this.spinnerLeft = new Spinner({el: "#spinner-left"});
    this.spinnerRight = new Spinner({el: "#spinner-right"});

    // this.spinnerLeft.render(0);
    // this.spinnerRight.render(0);

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
