'use strict';

var Sound = (function() {
  function Sound(options) {
    var defaults = {
      sprites: SPRITES,
      audio: ['../shared/audio/key.mp3']
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Sound.prototype.init = function(){
    var sprites = this.opt.sprites;
    this.sound = new Howl({
      src: this.opt.audio,
      sprite: sprites
    });
    this.notes = _.keys(sprites);
    // console.log(this.notes)
  };

  Sound.prototype.play = function(percent){
    if (percent < 0 || percent > 1) return false;

    var len = this.notes.length;
    var i = Math.floor((len - 1) * percent);
    var sprite = this.notes[i];
    this.sound.play(sprite);
  };

  return Sound;

})();
