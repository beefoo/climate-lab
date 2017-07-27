'use strict';

var Label = (function() {
  function Label(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Label.prototype.init = function(){
    // this.$el = $(this.opt.el);
    this.$month = $('#month-label');
    this.$region = $('#region-label');

    this.frameCount = 0;
    this.zoneCount = 0;
    this.degPerZone = 0;
    this.time = this.opt.time;
    this.zone = this.opt.zone;
  };

  Label.prototype.initTime = function(domain, frameCount) {
    this.frameCount = frameCount;
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

    var frame = Math.round(time * (this.frameCount-1));
    var date = new Date(this.domain[0], 0, 1);
    date.setUTCMonth(date.getUTCMonth()+frame);

    var month = date.getUTCMonth();
    var year = date.getUTCFullYear();
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    this.$month.text(monthNames[month].slice(0,3) + " " + year);
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
