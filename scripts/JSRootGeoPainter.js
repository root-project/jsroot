/// @file JSRootGeoPainter.js
/// JavaScript ROOT 3D geometry painter

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      // AMD. Register as an anonymous module.
      define( ['JSRootPainter', 'THREE_ALL'], factory );
   } else {

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'JSRootGeoPainter.js');

      if (typeof JSROOT.Painter != 'object')
         throw new Error('JSROOT.Painter is not defined', 'JSRootGeoPainter.js');

      if (typeof THREE == 'undefined')
         throw new Error('THREE is not defined', 'JSRootGeoPainter.js');

      factory(JSROOT);
   }
} (function(JSROOT) {

   /**
    * @class JSROOT.TGeoPainter Holder of different functions and classes for drawing geometries
    */

   // ======= Geometry painter================================================

   var renderer =  null;

   JSROOT.TGeoPainter = function( geometry ) {
      JSROOT.TObjectPainter.call( this, geometry );
      this._debug = false;
      this._full = false;
      this._bound = false;
      this._grid = false;
      //this._transformControl = null;
      //this._translationSnap = 100;
      this._geometry = geometry;
      this._scene = null;
      this._renderer = null;
      var _opt = JSROOT.GetUrlOption('_grid');
      if (_opt !== null && _opt == "true") this._grid = true;
      var _opt = JSROOT.GetUrlOption('_debug');
      if (_opt !== null && _opt == "true") { this._debug = true; this._grid = true; }
      if (_opt !== null && _opt == "bound") { this._debug = true; this._grid = true; this._bound = true; }
      if (_opt !== null && _opt == "full") { this._debug = true; this._grid = true; this._full = true; this._bound = true; }
   }

   JSROOT.TGeoPainter.prototype = Object.create( JSROOT.TObjectPainter.prototype );

   JSROOT.TGeoPainter.prototype.GetObject = function() {
      return this._geometry;
   }

   JSROOT.TGeoPainter.prototype.addControls = function(renderer, scene, camera) {

      if (typeof renderer.domElement.trackballControls !== 'undefined' &&
          renderer.domElement.trackballControls !== null) return;

      // add 3D mouse interactive functions
      renderer.domElement.clock = new THREE.Clock();
      renderer.domElement.trackballControls = new THREE.TrackballControls(camera, renderer.domElement);
      renderer.domElement.trackballControls.rotateSpeed = 5.0;
      renderer.domElement.trackballControls.zoomSpeed = 0.8;
      renderer.domElement.trackballControls.panSpeed = 0.2;
      renderer.domElement.trackballControls.noZoom = false;
      renderer.domElement.trackballControls.noPan = false;
      renderer.domElement.trackballControls.staticMoving = false;
      renderer.domElement.trackballControls.dynamicDampingFactor = 0.25;
      renderer.domElement.trackballControls.target.set(0,0,0);
      renderer.domElement.transformControl = null;

      renderer.domElement.render = function() {
         var delta = renderer.domElement.clock.getDelta();
         if ( renderer.domElement.transformControl !== null )
            renderer.domElement.transformControl.update();
         renderer.domElement.trackballControls.update(delta);
         renderer.render(scene, camera);
      }

      if ( this._debug || this._grid ) {
         renderer.domElement.transformControl = new THREE.TransformControls( camera, renderer.domElement );
         renderer.domElement.transformControl.addEventListener( 'change', renderer.domElement.render );
         scene.add( renderer.domElement.transformControl );
         //renderer.domElement.transformControl.setSize( 1.1 );

         window.addEventListener( 'keydown', function ( event ) {
            switch ( event.keyCode ) {
               case 81: // Q
                  renderer.domElement.transformControl.setSpace( renderer.domElement.transformControl.space === "local" ? "world" : "local" );
                  break;
               case 17: // Ctrl
                  renderer.domElement.transformControl.setTranslationSnap( renderer.domElement._translationSnap );
                  renderer.domElement.transformControl.setRotationSnap( THREE.Math.degToRad( 15 ) );
                  break;
               case 84: // T (Translate)
                  renderer.domElement.transformControl.setMode( "translate" );
                  break;
               case 82: // R (Rotate)
                  renderer.domElement.transformControl.setMode( "rotate" );
                  break;
               case 83: // S (Scale)
                  renderer.domElement.transformControl.setMode( "scale" );
                  break;
               case 187:
               case 107: // +, =, num+
                  renderer.domElement.transformControl.setSize( renderer.domElement.transformControl.size + 0.1 );
                  break;
               case 189:
               case 109: // -, _, num-
                  renderer.domElement.transformControl.setSize( Math.max( renderer.domElement.transformControl.size - 0.1, 0.1 ) );
                  break;
            }
         });
         window.addEventListener( 'keyup', function ( event ) {
            switch ( event.keyCode ) {
               case 17: // Ctrl
                  renderer.domElement.transformControl.setTranslationSnap( null );
                  renderer.domElement.transformControl.setRotationSnap( null );
                  break;
            }
         });

      }
      renderer.domElement._timeoutFunc = null;
      renderer.domElement._animationId = null;
      var mouseover = true;
      function animate() {
         if ( mouseover === true ) {
            renderer.domElement._timeoutFunc = setTimeout(function() {
               renderer.domElement._animationId = requestAnimationFrame(animate, renderer.domElement);
            }, 1000 / 30);
         }
         renderer.domElement.render();
      }
      /*
      $(renderer.domElement).on('mouseover', function(e) {
         mouseover = true;
         animate();
      }).on('mouseout', function(){
         mouseover = false;
      });
      */
      animate();
   }

   JSROOT.TGeoPainter.prototype.createCube = function( shape, material, volume ) {
      var geometry = new THREE.BoxGeometry( shape['fDX'], shape['fDY'], shape['fDZ'] );
      return new THREE.Mesh( geometry, material );
   }

   JSROOT.TGeoPainter.prototype.createPolygon = function( shape, material, rotation_matrix ) {
      var radiusSegments = 60;
      if ( shape['_typename'] == "TGeoPgon" )
         radiusSegments = shape['fNedges'];
      var outerRadius = [];
      var innerRadius = [];
      var tube = [], tubeMesh = [];
      var face = [], faceMesh = [];
      var end = [], endMesh = [];
      var thetaStart = 0
      var thetaLength = 360;
      thetaStart = shape['fPhi1'] + 90;
      thetaLength = shape['fDphi'];
      var draw_faces = (thetaLength < 360) ? true : false;
      if (rotation_matrix !== null && rotation_matrix[4] === -1 &&
          rotation_matrix[0] === 1 && rotation_matrix[8] === 1)
         thetaStart += 180;
      thetaStart *= (Math.PI / 180.0);
      thetaLength *= (Math.PI / 180.0);
      var geometry = new THREE.Geometry();

      for (var i=0; i<shape['fNz']; i++) {
         outerRadius[i] = shape['fRmax'][i]/2;
         innerRadius[i] = shape['fRmin'][i]/2;
         if (innerRadius[i] <= 0) innerRadius[i] = 0.0000001;
      }
      for (var n=0; n<shape['fNz']; n++) {
         var seg = n*2;
         var DZ = (shape['fZ'][n+1]-shape['fZ'][n])/2;
         tube[seg] = new THREE.CylinderGeometry(outerRadius[n+1], outerRadius[n],
                  DZ, radiusSegments, 1, true, thetaStart, thetaLength);
         tube[seg].applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
         tubeMesh[seg] = new THREE.Mesh( tube[seg], material );
         tubeMesh[seg].translateZ( 0.5 * (shape['fZ'][n] + DZ) );

         tube[seg+1] = new THREE.CylinderGeometry(innerRadius[n+1], innerRadius[n],
                  DZ, radiusSegments, 1, true, thetaStart, thetaLength);
         tube[seg+1].applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
         tubeMesh[seg+1] = new THREE.Mesh( tube[seg+1], material );
         tubeMesh[seg+1].translateZ( 0.5 * (shape['fZ'][n] + DZ) );

         if ( n >= (shape['fNz']-2) ) {
            end[seg] = new THREE.Geometry();
            for (i = 0; i < radiusSegments; i++){
               var j = i;
               var k = i*6;
               end[seg].vertices.push(tube[seg].vertices[j+0]/*.clone()*/);
               end[seg].vertices.push(tube[seg].vertices[j+1]/*.clone()*/);
               end[seg].vertices.push(tube[seg+1].vertices[j+0]/*.clone()*/);
               end[seg].faces.push( new THREE.Face3( k+0, k+1, k+2 ) );
               end[seg].vertices.push(tube[seg+1].vertices[j+0]/*.clone()*/);
               end[seg].vertices.push(tube[seg+1].vertices[j+1]/*.clone()*/);
               end[seg].vertices.push(tube[seg].vertices[j+1]/*.clone()*/);
               end[seg].faces.push( new THREE.Face3( k+3, k+4, k+5 ) );
            };
            end[seg].mergeVertices();
            end[seg].computeFaceNormals();
            endMesh[seg] = new THREE.Mesh( end[seg], material );
            endMesh[seg].translateZ( 0.5 * (shape['fZ'][n] + DZ) );
         }

         if ( draw_faces ) {
            face[seg] = new THREE.Geometry();
            face[seg].vertices.push(tube[seg].vertices[0]/*.clone()*/);
            face[seg].vertices.push(tube[seg].vertices[tube[seg].vertices.length/2]/*.clone()*/);
            face[seg].vertices.push(tube[seg+1].vertices[tube[seg].vertices.length/2]/*.clone()*/);
            face[seg].faces.push( new THREE.Face3( 0, 1, 2 ) );
            face[seg].vertices.push(tube[seg+1].vertices[0]/*.clone()*/);
            face[seg].vertices.push(tube[seg+1].vertices[tube[seg].vertices.length/2]/*.clone()*/);
            face[seg].vertices.push(tube[seg].vertices[0]/*.clone()*/);
            face[seg].faces.push( new THREE.Face3( 3, 4, 5 ) );
            face[seg].mergeVertices();
            face[seg].computeFaceNormals();
            faceMesh[seg] = new THREE.Mesh( face[seg], material );
            faceMesh[seg].translateZ( 0.5 * (shape['fZ'][n] + DZ) );

            face[seg+1] = new THREE.Geometry();
            face[seg+1].vertices.push(tube[seg].vertices[radiusSegments]/*.clone()*/);
            face[seg+1].vertices.push(tube[seg].vertices[tube[seg].vertices.length-1]/*.clone()*/);
            face[seg+1].vertices.push(tube[seg+1].vertices[tube[seg].vertices.length-1]/*.clone()*/);
            face[seg+1].faces.push( new THREE.Face3( 0, 1, 2 ) );
            face[seg+1].vertices.push(tube[seg+1].vertices[radiusSegments]/*.clone()*/);
            face[seg+1].vertices.push(tube[seg+1].vertices[tube[seg].vertices.length-1]/*.clone()*/);
            face[seg+1].vertices.push(tube[seg].vertices[radiusSegments]/*.clone()*/);
            face[seg+1].faces.push( new THREE.Face3( 3, 4, 5 ) );
            face[seg+1].mergeVertices();
            face[seg+1].computeFaceNormals();
            faceMesh[seg+1] = new THREE.Mesh( face[seg+1], material );
            faceMesh[seg+1].translateZ( 0.5 * (shape['fZ'][n] + DZ) );
         }
         if ( n == 0 ) {
            end[seg+1] = new THREE.Geometry();
            for (i = 0; i < radiusSegments; i++) {
               var j = i;
               var k = i*6;
               end[seg+1].vertices.push(tube[seg].vertices[tube[seg].vertices.length-2-j+0]/*.clone()*/);
               end[seg+1].vertices.push(tube[seg].vertices[tube[seg].vertices.length-2-j+1]/*.clone()*/);
               end[seg+1].vertices.push(tube[seg+1].vertices[tube[seg].vertices.length-2-j+0]/*.clone()*/);
               end[seg+1].faces.push( new THREE.Face3( k+0, k+1, k+2 ) );
               end[seg+1].vertices.push(tube[seg+1].vertices[tube[seg].vertices.length-2-j+0]/*.clone()*/);
               end[seg+1].vertices.push(tube[seg+1].vertices[tube[seg].vertices.length-2-j+1]/*.clone()*/);
               end[seg+1].vertices.push(tube[seg].vertices[tube[seg].vertices.length-2-j+1]/*.clone()*/);
               end[seg+1].faces.push( new THREE.Face3( k+3, k+4, k+5 ) );
            }
            end[seg+1].mergeVertices();
            end[seg+1].computeFaceNormals();
            endMesh[seg+1] = new THREE.Mesh( end[seg+1], material );
            endMesh[seg+1].translateZ( 0.5 * (shape['fZ'][n] + DZ) );
         }

         tubeMesh[seg].updateMatrix();
         geometry.merge(tubeMesh[seg].geometry, tubeMesh[seg].matrix);
         tubeMesh[seg+1].updateMatrix();
         geometry.merge(tubeMesh[seg+1].geometry, tubeMesh[seg+1].matrix);
         if ( draw_faces ) {
            faceMesh[seg].updateMatrix();
            geometry.merge(faceMesh[seg].geometry, faceMesh[seg].matrix);
            faceMesh[seg+1].updateMatrix();
            geometry.merge(faceMesh[seg+1].geometry, faceMesh[seg+1].matrix);
         }
         if ( n >= (shape['fNz']-2) ) {
            endMesh[seg].updateMatrix();
            geometry.merge(endMesh[seg].geometry, endMesh[seg].matrix);
         }
         if ( n == 0 ) {
            endMesh[seg+1].updateMatrix();
            geometry.merge(endMesh[seg+1].geometry, endMesh[seg+1].matrix);
         }
      }
      //geometry.computeFaceNormals();
      return new THREE.Mesh( geometry, material );
   }

   JSROOT.TGeoPainter.prototype.createSphere = function( shape, material ) {
      var widthSegments = 32;
      var heightSegments = 32;
      var outerRadius = shape['fRmax'];
      var innerRadius = shape['fRmin'];
      var phiStart = shape['fPhi1'] + 180;
      var phiLength = shape['fPhi2'] - shape['fPhi1'];
      var thetaStart = shape['fTheta1'];
      var thetaLength = shape['fTheta2'] - shape['fTheta1'];
      thetaStart *= (Math.PI / 180.0);
      thetaLength *= (Math.PI / 180.0);
      phiStart *= (Math.PI / 180.0);
      phiLength *= (Math.PI / 180.0);
      var geometry = new THREE.Geometry();
      if (innerRadius <= 0) innerRadius = 0.0000001;

      var outerSphere = new THREE.SphereGeometry( outerRadius/2, widthSegments,
            heightSegments, phiStart, phiLength, thetaStart, thetaLength );
      outerSphere.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
      var outerSphereMesh = new THREE.Mesh( outerSphere, material );

      var innerSphere = new THREE.SphereGeometry( innerRadius/2, widthSegments,
            heightSegments, phiStart, phiLength, thetaStart, thetaLength );
      innerSphere.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
      var innerSphereMesh = new THREE.Mesh( innerSphere, material );

      var first = new THREE.Geometry();
      for (i = 0; i < widthSegments; i++){
         var j = i;
         var k = i*6;
         first.vertices.push(outerSphere.vertices[j+0]/*.clone()*/);
         first.vertices.push(outerSphere.vertices[j+1]/*.clone()*/);
         first.vertices.push(innerSphere.vertices[j+0]/*.clone()*/);
         first.faces.push( new THREE.Face3( k+0, k+1, k+2 ) );
         first.vertices.push(innerSphere.vertices[j+0]/*.clone()*/);
         first.vertices.push(innerSphere.vertices[j+1]/*.clone()*/);
         first.vertices.push(outerSphere.vertices[j+1]/*.clone()*/);
         first.faces.push( new THREE.Face3( k+3, k+4, k+5 ) );
      };
      first.mergeVertices();
      first.computeFaceNormals();
      var firstMesh = new THREE.Mesh( first, material );

      var second = new THREE.Geometry();
      for (i = 0; i < widthSegments; i++) {
         var j = i;
         var k = i*6;
         second.vertices.push(outerSphere.vertices[outerSphere.vertices.length-2-j+0]/*.clone()*/);
         second.vertices.push(outerSphere.vertices[outerSphere.vertices.length-2-j+1]/*.clone()*/);
         second.vertices.push(innerSphere.vertices[outerSphere.vertices.length-2-j+0]/*.clone()*/);
         second.faces.push( new THREE.Face3( k+0, k+1, k+2 ) );
         second.vertices.push(innerSphere.vertices[outerSphere.vertices.length-2-j+0]/*.clone()*/);
         second.vertices.push(innerSphere.vertices[outerSphere.vertices.length-2-j+1]/*.clone()*/);
         second.vertices.push(outerSphere.vertices[outerSphere.vertices.length-2-j+1]/*.clone()*/);
         second.faces.push( new THREE.Face3( k+3, k+4, k+5 ) );
      };
      second.mergeVertices();
      second.computeFaceNormals();
      var secondMesh = new THREE.Mesh( second, material );

      var face1 = new THREE.Geometry();
      for (i = 0; i < widthSegments; i++){
         var j = widthSegments*i;
         var k = i*6;
         face1.vertices.push(outerSphere.vertices[j+i]/*.clone()*/);
         face1.vertices.push(outerSphere.vertices[j+widthSegments+i+1]/*.clone()*/);
         face1.vertices.push(innerSphere.vertices[j+i]/*.clone()*/);
         face1.faces.push( new THREE.Face3( k+0, k+1, k+2 ) );
         face1.vertices.push(innerSphere.vertices[j+i]/*.clone()*/);
         face1.vertices.push(outerSphere.vertices[j+widthSegments+i+1]/*.clone()*/);
         face1.vertices.push(innerSphere.vertices[j+widthSegments+i+1]/*.clone()*/);
         face1.faces.push( new THREE.Face3( k+3, k+4, k+5 ) );
      }
      face1.mergeVertices();
      face1.computeFaceNormals();
      var face1Mesh = new THREE.Mesh( face1, material );

      var face2 = new THREE.Geometry();
      for (i = 0; i < widthSegments; i++){
         var j = widthSegments*(i+1);
         var k = i*6;
         face2.vertices.push(outerSphere.vertices[j+i]/*.clone()*/);
         face2.vertices.push(outerSphere.vertices[j+widthSegments+i+1]/*.clone()*/);
         face2.vertices.push(innerSphere.vertices[j+i]/*.clone()*/);
         face2.faces.push( new THREE.Face3( k+0, k+1, k+2 ) );
         face2.vertices.push(innerSphere.vertices[j+i]/*.clone()*/);
         face2.vertices.push(outerSphere.vertices[j+widthSegments+i+1]/*.clone()*/);
         face2.vertices.push(innerSphere.vertices[j+widthSegments+i+1]/*.clone()*/);
         face2.faces.push( new THREE.Face3( k+3, k+4, k+5 ) );
      }
      face2.mergeVertices();
      face2.computeFaceNormals();
      var face2Mesh = new THREE.Mesh( face2, material );

      outerSphereMesh.updateMatrix();
      geometry.merge(outerSphereMesh.geometry, outerSphereMesh.matrix);
      innerSphereMesh.updateMatrix();
      geometry.merge(innerSphereMesh.geometry, innerSphereMesh.matrix);
      firstMesh.updateMatrix();
      geometry.merge(firstMesh.geometry, firstMesh.matrix);
      secondMesh.updateMatrix();
      geometry.merge(secondMesh.geometry, secondMesh.matrix);
      face1Mesh.updateMatrix();
      geometry.merge(face1Mesh.geometry, face1Mesh.matrix);
      face2Mesh.updateMatrix();
      geometry.merge(face2Mesh.geometry, face2Mesh.matrix);
      //geometry.computeFaceNormals();

      return new THREE.Mesh( geometry, material );
   }

   JSROOT.TGeoPainter.prototype.createTorus = function( shape, material ) {
      var radius = shape['fR'];
      var innerTube = shape['fRmin'];
      var outerTube = shape['fRmax'];
      var radialSegments = 30;
      var tubularSegments = 60;
      var arc = shape['fDphi'] - shape['fPhi1'];
      var rotation = shape['fPhi1'];
      rotation *= (Math.PI / 180.0);
      arc *= (Math.PI / 180.0);

      var geometry = new THREE.Geometry();

      var outerTorus = new THREE.TorusGeometry( radius/2, outerTube/2, radialSegments, tubularSegments, arc );
      outerTorus.applyMatrix( new THREE.Matrix4().makeRotationZ( rotation ) );
      var outerTorusMesh = new THREE.Mesh( outerTorus, material );

      var innerTorus = new THREE.TorusGeometry( radius/2, innerTube/2, radialSegments, tubularSegments, arc );
      innerTorus.applyMatrix( new THREE.Matrix4().makeRotationZ( rotation ) );
      var innerTorusMesh = new THREE.Mesh( innerTorus, material );

      var first = new THREE.Geometry();
      for (i = 0; i < radialSegments; i++) {
         var j = i*(tubularSegments+1);
         var k = i*6;
         var l = (i+1)*(tubularSegments+1);
         first.vertices.push(outerTorus.vertices[j]/*.clone()*/);
         first.vertices.push(outerTorus.vertices[l]/*.clone()*/);
         first.vertices.push(innerTorus.vertices[j]/*.clone()*/);
         first.faces.push( new THREE.Face3( k+0, k+1, k+2 ) );
         first.vertices.push(innerTorus.vertices[j]/*.clone()*/);
         first.vertices.push(innerTorus.vertices[l]/*.clone()*/);
         first.vertices.push(outerTorus.vertices[l]/*.clone()*/);
         first.faces.push( new THREE.Face3( k+3, k+4, k+5 ) );
      }
      first.mergeVertices();
      first.computeFaceNormals();
      var firstMesh = new THREE.Mesh( first, material );

      var second = new THREE.Geometry();
      for (i = 0; i < radialSegments; i++) {
         var j = (i+1)*tubularSegments;
         var k = i*6;
         var l = (i+2)*tubularSegments;
         second.vertices.push(outerTorus.vertices[j+i]/*.clone()*/);
         second.vertices.push(outerTorus.vertices[l+i+1]/*.clone()*/);
         second.vertices.push(innerTorus.vertices[j+i]/*.clone()*/);
         second.faces.push( new THREE.Face3( k+0, k+1, k+2 ) );
         second.vertices.push(innerTorus.vertices[j+i]/*.clone()*/);
         second.vertices.push(innerTorus.vertices[l+i+1]/*.clone()*/);
         second.vertices.push(outerTorus.vertices[l+i+1]/*.clone()*/);
         second.faces.push( new THREE.Face3( k+3, k+4, k+5 ) );
      }

      second.mergeVertices();
      second.computeFaceNormals();
      var secondMesh = new THREE.Mesh( second, material );

      outerTorusMesh.updateMatrix();
      geometry.merge(outerTorusMesh.geometry, outerTorusMesh.matrix);
      innerTorusMesh.updateMatrix();
      geometry.merge(innerTorusMesh.geometry, innerTorusMesh.matrix);
      firstMesh.updateMatrix();
      geometry.merge(firstMesh.geometry, firstMesh.matrix);
      secondMesh.updateMatrix();
      geometry.merge(secondMesh.geometry, secondMesh.matrix);
      //geometry.computeFaceNormals();

      return new THREE.Mesh( geometry, material );
   }

   JSROOT.TGeoPainter.prototype.createTrapezoid = function( shape, material ) {
      if (shape['_typename'] == "TGeoArb8" || shape['_typename'] == "TGeoTrap") {
         // Arb8
         var verticesOfShape = [
            shape['fXY'][0][0], shape['fXY'][0][1], -1*shape['fDZ'],
            shape['fXY'][1][0], shape['fXY'][1][1], -1*shape['fDZ'],
            shape['fXY'][2][0], shape['fXY'][2][1], -1*shape['fDZ'],
            shape['fXY'][3][0], shape['fXY'][3][1], -1*shape['fDZ'],
            shape['fXY'][4][0], shape['fXY'][4][1],    shape['fDZ'],
            shape['fXY'][5][0], shape['fXY'][5][1],    shape['fDZ'],
            shape['fXY'][6][0], shape['fXY'][6][1],    shape['fDZ'],
            shape['fXY'][7][0], shape['fXY'][7][1],    shape['fDZ'],
         ];
      }
      else if (shape['_typename'] == "TGeoTrd1") {
         var verticesOfShape = [
            -shape['fDx1'],  shape['fDY'], -shape['fDZ'],
             shape['fDx1'],  shape['fDY'], -shape['fDZ'],
             shape['fDx1'], -shape['fDY'], -shape['fDZ'],
            -shape['fDx1'], -shape['fDY'], -shape['fDZ'],
            -shape['fDx2'],  shape['fDY'],  shape['fDZ'],
             shape['fDx2'],  shape['fDY'],  shape['fDZ'],
             shape['fDx2'], -shape['fDY'],  shape['fDZ'],
            -shape['fDx2'], -shape['fDY'],  shape['fDZ']
         ];
      }
      else if (shape['_typename'] == "TGeoTrd2") {
         var verticesOfShape = [
            -shape['fDx1'],  shape['fDy1'], -shape['fDZ'],
             shape['fDx1'],  shape['fDy1'], -shape['fDZ'],
             shape['fDx1'], -shape['fDy1'], -shape['fDZ'],
            -shape['fDx1'], -shape['fDy1'], -shape['fDZ'],
            -shape['fDx2'],  shape['fDy2'],  shape['fDZ'],
             shape['fDx2'],  shape['fDy2'],  shape['fDZ'],
             shape['fDx2'], -shape['fDy2'],  shape['fDZ'],
            -shape['fDx2'], -shape['fDy2'],  shape['fDZ']
         ];
      }
      var indicesOfFaces = [
          4,5,6,   4,7,6,   0,3,7,   7,4,0,
          4,5,1,   1,0,4,   6,2,1,   1,5,6,
          7,3,2,   2,6,7,   1,2,3,   3,0,1,
      ];

      var geometry = new THREE.Geometry();
      for (var i = 0; i < 24; i += 3) {
         geometry.vertices.push( new THREE.Vector3( 0.5*verticesOfShape[i], 0.5*verticesOfShape[i+1], 0.5*verticesOfShape[i+2] ) );
      }
      for (var i = 0; i < 36; i += 3) {
         geometry.faces.push( new THREE.Face3( indicesOfFaces[i], indicesOfFaces[i+1], indicesOfFaces[i+2] ) );
      }
      geometry.computeFaceNormals();
      return new THREE.Mesh( geometry, material );
   }

   JSROOT.TGeoPainter.prototype.createTube = function( shape, material, rotation_matrix ) {
      var radiusSegments = 60;
      var outerRadius1, innerRadius1, outerRadius2, innerRadius2;
      if ((shape['_typename'] == "TGeoCone") || (shape['_typename'] == "TGeoConeSeg")) {
         outerRadius1 = shape['fRmax2'];
         innerRadius1 = shape['fRmin2'];
         outerRadius2 = shape['fRmax1'];
         innerRadius2 = shape['fRmin1'];
      }
      else {
         outerRadius1 = outerRadius2 = shape['fRmax'];
         innerRadius1 = innerRadius2 = shape['fRmin'];
      }
      if (innerRadius1 <= 0) innerRadius1 = 0.0000001;
      if (innerRadius2 <= 0) innerRadius2 = 0.0000001;
      var thetaStart = 0
      var thetaLength = 360;
      if ((shape['_typename'] == "TGeoConeSeg") || (shape['_typename'] == "TGeoTubeSeg") ||
           (shape['_typename'] == "TGeoCtub")) {
         thetaStart = shape['fPhi1'] + 90;
         thetaLength = shape['fPhi2'] - shape['fPhi1'];
         if (rotation_matrix !== null && rotation_matrix[4] === -1 &&
             rotation_matrix[0] === 1 && rotation_matrix[8] === 1)
            thetaStart += 180;
      }
      thetaStart *= (Math.PI / 180.0);
      thetaLength *= (Math.PI / 180.0);
      var geometry = new THREE.Geometry();

      var outerTube = new THREE.CylinderGeometry(outerRadius1/2, outerRadius2/2,
               shape['fDZ'], radiusSegments, 1, true, thetaStart, thetaLength);
      outerTube.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
      outerTube.faceVertexUvs[0] = [];  // workaround to avoid warnings from three.js
      var outerTubeMesh = new THREE.Mesh( outerTube, material );

      var innerTube = new THREE.CylinderGeometry(innerRadius1/2, innerRadius2/2,
               shape['fDZ'], radiusSegments, 1, true, thetaStart, thetaLength);
      innerTube.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
      innerTube.faceVertexUvs[0] = [];  // workaround to avoid warnings from three.js
      var innerTubeMesh = new THREE.Mesh( innerTube, material );

      var first = new THREE.Geometry();
      for (i = 0; i < radiusSegments; i++){
         var j = i;
         var k = i*6;
         first.vertices.push(outerTube.vertices[j+0]/*.clone()*/);
         first.vertices.push(outerTube.vertices[j+1]/*.clone()*/);
         first.vertices.push(innerTube.vertices[j+0]/*.clone()*/);
         first.faces.push( new THREE.Face3( k+0, k+1, k+2 ) );
         first.vertices.push(innerTube.vertices[j+0]/*.clone()*/);
         first.vertices.push(innerTube.vertices[j+1]/*.clone()*/);
         first.vertices.push(outerTube.vertices[j+1]/*.clone()*/);
         first.faces.push( new THREE.Face3( k+3, k+4, k+5 ) );
      };
      first.mergeVertices();
      first.computeFaceNormals();
      var firstMesh = new THREE.Mesh( first, material );

      var face1Mesh, face2Mesh;

      if ((shape['_typename'] == "TGeoConeSeg") || (shape['_typename'] == "TGeoTubeSeg") ||
          (shape['_typename'] == "TGeoCtub")) {
         var face1 = new THREE.Geometry();
         face1.vertices.push(outerTube.vertices[0]/*.clone()*/);
         face1.vertices.push(outerTube.vertices[outerTube.vertices.length/2]/*.clone()*/);
         face1.vertices.push(innerTube.vertices[outerTube.vertices.length/2]/*.clone()*/);
         face1.faces.push( new THREE.Face3( 0, 1, 2 ) );
         face1.vertices.push(innerTube.vertices[0]/*.clone()*/);
         face1.vertices.push(innerTube.vertices[outerTube.vertices.length/2]/*.clone()*/);
         face1.vertices.push(outerTube.vertices[0]/*.clone()*/);
         face1.faces.push( new THREE.Face3( 3, 4, 5 ) );
         face1.mergeVertices();
         face1.computeFaceNormals();
         face1Mesh = new THREE.Mesh( face1, material );

         var face2 = new THREE.Geometry();
         face2.vertices.push(outerTube.vertices[radiusSegments]/*.clone()*/);
         face2.vertices.push(outerTube.vertices[outerTube.vertices.length-1]/*.clone()*/);
         face2.vertices.push(innerTube.vertices[outerTube.vertices.length-1]/*.clone()*/);
         face2.faces.push( new THREE.Face3( 0, 1, 2 ) );
         face2.vertices.push(innerTube.vertices[radiusSegments]/*.clone()*/);
         face2.vertices.push(innerTube.vertices[outerTube.vertices.length-1]/*.clone()*/);
         face2.vertices.push(outerTube.vertices[radiusSegments]/*.clone()*/);
         face2.faces.push( new THREE.Face3( 3, 4, 5 ) );
         face2.mergeVertices();
         face2.computeFaceNormals();
         face2Mesh = new THREE.Mesh( face2, material );
      }

      var second = new THREE.Geometry();
      for (i = 0; i < radiusSegments; i++) {
         var j = i;
         var k = i*6;
         second.vertices.push(outerTube.vertices[outerTube.vertices.length-2-j+0]/*.clone()*/);
         second.vertices.push(outerTube.vertices[outerTube.vertices.length-2-j+1]/*.clone()*/);
         second.vertices.push(innerTube.vertices[outerTube.vertices.length-2-j+0]/*.clone()*/);
         second.faces.push( new THREE.Face3( k+0, k+1, k+2 ) );
         second.vertices.push(innerTube.vertices[outerTube.vertices.length-2-j+0]/*.clone()*/);
         second.vertices.push(innerTube.vertices[outerTube.vertices.length-2-j+1]/*.clone()*/);
         second.vertices.push(outerTube.vertices[outerTube.vertices.length-2-j+1]/*.clone()*/);
         second.faces.push( new THREE.Face3( k+3, k+4, k+5 ) );

      };
      second.mergeVertices();
      second.computeFaceNormals();
      var secondMesh = new THREE.Mesh( second, material );

      outerTubeMesh.updateMatrix();
      geometry.merge(outerTubeMesh.geometry, outerTubeMesh.matrix);
      innerTubeMesh.updateMatrix();
      geometry.merge(innerTubeMesh.geometry, innerTubeMesh.matrix);

      if (face1Mesh && face2Mesh) {
         face1Mesh.updateMatrix();
         geometry.merge(face1Mesh.geometry, face1Mesh.matrix);
         face2Mesh.updateMatrix();
         geometry.merge(face2Mesh.geometry, face2Mesh.matrix);
      }
      firstMesh.updateMatrix();
      geometry.merge(firstMesh.geometry, firstMesh.matrix);
      secondMesh.updateMatrix();
      geometry.merge(secondMesh.geometry, secondMesh.matrix);
      //geometry.computeFaceNormals();

      return new THREE.Mesh( geometry, material );
   }

   JSROOT.TGeoPainter.prototype.createMesh = function( shape, material, rotation_matrix ) {
      var mesh = null;
      if (shape['_typename'] == "TGeoBBox") {
         // Cube
         mesh = this.createCube( shape, material );
      }
      else if ((shape['_typename'] == "TGeoArb8") || (shape['_typename'] == "TGeoTrd1") ||
          (shape['_typename'] == "TGeoTrd2") || (shape['_typename'] == "TGeoTrap")) {
         mesh = this.createTrapezoid( shape, material );
      }
      else if ((shape['_typename'] == "TGeoSphere")) {
         mesh = this.createSphere( shape, material );
      }
      else if ((shape['_typename'] == "TGeoCone") || (shape['_typename'] == "TGeoConeSeg") ||
          (shape['_typename'] == "TGeoTube") || (shape['_typename'] == "TGeoTubeSeg")) {
         mesh = this.createTube( shape, material, rotation_matrix );
      }
      else if (shape['_typename'] == "TGeoTorus") {
         mesh = this.createTorus( shape, material );
      }
      else if ( shape['_typename'] == "TGeoPcon" || shape['_typename'] == "TGeoPgon" ) {
         mesh = this.createPolygon( shape, material, rotation_matrix );
      }
      return mesh;
   }

   JSROOT.TGeoPainter.prototype.drawNode = function(scene, toplevel, node) {
      var container = toplevel;
      var volume = node['fVolume'];
      if (('fGeoAtt' in volume) && !('TestAttBit' in volume)) {
         volume['TestAttBit'] = function (f) {
            return ((volume['fGeoAtt'] & f) != 0);
         };
      }
      var shape = volume['fShape'];
      var translation_matrix = [0, 0, 0];
      var rotation_matrix = null;//[1, 0, 0, 0, 1, 0, 0, 0, 1];
      if (typeof node['fMatrix'] != 'undefined' && node['fMatrix'] != null) {
         if (node['fMatrix']['_typename'] == 'TGeoTranslation') {
            translation_matrix = node['fMatrix']['fTranslation'];
         }
         else if (node['fMatrix']['_typename'] == 'TGeoRotation') {
            rotation_matrix = node['fMatrix']['fRotationMatrix'];
         }
         else if (node['fMatrix']['_typename'] == 'TGeoCombiTrans') {
            if (typeof node['fMatrix']['fTranslation'] != 'undefined' &&
                node['fMatrix']['fTranslation'] != null)
               translation_matrix = node['fMatrix']['fTranslation'];
            if (typeof node['fMatrix']['fRotation'] != 'undefined' &&
                node['fMatrix']['fRotation'] != null)
               rotation_matrix = node['fMatrix']['fRotation']['fRotationMatrix'];
         }
      }
      if (node['_typename'] == "TGeoNodeOffset") {
         if (node['fFinder']['_typename'] == 'TGeoPatternX') {
         }
         if (node['fFinder']['_typename'] == 'TGeoPatternY') {
         }
         if (node['fFinder']['_typename'] == 'TGeoPatternZ') {
         }
         if (node['fFinder']['_typename'] == 'TGeoPatternParaX') {
         }
         if (node['fFinder']['_typename'] == 'TGeoPatternParaY') {
         }
         if (node['fFinder']['_typename'] == 'TGeoPatternParaZ') {
         }
         if (node['fFinder']['_typename'] == 'TGeoPatternTrapZ') {
         }
         if (node['fFinder']['_typename'] == 'TGeoPatternCylR') {
         }
         if (node['fFinder']['_typename'] == 'TGeoPatternSphR') {
         }
         if (node['fFinder']['_typename'] == 'TGeoPatternSphTheta') {
         }
         if (node['fFinder']['_typename'] == 'TGeoPatternSphPhi') {
         }
         if (node['fFinder']['_typename'] == 'TGeoPatternHoneycomb') {
         }
         if (node['fFinder']['_typename'] == 'TGeoPatternCylPhi') {
            if (typeof node['fFinder']['fSinCos'] === 'undefined') {
               node['fFinder']['fSinCos'] = [];
               for (var i = 0; i<node['fFinder']['fNdivisions']; i++) {
                  node['fFinder']['fSinCos'][2*i] = Math.sin((Math.PI / 180.0)*(node['fFinder']['fStart']+0.5*node['fFinder']['fStep']+i*node['fFinder']['fStep']));
                  node['fFinder']['fSinCos'][2*i+1] = Math.cos((Math.PI / 180.0)*(node['fFinder']['fStart']+0.5*node['fFinder']['fStep']+i*node['fFinder']['fStep']));
               }
            }
            if (rotation_matrix == null)
               rotation_matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
            rotation_matrix[0] = node['fFinder']['fSinCos'][(2*node['fIndex'])+1];
            rotation_matrix[1] = -node['fFinder']['fSinCos'][(2*node['fIndex'])];
            rotation_matrix[3] = node['fFinder']['fSinCos'][(2*node['fIndex'])];
            rotation_matrix[4] = node['fFinder']['fSinCos'][(2*node['fIndex'])+1];
         }
      }
      var mesh = null;
      var linecolor = JSROOT.Painter.root_colors[volume['fLineColor']];
      var fillcolor = JSROOT.Painter.root_colors[volume['fFillColor']];
      fillcolor = linecolor;
      var _transparent = true;
      var _helper = false;
      if (this._debug) _helper = true;
      var _opacity = 0.0;
      var _isdrawn = false;
      if (volume.TestAttBit(JSROOT.BIT(7))) {
         _transparent = false;
         _opacity = 1.0;
         _isdrawn = true;
      }
      if (typeof volume['fMedium'] != 'undefined' && volume['fMedium'] != null &&
          typeof volume['fMedium']['fMaterial'] != 'undefined' &&
          volume['fMedium']['fMaterial'] != null) {
         var fillstyle = volume['fMedium']['fMaterial']['fFillStyle'];
         var transparency = (fillstyle < 3000 || fillstyle > 3100) ? 0 : fillstyle - 3000;
         if (transparency > 0) {
            _transparent = true;
            _opacity = (100.0 - transparency) / 100.0;
         }
         if (typeof fillcolor == "undefined")
            fillcolor = JSROOT.Painter.root_colors[volume['fMedium']['fMaterial']['fFillColor']];
      }

      var material = new THREE.MeshLambertMaterial( { transparent: _transparent,
               opacity: _opacity, wireframe: false, color: fillcolor,
               side: THREE.DoubleSide, vertexColors: THREE.VertexColors,
               overdraw: false /*, shading : THREE.NoShading */ } );
      if ( !_isdrawn ) {
         //material.depthWrite = false;
         material.visible = false;
      }
      mesh = this.createMesh(shape, material, rotation_matrix);
      if (typeof mesh != 'undefined' && mesh != null) {
         mesh.position.x = 0.5 * translation_matrix[0];
         mesh.position.y = 0.5 * translation_matrix[1];
         mesh.position.z = 0.5 * translation_matrix[2];

         if (rotation_matrix !== null) {
            mesh.rotation.setFromRotationMatrix(
               new THREE.Matrix4().set( rotation_matrix[0], rotation_matrix[1], rotation_matrix[2],   0,
                                        rotation_matrix[3], rotation_matrix[4], rotation_matrix[5],   0,
                                        rotation_matrix[6], rotation_matrix[7], rotation_matrix[8],   0,
                                        0,                                   0,                  0,   1 ) );
         }
         if (_isdrawn && _helper) {
            var helper = new THREE.WireframeHelper(mesh);
            helper.material.color.set(JSROOT.Painter.root_colors[volume['fLineColor']]);
            helper.material.linewidth = volume['fLineWidth'];
            scene.add(helper);
         }
         if (this._debug && this._bound) {
            if (_isdrawn || this._full) {
               var boxHelper = new THREE.BoxHelper( mesh );
               toplevel.add( boxHelper );
            }
         }
         mesh['name'] = node['fName'];
         // add the mesh to the scene
         toplevel.add(mesh);
         //if ( this._debug && renderer.domElement.transformControl !== null)
         //   renderer.domElement.transformControl.attach( mesh );
         container = mesh;
      }
      if (typeof volume['fNodes'] != 'undefined' && volume['fNodes'] != null) {
         var nodes = volume['fNodes']['arr'];
         for (var i in nodes)
            this.drawNode(scene, container, nodes[i]);
      }
   }

   JSROOT.TGeoPainter.prototype.computeBoundingBox = function( mesh ) {
      var bbox = null;
      for (var i = 0; i < mesh.children.length; ++i) {
         var node = mesh.children[i];
         if ( node instanceof THREE.Mesh ) {
            if ( node['material']['visible'] ) {
               bbox = new THREE.Box3().setFromObject( node );
               return bbox;
            } else {
               bbox = this.computeBoundingBox( node );
               if (bbox != null) return bbox;
            }
         }
      }
      return bbox;
   }

   JSROOT.TGeoPainter.prototype.drawGeometry = function() {

      var w = this.GetStyleValue(this.select_main(), 'width'),
          h = this.GetStyleValue(this.select_main(), 'height'),
          size = 100;

      if (h < 10) { h = parseInt(0.66*w); this.select_main().style('height', h +"px"); }

      var dom = this.select_main().node();

      // three.js 3D drawing
      this._scene = new THREE.Scene();
      this._scene.fog = new THREE.Fog(0xffffff, 500, 300000);

      var camera = new THREE.PerspectiveCamera(25, w / h, 1, 100000);
      var pointLight = new THREE.PointLight(0xefefef);
      camera.add( pointLight );
      pointLight.position.set( 10, 10, 10 );
      this._scene.add( camera );

      /**
       * @author alteredq / http://alteredqualia.com/
       * @author mr.doob / http://mrdoob.com/
       */
      var Detector = {
            canvas : !!window.CanvasRenderingContext2D,
            webgl : (function() {
               try {
                  return !!window.WebGLRenderingContext
                  && !!document.createElement('canvas')
                  .getContext('experimental-webgl');
               } catch (e) {
                  return false;
               }
            })(),
            workers : !!window.Worker,
            fileapi : window.File && window.FileReader
            && window.FileList && window.Blob
      };

      renderer = Detector.webgl ? new THREE.WebGLRenderer({ antialias : true }) :
                       new THREE.CanvasRenderer({antialias : true });
      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setClearColor(0xffffff, 1);
      renderer.setSize(w, h);
      this._renderer = renderer;

      dom.appendChild(renderer.domElement);

      this.addControls(renderer, this._scene, camera);

      var toplevel = new THREE.Object3D();
      //toplevel.rotation.x = 30 * Math.PI / 180;
      toplevel.rotation.y = 90 * Math.PI / 180;
      this._scene.add(toplevel);

      var shape = this._geometry['fShape'];
      var top = new THREE.BoxGeometry( shape['fDX'], shape['fDY'], shape['fDZ'] );
      var cube = new THREE.Mesh( top, new THREE.MeshBasicMaterial( {
               visible: false, transparent: true, opacity: 0.0 } ) );
      toplevel.add(cube);

      //this.drawVolume(this._scene, toplevel, this._geometry);
      if (typeof this._geometry['fNodes'] != 'undefined' && this._geometry['fNodes'] != null) {
         var nodes = this._geometry['fNodes']['arr'];
         for (var i in nodes)
            this.drawNode(this._scene, cube, nodes[i])
      }

      top.computeBoundingBox();
      var overall_size = 3 * Math.max( Math.max(Math.abs(top.boundingBox.max.x), Math.abs(top.boundingBox.max.y)),
                                       Math.abs(top.boundingBox.max.z));
/*
      var boundingBox = this.computeBoundingBox(cube);
      overall_size = 20 * Math.max( Math.max(Math.abs(boundingBox.max.x), Math.abs(boundingBox.max.y)),
                                   Math.abs(boundingBox.max.z));
*/
      if ( this._debug || this._grid ) {
         if ( this._full ) {
            var boxHelper = new THREE.BoxHelper( cube );
            this._scene.add( boxHelper );
         }
         this._scene.add( new THREE.AxisHelper( 2 * overall_size ) );
         this._scene.add( new THREE.GridHelper( Math.ceil( overall_size), Math.ceil( overall_size ) / 50 ) );
         renderer.domElement._translationSnap = Math.ceil( overall_size ) / 50;
         if ( renderer.domElement.transformControl !== null )
            renderer.domElement.transformControl.attach( toplevel );
      }
      camera.position.x = overall_size * Math.cos( 135.0 );
      camera.position.y = overall_size * Math.cos( 45.0 );
      camera.position.z = overall_size * Math.sin( 45.0 );
      renderer.render(this._scene, camera);

      dom.painter = this;
      dom.tabIndex = 0;
      dom.focus();
      dom.onkeypress = function(e) {
         if (!e) e = event;
         switch ( e.keyCode ) {
            case 87:  // W
            case 119: // w
               this.painter.toggleWireFrame(this.painter._scene);
               break;
         }
      };
      dom.onclick = function(e) {
         this.focus();
      };
      //dom.onmouseenter = function(e) {
      //   this.focus();
      //};
      //dom.onmouseleave = function(e) {
      //   this.blur();
      //};
      dom.onremove = function () {
         if ( this.painter._scene === null ) return;

         renderer.domElement.clock = null;
         if (renderer.domElement._timeoutFunc != null)
            clearTimeout( renderer.domElement._timeoutFunc );
         if (renderer.domElement._animationId != null)
            cancelAnimationFrame( renderer.domElement._animationId );

         this.painter.deleteChildren(this.painter._scene);
         renderer.initWebGLObjects(this.painter._scene);
         delete(this.painter._scene);
         this.painter._scene = null;
         if ( renderer.domElement.transformControl !== null )
            renderer.domElement.transformControl.dispose();
         renderer.domElement.transformControl = null;
         renderer.domElement.trackballControls = null;
         renderer.domElement.render = null;
         renderer = null;
      };

      return this.DrawingReady();
   }

   ownedByTransformControls = function(child) {
      var obj = child.parent;
      while (obj && !(obj instanceof THREE.TransformControls) ) {
         obj = obj.parent;
      }
      return (obj && (obj instanceof THREE.TransformControls));
   }

   JSROOT.TGeoPainter.prototype.toggleWireFrame = function(obj) {
      var f = function(obj2) {
         if ( obj2.hasOwnProperty("material") && !(obj2 instanceof THREE.GridHelper) ) {
            if (!ownedByTransformControls(obj2))
               obj2.material.wireframe = !obj2.material.wireframe;
         }
      }
      obj.traverse(f);
   }

   JSROOT.TGeoPainter.prototype.deleteChildren = function(obj) {
      if ((typeof obj['children'] != 'undefined') && (obj['children'] instanceof Array)) {
         for ( var i=obj.children.length-1; i>=0; i-- ) {
            var ob = obj.children[i];
            this.deleteChildren(ob);
            try {
               obj.remove(obj.children[i]);
            } catch(e) {}
            try {
               ob.geometry.dispose();
               ob.geometry = null;
            } catch(e) {}
            try {
               ob.material.dispose();
               ob.material = null;
            } catch(e) {}
            try {
               ob.texture.dispose();
               ob.texture = null;
            } catch(e) {}
            ob = null;
            obj.children[i] = null;
         }
         obj.children = null;
      }
      obj = null;
   }

   JSROOT.Painter.drawGeometry = function(divid, geometry, opt, painter) {

      // create painter and add it to canvas
      JSROOT.extend(painter, new JSROOT.TGeoPainter(geometry));

      painter.SetDivId(divid);
      painter.drawGeometry();
      return painter.DrawingReady();
   }

   return JSROOT.Painter;

}));

