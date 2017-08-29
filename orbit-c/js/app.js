'use strict';

var App = (function() {
  function App(options) {
    var defaults = {
      speedRange: [0.0, 3.0]
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;

    this.globes = [];
    var season = $('.select-season.selected').first().attr('data-value');
    this.season = season;
    var seasons = $('.select-season').map(function() { return $(this).attr('data-value'); }).get();
    this.seasons = seasons;

    $('.globe').each(function(){
      var $el = $(this);
      _this.globes.push(new Globe({$el: $el, season: season, seasons: seasons, value: $el.attr('data-value')}));
    });

    this.orbit = new Orbit({el: "#orbit", season: season});

    this.initMode();
    this.loadListeners();
    this.render();
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

  App.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(e){
      _this.onResize();
    });

    if (this.mode!=='sender') {
      crosstab.on('season.select', function(message) {
        _this.selectSeason(message.data);
      });
    }

    if (this.mode!=='receiver') {
      $('.select-season').on('click', function(){
        _this.onSeasonSelect($(this));
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
      this.onResize();
    }

    var season = this.seasons[i];
    crosstab.broadcast('factor.select', season);
  };

  App.prototype.onResize = function(){
    _.each(this.globes, function(g){ g.onResize(); });
  };

  App.prototype.onSeasonSelect = function($el) {
    var selected = $el.hasClass('selected');
    var season = $el.attr('data-value');

    if (!selected) {
      $('.select-season').removeClass('selected');
      $el.addClass('selected');
      crosstab.broadcast('season.select', season);
    }
  };

  App.prototype.render = function(){
    var _this = this;

    _.each(this.globes, function(g){
      g.render();
    });

    requestAnimationFrame(function(){
      _this.render();
    });
  };

  App.prototype.selectSeason = function(season){
    _.each(this.globes, function(g){
      g.selectSeason(season);
    });

    this.orbit.selectSeason(season);
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
