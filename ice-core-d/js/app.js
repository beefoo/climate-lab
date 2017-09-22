'use strict';

var App = (function() {
  function App(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    this.offsetX = 0;
    this.width = this.opt.widthCm * 2.54 * this.opt.dpi;

    this.loadMarkers();
    this.loadData();
  };

  App.prototype.loadData = function(i){
    var _this = this;

    $.getJSON(this.opt.dataUrl, function(data) {
      console.log('Data loaded.');
      _this.onDataLoaded(data);
    });
  };

  App.prototype.loadListeners = function(){
    var _this = this;
    var scrollStep = this.opt.scrollStep;

    $(window).on('resize', function(e){
      _this.onResize();
    });

    $(window).mousewheel(function(e) {
      var delta = e.deltaY * scrollStep * -1;
      var offsetX = _this.offsetX + delta;
      offsetX = UTIL.lim(offsetX, 0, 1);
      _this.updateOffsetX(offsetX);
    });
  };

  App.prototype.loadMarkers = function(){
    var markers = [];
    $('.content-image').each(function(){
      var depth = parseInt($(this).attr('data-depth'));
      markers.push(depth);
    });
    this.depthMarkers = markers;
  };

  App.prototype.onDataLoaded = function(data){
    this.depthRange = data.depthRange;
    this.content = new Content({el: "#content", width: this.width, offsetX: this.offsetX, data: data});
    this.timeline = new Timeline({el: "#timeline", width: this.width, offsetX: this.offsetX, data: data, markers: this.depthMarkers});

    this.loadListeners();
  };

  App.prototype.onResize = function(){
    this.content.onResize();
    this.timeline.onResize();
  };

  App.prototype.updateOffsetX = function(offsetX){
    this.offsetX = offsetX;

    var windowRatio = $(window).width() / this.width;
    var d0 = UTIL.lerp(0, 1-windowRatio, offsetX);
    var d1 = d0 + windowRatio;
    var depth0 = UTIL.lerp(this.depthRange[0], this.depthRange[1], d0);
    var depth1 = UTIL.lerp(this.depthRange[0], this.depthRange[1], d1);
    var markers = _.filter(this.depthMarkers, function(d){ return d <= depth0 && d >= depth1; });

    var targetDepth = UTIL.lerp(this.depthRange[0], this.depthRange[1], offsetX);
    var depthMarker = false;
    if (markers.length) {
      var sortedMarkers = _.sortBy(markers, function(d){ return Math.abs(d-targetDepth); });
      depthMarker = sortedMarkers[0];
    }


    this.content.updateDepth(depthMarker);
    this.timeline.updateOffsetX(offsetX);
    this.timeline.updateDepth(depthMarker);
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
