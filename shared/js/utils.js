// Utility functions
(function() {
  window.UTIL = {};

  UTIL.dateDiff = function(date1, date2) {
    var diff = Math.floor(date2.getTime() - date1.getTime());
    var day = 1000 * 60 * 60 * 24;

    var days = Math.floor(diff/day);
    var months = Math.floor(days/31);
    var years = Math.floor(months/12);

    months = months % 12;
    days = days % 31;

    var message = [];

    if (years > 1) message.push(years + " years");
    else if (years > 0) message.push(years + " year");

    if (months > 1) message.push(months + " months");
    else if (months > 0) message.push(months + " month");

    if (days > 1) message.push(days + " days");
    else if (days > 0) message.push(days + " day");

    message = message.join(", ");
    message += " ago";

    return message;
  }

  UTIL.dateTupleToInt = function(dt) {
    var d = new Date(dt[0], dt[1], dt[2], dt[3]);
    return d.getTime();
  };

  UTIL.easeInOutCubic = function (t) {
    return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1;
  };

  UTIL.lerp = function(a, b, percent) {
    return (1.0*b - a) * percent + a;
  };

  UTIL.lim = function(num, min, max) {
    if (num < min) return min;
    if (num > max) return max;
    return num;
  };

  UTIL.norm = function(value, a, b){
    return (1.0 * value - a) / (b - a);
  };

  UTIL.round = function(value, precision) {
    return value.toFixed(precision);
  };

  UTIL.translatePoint = function(p, degrees, distance) {
    var radians = degrees * (Math.PI / 180);
    var x2 = p[0] + distance * Math.cos(radians);
    var y2 = p[1] + distance * Math.sin(radians);
    return [x2, y2];
  };

  UTIL.within = function(num, min, max) {
    if (num < min) return false;
    if (num > max) return false;
    return true;
  };

})();
