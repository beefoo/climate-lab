'use strict';

var App = (function() {
  function App(options) {
    var defaults = {
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    this.branches = this.opt.branches;
    this.branchCount = this.branches.length;
    this.index = 0;
    this.branch = this.branches[this.index];
    this.rotation = 0;
    this.timeouts = [];

    $('#graph > g').each(function(){
      var $el = $(this);
      var id = $el.attr('id');

      if (id.length <= 2) {
        $el.addClass('strong');
      } else if (id[3] == '2' || id[3] == '3') {
        $el.addClass('weak');
      }
    })

    var nodes = this.branch.nodes;
    _.each(nodes, function(node, i){
      $('#'+node).addClass('active');
    });

    this.loadListeners();
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
    var _this = this;

    var index = this.index;
    index += direction;

    if (index < 0) index = this.branchCount - 1;
    if (index >= this.branchCount) index = 0;

    var currBranch = this.branch;
    var nextBranch = this.branches[index];

    var rotation = this.rotation;
    if (direction > 0) rotation += nextBranch.rotate;
    else rotation -= currBranch.rotate;

    var nodes = nextBranch.nodes;

    $('#graph > g').removeClass('active');
    $('#svg-container').css('transform', 'rotate('+rotation+'deg)');
    $('#center').css('transform', 'rotate('+(-rotation)+'deg)');

    _.each(this.timeouts, function(timeout, i){
      clearTimeout(timeout);
    });

    var timeouts = [];

    _.each(nodes, function(node, i){
      var s = (i+1) * 500;
      var timeout = setTimeout(function(){
        $('#'+node).addClass('active');
      }, s);
      timeouts.push(timeout);
    });

    this.timeouts = timeouts;
    this.branch = nextBranch;
    this.rotation = rotation;
    this.index = index;
  };

  App.prototype.onResize = function(){
    var _this = this;


  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
