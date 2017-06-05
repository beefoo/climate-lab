'use strict';

var Label = (function() {
  function Label(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Label.prototype.init = function(){
    this.$el = $(this.opt.el);
  };

  Label.prototype.render = function(progress){
    var days = Math.floor(progress * 365) + 1;

    // no leap year
    var date = new Date(2015, 0);
    date.setDate(days);

    // format date
    var monthNames = [
      "January", "February", "March",
      "April", "May", "June", "July",
      "August", "September", "October",
      "November", "December"
    ];
    var dateF = monthNames[date.getMonth()] + " " + date.getDate();

    this.$el.text(dateF);
  };

  return Label;

})();
