'use strict';

var App = (function() {
  function App(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  App.prototype.init = function(){
    var _this = this;
    var globes = [];
    var promises = [];

    this.calendar = new Calendar({el: "#calendar"});
    this.$globesContainer = $('#globes');
    this.$globes = $('.globe');
    this.globesRotation = 0;

    _.each(this.opt.globes, function(globeOpt, i){
      var globe = new Globe(globeOpt);
      promises.push(globe.load());
      globes.push(globe);
    });

    this.globes = globes;

    $.when.apply($, promises).then(function(){
      _this.reset();
      _this.render();
      _this.loadListeners();
    });
  };

  App.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(e){
      _this.onResize();
    });

    $(document).keydown(function(e) {
      switch(e.which) {
        case 37: // left
          e.preventDefault();
          _this.nextGlobe(-1);
          break;

        case 39: // right
          e.preventDefault();
          _this.nextGlobe(1);
          break;

        default: return; // exit this handler for other keys
      }
    });
  };

  App.prototype.nextGlobe = function(direction){
    this.globesRotation += direction * 45;

    var i = this.globesRotation/45;

    if (i % 2 === 0) {
      this.$globesContainer.css('transform', 'translate3d(0, 0, 0) rotate('+this.globesRotation+'deg)');
    } else {
      var h = this.$globesContainer.height();
      this.$globesContainer.css('transform', 'translate3d('+(h*0.05)+'px, '+(h*0.2)+'px, 0) rotate('+this.globesRotation+'deg)');
    }

    this.$globes.css('transform', 'rotate('+(-this.globesRotation)+'deg)');
  };

  App.prototype.onResize = function(){
    _.each(this.globes, function(globe){
      globe.onResize();
    });
    this.calendar.onResize();
  };

  App.prototype.render = function(){
    var _this = this;

    var masterGlobe = this.globes[0];
    if (masterGlobe.ended()) this.reset();
    var progress = masterGlobe.getProgress();

    _.each(this.globes, function(globe){
      globe.isLoaded() && globe.render();
    });

    this.calendar.render(progress);

    requestAnimationFrame(function(){
      _this.render();
    });
  };

  App.prototype.reset = function(){
    _.each(this.globes, function(g){
      g.setProgress(0);
    });
  };

  return App;

})();

$(function() {
  var app = new App(CONFIG);
});
