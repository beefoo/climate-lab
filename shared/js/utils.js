// Utility functions
(function() {
  window.UTIL = {};

  UTIL.ceilToNearest = function(value, nearest) {
    return Math.ceil(value / nearest) * nearest;
  };

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

  UTIL.easeInOutSin = function (t) {
    return (1 + Math.sin(Math.PI * t - Math.PI / 2)) / 2;
  };

  UTIL.floorToNearest = function(value, nearest) {
    return Math.floor(value / nearest) * nearest;
  };

  UTIL.lerp = function(a, b, percent) {
    return (1.0*b - a) * percent + a;
  };

  UTIL.lim = function(num, min, max) {
    if (num < min) return min;
    if (num > max) return max;
    return num;
  };

  // Calculates line segment intersection
  UTIL.lineIntersect = function(A, B, E, F) {
    var ip, a1, a2, b1, b2, c1, c2;
    // calculate
    a1 = B.y-A.y; a2 = F.y-E.y;
    b1 = A.x-B.x; b2 = E.x-F.x;
    c1 = B.x*A.y - A.x*B.y; c2 = F.x*E.y - E.x*F.y;
    // det
    var det=a1*b2 - a2*b1;
    // if lines are parallel
    if (det == 0) { return false; }
    // find point of intersection
    var xip = (b1*c2 - b2*c1)/det;
    var yip = (a2*c1 - a1*c2)/det;
    // now check if that point is actually on both line
    // segments using distance
    if (Math.pow(xip - B.x, 2) + Math.pow(yip - B.y, 2) >
        Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2))
    { return false; }
    if (Math.pow(xip - A.x, 2) + Math.pow(yip - A.y, 2) >
        Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2))
    { return false; }
    if (Math.pow(xip - F.x, 2) + Math.pow(yip - F.y, 2) >
        Math.pow(E.x - F.x, 2) + Math.pow(E.y - F.y, 2))
    { return false; }
    if (Math.pow(xip - E.x, 2) + Math.pow(yip - E.y, 2) >
        Math.pow(E.x - F.x, 2) + Math.pow(E.y - F.y, 2))
    { return false; }
    // else it's on both segments, return it
    return [xip, yip];
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
