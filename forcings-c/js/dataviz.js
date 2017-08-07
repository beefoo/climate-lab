'use strict';

var DataViz = (function() {
  function DataViz(options) {
    var defaults = {
      el: '#main',
      transitionMs: 500,
      labelTextStyle: {
        fill: "#ffffff",
        fontSize: 24,
        fontWeight: "bold"
      },
      axisTextStyle: {
        fill: "#ffffff",
        fontSize: 16,
      },
      plotMargin: [100, 60],
      rangeIncrement: 0.25,
      domainIncrement: 20,
      sound: {
        soundDir: '../shared/audio/orchestral_harp-mp3/',
        stereo: 0.0,
      },
      cord: {
        curveRatio: 0.45,
        ampMin: 0.1, // min oscillation height in px
        oscRange: [0.005, 0.01], // frequency / oscillation speed; lower means slower
        tensityRange: [0.05, 0.1], // how tense the string is; lower means less tense
        ampRange: [10, 50] // starting perpendicular height of oscillating string in px
      }
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  DataViz.prototype.init = function(){
    var _this = this;

    this.$el = $(this.opt.el);

    this.domain = this.opt.domain;
    this.range = this.opt.range;

    this.data = [];
    this.cords = [];
    this.prevProgress = 0;
    this.progress = 0;
    this.active = true;

    this.initData(this.opt.data);

    // load sound
    this.sound = new Sound(this.opt.sound);

    // set refData
    this.refData = false;
    if (this.opt.refData) this.refData = this.opt.refData;

    this.loadView();
    this.loadCords();
    this.loadListeners();
  };

  DataViz.prototype.initData = function(data){
    var _this = this;
    var range = this.range;
    var incr = this.opt.rangeIncrement;

    // init data
    _.each(data, function(d, i){
      data[i].prevProgress = 0;
      data[i].progress = 0;
      data[i].transitionStart = false;
      data[i].data = d.data.slice(0);

      // calculate intersections
      var intersections = [];
      for (var dy=range[0]; dy<=range[1]; dy+=incr) {
        var cordIntersections = _this._getIntersections(data[i].data, dy);
        intersections.push(cordIntersections);
      }
      data[i].intersections = intersections;
    });

    this.data = data;
  };

  DataViz.prototype.addIndex = function(i){
    // console.log('add',i)
    this.data[i].transitionStart = new Date();
    this.data[i].prevProgress = 0;
    this.data[i].progress = 0;
    this.data[i].direction = 1;

    this.active = true;
  };

  DataViz.prototype.checkForPluck = function() {
    var _this = this;
    var data = this.data;
    var domain = this.domain;
    var ampRange = this.opt.cord.ampRange;

    _.each(data, function(d, i){
      if (d.progress > d.prevProgress) {
        var curr = d.progress;
        var prev = d.prevProgress;
        var d0 = UTIL.lerp(domain[0], domain[1], prev);
        var d1 = UTIL.lerp(domain[0], domain[1], curr);
        var amp = UTIL.lerp(ampRange[0], ampRange[1], curr-prev);
        var intersections = d.intersections;

        // check to see if we crossed cords
        _.each(_this.cords, function(c, j){
          var cIntersections = intersections[c.i];
          _.each(cIntersections, function(intersection){
            if (intersection > d0 && intersection < d1) {
              _this.cords[c.i].plucked = true;
              _this.cords[c.i].pluckedAt = new Date();
              _this.cords[c.i].amplitude = amp;
            }
          });
        });
      }
    });
  };

  DataViz.prototype.loadCords = function(){
    var _this = this;
    var data = this.data;
    var domain = this.domain;
    var range = this.range;
    var incr = this.opt.rangeIncrement;
    var len = (range[1] - range[0]) / incr;
    var oscRange = this.opt.cord.oscRange;
    var tensityRange = this.opt.cord.tensityRange;

    this.cords = [];

    var i = 0;
    for (var dy=range[0]; dy<=range[1]; dy+=incr) {
      var progress = i/len;
      var pp = _this._dataToPercent(0, dy, domain, range);
      var p = _this._dataToPoint(0, dy, domain, range);
      var freq = UTIL.lerp(oscRange[0], oscRange[1], progress);
      var tensity = UTIL.lerp(tensityRange[0], tensityRange[1], progress);

      _this.cords.push({
        i: i,
        y: p[1],
        py: pp[1],
        dy: dy,
        plucked: false,
        pluckedAt: false,
        amplitude: 0,
        frequency: freq,
        tensity: tensity
      });
      i++;
    }

    // console.log(this.cords);
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
    this.refPlot = new PIXI.Graphics();
    this.plot = new PIXI.Graphics();
    this.plotProgress = new PIXI.Graphics();
    this.labels = new PIXI.Graphics();

    this.app.stage.addChild(this.axes, this.refPlot, this.plot, this.plotProgress, this.labels);

    this.$el.append(this.app.view);
  };

  DataViz.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());
    this.renderAxes();
    this.renderRef();
    // this.renderLabels();
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

  DataViz.prototype.removeIndex = function(i){
    // console.log('remove',i)
    this.data[i].transitionStart = new Date();
    this.data[i].prevProgress = 1;
    this.data[i].progress = 1;
    this.data[i].direction = -1;

    this.active = true;
  };

  DataViz.prototype.render = function(){
    if (this.active) {
      this.transitionData();
      this.checkForPluck();
      this.pluck();
      this.renderAxes();
      this.renderProgress();

      if (!this.cordsActive && !this.dataActive) this.active = false;
    }
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
    this.cordsActive = false;
    _.each(this.cords, function(c,i){
      _this.renderCord(c);
    });

    // draw axes labels
    var textStyle = this.opt.axisTextStyle;

    // draw domain labels

    var domain = this.domain;
    var range = this.range;
    var domainIncrement = this.opt.domainIncrement;
    var v = domain[0];
    while (v <= domain[1]) {

      var delta = domain[1]-v;
      var tooClose = delta <= 5 && delta > 0;

      if (v % domainIncrement !== 0 && v !== domain[0] && v !== domain[1] || tooClose) {
        v++;
        continue;
      }

      var p = _this._dataToPoint(v, range[0]);
      var label = new PIXI.Text(v, textStyle);

      label.y = p[1]+10;
      label.x = p[0];
      label.anchor.set(0.5, 0);

      _this.axes.addChild(label);
      v++;
    }

    // draw range labels

    v = range[0];
    while (v <= range[1]) {

      var p = _this._dataToPoint(domain[0], v);
      var text = v + '°F';
      if (v > 0) text = "+"+text;
      var label = new PIXI.Text(text, textStyle);
      label.x = p[0] - 10;
      label.y = p[1];
      label.anchor.set(1, 0.5);
      _this.axes.addChild(label);
      v++;
    }

  };

  DataViz.prototype.renderCord = function(c){
    if (c.dy===0) this.axes.lineStyle(2, 0xc4ced4);
    else this.axes.lineStyle(2, 0x45474c);

    // get plot bounds
    var w = this.app.renderer.width;
    var x0 = this.opt.plotMargin[0];
    var pw = w - x0 * 2;

    // check if cord is oscillating
    var oscillating = false;

    // we are oscillating, draw curve
    if (c.amplitude > this.opt.cord.ampMin) {
      var d1 = new Date();
      var d0 = c.pluckedAt;
      var td = (d1 - d0) * c.frequency;
      var a = 2 * Math.PI * td;
      var ex = Math.exp(td * c.tensity); // exponential function; gets bigger over time
      var amp = c.amplitude / ex; // the current amplitude; gets smaller over time
      var yc = Math.cos(a) * amp; // the oscillating y-coordinate

      // set new amplitude
      this.cords[c.i].amplitude = amp;

      // build bezier curve
      var curveRatio = this.opt.cord.curveRatio;
      var xc = x0 + pw * 0.5;
      var dx = xc - x0;
      var dy = yc - c.y;
      var dxBez = curveRatio * Math.sqrt(dx * dx + dy * dy);

      // draw bezier curve
      this.axes.moveTo(x0, c.y).bezierCurveTo(xc - dxBez, c.y + yc, xc + dxBez, c.y + yc, x0 + pw, c.y);

      this.cordsActive = true;

    // not oscillating, just draw a straight line
    } else {
      this.axes.moveTo(x0, c.y).lineTo(x0 + pw, c.y);
    }

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

  DataViz.prototype.renderLine = function(g, data, lineW, color, alpha){
    var _this = this;
    alpha = alpha || 1;


    g.lineStyle(lineW, color, alpha);

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

  DataViz.prototype.renderProgress = function(){
    var _this = this;
    var colors = this.opt.colors;
    var data = this.data;

    // clear progress
    this.plotProgress.clear();
    // while(this.plotProgress.children[0]) {
    //   this.plotProgress.removeChild(this.plotProgress.children[0]);
    // }

    _.each(this.data, function(d, i){
      var progress = d.progress;
      if (progress > 0) {
        var data = d.data;
        var len = data.length-1;
        var dp = _.filter(data, function(v, j){ return (j/len) <= progress; });
        var color = colors[i];

        if (dp.length) {
          _this.renderLine(_this.plotProgress, dp, 3, color);
          var pp = dp[dp.length-1];
          var p = _this._dataToPoint(pp[0], pp[1]);
          _this.plotProgress.beginFill(color);
          _this.plotProgress.drawCircle(p[0], p[1], 5);
          _this.plotProgress.endFill();
        }
      }

    });
  };

  DataViz.prototype.renderRef = function(){
    return false; // disable for now

    if (!this.refData) return false;

    // render data
    var data = this.refData.data;
    this.renderLine(this.refPlot, data, 2, 0xa6acb2);

    // draw dot
    var dp = data[data.length-1];
    var p = this._dataToPoint(dp[0], dp[1]);
    this.refPlot.lineStyle(0, 0xffffff);
    this.refPlot.beginFill(0x6d6f71);
    this.refPlot.drawCircle(p[0], p[1], 4);

    // render label
    var text = this.refData.label;
    var textStyle = this.opt.axisTextStyle;
    textStyle.wordWrap = true;
    textStyle.wordWrapWidth = 100;
    var label = new PIXI.Text(text, textStyle);

    label.x = p[0] + 10;
    label.y = p[1];
    label.anchor.set(0, 0.5);
    this.refPlot.addChild(label);
  };

  DataViz.prototype.transitionData = function(){
    var _this = this;
    var data = this.data;
    var transitionMs = this.opt.transitionMs;
    var now = new Date();

    this.dataActive = false;

    _.each(data, function(d, i){
      if (d.transitionStart) {
        var timeSince = now - d.transitionStart;
        var prevProgress = d.progress;
        var direction = d.direction;
        var progress = 1.0;

        // we are transitioning
        if (timeSince <= transitionMs) {
          // set progress for progress line
          var progress = timeSince / transitionMs;
          progress = UTIL.easeInOutSin(progress);
        }
        if (direction < 0) progress = 1.0 - progress;

        progress = Math.min(progress, 1.0);
        progress = Math.max(progress, 0.0);

        _this.data[i].prevProgress = prevProgress;
        _this.data[i].progress = progress;

        // done progressing
        if (direction > 0 && progress >= 1.0 || direction < 0 && progress <= 0.0) {
          _this.data[i].transitionStart = false;
        }

        _this.dataActive = true;
      } else {
        _this.data[i].prevProgress = d.progress;
      }
    });
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
