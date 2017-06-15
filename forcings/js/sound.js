'use strict';

var Sound = (function() {
  function Sound(options) {
    var defaults = {
      soundDir: 'audio/orchestral_harp-mp3/',
      soundExt: '.mp3',
      notes: ['E3', 'Gb3', 'Ab3', 'A3', 'B3', 'Db3', 'Eb3', 'E4', 'Gb4', 'Ab4', 'A4', 'B4', 'Db4']
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

    _.each(notes, function(n){
      var filename = dir + n + ext;
      _this.sounds.push(new Howl({ src: [filename] }));
    });
  };

  Sound.prototype.play = function(percent){
    var len = this.sounds.length;
    var i = Math.floor((len - 1) * percent);
    this.sounds[i].seek(0);
    this.sounds[i].play();
  };

  return Sound;

})();