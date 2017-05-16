'use strict';

var Orbit = (function() {
  function Orbit(options) {
    var defaults = {
      el: '#orbit',
      viewAngle: 45,
      near: 0.01,
      far: 1000,
      orbitRadius: 1.25
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
	  this.camera.position.z = 5.0;

    // init lights
    var aLight = new THREE.AmbientLight(0x888888);
    var dLight = new THREE.DirectionalLight(0xcccccc, 1);
  	dLight.position.set(0,0,1);
    this.scene.add(aLight);
    this.scene.add(dLight);

    // init controls
    // this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

    // init earth
    var earthGeo = new THREE.SphereGeometry(0.5, 32, 32);
    var earthMat = new THREE.MeshPhongMaterial();
    this.earth = new THREE.Mesh(earthGeo, earthMat);
    this.earth.position.set(0, this.opt.orbitRadius, 0);
    this.earth.scale.set(0.5, 0.5, 0.5);
    this.earth.material.color.setHex(0x1e6eaa);
    this.scene.add(this.earth);

    // init sun
    var loader = new THREE.TextureLoader();
    loader.load('img/sunmap.jpg', function (texture) {
      var geometry = new THREE.SphereGeometry(0.5, 32, 32);
      var material = new THREE.MeshPhongMaterial({map: texture});
      _this.sun = new THREE.Mesh(geometry, material);
      _this.scene.add(_this.sun);
      _this.render(0);
    });

    // this.scene.add(new THREE.AxisHelper(10));

    // create glow effect
    // var materialGlow = new THREE.ShaderMaterial({
    //   uniforms: {
    //   	"c":   { type: "f", value: 0.5 },
    //   	"p":   { type: "f", value: 4.0 }
    //   },
    //   vertexShader:   document.getElementById('vertexShaderGlow').textContent,
    //   fragmentShader: document.getElementById('fragmentShaderGlow').textContent
    // });
    //
    // // glow scene
    // this.glowScene = new THREE.Scene();
  	// this.glowCamera = new THREE.PerspectiveCamera(viewAngle, w / h, near, far);
  	// this.glowCamera.position.z = this.camera.position.z;
  	// this.glowScene.add(this.glowCamera);
    //
  	// var glow = new THREE.Mesh(geometry.clone(), materialGlow);
  	// glow.scale.x = glow.scale.y = glow.scale.z = 1.5;
  	// // glow should provide light from behind the sphere, so only render the back side
  	// glow.material.side = THREE.BackSide;
  	// this.glowScene.add(glow);
    //
  	// // clone earlier sphere geometry to block light correctly
  	// // and make it a bit smaller so that light blends into surface a bit
  	// var blackMaterial = new THREE.MeshBasicMaterial({color: 0x000000});
  	// var blackSphere = new THREE.Mesh(earthGeo.clone(), blackMaterial);
    // blackSphere.position.set(0, 1.5, 0);
    // blackSphere.scale.set(0.5, 0.5, 0.5);
  	// this.glowScene.add(blackSphere);
    //
    // // final composer will blend composer2.render() results with the scene
    // // prepare secondary composer
  	// var renderTargetParameters =  {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false};
  	// var renderTarget = new THREE.WebGLRenderTarget(w, h, renderTargetParameters);
  	// var composer = new THREE.EffectComposer(this.renderer, renderTarget);
    //
  	// // prepare the secondary render's passes
  	// var render2Pass = new THREE.RenderPass(this.glowScene, this.glowCamera);
  	// composer.addPass(render2Pass);
    //
  	// // prepare final composer
  	// var finalComposer = new THREE.EffectComposer(this.renderer, renderTarget);
    //
  	// // prepare the final render's passes
  	// var renderModel = new THREE.RenderPass(this.scene, this.camera);
  	// finalComposer.addPass(renderModel);
    //
  	// var effectBlend = new THREE.ShaderPass(THREE.AdditiveBlendShader, "tDiffuse1");
  	// effectBlend.uniforms['tDiffuse2'].value = composer.renderTarget2;
  	// effectBlend.renderToScreen = true;
  	// finalComposer.addPass(effectBlend);
    //
    // this.composer = composer;
    // this.finalComposer = finalComposer;
  };

  Orbit.prototype.render = function(progress){
    var _this = this;

    // earth orbits
    var degrees = 360 - (progress * 360 - 90);
    var xy = UTIL.translatePoint([0,0], degrees, this.opt.orbitRadius);
    this.earth.position.set(xy[0], xy[1], 0);

    this.renderer.render(this.scene, this.camera);
    // this.controls.update();

    // requestAnimationFrame(function(){
    //   _this.render();
    // });
  };

  return Orbit;

})();
