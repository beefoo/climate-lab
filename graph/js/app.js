'use strict';

var App = (function() {
  function App(options) {
    var defaults = {
      el: "#graph"
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    this.$el = $(this.opt.el);
    this.nodes = this.opt.nodes;
    this.links = this.opt.links;

    // this.branches = this.opt.branches;
    // this.branchCount = this.branches.length;
    // this.index = 0;
    // this.branch = this.branches[this.index];
    // this.rotation = 0;
    // this.timeouts = [];

    this.loadGraph();

    this.loadListeners();
  };

  App.prototype.loadGraph = function(){

    var w = this.$el.width();
    var h = this.$el.height();
    var nodes = this.nodes;
    var links = this.links;
    var positions = this.opt.positions;
    var radius = h / 25;

    _.each(nodes, function(node, i){
      nodes[i].radius = radius;
      if (node.id==="CENTER") {
        nodes[i].fx = w / 2;
        nodes[i].fy = h / 2;
      }
    });

    var svg = d3.select(this.opt.el).append('svg')
      .attr('width', w)
      .attr('height', h);

    var simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-100))
      .force("collide", d3.forceCollide().radius(function(d){ return d.radius*2; }))
      .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(h/2))
      .force("center", d3.forceCenter(w/2, h/2))
      .force("x", d3.forceX(function(d){ return positions[d.groupId][0] * w; }))
      .force("y", d3.forceY(function(d){ return positions[d.groupId][1] * h; }));
    simulation.force("link").links(links);

    // define arrow markers for graph links
    svg.append('svg:defs').append('svg:marker')
        .attr('id', 'end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 6)
        .attr('markerWidth', radius/6)
        .attr('markerHeight', radius/6)
        .attr('orient', 'auto')
      .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#fff');

        var path = svg.append('svg:g').selectAll('path'),
        circle = svg.append('svg:g').selectAll('g');

    var link = svg.selectAll('.link')
        .data(links)
        .enter().append('path')
        .attr('class', 'link')
        .style('marker-end', 'url(#end-arrow)');

    var node = svg.selectAll('.node')
        .data(nodes)
        .enter().append('g')
          .attr('class', 'node');
    node.append('circle')
      .attr('r', radius);

    var textBounds = {x: radius * 2, y: radius * 2}
    node.append('text')
      .attr("text-anchor", "middle")
      // .attr("x", textBounds.x * -0.5)
      // .attr("x", textBounds.y * -0.5)
      .attr("id", function(d) { return "text-" + d.id; })
      .text(function(d) { return d.name; });

    var wrap = d3.textwrap()
      .bounds({height: textBounds.y, width: textBounds.x})
      .method('tspans');
    node.selectAll('text').call(wrap);

    simulation.on('tick', function() {

      link.attr('d', function(d) {
        var deltaX = d.target.x - d.source.x,
            deltaY = d.target.y - d.source.y,
            dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
            normX = deltaX / dist,
            normY = deltaY / dist,
            sourcePadding = radius * 1.1,
            targetPadding = radius * 1.2,
            sourceX = d.source.x + (sourcePadding * normX),
            sourceY = d.source.y + (sourcePadding * normY),
            targetX = d.target.x - (targetPadding * normX),
            targetY = d.target.y - (targetPadding * normY);
        return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
      });

      node.attr('transform', function(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
      });

    });

  };

  App.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(e){
      _this.onResize();
    });

    $(document).on("click", function(e) {
      e.preventDefault();
      _this.nextBranch(1);
    });

    $(document).on('mousewheel', function(e) {
      if (e.deltaY > 0) {
        _this.nextBranch(-1);
      } else {
        _this.nextBranch(1);
      }
    });

    $(document).keydown(function(e) {
      switch(e.which) {
        case 37: // left
          e.preventDefault();
          _this.nextBranch(-1);
          break;

        case 39: // right
          e.preventDefault();
          _this.nextBranch(1);
          break;

        default: return; // exit this handler for other keys
      }
    });
  };

  App.prototype.nextBranch = function(direction){
    // var _this = this;
    //
    // var index = this.index;
    // index += direction;
    //
    // if (index < 0) index = this.branchCount - 1;
    // if (index >= this.branchCount) index = 0;
    //
    // var currBranch = this.branch;
    // var nextBranch = this.branches[index];
    //
    // var rotation = this.rotation;
    // if (direction > 0) rotation += nextBranch.rotate;
    // else rotation -= currBranch.rotate;
    //
    // var nodes = nextBranch.nodes;
    //
    // $('#graph > g').removeClass('active');
    // $('#svg-container').css('transform', 'rotate('+rotation+'deg)');
    // $('#center').css('transform', 'rotate('+(-rotation)+'deg)');
    //
    // _.each(this.timeouts, function(timeout, i){
    //   clearTimeout(timeout);
    // });
    //
    // var timeouts = [];
    //
    // _.each(nodes, function(node, i){
    //   var s = (i+1) * 500;
    //   var timeout = setTimeout(function(){
    //     $('#'+node).addClass('active');
    //   }, s);
    //   timeouts.push(timeout);
    // });
    //
    // this.timeouts = timeouts;
    // this.branch = nextBranch;
    // this.rotation = rotation;
    // this.index = index;
  };

  App.prototype.onResize = function(){
    var _this = this;


  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
