'use strict';

var Annotations = (function() {
  function Annotations(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Annotations.prototype.init = function(){
    var dataKey = this.opt.dataKey;
    var _this = this;

    this.$el = $(this.opt.el);
    this.annotations = [];

    $.getJSON("data/annotations.json", function(data) {
      console.log('Annotations loaded.');
      _this.onDataLoaded(data[dataKey]);
    });
  };

  Annotations.prototype.onDataLoaded = function(annotations){
    this.annotations = annotations;
  };

  Annotations.prototype.render = function(progress, angle){
    if (!this.annotations.length) return false;

    var days = Math.floor(progress * 365) + 1;
    // no leap year
    var date = new Date(2015, 0);
    date.setDate(days);
    var month = date.getMonth() + 1;

    // find matches
    var annotations = _.filter(this.annotations, function(a){
      var monthMatch = !_.has(a, "month") || _.indexOf(a.month, month) >= 0;
      var angleMatch = !_.has(a, "angle") || angle >= a.angle[0] && angle <= a.angle[1];
      return monthMatch && angleMatch;
    });

    // display annotation
    if (annotations.length) {
      var annotation = annotations[0];
      this.$el.text(annotation.text);
    } else {
      this.$el.text("");
    }
  };

  return Annotations;

})();
