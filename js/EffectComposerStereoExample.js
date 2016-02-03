//three.js EffectComposer stereo example by Christopher Stevens http://www.christopherstevens.cc
//Uses StereoCamera.js, a modified version of StereoEffect.js, returning stereo cameras insead of rendering effect

function EffectComposerStereoExample() {

	var _self = this;

	_self.container;
	_self.scene;
	_self.camera;
	_self.cubes;
	_self.stereoCamera;
	_self.renderer;
	_self.effectFXAA;
	_self.effectCopy;
	_self.effectBloom;
	_self.element;
	_self.controls;
	_self.clock;
	_self.composer;
	_self.renderPass;
	_self.stats;
	_self.width;
	_self.height;

	_self.onResize = function() {
		_self.width = window.innerWidth;
	    _self.height = window.innerHeight;

	    _self.camera.aspect = _self.width / _self.height;
	    _self.camera.updateProjectionMatrix();
	    _self.renderer.setSize(_self.width, _self.height);
	    _self.effectFXAA.uniforms.resolution.value = new THREE.Vector2(1 / _self.width, 1 / _self.height);
	    _self.composer.setSize(_self.width, _self.height);
	    _self.composer.reset();
	};

	//put the scene together
	_self.initScene = function() {
		var i;

	    _self.clock = new THREE.Clock();
		_self.container = document.getElementById("viewerContainer");

		///////////
	    // SCENE //
	    ///////////

	    _self.scene = new THREE.Scene();

	    /////////////
	    // CAMERAS //
	    /////////////

	    var screenW = window.innerWidth;
	    var screenH = window.innerHeight;   
	    var viewAngle = 90;
	    var aspectRatio = screenW / screenH;
	    var near = 0.001;
	    var far = 10000;
	    _self.camera = new THREE.PerspectiveCamera(viewAngle, aspectRatio, near, far);
	    _self.camera.position.set(0,0,0);
	    _self.camera.lookAt(_self.scene.position);

	    //stereo camera (use main camera position/angle to produce a stereo L/R camera)
	    //based on StereoEffect.js, returning cameras instead of rendering the effect
	    _self.stereoCamera = new THREE.StereoCamera();

	    //////////////
	    // RENDERER //
	    //////////////
	    
	    var canvas = document.getElementById("viewer");
	    _self.renderer = new THREE.WebGLRenderer({antialias:true, canvas:canvas, alpha: true, clearColor: 0x000000 });
	    _self.renderer.autoClear = false;
	    _self.element = _self.renderer.domElement;

	    ///////////
	    //EFFECTS//
	    ///////////

	    _self.effectCopy = new THREE.ShaderPass(THREE.CopyShader);
	    _self.effectCopy.renderToScreen = true;

	    _self.effectBloom = new THREE.BloomPass(1.5);

	    _self.effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
		_self.effectFXAA.uniforms.resolution.value = new THREE.Vector2(1 / _self.width, 1 / _self.height);
		
		/////////////////////
		// EFFECT COMPOSER //
		/////////////////////

		_self.renderPass = new THREE.RenderPass(_self.scene, _self.stereoCamera.left);
		_self.composer = new THREE.EffectComposer(_self.renderer);
		_self.composer.addPass(_self.renderPass);
		_self.composer.addPass(_self.effectBloom);
		_self.composer.addPass(_self.effectFXAA);
		_self.composer.addPass(_self.effectCopy);

	    //////////////
	    // CONTROLS //
	    //////////////

	    // Our initial control fallback with mouse/touch events in case DeviceOrientation is not enabled
		_self.controls = new THREE.OrbitControls(_self.camera, _self.element);
		_self.controls.target.set(
			_self.camera.position.x,
			_self.camera.position.y,
			_self.camera.position.z - 0.0001
		);
		_self.controls.enablePan = false;
		_self.controls.enableZoom = false;

	    ////////////
	    // EVENTS //
	    ////////////

	    var setOrientationControls = function(e) {
			if (e == undefined || !e.alpha) {
				return;
			}
			
			_self.controls = null; //reset controls (? check this)
			_self.controls = new THREE.DeviceOrientationControls(_self.camera, true);
			_self.controls.connect();
			_self.controls.update();

			window.removeEventListener("deviceorientation", setOrientationControls, true);
		};

	    // automatically resize renderer
	    window.addEventListener('resize', function() { _self.onResize(); }, true);
	    
	    //change controls to device orientation if supported
	    window.addEventListener("deviceorientation", setOrientationControls, true);

	    ///////////
	    // STATS //
	    ///////////
	    
	    _self.stats = new Stats();
	   	_self.stats.domElement.style.position = 'absolute';
	    _self.stats.domElement.style.bottom = '0px';
	    _self.stats.domElement.style.zIndex = 100;
	    _self.container.appendChild( _self.stats.domElement );

	    ///////////
	    // LIGHT //
	    ///////////
	    
	    var light = new THREE.PointLight(0xffffff);
	    light.position.set(0,250,250);
	    _self.scene.add(light);
	    _self.scene.add( new THREE.AmbientLight( 0x333333 ) );

	    ///////////
	    // CUBES //
	    ///////////

	    var geometry = new THREE.BoxGeometry(20, 20, 20);
	    var i, object, material;
	    _self.cubes = [];
		for (i=0; i<800; i++) {
			material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff, transparent: true, opacity: 1.0 });
			object = new THREE.Mesh(geometry, material);

			object.position.x = Math.random() * 2000 - 1000;
			object.position.y = Math.random() * 2000 - 1000;
			object.position.z = Math.random() * 2000 - 1000;

			//prevent from overlapping camera
			if(object.position.x < 40 && object.position.x > -40) {
				object.position.x = 40;
			}
			if(object.position.z < 40 && object.position.z > -40) {
				object.position.z = 40;
			}

			_self.scene.add(object);
			_self.cubes.push(object);
		}

	    _self.onResize();

	    //mark scene as initiated to start rendering
	    _self.sceneInitiated = true;
	};

	//update scene elements
	_self.update = function() {
	    var i, object, r;

	    var delta = _self.clock.getDelta();

	    _self.stereoCamera.update(_self.scene, _self.camera, _self.width, _self.height);

		for (i=0; i<_self.cubes.length; i++) {
			object = _self.cubes[i];
			r = _self.clock.elapsedTime * 0.2;
			object.rotation.x = object.rotation.y = object.rotation.z = r;
			object.position.y -= 0.5;

			if(object.position.y < -1000) {
				object.position.y = 1000;
			}

			object.material.opacity = 1 - (Math.abs(object.position.y) / 1000);
		}
	        
	    _self.stats.update();
	};

	//render three.js scene
	_self.render = function() {   
		_self.renderer.setViewport( 0, 0, _self.width / 2, _self.height);
		_self.renderPass.camera = _self.stereoCamera.left; //note: bending rule by settings RenderPass.camera directly without set/get methods
		_self.composer.render();

		_self.renderer.setViewport( window.innerWidth / 2, 0, _self.width / 2, _self.height);
		_self.renderPass.camera = _self.stereoCamera.right; //note: bending rule by settings RenderPass.camera directly without set/get methods
		_self.composer.render();
	};

	//"Go forth with forthness, into the depths of depthness." --crazy web guy
	_self.goForth = function() {
		console.log('Go forth!');

		(function drawFrame() {
			window.requestAnimationFrame(drawFrame);

			if(_self.sceneInitiated == true) {
		       	_self.controls.update();
		       	_self.update();
		       	_self.render();       
		    } else {
		    	console.log('scene not ready yet...');
		    }
		}());
	};
}