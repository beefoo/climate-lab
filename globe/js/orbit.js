'use strict';

var Orbit = (function() {
  function Orbit(options) {
    var defaults = {
      el: '#orbit',
      viewAngle: 45,
      near: 0.01,
      far: 1000,
      orbitRadius: 5,
      earthTilt: 23.43703
    };
    this.opt = $.extend({}, defaults, options);
    this.init();
  }

  Orbit.prototype.init = function(){
    this.$el = $(this.opt.el);

    this.loadView();
  };

  Orbit.prototype.loadView = function(){
    var _this = this;
    var w = this.$el.width();
    var h = w;

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
    // this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

    // init earth
    var earthGeo = new THREE.SphereGeometry(1.0, 32, 32);
    var earthMat = new THREE.MeshPhongMaterial();
    this.earth = new THREE.Mesh(earthGeo, earthMat);
    this.earth.material.color.setHex(0x1e6eaa);
    this.earth.add(new THREE.AxisHelper(3));

    // create a helper
    this.earthHelper = new THREE.Object3D();
    this.earthHelper.position.set(0, this.opt.orbitRadius, 0);
    this.earthHelper.scale.set(0.4, 0.4, 0.4);
    this.earthHelper.rotation.z = this.opt.earthTilt * Math.PI / 180;
    this.earthHelper.add(this.earth);

    this.scene.add(this.earthHelper);

    // init sun
    var loader = new THREE.TextureLoader();
    loader.load('img/sunmap.jpg', function (texture) {
      var geometry = new THREE.SphereGeometry(1.0, 32, 32);
      var material = new THREE.MeshBasicMaterial({map: texture});
      _this.sun = new THREE.Mesh(geometry, material);
      _this.scene.add(_this.sun);
      _this.render(0);
    });

    // this.scene.add(new THREE.AxisHelper(5));

    // create glow effect
    var materialGlow = new THREE.ShaderMaterial({
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

  	var glow = new THREE.Mesh(earthGeo.clone(), materialGlow);
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

  Orbit.prototype.onResize = function(){
    var w = this.$el.width();
    var h = w;

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

    // this.controls.update();

    // requestAnimationFrame(function(){
    //   _this.render();
    // });
  };

  return Orbit;

})();
