'use strict';

var DataViz = (function() {
  function DataViz(options) {
    var defaults = {
      el: '#main',
      margin: [0.1, 0.15, 0.1, 0.1],
      enableSound: true,
      highlightMs: 1000,
      minDomainCount: 5,
      yAxisStep: 0.1,
      axisTextStyle: {
        fill: "#d2d1dd",
        fontSize: 18
      },
      axisSubtextStyle: {
        fill: "#7f7f87",
        fontSize: 15
      },
      markerTextStyle: {
        fill: "#d2d1dd",
        fontSize: 22
      }
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  DataViz.prototype.init = function(){
    this.$el = $(this.opt.el);

    this.domain = this.opt.domain;
    this.range = this.opt.range;
    this.time = this.opt.time;
    this.scale = this.opt.scale;

    // re-map data
    var d0 = this.domain[0];
    this.data = _.map(this.opt.data, function(d,i){
      return {
        year: d0 + i,
        value: d[0],
        color: d[1],
        index: i,
        active: false
      };
    });
    this.dataLen = this.data.length;

    this.sound = false;
    if (this.opt.enableSound) this.sound = new Sound({});

    // init plot
    this.plotDomain = [];
    this.plotDomainPrecise = [];
    this.plotRange = [];
    this.dataIndex = 0;
    this.plotIndex = 0;
    this.plotYear = {};

    this.loadView();
    this.loadListeners();

    this.initTime();
    this.updateScale(this.scale);
  };

  DataViz.prototype.initTime = function(){
    var time = this.time;
    var domain = this.domain;

    var i = Math.round((domain[1]-domain[0]) * time);

    this.dataIndex = this.time;
    this.plotIndex = i;
    this.plotYear = this.data[i];
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
    this.highlight = new PIXI.Graphics();
    this.labels = new PIXI.Graphics();
    this.marker = new PIXI.Graphics();

    this.app.stage.addChild(this.plot, this.highlight, this.axes, this.labels, this.marker);

    this.$el.append(this.app.view);
  };

  DataViz.prototype.onResize = function(){
    this.app.renderer.resize(this.$el.width(), this.$el.height());
    this.renderAxes();
    this.renderPlot();
    this.renderLabels();
    this.renderMarker();
  };

  DataViz.prototype.render = function(){


    this.transition();


  };

  DataViz.prototype.renderAxes = function(){
    var _this = this;
    var domain = this.plotDomain;
    var domainp = this.plotDomainPrecise;
    var range = this.plotRange;
    var textStyle = this.opt.axisTextStyle;
    var subtextStyle = this.opt.axisSubtextStyle;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var m = this.opt.margin;
    var mx0 = m[0] * w;
    var mx1 = m[2] * w;

    this.axes.clear();
    while(this.axes.children[0]) {
      this.axes.removeChild(this.axes.children[0]);
    }

    // draw y axis
    var delta = range[1] - range[0];
    var yAxisStep = this.opt.yAxisStep;
    var count = delta / yAxisStep;
    var x0 = w * m[0];
    var x1 = w - m[2] * w;
    var showEvery = 1;
    if (count > 20) showEvery = 4;
    else if (count > 10) showEvery = 2;
    this.axes.lineStyle(1, 0xffffff, 0.333);
    var value = range[0];
    var i=0;
    while(value <= range[1]) {
      if (i % showEvery === 0) {
        var p = _this._dataToPoint(0, value, domain, range);
        var y = p[1];
        var df = UTIL.round(value, 1);
        var dc = UTIL.round((value-32) * 5 / 9.0, 1);

        var text = df + "°F";
        var label = new PIXI.Text(text, textStyle);
        label.x = x0 - 20;
        label.y = y;
        label.anchor.set(1.0, 1.0);

        var subtext = "(" + dc + " °C)";
        var sublabel = new PIXI.Text(subtext, subtextStyle);
        sublabel.x = x0 - 20;
        sublabel.y = y;
        sublabel.anchor.set(1.0, 0);

        this.axes.addChild(label);
        this.axes.addChild(sublabel);
        this.axes.moveTo(x0, y).lineTo(x1, y);
      }
      value += yAxisStep;
      i++;
    }

    // draw x axis
    count = domain[1] - domain[0];
    showEvery = 1;
    if (count > 10) showEvery = 5;
    if (count > 30) showEvery = 10;
    if (count > 80) showEvery = 20;
    value = domain[0];
    i = 0;
    var cw = w - mx0 - mx1;
    var dataW = cw / (domainp[1]-domainp[0]+1);
    while (value <= domain[1]) {
      var delta1 = domain[1] - value;
      var delta2 = value - domain[0];
      var valid = (value === domain[0] || value === domain[1] || value % showEvery === 0) && (delta1 >= showEvery/2 || delta1 <= 0) && (delta2 >= showEvery/2 || delta2 <= 0);
      if (!valid) {
        value++;
        i++;
        continue;
      }
      var p = _this._dataToPoint(value, range[0], domain, range);
      var px = UTIL.norm(value, domainp[0], domainp[1]+1);
      var x = px * cw + mx0 + dataW * 0.5;
      var text = value;
      var ts = _.clone(textStyle);
      var xAnchor = 0.5;
      ts.fontSize = 22;
      var label = new PIXI.Text(text, ts);
      if (count > 10) {
        if (value == domain[0]) {
          x = mx0;
          xAnchor = 0;
        } else if (value==domain[1]) {
          x = mx0+cw;
          xAnchor = 1;
        }
      }
      label.x = x;
      label.y = p[1] + m[3] * h / 5;
      label.anchor.set(xAnchor, 0);
      this.axes.addChild(label);
      value++;
      i++;
    }
  };

  DataViz.prototype.renderLabels = function(){
    // this.labels.clear();
    // while(this.labels.children[0]) {
    //   this.labels.removeChild(this.labels.children[0]);
    // }
  };

  DataViz.prototype.renderMarker = function(){
    // draw plot marker
    var year = this.plotYear;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var m = this.opt.margin;
    var mx0 = m[0] * w;
    var my0 = m[1] * h;
    var mx1 = m[2] * w;
    var my1 = m[3] * h;

    this.marker.clear();
    while(this.marker.children[0]) {
      this.marker.removeChild(this.marker.children[0]);
    }

    var cw = w - mx0 - mx1;
    var x = mx0 + cw * this.time;
    this.marker.lineStyle(5, 0xf1a051, 0.7);
    this.marker.moveTo(x, my0).lineTo(x, h-my1);

    var textStyle = this.opt.markerTextStyle;
    var df = UTIL.round(year.value, 1);
    var dc = UTIL.round((year.value-32) * 5 / 9.0, 1);
    var text = df + "°F ("+dc+" °C)";
    var label = new PIXI.Text(text, textStyle);
    label.x = x + 10;
    label.y = my0;
    label.anchor.set(0.0, 0.0);
    this.marker.addChild(label);

    textStyle = _.clone(textStyle);
    textStyle.fontSize *= 0.9;
    label = new PIXI.Text(year.year, textStyle);
    label.x = x + 10;
    label.y = my0 + textStyle.fontSize * 1.5;
    label.anchor.set(0.0, 0.0);
    this.marker.addChild(label);
  };

  DataViz.prototype.renderPlot = function(){
    var _this = this;
    var data = this.data;
    var domain = this.plotDomain;
    var domainp = this.plotDomainPrecise;
    var range = this.plotRange;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var m = this.opt.margin;
    var mx0 = m[0] * w;
    var my0 = m[1] * h;
    var mx1 = m[2] * w;
    var my1 = m[3] * h;

    this.plot.clear();
    // while(this.plot.children[0]) {
    //   this.plot.removeChild(this.plot.children[0]);
    // }

    var cw = w - mx0 - mx1;
    var ch = h - my0 - my1;
    var dataW = cw / (domainp[1]-domainp[0]+1);

    var dataMargin = 0.5;
    _.each(data, function(d, i){
      if (d.active) {
        var value = d.value;
        if (d.highlighting) {
          value = UTIL.lerp(value+0.5, value, UTIL.easeInElastic(d.highlightValue, 0.01));
          if (isNaN(value)) value = d.value;
        }
        var p = _this._dataToPoint(d.year, value, domainp, range);
        var px = UTIL.norm(d.year, domainp[0], domainp[1]+1);
        var y = p[1];
        var x = px * cw + mx0;
        var w = dataW - dataMargin * 2;
        // clip the sides off the edges
        if (x < mx0) {
          w -= (mx0 - x);
          x = mx0;
        }
        if (x > (mx0 + cw - dataW)) {
          w -= (x - (mx0 + cw - dataW));
        }
        _this.plot.beginFill(d.color);
        _this.plot.drawRect(x+dataMargin, y, w, h-y-my1);
      }
    });
  };

  DataViz.prototype.transition = function(){
    if (!this.transitioning) return false;

    var _this = this;
    var range = this.plotRange;
    var highlightMs = this.opt.highlightMs;
    var transitioning = false;
    var now = new Date();

    _.each(this.data, function(d, i){
      if (d.highlighting && d.highlightStart) {
        var diff = now - d.highlightStart;
        if (diff >= highlightMs) {
          diff = highlightMs;
          _this.data[i].highlighting = false;
        } else {
          transitioning = true;
        }
        var progress = diff / highlightMs;
        progress = Math.max(progress, 0);
        progress = Math.min(progress, 1);
        _this.data[i].highlightValue = progress;
      }
    });

    this.transitioning = transitioning;
    this.renderPlot();
    // this.renderHighlight();
  };

  DataViz.prototype.updateScale = function(scale){
    this.scale = scale;

    var _this = this;

    var time = this.time;
    var dataIndex = this.dataIndex;
    var minDomainCount = this.opt.minDomainCount;
    var maxDomainCount = this.dataLen;
    var domainCount = UTIL.lerp(minDomainCount, maxDomainCount, scale);

    var domainCountP = domainCount / maxDomainCount;
    var domainStartP = dataIndex - (domainCountP * time);
    var domainEndP = dataIndex + (domainCountP * (1-time));

    // adjust edges
    if (domainStartP < 0) {
      domainEndP -= domainStartP;
      domainStartP = 0;
    }
    if (domainEndP > 1) {
      domainStartP -= (domainEndP-1)
      domainEndP = 1;
    }

    // determine new domain
    var domain = this.domain;
    var prevDomain = this.plotDomain;
    var d0 = domain[0];
    var d1 = domain[1];
    var domainStart = UTIL.lerp(d0, d1, domainStartP);
    var domainEnd = UTIL.lerp(d0, d1, domainEndP);
    var newDomainPrecise = [domainStart, domainEnd];
    var newDomain = [Math.ceil(domainStart), Math.floor(domainEnd)];

    this.plotDomain = newDomain;
    this.plotDomainPrecise = newDomainPrecise;

    var values = [];
    _.each(this.data, function(d, i){
      if (d.year >= Math.floor(domainStart) && d.year <= Math.ceil(domainEnd)) {
        _this.data[i].active = true;
        values.push(d.value);
      } else {
        _this.data[i].active = false;
      }
    });

    var yAxisStep = this.opt.yAxisStep;
    var minRange = UTIL.floorToNearest(_.min(values), yAxisStep);
    var maxRange = UTIL.ceilToNearest(_.max(values), yAxisStep);
    this.plotRange = [minRange, maxRange];

    this.updateTime(this.time, false);
    this.renderAxes();
    this.renderLabels();
    this.renderMarker();
    this.renderPlot();
  };

  DataViz.prototype.updateTime = function(time, withSound){
    var prevTime = this.time;
    this.time = time;

    var domain = this.domain;
    var domainPrecise = this.plotDomainPrecise;
    var yearPrecise = UTIL.lerp(domainPrecise[0], domainPrecise[1], time);
    var prevIndex = this.plotIndex;

    this.dataIndex = UTIL.norm(yearPrecise, domain[0], domain[1]);
    var plotIndex = Math.round(UTIL.lerp(domain[0], domain[1], this.dataIndex)) - domain[0];
    this.plotIndex = plotIndex;
    this.plotYear = this.data[this.plotIndex];
    // console.log(this.plotYear.year)

    // add transition for index and play sound
    if ((prevIndex < plotIndex || time > prevTime && prevTime <= 0)&& withSound !== false) {
      this.data[plotIndex].highlighting = true;
      this.data[plotIndex].highlightStart = new Date();
      this.data[plotIndex].highlightValue = 0;
      this.sound && this.sound.play(UTIL.norm(this.data[plotIndex].value, this.range[0], this.range[1]));
    }

    this.transitioning = true;
    this.transition();
    this.renderMarker();
  };

  DataViz.prototype._dataToPoint = function(dx, dy, domain, range){
    domain = domain || this.plotDomain;
    range = range || this.plotRange;

    var px = UTIL.norm(dx, domain[0], domain[1]);
    var py = UTIL.norm(dy, range[0], range[1]);

    return this._percentToPoint(px, py);
  };

  DataViz.prototype._percentToPoint = function(px, py, margin){
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    margin = margin || this.opt.margin;
    var marginX0 = margin[0] * w;
    var marginY0 = margin[1] * h;
    var marginX1 = margin[2] * w;
    var marginY1 = margin[3] * h;
    var cw = w - marginX0 - marginX1;
    var ch = h - marginY0 - marginY1;

    var x = px * cw + marginX0;
    var y = h - marginY1 - (py * ch);

    return [x, y];
  };

  return DataViz;

})();
