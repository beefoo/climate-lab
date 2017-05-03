// Utility functions
(function() {
  window.UTIL = {};

  UTIL.dateTupleToInt = function(dt) {
    var d = new Date(dt[0], dt[1], dt[2], dt[3]);
    return d.getTime();
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

})();
