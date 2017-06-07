'use strict';

var Globe = (function() {
  function Globe(options) {
    var defaults = {
      el: '#main',
      viewAngle: 45,
      near: 0.01,
      far: 1000,
      orbitRadius: 4
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Globe.prototype.init = function(){
    var _this = this;
    this.$el = $(this.opt.el);
    this.video = document.getElementById('video-net-radiation');
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

    // ambient light
    var aLight = new THREE.AmbientLight(0x888888);
    this.scene.add(aLight);

    // directional light
    // this.dLight = new THREE.DirectionalLight(0xcccccc, 1);
    // var xy = UTIL.translatePoint([0,0], 0, this.opt.orbitRadius);
  	// this.dLight.position.set(xy[0],xy[1],0);
  	// this.scene.add(this.dLight);

    // light helper
    // var lightHelper = new THREE.DirectionalLightHelper(this.dLight, 1);
    // this.scene.add(lightHelper);

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
    var material = new THREE.MeshBasicMaterial({map: vTexture, overdraw: true});
    this.earth = new THREE.Mesh(geometry, material);

    // add arrow helpers
    // this.earth.add(new THREE.AxisHelper(1));

    // add north arrow
    var dir = new THREE.Vector3(0, 1, 0);
    var origin = new THREE.Vector3(0, 0, 0);
    var length = 0.8;
    var hex = 0x00ff00;
    var northArrow = new THREE.ArrowHelper(dir, origin, length, hex);
    this.earth.add(northArrow);

    // add south arrow
    dir = new THREE.Vector3(0, -1, 0);
    hex = 0xff0000;
    var southArrow = new THREE.ArrowHelper(dir, origin, length, hex);
    this.earth.add(southArrow);

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

  Globe.prototype.render = function(progress){
    var _this = this;

    if (!this.ready) return false;

    // earth orbits
    // var degrees = 360 - (progress * 360 - 90);
    // var xy = UTIL.translatePoint([0,0], degrees, this.opt.orbitRadius);

    // earth rotates
    // var days = progress / (1.0 / 365.25);
    // var dayProgress = days - Math.floor(days);
    // var xz = UTIL.translatePoint([0,0], dayProgress*360, this.opt.orbitRadius);
    // this.dLight.position.set(xz[0], 0, xz[1]);
    // this.dLight.lookAt(new THREE.Vector3(0,0,0));

    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  };

  Globe.prototype.setSpeed = function(speed){
    if (this.video) this.video.playbackRate = speed;
  };

  return Globe;

})();
