/// @file JSRootGeoBase.js
/// JavaScript ROOT 3D geometry base routines


/// @file JSRootGeoPainter.js
/// JavaScript ROOT 3D geometry painter

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      // AMD. Register as an anonymous module.
      define( ['JSRootCore', 'THREE_ALL'], factory );
   } else {

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'JSRootGeoBase.js');

      if (typeof THREE == 'undefined')
         throw new Error('THREE is not defined', 'JSRootGeoBase.js');

      factory(JSROOT);
   }
} (function(JSROOT) {

   JSROOT.GEO = {};

   JSROOT.GEO.createCube = function( shape ) {

      return new THREE.BoxGeometry( shape['fDX'], shape['fDY'], shape['fDZ'] );
   }

   JSROOT.GEO.createPara = function( shape ) {

      var txy = shape.fTxy, txz = shape.fTxz, tyz = shape.fTyz;

      var verticesOfShape = [
          -shape.fZ*txz-txy*shape.fY-shape.fX, -shape.fY-shape.fZ*tyz,  -shape.fZ,
          -shape.fZ*txz+txy*shape.fY-shape.fX, +shape.fY-shape.fZ*tyz,  -shape.fZ,
          -shape.fZ*txz+txy*shape.fY+shape.fX, +shape.fY-shape.fZ*tyz,  -shape.fZ,
          -shape.fZ*txz-txy*shape.fY+shape.fX, -shape.fY-shape.fZ*tyz,  -shape.fZ,
          +shape.fZ*txz-txy*shape.fY-shape.fX, -shape.fY+shape.fZ*tyz,  +shape.fZ,
          +shape.fZ*txz+txy*shape.fY-shape.fX, +shape.fY+shape.fZ*tyz,  +shape.fZ,
          +shape.fZ*txz+txy*shape.fY+shape.fX, +shape.fY+shape.fZ*tyz,  +shape.fZ,
          +shape.fZ*txz-txy*shape.fY+shape.fX, -shape.fY+shape.fZ*tyz,  +shape.fZ ];

      var indicesOfFaces = [ 4,5,6,   4,7,6,   0,3,7,   7,4,0,
                             4,5,1,   1,0,4,   6,2,1,   1,5,6,
                             7,3,2,   2,6,7,   1,2,3,   3,0,1 ];

      var geom = new THREE.Geometry();

      for (var i = 0; i < verticesOfShape.length; i += 3)
         geom.vertices.push( new THREE.Vector3( 0.5*verticesOfShape[i], 0.5*verticesOfShape[i+1], 0.5*verticesOfShape[i+2] ) );

      for (var i = 0; i < indicesOfFaces.length; i += 3)
         geom.faces.push( new THREE.Face3( indicesOfFaces[i], indicesOfFaces[i+1], indicesOfFaces[i+2] ) );

      geom.computeFaceNormals();

      return geom;
   }

   JSROOT.GEO.createTrapezoid = function( shape ) {

      var verticesOfShape;

      if (shape['_typename'] == "TGeoArb8" || shape['_typename'] == "TGeoTrap") {
         // Arb8
         verticesOfShape = [
            shape['fXY'][0][0], shape['fXY'][0][1], -1*shape['fDZ'],
            shape['fXY'][1][0], shape['fXY'][1][1], -1*shape['fDZ'],
            shape['fXY'][2][0], shape['fXY'][2][1], -1*shape['fDZ'],
            shape['fXY'][3][0], shape['fXY'][3][1], -1*shape['fDZ'],
            shape['fXY'][4][0], shape['fXY'][4][1],    shape['fDZ'],
            shape['fXY'][5][0], shape['fXY'][5][1],    shape['fDZ'],
            shape['fXY'][6][0], shape['fXY'][6][1],    shape['fDZ'],
            shape['fXY'][7][0], shape['fXY'][7][1],    shape['fDZ']
         ];
      }
      else if (shape['_typename'] == "TGeoTrd1") {
         verticesOfShape = [
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
         verticesOfShape = [
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
          7,3,2,   2,6,7,   1,2,3,   3,0,1 ];

      var geometry = new THREE.Geometry();
      for (var i = 0; i < 24; i += 3) {
         geometry.vertices.push( new THREE.Vector3( 0.5*verticesOfShape[i], 0.5*verticesOfShape[i+1], 0.5*verticesOfShape[i+2] ) );
      }
      for (var i = 0; i < 36; i += 3) {
         geometry.faces.push( new THREE.Face3( indicesOfFaces[i], indicesOfFaces[i+1], indicesOfFaces[i+2] ) );
      }
      geometry.computeFaceNormals();
      return geometry;
   }

   JSROOT.GEO.createSphere = function( shape ) {

      var outerRadius = shape['fRmax'];
      var innerRadius = shape['fRmin'];
      var phiStart = shape['fPhi1'] + 180;
      var phiLength = shape['fPhi2'] - shape['fPhi1'];
      var thetaStart = shape['fTheta1'];
      var thetaLength = shape['fTheta2'] - shape['fTheta1'];

      var widthSegments = Math.floor(phiLength / 6);
      if (widthSegments < 8) widthSegments = 8;

      var heightSegments = Math.floor(thetaLength / 6);
      if (heightSegments < 8) heightSegments = 8;
      if (innerRadius <= 0) innerRadius = 0.0000001;

      var outerSphere = new THREE.SphereGeometry( outerRadius/2, widthSegments, heightSegments,
                                                 phiStart*Math.PI/180, phiLength*Math.PI/180, thetaStart*Math.PI/180, thetaLength*Math.PI/180);
      outerSphere.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );

      var innerSphere = new THREE.SphereGeometry( innerRadius/2, widthSegments, heightSegments,
                                                phiStart*Math.PI/180, phiLength*Math.PI/180, thetaStart*Math.PI/180, thetaLength*Math.PI/180);
      innerSphere.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );

      var geometry = new THREE.Geometry();

      // add inner sphere
      for (var n=0; n < innerSphere.vertices.length; ++n)
         geometry.vertices.push(innerSphere.vertices[n]);

      for (var n=0; n < innerSphere.faces.length; ++n)
         geometry.faces.push(innerSphere.faces[n]);

      var shift = geometry.vertices.length;

      // add outer sphere
      for (var n=0; n < outerSphere.vertices.length; ++n)
         geometry.vertices.push(outerSphere.vertices[n]);

      for (var n=0; n < outerSphere.faces.length; ++n) {
         var face = outerSphere.faces[n];
         face.a += shift; face.b += shift; face.c += shift;
         geometry.faces.push(face);
      }

      // add top cap
      for (var i = 0; i < widthSegments; ++i) {
         geometry.faces.push( new THREE.Face3( i+0, i+1, i+shift ) );
         geometry.faces.push( new THREE.Face3( i+1, i+shift+1, i+shift ) );
      }

      var dshift = outerSphere.vertices.length - widthSegments - 1;

      // add bottom cap
      for (var i = dshift; i < dshift + widthSegments; ++i) {
         geometry.faces.push( new THREE.Face3( i+0, i+1, i+shift ) );
         geometry.faces.push( new THREE.Face3( i+1, i+shift+1, i+shift ) );
      }

      if (phiLength !== 360) {
         // one cuted side
         for (var j=0;j<heightSegments;j++) {
            var i1 = j*(widthSegments+1);
            var i2 = (j+1)*(widthSegments+1);
            geometry.faces.push( new THREE.Face3( i1, i2, i1+shift ) );
            geometry.faces.push( new THREE.Face3( i2, i2+shift, i1+shift));
         }
         // another cuted side
         for (var j=0;j<heightSegments;j++) {
            var i1 = (j+1)*(widthSegments+1) - 1;
            var i2 = (j+2)*(widthSegments+1) - 1;
            geometry.faces.push( new THREE.Face3( i1, i2, i1+shift ) );
            geometry.faces.push( new THREE.Face3( i2, i2+shift, i1+shift));
         }

      }

      geometry.computeFaceNormals();

      return geometry;
   }

   JSROOT.GEO.createTube = function( shape ) {

      var outerRadius1, innerRadius1, outerRadius2, innerRadius2;
      if ((shape['_typename'] == "TGeoCone") || (shape['_typename'] == "TGeoConeSeg")) {
         outerRadius1 = shape['fRmax2'];
         innerRadius1 = shape['fRmin2'];
         outerRadius2 = shape['fRmax1'];
         innerRadius2 = shape['fRmin1'];
      } else {
         outerRadius1 = outerRadius2 = shape['fRmax'];
         innerRadius1 = innerRadius2 = shape['fRmin'];
      }
      if (innerRadius1 <= 0) innerRadius1 = 0.0000001;
      if (innerRadius2 <= 0) innerRadius2 = 0.0000001;

      var thetaStart = 0, thetaLength = 360;
      if ((shape['_typename'] == "TGeoConeSeg") || (shape['_typename'] == "TGeoTubeSeg") || (shape['_typename'] == "TGeoCtub")) {
         thetaStart = shape['fPhi1'] + 90;
         thetaLength = shape['fPhi2'] - shape['fPhi1'];
      }

      var radiusSegments = Math.floor(thetaLength/6);
      if (radiusSegments < 8) radiusSegments = 8;

      var outerTube = new THREE.CylinderGeometry(outerRadius1/2, outerRadius2/2,
               shape['fDZ'], radiusSegments, 1, true, thetaStart*Math.PI/180.0, thetaLength*Math.PI/180.0);
      outerTube.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );


      var innerTube = new THREE.CylinderGeometry(innerRadius1/2, innerRadius2/2,
               shape['fDZ'], radiusSegments, 1, true, thetaStart*Math.PI/180.0, thetaLength*Math.PI/180.0);
      innerTube.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );

      var geometry = new THREE.Geometry();

      // add inner tube
      for (var n=0; n < innerTube.vertices.length; ++n)
         geometry.vertices.push(innerTube.vertices[n]);

      for (var n=0; n < innerTube.faces.length; ++n)
         geometry.faces.push(innerTube.faces[n]);

      var shift = geometry.vertices.length;

      // add outer tube
      for (var n=0; n < outerTube.vertices.length; ++n)
         geometry.vertices.push(outerTube.vertices[n]);

      for (var n=0; n < outerTube.faces.length; ++n) {
         var face = outerTube.faces[n];
         face.a += shift; face.b += shift; face.c += shift;
         geometry.faces.push(face);
      }

      // add top cap
      for (var i = 0; i < radiusSegments; ++i){
         geometry.faces.push( new THREE.Face3( i+0, i+1, i+shift ) );
         geometry.faces.push( new THREE.Face3( i+1, i+shift+1, i+shift ) );
      }

      // add endcap cap
      for (var i = radiusSegments+1; i < 2*radiusSegments+1; ++i){
         geometry.faces.push( new THREE.Face3( i+0, i+1, i+shift ) );
         geometry.faces.push( new THREE.Face3( i+1, i+shift+1, i+shift ) );
      }

      // close cut regions
      if ((thetaStart !== 0) || (thetaLength !== 360)) {
          geometry.faces.push( new THREE.Face3( 0, radiusSegments+1 , shift+radiusSegments+1 ) );
          geometry.faces.push( new THREE.Face3( 0, shift+radiusSegments+1, shift ) );

          geometry.faces.push( new THREE.Face3( radiusSegments, 2*radiusSegments+1, shift+2*radiusSegments+1 ) );
          geometry.faces.push( new THREE.Face3( radiusSegments, shift+2*radiusSegments+1, shift + radiusSegments ) );
      }

      geometry.computeFaceNormals();

      return geometry;
   }

   JSROOT.GEO.createTorus = function( shape ) {
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
      var outerTorusMesh = new THREE.Mesh( outerTorus );

      var innerTorus = new THREE.TorusGeometry( radius/2, innerTube/2, radialSegments, tubularSegments, arc );
      innerTorus.applyMatrix( new THREE.Matrix4().makeRotationZ( rotation ) );
      var innerTorusMesh = new THREE.Mesh( innerTorus );

      var first = new THREE.Geometry();
      for (i = 0; i < radialSegments; ++i) {
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
      var firstMesh = new THREE.Mesh( first );

      var second = new THREE.Geometry();
      for (i = 0; i < radialSegments; ++i) {
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
      var secondMesh = new THREE.Mesh( second );

      outerTorusMesh.updateMatrix();
      geometry.merge(outerTorusMesh.geometry, outerTorusMesh.matrix);
      innerTorusMesh.updateMatrix();
      geometry.merge(innerTorusMesh.geometry, innerTorusMesh.matrix);
      firstMesh.updateMatrix();
      geometry.merge(firstMesh.geometry, firstMesh.matrix);
      secondMesh.updateMatrix();
      geometry.merge(secondMesh.geometry, secondMesh.matrix);
      //geometry.computeFaceNormals();

      return geometry;
   }

   JSROOT.GEO.createPolygon = function( shape ) {
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
      thetaStart *= (Math.PI / 180.0);
      thetaLength *= (Math.PI / 180.0);
      var geometry = new THREE.Geometry();

      for (var i=0; i<shape['fNz']; ++i) {
         outerRadius[i] = shape['fRmax'][i]/2;
         innerRadius[i] = shape['fRmin'][i]/2;
         if (innerRadius[i] <= 0) innerRadius[i] = 0.0000001;
      }
      for (var n=0; n<shape['fNz']; ++n) {
         var seg = n*2;
         var DZ = (shape['fZ'][n+1]-shape['fZ'][n])/2;
         tube[seg] = new THREE.CylinderGeometry(outerRadius[n+1], outerRadius[n],
                  DZ, radiusSegments, 1, true, thetaStart, thetaLength);
         tube[seg].applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
         tube[seg].faceVertexUvs[0] = [];  // workaround to avoid warnings from three.js
         tubeMesh[seg] = new THREE.Mesh( tube[seg] );
         tubeMesh[seg].translateZ( 0.5 * (shape['fZ'][n] + DZ) );

         tube[seg+1] = new THREE.CylinderGeometry(innerRadius[n+1], innerRadius[n],
                  DZ, radiusSegments, 1, true, thetaStart, thetaLength);
         tube[seg+1].applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
         tube[seg+1].faceVertexUvs[0] = [];  // workaround to avoid warnings from three.js

         tubeMesh[seg+1] = new THREE.Mesh( tube[seg+1] );
         tubeMesh[seg+1].translateZ( 0.5 * (shape['fZ'][n] + DZ) );

         if ( n >= (shape['fNz']-2) ) {
            end[seg] = new THREE.Geometry();
            for (i = 0; i < radiusSegments; ++i){
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
            endMesh[seg] = new THREE.Mesh( end[seg] );
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
            faceMesh[seg] = new THREE.Mesh( face[seg] );
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
            faceMesh[seg+1] = new THREE.Mesh( face[seg+1] );
            faceMesh[seg+1].translateZ( 0.5 * (shape['fZ'][n] + DZ) );
         }
         if ( n == 0 ) {
            end[seg+1] = new THREE.Geometry();
            for (i = 0; i < radiusSegments; ++i) {
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
            endMesh[seg+1] = new THREE.Mesh( end[seg+1] );
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
      return geometry;
   }

   JSROOT.GEO.isShapeSupported = function ( shape ) {
      if ((shape === undefined) || ( shape === null )) return false;
      if (! ('supported_shapes' in this))
         this.supported_shapes =
            [ "TGeoBBox", "TGeoPara", "TGeoArb8", "TGeoTrd1", "TGeoTrd2", "TGeoTrap", "TGeoSphere",
              "TGeoCone", "TGeoConeSeg", "TGeoTube", "TGeoTubeSeg","TGeoTorus", "TGeoPcon", "TGeoPgon" ];
      if (this.supported_shapes.indexOf(shape._typename) >= 0) return true;

      if (!('unsupported_shapes' in this)) this.unsupported_shapes = [];
      if (this.unsupported_shapes.indexOf(shape._typename) < 0) {
         this.unsupported_shapes.push(shape._typename);
         console.warn('Not supported ' + shape._typename);
      }

      return false;
   }

   JSROOT.GEO.createGeometry = function( shape ) {

      if (shape['_typename'] == "TGeoBBox")
         return JSROOT.GEO.createCube( shape );  // Cube

      if (shape['_typename'] == "TGeoPara")
         return JSROOT.GEO.createPara( shape );  // Parallelepiped

      if ((shape['_typename'] == "TGeoArb8") || (shape['_typename'] == "TGeoTrd1") ||
          (shape['_typename'] == "TGeoTrd2") || (shape['_typename'] == "TGeoTrap"))
         return JSROOT.GEO.createTrapezoid( shape );

      if ((shape['_typename'] == "TGeoSphere"))
         return JSROOT.GEO.createSphere( shape );

      if ((shape['_typename'] == "TGeoCone") || (shape['_typename'] == "TGeoConeSeg") ||
          (shape['_typename'] == "TGeoTube") || (shape['_typename'] == "TGeoTubeSeg"))
         return JSROOT.GEO.createTube( shape );


      if (shape['_typename'] == "TGeoTorus")
         return JSROOT.GEO.createTorus( shape );

      if ( shape['_typename'] == "TGeoPcon" || shape['_typename'] == "TGeoPgon" )
         return JSROOT.GEO.createPolygon( shape );

      return null;
   }

   return JSROOT.GEO;

}));
