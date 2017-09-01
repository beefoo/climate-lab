'use strict';

var Orbit = (function() {
  function Orbit(options) {
    var defaults = {
      el: '#orbit',
      viewAngle: 45,
      near: 0.01,
      far: 1000,
      orbitRadius: 5,
      earthTilt: 23.43703,
      controls: false
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Orbit.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.loaded = false;

    this.loadView();
  };

  Orbit.prototype.isLoaded = function(){
    return this.loaded;
  };

  Orbit.prototype.loadGlow = function(){
    var w = this.$el.width();
    var h = this.$el.height();
    var viewAngle = this.opt.viewAngle;
    var aspect = w / h;
    var near = this.opt.near;
    var far = this.opt.far;
    var glowGeo = new THREE.SphereGeometry(1.0, 32, 32);
    // create glow effect
    var glowMat = new THREE.ShaderMaterial({
      uniforms: {
      	"c":   { type: "f", value: 0.5 },
      	"p":   { type: "f", value: 4.0 }
      },
      vertexShader:   document.getElementById('vertexShaderGlow').textContent,
      fragmentShader: document.getElementById('fragmentShaderGlow').textContent
    });

    // glow scene
    this.glowScene = new THREE.Scene();
  	this.glowCamera = new THREE.PerspectiveCamera(viewAngle, w / h, near, far);
  	this.glowCamera.position.z = this.camera.position.z;
  	this.glowScene.add(this.glowCamera);

  	var glow = new THREE.Mesh(glowGeo, glowMat);
  	glow.scale.x = glow.scale.y = glow.scale.z = 1.5;
  	// glow should provide light from behind the sphere, so only render the back side
  	glow.material.side = THREE.BackSide;
  	this.glowScene.add(glow);

    // final composer will blend composer2.render() results with the scene
    // prepare secondary composer
  	var renderTargetParameters =  {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false};
  	var renderTarget = new THREE.WebGLRenderTarget(w, h, renderTargetParameters);
  	var composer = new THREE.EffectComposer(this.renderer, renderTarget);

  	// prepare the secondary render's passes
  	var render2Pass = new THREE.RenderPass(this.glowScene, this.glowCamera);
  	composer.addPass(render2Pass);

  	// prepare final composer
  	var finalComposer = new THREE.EffectComposer(this.renderer, renderTarget);

  	// prepare the final render's passes
  	var renderModel = new THREE.RenderPass(this.scene, this.camera);
  	finalComposer.addPass(renderModel);

  	var effectBlend = new THREE.ShaderPass(THREE.AdditiveBlendShader, "tDiffuse1");
  	effectBlend.uniforms['tDiffuse2'].value = composer.renderTarget2;
  	effectBlend.renderToScreen = true;
  	finalComposer.addPass(effectBlend);

    this.composer = composer;
    this.finalComposer = finalComposer;
  };

  Orbit.prototype.loadView = function(){
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
	  this.camera.position.z = 10.0;
    this.camera.position.y = 10.0;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    // init lights
    var aLight = new THREE.AmbientLight(0x888888);
    var pLight = new THREE.PointLight(0xFFFFFF, 1, 0);
  	pLight.position.set(0,0,0);
    this.scene.add(aLight);
    this.scene.add(pLight);

    // init controls
    if (this.opt.controls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    }

    // init sun
    var sunGeo = new THREE.SphereGeometry(1.0, 32, 32);
    var sunMat = new THREE.MeshBasicMaterial();
    this.sun = new THREE.Mesh(sunGeo, sunMat);
    this.scene.add(this.sun);

    // init earth
    var earthGeo = new THREE.SphereGeometry(1.0, 32, 32);
    var earthMat = new THREE.MeshPhongMaterial();
    this.earth = new THREE.Mesh(earthGeo, earthMat);
    // this.earth.material.color.setHex(0x1e6eaa);
    // this.earth.add(new THREE.AxisHelper(3));

    // add north arrow
    var dir = new THREE.Vector3(0, 1, 0);
    var origin = new THREE.Vector3(0, 0, 0);
    var length = 4;
    var hex = 0x00ff00;
    var northArrow = new THREE.ArrowHelper(dir, origin, length, hex);
    this.earth.add(northArrow);

    // add south arrow
    dir = new THREE.Vector3(0, -1, 0);
    hex = 0xff0000;
    var southArrow = new THREE.ArrowHelper(dir, origin, length, hex);
    this.earth.add(southArrow);

    // create earth helper
    this.earthHelper = new THREE.Object3D();
    this.earthHelper.position.set(0, this.opt.orbitRadius, 0);
    this.earthHelper.scale.set(0.4, 0.4, 0.4);
    this.earthHelper.rotation.z = this.opt.earthTilt * Math.PI / 180;
    this.earthHelper.add(this.earth);

    // equator
    var eqGeo = new THREE.CircleGeometry(1.2, 32);
    eqGeo.vertices.shift();
    eqGeo.vertices.push(eqGeo.vertices[0].clone());
    var eqMat = new THREE.LineBasicMaterial( { color: 0x00f6ff } );
    var equator = new THREE.Line(eqGeo, eqMat);
    equator.rotation.x = Math.PI / 2;
    this.earthHelper.add(equator);

    this.scene.add(this.earthHelper);

    // load textures asynchronously
    var sunPromise = $.Deferred();
    var earthPromise = $.Deferred();

    // load sun texture
    var sunTextureLoader = new THREE.TextureLoader();
    sunTextureLoader.load('img/sunmap.jpg', function (texture) {
      _this.sun.material.map = texture;
      _this.sun.material.map.needsUpdate = true;
      sunPromise.resolve();
    });

    // load earth texture
    var earthTextureLoader = new THREE.TextureLoader();
    earthTextureLoader.load('img/earthmap1k.jpg', function (texture) {
      _this.earth.material.map = texture;
      _this.earth.material.map.needsUpdate = true;
      earthPromise.resolve();
    });

    // load glow
    this.loadGlow();

    // wait for textures to load
    $.when(sunPromise, earthPromise).done(function() {
      _this.loaded = true;
    });

    // this.scene.add(new THREE.AxisHelper(5));
  };

  Orbit.prototype.onResize = function(){
    var w = this.$el.width();
    var h = this.$el.height();

		this.renderer.setSize(w, h);
		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();
  };

  Orbit.prototype.render = function(progress){
    var _this = this;

    // earth orbits
    var degrees = 360 - (progress * 360 - 90);
    var xy = UTIL.translatePoint([0,0], degrees, this.opt.orbitRadius);
    this.earthHelper.position.set(xy[0], 0, xy[1]);

    // earth rotates
    var days = progress / (1.0 / 365.25);
    var dayProgress = days - Math.floor(days);
    this.earth.rotation.y = 2 * dayProgress * Math.PI;

    // this.renderer.render(this.scene, this.camera);

    this.composer.render();
    this.finalComposer.render();

    this.opt.controls && this.controls.update();
  };

  return Orbit;

})();
