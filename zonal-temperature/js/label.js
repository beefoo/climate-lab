'use strict';

var Label = (function() {
  function Label(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Label.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.$month = this.$el.find('#month-label');

    this.frameCount = 0;
    this.time = this.opt.time;
  };

  Label.prototype.initTime = function(domain, frameCount) {
    this.frameCount = frameCount;
    this.domain = domain;



    this.updateTime(this.time);
  };

  Label.prototype.updateTime = function(time) {
    this.time = time;

    var frame = Math.round(time * (this.frameCount-1));
    var date = new Date(this.domain[0], 0, 1);
    date.setUTCMonth(date.getUTCMonth()+frame);

    var month = date.getUTCMonth();
    var year = date.getUTCFullYear();
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    this.$month.text(monthNames[month].slice(0,3) + " " + year);
  };

  return Label;

})();
