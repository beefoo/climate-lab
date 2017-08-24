'use strict';

var DataViz = (function() {
  function DataViz(options) {
    var defaults = {
      el: '#main',
      margin: [0.02, 0, 0.01, 0.1],
      map: 'img/BlankMap-Equirectangular-01.png',
      axesLabelEvery: 5,
      dotRadius: 0.002,
      graphTextStyle: {
        fill: "#1a1a1a",
        fontSize: 24,
        fontWeight: "bold"
      },
      keyTextStyle: {
        fill: "#d2d1dd",
        fontSize: 18
      },
      labelTextStyle: {
        fill: "#ffffff",
        fontSize: 44,
        fontWeight: "bold"
      },
      graphUnitWidth: 0.001
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  DataViz.prototype.init = function(){
    var _this = this;

    this.$el = $(this.opt.el);
    this.domain = this.opt.domain;
    this.time = this.opt.time;
    this.categories = this.opt.categories;
    this.groupEvery = this.opt.groupEvery;

    // re-map data
    var d0 = this.domain[0];
    var data = [];
    _.each(this.opt.data, function(d, i){
      var events = _.map(d.events, function(dd){
        return {
          x: dd[0],
          y: dd[1],
          size: dd[2],
          category: dd[3]
        };
      });
      data.push({
        events: events,
        counts: d.counts
      });
    });
    this.data = data;
    this.dataLen = this.data.length;

    this.loadView();
    this.loadListeners();

    this.renderMap();
    this.renderKey();

    this.updateTime(this.time);
  };

  DataViz.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(e){
      _this.onResize();
    })
  };

  DataViz.prototype.loadView = function(){
    var w = this.$el.width();
    var h = w / 2;

    this.app = new PIXI.Application(w, h, {transparent : true});
    this.map = new PIXI.Graphics();
    this.graph = new PIXI.Graphics();
    this.plot = new PIXI.Graphics();
    this.labels = new PIXI.Graphics();
    this.key = new PIXI.Graphics();

    this.app.stage.addChild(this.map, this.plot, this.graph, this.key, this.labels);

    this.$el.append(this.app.view);
  };

  DataViz.prototype.onResize = function(){
    var w = this.$el.width();
    var h = w / 2;

    this.app.renderer.resize(w, h);
    this.renderMap();
    this.renderGraph();
    this.renderKey();
    this.renderPlot();

  };

  DataViz.prototype.render = function(){

  };

  DataViz.prototype.renderGraph = function(){
    var _this = this;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var graphUnitWidth = this.opt.graphUnitWidth * w;
    var graphTextStyle = this.opt.graphTextStyle;
    var m = this.opt.margin;

    this.graph.clear();
    while(this.graph.children[0]) {
      this.graph.removeChild(this.graph.children[0]);
    }

    var counts = this.data[this.yearIndex].counts.slice(0).reverse();
    var categories = this.categories.slice(0).reverse();
    var graphHeight = h * m[3] * 0.5;

    var x = w * m[0];
    var y = h - graphHeight - h * 0.02;

    _.each(categories, function(c, i){
      var count = counts[i];
      var width = graphUnitWidth * count;

      _this.graph.beginFill(c.color);
      _this.graph.drawRect(x, y, width, graphHeight);
      _this.graph.endFill();

      var label = new PIXI.Text(count, graphTextStyle);
      label.x = x + width / 2;
      label.y = y + graphHeight / 2;
      label.alpha = 0.7;
      label.anchor.set(0.5, 0.5);
      _this.graph.addChild(label);

      x += width;
    });

  };

  DataViz.prototype.renderKey = function(){
    var _this = this;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var m = this.opt.margin;
    var keyTextStyle = this.opt.keyTextStyle;
    var categories = this.categories;
    var radius = this.opt.dotRadius * w * 2;

    this.key.clear();
    while(this.key.children[0]) {
      this.key.removeChild(this.key.children[0]);
    }

    var rowHeight = h * 0.03;
    var marginX = h * m[0];
    var marginY = h * m[3];
    _.each(categories, function(c, i){
      var color = c.color;
      var x = marginX * 2.5;
      var y = h - (marginY + rowHeight * i);

      _this.key.beginFill(color);
      // _this.key.lineStyle(1, color);
      _this.key.drawCircle(x, y, radius);
      _this.key.endFill();

      var text = c.label;
      var label = new PIXI.Text(text, keyTextStyle);
      label.x = x + radius * 2 + marginX/4;
      label.y = y;
      label.anchor.set(0, 0.5);
      _this.key.addChild(label);
    });


  };

  DataViz.prototype.renderMap = function(){
    var _this = this;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;

    this.map.clear();
    while(this.map.children[0]) {
      this.map.removeChild(this.map.children[0]);
    }

    var mapImg = PIXI.Sprite.fromImage(this.opt.map);
    mapImg.width = w;
    mapImg.height = h;
    mapImg.x = 0;
    mapImg.y = 0;

    this.map.addChild(mapImg);
  };

  DataViz.prototype.renderLabels = function(){
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var m = this.opt.margin;
    var labelTextStyle = this.opt.labelTextStyle;

    this.labels.clear();
    while(this.labels.children[0]) {
      this.labels.removeChild(this.labels.children[0]);
    }

    var year = this.domain[0] + this.yearIndex;
    var label = new PIXI.Text(year, labelTextStyle);
    label.x = w * m[0];
    label.y = h * 0.725;
    label.anchor.set(0, 0);
    this.labels.addChild(label);
  };

  DataViz.prototype.renderPlot = function(){
    var _this = this;
    var data = this.data;
    var w = this.app.renderer.width;
    var h = this.app.renderer.height;
    var radius = this.opt.dotRadius * w;

    this.plot.clear();
    // while(this.plot.children[0]) {
    //   this.plot.removeChild(this.plot.children[0]);
    // }

    var categories = this.categories;
    var yearIndex = this.yearIndex;
    var groupEvery = this.groupEvery;
    var yearData = this.data[this.yearIndex];

    _.each(yearData.events, function(d, j){
      var x = d.x * w;
      var y = d.y * h;
      var r = d.size * radius;
      var color = categories[d.category].color;
      _this.plot.beginFill(color, 0.4);
      _this.plot.lineStyle(1, color);
      _this.plot.drawCircle(x, y, r);
      _this.plot.endFill();
    });
  };

  DataViz.prototype.updateTime = function(time){
    this.time = time;
    this.yearIndex = Math.round(time * (this.dataLen - 1));

    this.renderPlot();
    this.renderGraph();
    this.renderLabels();
  };

  return DataViz;

})();
