//custom 3d object discussion:
//http://stackoverflow.com/questions/31923047/creating-custom-object3d-class

function Ship4() {

    var _s = this;

    _s.chassis;
    _s.chassisLoaded = false;
    _s.obj = new THREE.Object3D();

    _s.warpField;
    _s.warpFieldDiameter = 2500;
	_s.warpLength = 5000;
    
    _s.warpActive = false;
    //!!! need to set these with set/get methods
    _s.warpSpeed = 0.0;
    _s.warpAlpha = 0.0;

    _s.assignShipMaterials = function(materials) {
	    var i;

	    for(i=0;i<materials.length;i++) {
	        
	        //console.log(materials[i]);

	        if(materials[i].name == 'texture') {
	            materials[i] = new THREE.MeshPhongMaterial({
	                emissive: 0xffffff,
	                map: THREE.ImageUtils.loadTexture('img/shipTexture.png'),
	                shading: THREE.FlatShading,
	                emissiveMap: THREE.ImageUtils.loadTexture('img/shipTexture.png'),
	                name: 'texture'
	            });
	        }
	    }

	    return materials;
	};

	_s.loadModels = function() {
		var ship;
		var loader = new THREE.JSONLoader();

	    //load the back
	    loader.load( 'models/ship4.json', function ( geometry, materials ) {

			materials = _s.assignShipMaterials(materials);

			_s.chassis = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
			_s.chassis.scale.x = _s.chassis.scale.y = _s.chassis.scale.z = 100;
			_s.chassis.rotation.y = 0;

			_s.chassisLoaded = true;
			_s.areAllModelsLoaded();
		});
	};

	_s.areAllModelsLoaded = function() {	
	    if(_s.chassisLoaded == true) {
	        _s.init();
	    }
	}

	_s.setupWarpEffect = function() {
		var i, map, geometry, material, plane;

		var mergedWarpGeometry = new THREE.Geometry();

		//create and merge individual warp "beams"
		map = new THREE.TextureLoader().load( "img/warpBeam.png" );
		material = new THREE.MeshBasicMaterial( {map: map, opacity: 0.0, transparent: true, color: 0x007eff, blending: THREE.AdditiveBlending } );

		for(i=0; i<150; i++) {
			
		    geometry = new THREE.PlaneGeometry(120, 10);
			plane = new THREE.Mesh(geometry);

			plane.position.x = (Math.random() * _s.warpFieldDiameter) - (_s.warpFieldDiameter / 2);
			//move away from ship interior
			if(plane.position.x > 0 && plane.position.x < 280) {
				plane.position.x += 280;
			} else if(plane.position.x < 0 && plane.position.x > -280) {
				plane.position.x -= 280;
			}

			plane.position.y = (Math.random() * _s.warpFieldDiameter) - (_s.warpFieldDiameter / 2);
			//move away from ship interior
			if(plane.position.y > 0 && plane.position.y < 280) {
				plane.position.y += 280;
			} else if(plane.position.y < 0 && plane.position.y > -280) {
				plane.position.y -= 280;
			}

			//tilt plane to look towards center of ship initially
			plane.lookAt(new THREE.Vector3(0,0,0));

			plane.position.z = (Math.random() * _s.warpLength) - (_s.warpLength / 2);

			//will ensure 
			plane.updateMatrix();

			mergedWarpGeometry.merge(plane.geometry, plane.matrix);
		}

		//duplicate warp field in the front and back of the "middle" field.
		//When camera hits start of foward duplicate field,
		//knock field back for a "seamless" warp cycle animation
		//(that also doesn't kill frame rate, merged beats individual beams)
		var mergedWarpCopyFront = new THREE.Mesh(mergedWarpGeometry.clone());
		var mergedWarpCopyBack = new THREE.Mesh(mergedWarpGeometry.clone());
		mergedWarpCopyFront.position.z += _s.warpLength;
		mergedWarpCopyBack.position.z -= _s.warpLength;
		mergedWarpCopyFront.updateMatrix();
		mergedWarpCopyBack.updateMatrix();
		mergedWarpGeometry.merge(mergedWarpCopyFront.geometry, mergedWarpCopyFront.matrix);
		mergedWarpGeometry.merge(mergedWarpCopyBack.geometry, mergedWarpCopyBack.matrix);

		_s.warpField = new THREE.Mesh(mergedWarpGeometry, material);
		_s.obj.add(_s.warpField);

	}

	_s.toggleWarp = function() {
		var i;

		if(_s.warpActive == false) {
			_s.warpActive = true;
			_s.warpAlpha = 0.0;
			_s.warpField.visible = true;
			_s.warpField.material.opacity = 0.0;
		} else {
			_s.warpActive = false;
			_s.warpField.visible = false;
		}
	};

	_s.updateWarpEffect = function() {
		var i;
		var warpLength = 5000;

		if(_s.warpActive == true) {
			_s.warpField.material.opacity = _s.warpAlpha;
			_s.warpField.position.z -= _s.warpSpeed;
			if(_s.warpField.position.z <= -(warpLength / 2)) {
				_s.warpField.position.z = (warpLength / 2);
			}
		}
	};

	_s.init = function() {
		//var ambientLight = new THREE.AmbientLight(0xffffff);
        //_s.obj.add(ambientLight);

		_s.obj.add(_s.chassis);
		_s.setupWarpEffect();
	};

	_s.update = function() {
		_s.updateWarpEffect();
	};
}