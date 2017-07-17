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

    this.initMode();
    if (this.mode !== 'sender') this.loadData();
    this.loadListeners();
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
    }

    if (this.mode!=='receiver') {
      $('.factor-button').on('click', function(){
        _this.onFactorClick($(this));
      });
    }
  };

  App.prototype.onDataLoaded = function(data){
    var _this = this;

    // load data
    var refData = data.data[0];
    this.data = data.data.slice(1);

    // load data viz
    this.dataViz = new DataViz({"el": "#pane", "data": data.data[1], "domain": data.domain, "range": data.range, "refData": refData});

    // load titles
    this.titles = new Titles({data: this.data, el: "#titles"});

    this.render();
  };

  App.prototype.onFactorClick = function($el) {
    $('.factor-button').removeClass('selected');
    $el.addClass('selected');
    var index = parseInt($el.attr('data-value'));

    crosstab.broadcast('factor.select', index);
  };

  App.prototype.render = function(){
    var _this = this;

    this.dataViz.render();

    requestAnimationFrame(function(){ _this.render(); });
  };

  App.prototype.selectFactor = function(index) {
    var factorData = this.data[index];
    this.dataViz.setData(factorData);
    this.titles.activate(index);
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
