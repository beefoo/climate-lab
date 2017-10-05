'use strict';

var Controls = (function() {
  function Controls(options) {
    var defaults = {};
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Controls.prototype.init = function(){
    this.gamepad = false;

    var controls = this.opt.sliders;
    this.controls = controls;
    this.keys = _.keys(this.controls);

    var state = {};
    $.each(this.keys, function(i, key){
      state[key] = controls[key].value;
    });
    this.state = state;

    this.loadGamepad();
    this.loadSliders(controls);
  };

  Controls.prototype.initGamepad = function(gamepad){
    var _this = this;
    $(".app").addClass("gamepad");
    this.gamepad = gamepad;
    $.publish('window.resize', true);
    this.pollGamepad();
  };

  Controls.prototype.loadGamepad = function(){
    // if (!('ongamepadconnected' in window)) return false;
    var _this = this;

    window.addEventListener("gamepadconnected", function(e){
      console.log("Gamepad connected", e.gamepad);
      _this.initGamepad(e.gamepad);
    });

    window.addEventListener("gamepaddisconnected", function(e){
      console.log("Gamepad disconnected");
      _this.gamepad = false;
      // $(".app").removeClass("gamepad");
    });
  };

  Controls.prototype.loadSliders = function(sliders){
    $.each(sliders, function(el, options){
      $(el).slider(options);
    });
  };

  Controls.prototype.pollGamepad = function(){
    if (!this.gamepad) return false;
    var _this = this;
    var controls = this.controls;

    var gamepad = navigator.getGamepads()[this.gamepad.index];
    var prevState = this.state;
    var state = {};
    var axes = gamepad.axes;

    $.each(this.controls, function(key, control){
      var state = (axes[control.gamepad] + 1) / 2;
      state = Math.min(state, 1);
      state = Math.max(state, 0);
      if (state > 0.99) state = 1.0;
      // state has changed, execute callback
      if (prevState[key] != state) {
        // console.log("State change", key, state)
        control.slide(null, {value: state});
        _this.state[key] = state;
      }
    });

    requestAnimationFrame(function(){ _this.pollGamepad(); });
  };

  return Controls;

})();
