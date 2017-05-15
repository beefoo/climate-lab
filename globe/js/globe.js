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
    this.$el = $(this.opt.el);

    this.loadView();
    this.loadListeners();
  };

  Globe.prototype.loadListeners = function(){
    var _this = this;

    $(window).on('resize', function(e){
      _this.onResize();
    })
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
	  this.camera.position.z = 1.5;

    // init lights
    var aLight = new THREE.AmbientLight(0x888888);
    var dLight = new THREE.DirectionalLight(0xcccccc, 1);
  	dLight.position.set(5,3,5);
    this.scene.add(aLight);
  	this.scene.add(dLight);

    // init globe
    var geometry = new THREE.SphereGeometry(0.5, 32, 32);
    var material = new THREE.MeshPhongMaterial();
    this.earth = new THREE.Mesh(geometry, material);
    this.scene.add(this.earth);

    // init controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

    // load base texture
    var loader = new THREE.TextureLoader();
    loader.load(
    	'img/earthmap4k.jpg',
    	function (texture) {
        material.map = texture;
        _this.render();
      },
    	function (xhr) { /* console.log( (xhr.loaded / xhr.total * 100) + '% loaded' ); */ }
    );

    // var material  = new THREE.MeshPhongMaterial({
    //   map     : new THREE.Texture(canvasCloud),
    //   side        : THREE.DoubleSide,
    //   opacity     : 0.8,
    //   transparent : true,
    //   depthWrite  : false,
    // })
    // var cloudMesh = new THREE.Mesh(geometry, material)
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

    this.renderer.render(this.scene, this.camera);
    this.controls.update();

    requestAnimationFrame(function(){
      _this.render();
    });
  };

  return Globe;

})();
