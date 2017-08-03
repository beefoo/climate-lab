'use strict';

var Label = (function() {
  function Label(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Label.prototype.init = function(){
    // this.$el = $(this.opt.el);
    this.$year = $('#year-label');
    this.$region = $('#region-label');

    this.domain = [];
    this.zoneCount = 0;
    this.degPerZone = 0;
    this.time = this.opt.time;
    this.zone = this.opt.zone;
  };

  Label.prototype.initTime = function(domain) {
    this.domain = domain;

    this.updateTime(this.time);
  };

  Label.prototype.initZone = function(zoneCount, zone) {
    this.zoneCount = zoneCount;
    this.degPerZone = Math.round(180 / zoneCount);

    this.updateZone(zone);
  };

  Label.prototype.updateTime = function(time) {
    this.time = time;

    var domain = this.domain;
    var years = domain[1]-domain[0];
    var i = Math.round(years * time);
    var year = domain[0] + i;

    this.$year.text(year);
  };

  Label.prototype.updateZone = function(zone) {
    this.time = zone;

    var degPerZone = this.degPerZone;
    var lat1 = Math.round(UTIL.lerp(0, 180-degPerZone, zone) - 90);
    var lat2 = lat1 + degPerZone;

    var text = "Temperature differences of region between "+lat1+" and "+lat2+" degrees of latitude";
    this.$region.text(text);
  };

  return Label;

})();
