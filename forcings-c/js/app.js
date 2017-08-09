'use strict';

var App = (function() {
  function App(options) {
    var defaults = {
      enableSound: true
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    this.data = [];
    this.dataIndex = -1;
    this.gamepad = false;

    this.initMode();
    if (this.mode !== 'sender') this.loadData();
  };

  App.prototype.initMode = function(){
    var q = UTIL.parseQuery();

    this.mode = 'default';

    if (_.has(q, 'mode')) this.mode = q.mode;

    $('.app').addClass(this.mode);

    // pop out a new window if receiver
    if (this.mode==='receiver') {
      var url = window.location.href.split('?')[0] + '?mode=sender';
      window.open(url);
    }
  };

  App.prototype.deselectFactor = function(index) {
    this.dataViz.removeIndex(index);
  };

  App.prototype.loadData = function(){
    var _this = this;

    $.getJSON(this.opt.dataURL, function(data) {
      console.log('Data loaded.');
      _this.onDataLoaded(data);
    });
  };

  App.prototype.loadListeners = function(){
    var _this = this;

    if (this.mode!=='sender') {
      crosstab.on('factor.select', function(message) {
        _this.selectFactor(message.data);
      });
      crosstab.on('factor.deselect', function(message) {
        _this.deselectFactor(message.data);
      });
    }

    if (this.mode!=='receiver') {
      $('.factor-button').on('click', function(){
        _this.onFactorClick($(this));
      });
      $(window).keypress(function(e) {
        _this.onKeydown(e);
      });
      $(window).keyup(function(e) {
        _this.onKeyup(e);
      });
    }
  };

  App.prototype.onKeydown = function(e){
    // console.log('keydown', e.which);
    var i = e.which - 49;
    if (i < 0 || i >= this.data.length) return false;
    e.preventDefault();
    // console.log('down', i);

    // go into gamepad mode
    if (!this.gamepad) {
      this.gamepad = true;
      $(".app").addClass("gamepad");
      this.dataViz.onResize();
    }

    if (!this.states[i]) {
      this.states[i] = true;
      crosstab.broadcast('factor.select', i);
    }
  };

  App.prototype.onKeyup = function(e){
    // console.log('keyup', e.which);
    var i = e.which - 49;
    if (i < 0 || i >= this.data.length) return false;
    e.preventDefault();
    // console.log('up', i);

    if (this.states[i]) {
      this.states[i] = false;
      crosstab.broadcast('factor.deselect', i);
    }
  };

  App.prototype.onDataLoaded = function(data){
    var _this = this;

    // load data
    var refData = data.data[0];
    this.data = data.data.slice(1);
    var colors = this.opt.colors;
    this.states = _.map(this.data, function(d, i){ return false; });

    // load data viz
    this.dataViz = new DataViz({"el": "#pane", "data": this.data, "domain": data.domain, "range": data.range, "refData": refData, colors: colors});

    this.render();
    this.loadListeners();
  };

  App.prototype.onFactorClick = function($el) {
    var selected = $el.hasClass('selected');
    var index = parseInt($el.attr('data-value'));

    if (selected) {
      $el.removeClass('selected');
      crosstab.broadcast('factor.deselect', index);
    } else {
      $el.addClass('selected');
      crosstab.broadcast('factor.select', index);
    }
  };

  App.prototype.render = function(){
    var _this = this;

    this.dataViz.render();

    requestAnimationFrame(function(){ _this.render(); });
  };

  App.prototype.selectFactor = function(index) {
    this.dataViz.addIndex(index);
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
