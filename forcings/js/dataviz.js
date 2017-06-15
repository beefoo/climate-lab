'use strict';

var DataViz = (function() {
  function DataViz(options) {
    var defaults = {
      el: '#main',
      margin: [10,10],
      labelTextStyle: {
        fill: "#ffffff",
        fontSize: 24,
        fontWeight: "bold"
      },
      plotMargin: [40, 60],
      rangeIncrement: 0.25,
      soundDir: 'audio/orchestral_harp-mp3/'
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  DataViz.prototype.init = function(){
    this.$el = $(this.opt.el);

    this.domain = this.opt.domain;
    this.range = this.opt.range;
    this.data = [];
    this.cords = [];
    this.label = '';
    this.progress = 0;

    // load sound
    this.sound = new Sound({soundDir: this.opt.soundDir});

    this.loadView();
    this.setData(this.opt.data, this.opt.label);
    this.loadCords();
    this.loadListeners();
  };

  DataViz.prototype.checkForPluck = function(prev, curr) {
    // don't pluck if going backwards
    if (prev > curr) return false;

    var _this = this;
    var domain = this.domain;
    var d0 = UTIL.lerp(domain[0], domain[1], prev);
    var d1 = UTIL.lerp(domain[0], domain[1], curr);

    // check to see if we crossed it
    _.each(this.cords, function(c, i){
      var intersections = c.intersections;
      _.each(intersections, function(intersection){
        if (intersection > d0 && intersection <= d1) {
          _this.cords[c.i].plucked = true;
          _this.cords[c.i].pluckedAt = new Date();
        }
      });
    });
  }

  DataViz.prototype.loadCords = function(){
    var _this = this;
    var domain = this.domain;
    var range = this.range;
    var incr = this.opt.rangeIncrement;
    var len = (range[1] - range[0]) / incr;

    var i = 0;
    for (var dy=range[0]; dy<=range[1]; dy+=incr) {
      var progress = i/len;
      var pp = _this._dataToPercent(0, dy, domain, range);
      var p = _this._dataToPoint(0, dy, domain, range);
      var intersections = _this._getIntersections(_this.data, dy);
      // console.log(intersections)
      _this.cords.push({
        i: i,
        y: p[1],
        py: pp[1],
        dy: dy,
        intersections: intersections,
        plucked: false,
        pluckedAt: false
      });
      i++;
    }
  };

  DataViz.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(e){
      _this.onResize();
    })
  };

  DataViz.prototype.loadView = function(){
    this.app = new PIXI.Application(this.$el.width(), this.$el.height(), {transparent : true});
    this.axes = new PIXI.Graphics();
    this.plot = new PIXI.Graphics();
    this.plotProgress = new PIXI.Graphics();
    this.labels = new PIXI.Graphics();

    this.app.stage.addChild(this.axes, this.plot, this.plotProgress, this.labels);

    this.$el.append(this.app.view);
  };

  DataViz.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());
    this.renderAxes();
    this.renderPlot();
    this.renderLabels();
    this.renderProgress();
  };

  DataViz.prototype.pluck = function(){
    var _this = this;

    _.each(this.cords, function(c, i){
      if (c.plucked) {
        _this.sound.play(c.py);
        _this.cords[i].plucked = false;
      }
    });
  };

  DataViz.prototype.render = function(progress){
    var prev = this.progress;
    this.progress = progress;

    this.checkForPluck(prev, progress);

    this.pluck();
    this.renderAxes();
    this.renderProgress();
  };

  DataViz.prototype.renderAxes = function(){
    var _this = this;

    // clear axes
    this.axes.clear();
    while(this.axes.children[0]) {
      this.axes.removeChild(this.axes.children[0]);
    }

    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var x0 = this.opt.plotMargin[0];
    var y0 = this.opt.plotMargin[1];
    var pw = w - x0 * 2;
    var ph = h - y0 * 2;

    // draw y axis
    this.axes.lineStyle(2, 0xc4ced4);
    this.axes.moveTo(x0, y0).lineTo(x0, y0 + ph);

    // draw horizontal lines (cords)
    _.each(this.cords, function(c){
      if (c.dy===0) {
        _this.axes.lineStyle(4, 0xc4ced4);
      } else {
        _this.axes.lineStyle(2, 0x00676d);
      }
      _this.axes.moveTo(x0, c.y).lineTo(x0 + pw, c.y);
    });
  };

  DataViz.prototype.renderLabels = function(){
    // clear labels
    this.labels.clear();
    while(this.labels.children[0]) {
      this.labels.removeChild(this.labels.children[0]);
    }
    var w = this.app.renderer.width;
    var textStyle = this.opt.labelTextStyle;
    var label = new PIXI.Text(this.label, textStyle);

    // center the label
    label.x = w * 0.5;
    label.y = 0;
    label.anchor.set(0.5, 0);
    this.labels.addChild(label);
  };

  DataViz.prototype.renderLine = function(g, data, lineW, color){
    var _this = this;

    // clear labels
    g.clear();
    while(g.children[0]) {
      g.removeChild(g.children[0]);
    }

    g.lineStyle(lineW, color);

    var domain = this.domain;
    var range = this.range;
    _.each(data, function(v, i){
      var p = _this._dataToPoint(v[0], v[1], domain, range);

      if (i<=0) {
        g.moveTo(p[0], p[1]);
      } else {
        g.lineTo(p[0], p[1]);
      }
    });
  };

  DataViz.prototype.renderPlot = function(){
    this.renderLine(this.plot, this.data, 2, 0x6d6f71);
  };

  DataViz.prototype.renderProgress = function(){
    var len = this.data.length-1;
    var progress = this.progress;
    var data = _.filter(this.data, function(v, i){ return (i/len) <= progress; })
    this.renderLine(this.plotProgress, data, 2, 0xffffff);

    this.plotProgress.beginFill(0xffffff);
    var dp = data[data.length-1];
    var p = this._dataToPoint(dp[0], dp[1]);
    this.plotProgress.drawCircle(p[0], p[1], 5);
  };

  DataViz.prototype.setData = function(data, label){
    this.label = label;
    this.data = data;
    this.renderAxes();
    this.renderPlot();
    this.renderLabels();
    this.renderProgress();
  };

  DataViz.prototype._dataToPercent = function(dx, dy, domain, range){
    domain = domain || this.domain;
    range = range || this.range;

    var px = UTIL.norm(dx, domain[0], domain[1]);
    var py = UTIL.norm(dy, range[0], range[1]);

    px = UTIL.lim(px, 0, 1);
    py = UTIL.lim(py, 0, 1);

    return [px, py];
  };

  DataViz.prototype._dataToPoint = function(dx, dy, domain, range){
    var p = this._dataToPercent(dx, dy, domain, range);
    return this._percentToPoint(p[0], p[1]);
  };

  DataViz.prototype._getIntersections = function(data, dy) {
    var intersections = [];
    var domain = this.domain;
    _.each(data, function(v, i){
      if (i > 0) {
        var prev = data[i-1];
        var a = {x: prev[0], y: prev[1]};
        var b = {x: v[0], y: v[1]};
        var c = {x: domain[0], y: dy};
        var d = {x: domain[1], y: dy};
        var intersection = UTIL.lineIntersect(a, b, c, d);
        if (intersection) {
          intersections.push(intersection[0]);
        }
      }
    });
    return intersections;
  };

  DataViz.prototype._percentToPoint = function(px, py){
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var x0 = this.opt.plotMargin[0];
    var y0 = this.opt.plotMargin[1];
    var pw = w - x0 * 2;
    var ph = h - y0 * 2;

    var x = px * pw + x0;
    var y = h - y0 - (py * ph);

    return [x, y];
  };

  return DataViz;

})();
