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
    this.$el = this.opt.$el;
    this.ready = false;
    this.season = this.opt.season;
    this.seasons = this.opt.seasons;
    this.value = this.opt.value;
    this.image = 'img/'+this.value+'_'+this.season+'.png';

    this.loadImages();
    this.loadView();
  };

  Globe.prototype.getRotationAngle = function(){
    return this.camera.rotation.x * 180 / Math.PI;
  };

  Globe.prototype.isLoaded = function(){
    return this.ready;
  };

  Globe.prototype.loadImages = function(){
    var value = this.value;

    _.each(this.seasons, function(season, i){
      var url = 'img/'+value+'_'+season+'.png';
      var img = new Image();
      img.src=url;
    });
  };

  Globe.prototype.loadView = function(){
    var _this = this;
    var w = this.$el.width();
    var h = this.$el.height();
    var image = this.image;

    // init renderer
    this.renderer = new THREE.WebGLRenderer({alpha: true});
    this.renderer.setClearColor(0x000000, 0);
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
    // this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls = new THREE.OrbitControls(this.camera, $('#orbit-control')[0]);

    // load textures asynchronously
    var earthPromise = $.Deferred();
    var countryPromise = $.Deferred();

    // init globe with image texture
    var geometry = new THREE.SphereGeometry(0.5, 64, 64);
    var material = new THREE.MeshBasicMaterial();
    this.earth = new THREE.Mesh(geometry, material);
    var textureLoader = new THREE.TextureLoader();
    textureLoader.load(image, function (texture) {
      _this.earth.material.map = texture;
      _this.earth.material.map.needsUpdate = true;
      earthPromise.resolve();
    });

    // load country texture
    var cGeo = geometry.clone();
    var cMat = new THREE.MeshPhongMaterial({transparent: true, opacity: 0.5});
    this.countries = new THREE.Mesh(cGeo, cMat);
    var cTextureLoader = new THREE.TextureLoader();
    cTextureLoader.load('img/BlankMap-Equirectangular.png', function (texture) {
      _this.countries.material.map = texture;
      _this.countries.material.map.needsUpdate = true;
      countryPromise.resolve();
    });

    // equator
    var eqGeo = new THREE.CircleGeometry(0.55, 64);
    eqGeo.vertices.shift();
    eqGeo.vertices.push(eqGeo.vertices[0].clone());
    var eqMat = new THREE.LineBasicMaterial( { color: 0x00f6ff } );
    var equator = new THREE.Line(eqGeo, eqMat);
    equator.rotation.x = Math.PI / 2;

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
    this.scene.add(this.countries);
    this.scene.add(equator);

    // wait for textures to load
    $.when(earthPromise, countryPromise).done(function() {
      _this.ready = true;
    });
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

  Globe.prototype.selectSeason = function(season){
    this.season = season;

    var _this = this;
    var image = 'img/'+this.value+'_'+this.season+'.png';
    var textureLoader = new THREE.TextureLoader();
    textureLoader.load(image, function (texture) {
      _this.earth.material.map = texture;
      _this.earth.material.map.needsUpdate = true;
    });
  };

  return Globe;

})();
