'use strict';

var Sound = (function() {
  function Sound(options) {
    var defaults = {
      soundDir: 'audio/orchestral_harp-mp3/',
      soundExt: '.mp3',
      notes: ['Db3', 'Eb3', 'E3', 'Gb3', 'Ab3', 'A3', 'B3', 'Db4', 'E4', 'Gb4', 'Ab4', 'A4', 'B4'],
      stereo: 0.0
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Sound.prototype.init = function(){
    var _this = this;
    this.sounds = [];
    this.prevSounds = [];

    var dir = this.opt.soundDir;
    var ext = this.opt.soundExt;
    var notes = this.opt.notes;
    var stereo = this.opt.stereo;

    _.each(notes, function(n){
      var filename = dir + n + ext;
      _this.sounds.push(new Howl({ src: [filename], stereo: stereo }));
      _this.prevSounds.push(false);
    });
  };

  Sound.prototype.play = function(percent){
    var len = this.sounds.length;
    var i = Math.floor((len - 1) * percent);
    if (this.prevSounds[i]) {
      this.sounds[i].fade(1.0, 0.0, 10, this.prevSounds[i]);
    }
    this.prevSounds[i] = this.sounds[i].play();

  };

  return Sound;

})();
