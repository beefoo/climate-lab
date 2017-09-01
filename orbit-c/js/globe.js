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
    this.data = this.opt.data;

    this.loadView();
  };

  Globe.prototype.getRotationAngle = function(){
    return this.camera.rotation.x * 180 / Math.PI;
  };

  Globe.prototype.isLoaded = function(){
    return this.ready;
  };

  Globe.prototype.loadPoints = function(){

    if (this.points) {
      this.scene.remove(this.points);
    }

    var _this = this;
    var data = this.data[this.season];
    var geo = new THREE.Geometry();
    var sphereRadius = 0.5;

    var pointD = sphereRadius / 200;
    var pointGeo = new THREE.BoxGeometry(pointD, pointD, pointD);
    pointGeo.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,0));
    var point = new THREE.Mesh(pointGeo);
    var i = 0;

    // add points from data
    for (i=0; i<data.length; i+=4) {
      var lat = data[i];
      var lng = data[i + 1];
      var size = data[i + 2];
      var color = new THREE.Color(data[i + 3]);

      var phi = (90 - lat) * Math.PI / 180;
      var theta = (180 - lng) * Math.PI / 180;

      point.position.x = sphereRadius * Math.sin(phi) * Math.cos(theta);
      point.position.y = sphereRadius * Math.cos(phi);
      point.position.z = sphereRadius * Math.sin(phi) * Math.sin(theta);

      point.lookAt(_this.earth.position);

      point.scale.z = Math.max(size * 5, 0.1); // avoid non-invertible matrix
      point.scale.x = Math.max(size * 5, 0.1);
      point.scale.y = Math.max(size * 5, 0.1);
      point.updateMatrix();

      for (var j = 0; j < point.geometry.faces.length; j++) {
        point.geometry.faces[j].color = color;
      }
      if(point.matrixAutoUpdate){
        point.updateMatrix();
      }
      geo.merge(point.geometry, point.matrix);
    }

    if (geo.morphTargets.length < 8) {
      console.log('Morph padding');
      var padding = 8 - geo.morphTargets.length;
      for(var i=0; i<=padding; i++) {
        geo.morphTargets.push({'name': 'morphPadding'+i, vertices: geo.vertices});
      }
    }

    // create points
    this.points = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: THREE.FaceColors,
      morphTargets: true
    }));

    this.scene.add(this.points);

  };

  Globe.prototype.loadView = function(){
    var _this = this;
    var w = this.$el.width();
    var h = this.$el.height();
    var image = this.image;

    // init renderer
    this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(w, h);
    this.$el.append(this.renderer.domElement);

    // init scene
    this.scene = new THREE.Scene();

    var earthShader = {
      uniforms: {
        'texture': { type: 't', value: null }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          'vNormal = normalize( normalMatrix * normal );',
          'vUv = uv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D texture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'vec3 diffuse = texture2D( texture, vUv ).xyz;',
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
          'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
      ].join('\n')
    };

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

    // init controls
    // this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls = new THREE.OrbitControls(this.camera, $('#orbit-control')[0]);

    // load textures asynchronously
    var earthPromise = $.Deferred();

    // init globe with image texture
    var geometry = new THREE.SphereGeometry(0.5, 40, 30);
    var material = new THREE.MeshBasicMaterial();

    var uniforms = THREE.UniformsUtils.clone(earthShader.uniforms);
    var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: earthShader.vertexShader,
      fragmentShader: earthShader.fragmentShader
    });
    this.earth = new THREE.Mesh(geometry, material);
    this.earth.rotation.y = Math.PI;

    var textureLoader = new THREE.TextureLoader();
    textureLoader.load('img/world.png', function (texture) {
      _this.earth.material.uniforms['texture'].value = texture;
      // _this.earth.material.map.needsUpdate = true;
      earthPromise.resolve();
    });

    // equator
    var eqGeo = new THREE.CircleGeometry(0.51, 64);
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
    this.scene.add(equator);

    this.loadPoints();

    // wait for textures to load
    $.when(earthPromise).done(function() {
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
    if (season === this.season) return false;

    this.season = season;
    this.loadPoints();

  };

  return Globe;

})();
