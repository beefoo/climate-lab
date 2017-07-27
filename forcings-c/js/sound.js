'use strict';

var Sound = (function() {
  function Sound(options) {
    var defaults = {
      soundDir: '../shared/audio/orchestral_harp-mp3/',
      soundExt: '.mp3',
      notes: ['Db3', 'Eb3', 'E3', 'Gb3', 'Ab3', 'A3', 'B3', 'Db4', 'E4', 'Gb4', 'Ab4', 'A4', 'B4'],
      stereo: 0.0,
      waitMs: 100
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Sound.prototype.init = function(){
    var _this = this;
    this.sounds = [];

    var dir = this.opt.soundDir;
    var ext = this.opt.soundExt;
    var notes = this.opt.notes;
    var stereo = this.opt.stereo;

    _.each(notes, function(n){
      var filename = dir + n + ext;
      var soundData = {
        player: new Howl({ src: [filename], stereo: stereo }),
        prevSound: false,
        lastPlayed: false
      };
      _this.sounds.push(soundData);
    });
  };

  Sound.prototype.play = function(percent){
    var len = this.sounds.length;
    var i = Math.floor((len - 1) * percent);

    // don't play same note right after it was played
    var now = new Date();
    var waitMs = this.opt.waitMs;
    if (!this.sounds[i].lastPlayed || (now-this.sounds[i].lastPlayed) > 100) {
      // fade out prev sound
      // if (this.sounds[i].prevSound) {
      //   this.sounds[i].player.fade(1.0, 0.0, 10, this.sounds[i].prevSound);
      // }
      this.sounds[i].prevSound = this.sounds[i].player.play();
      this.sounds[i].lastPlayed = now;
      // console.log(this.opt.notes[i])
    }

  };

  return Sound;

})();
