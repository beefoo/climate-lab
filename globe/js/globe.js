'use strict';

var Globe = (function() {
  function Globe(options) {
    var defaults = {
      el: '#main',
      viewAngle: 45,
      near: 0.01,
      far: 1000
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Globe.prototype.init = function(){
    var _this = this;
    this.$el = $(this.opt.el);
    this.video = document.getElementById('video-co2');
    this.ready = false;

    this.video.addEventListener('loadeddata', function() {
      console.log('Video loaded');
      _this.loadView();
    }, false);
  };

  Globe.prototype.getProgress = function(){
    var progress = 0;
    var video = this.video;
    if (video && video.duration) {
      progress = video.currentTime / video.duration;
    }
    return progress;
  };

  Globe.prototype.isLoaded = function(){
    return this.ready;
  };

  Globe.prototype.loadView = function(){
    var _this = this;
    var w = this.$el.width();
    var h = this.$el.height();

    // init renderer
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(w, h);
    this.$el.append(this.renderer.domElement);

    // init scene
    this.scene = new THREE.Scene();

    // init camera
    var viewAngle = this.opt.viewAngle;
    var aspect = w / h;
    var near = this.opt.near;
    var far = this.opt.far;
    this.camera = new THREE.PerspectiveCamera(viewAngle, w / h, near, far);
	  this.camera.position.z = 2.0;

    // init lights
    var aLight = new THREE.AmbientLight(0x888888);
    var dLight = new THREE.DirectionalLight(0xcccccc, 1);
  	dLight.position.set(5,3,5);
    this.scene.add(aLight);
  	this.scene.add(dLight);

    // init controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

    // load video texture
    // var video = document.getElementById('video-co2');
    var video = this.video;
    var vTexture = new THREE.VideoTexture(video);
		vTexture.minFilter = THREE.LinearFilter;
		vTexture.magFilter = THREE.LinearFilter;
		vTexture.format = THREE.RGBFormat;

    // init globe
    var geometry = new THREE.SphereGeometry(0.5, 32, 32);
    var material = new THREE.MeshPhongMaterial({map: vTexture, overdraw: true});
    this.earth = new THREE.Mesh(geometry, material);
    this.earth.add(new THREE.AxisHelper(1));
    this.scene.add(this.earth);

    this.ready = true;
  };

  Globe.prototype.onResize = function(){
    var w = this.$el.width();
    var h = this.$el.height();

		this.renderer.setSize(w, h);
		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();
  };

  Globe.prototype.render = function(){
    var _this = this;

    if (!this.ready) return false;

    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  };

  Globe.prototype.setSpeed = function(speed){
    if (this.video) this.video.playbackRate = speed;
  };

  return Globe;

})();
