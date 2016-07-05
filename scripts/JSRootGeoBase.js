(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      // AMD. Register as an anonymous module.
      define( [ 'JSRootCore', 'threejs', 'ThreeCSG' ], factory );
   } else {

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'JSRootGeoBase.js');

      if (typeof THREE == 'undefined')
         throw new Error('THREE is not defined', 'JSRootGeoBase.js');

      factory(JSROOT);
   }
} (function( JSROOT ) {
   // === functions to create THREE.Geometry for TGeo shapes ========================

   JSROOT.GEO = {};

   JSROOT.GEO.createCube = function( shape ) {

      // instead of BoxGeometry create all vertices and faces ourself
      // reduce number of allocated objects

      //return new THREE.BoxGeometry( 2*shape.fDX, 2*shape.fDY, 2*shape.fDZ );

      var geom = new THREE.Geometry();

      geom.vertices.push( new THREE.Vector3( shape.fDX,  shape.fDY,  shape.fDZ ) );
      geom.vertices.push( new THREE.Vector3( shape.fDX,  shape.fDY, -shape.fDZ ) );
      geom.vertices.push( new THREE.Vector3( shape.fDX, -shape.fDY,  shape.fDZ ) );
      geom.vertices.push( new THREE.Vector3( shape.fDX, -shape.fDY, -shape.fDZ ) );
      geom.vertices.push( new THREE.Vector3(-shape.fDX,  shape.fDY, -shape.fDZ ) );
      geom.vertices.push( new THREE.Vector3(-shape.fDX,  shape.fDY,  shape.fDZ ) );
      geom.vertices.push( new THREE.Vector3(-shape.fDX, -shape.fDY, -shape.fDZ ) );
      geom.vertices.push( new THREE.Vector3(-shape.fDX, -shape.fDY,  shape.fDZ ) );

      var indicies = [0,2,1, 2,3,1, 4,6,5, 6,7,5, 4,5,1, 5,0,1, 7,6,2, 6,3,2, 5,7,0, 7,2,0, 1,3,4, 3,6,4];

      // normals for each  pair of faces
      var normals = [ 1,0,0, -1,0,0, 0,1,0, 0,-1,0, 0,0,1,  0,0,-1 ];

      var color = new THREE.Color();
      var norm = null;
      for (var n=0; n < indicies.length; n+=3) {
          if (n % 6 === 0) norm = new THREE.Vector3(normals[n/2], normals[n/2+1], normals[n/2+2]);
          var face = new THREE.Face3( indicies[n], indicies[n+1], indicies[n+2], norm, color, 0);
          geom.faces.push(face);
      }

      return geom;

   }

   JSROOT.GEO.createPara = function( shape ) {

      var txy = shape.fTxy, txz = shape.fTxz, tyz = shape.fTyz;

      var verticesOfShape = [
          -shape.fZ*txz-txy*shape.fY-shape.fX, -shape.fY-shape.fZ*tyz,  -shape.fZ,
          -shape.fZ*txz+txy*shape.fY-shape.fX,  shape.fY-shape.fZ*tyz,  -shape.fZ,
          -shape.fZ*txz+txy*shape.fY+shape.fX,  shape.fY-shape.fZ*tyz,  -shape.fZ,
          -shape.fZ*txz-txy*shape.fY+shape.fX, -shape.fY-shape.fZ*tyz,  -shape.fZ,
           shape.fZ*txz-txy*shape.fY-shape.fX, -shape.fY+shape.fZ*tyz,   shape.fZ,
           shape.fZ*txz+txy*shape.fY-shape.fX,  shape.fY+shape.fZ*tyz,   shape.fZ,
           shape.fZ*txz+txy*shape.fY+shape.fX,  shape.fY+shape.fZ*tyz,   shape.fZ,
           shape.fZ*txz-txy*shape.fY+shape.fX, -shape.fY+shape.fZ*tyz,   shape.fZ ];

      var indicesOfFaces = [ 4,6,5,   4,7,6,   0,3,7,   7,4,0,
                             4,5,1,   1,0,4,   6,2,1,   1,5,6,
                             7,3,2,   2,6,7,   1,2,3,   3,0,1 ];

      var geom = new THREE.Geometry();

      for (var i = 0; i < verticesOfShape.length; i += 3)
         geom.vertices.push( new THREE.Vector3( verticesOfShape[i], verticesOfShape[i+1], verticesOfShape[i+2] ) );

      var color = new THREE.Color();

      for (var i = 0; i < indicesOfFaces.length; i += 3)
         geom.faces.push( new THREE.Face3( indicesOfFaces[i], indicesOfFaces[i+1], indicesOfFaces[i+2], null, color, 0 ) );

      geom.computeFaceNormals();

      return geom;
   }


   JSROOT.GEO.createTrapezoid = function( shape ) {

      var y1, y2;
      if (shape._typename == "TGeoTrd1") {
         y1 = y2 = shape.fDY;
      } else {
         y1 = shape.fDy1; y2 = shape.fDy2;
      }

      var verticesOfShape = [
            -shape.fDx1,  y1, -shape.fDZ,
             shape.fDx1,  y1, -shape.fDZ,
             shape.fDx1, -y1, -shape.fDZ,
            -shape.fDx1, -y1, -shape.fDZ,
            -shape.fDx2,  y2,  shape.fDZ,
             shape.fDx2,  y2,  shape.fDZ,
             shape.fDx2, -y2,  shape.fDZ,
            -shape.fDx2, -y2,  shape.fDZ
         ];

      var indicesOfFaces = [
          4,6,5,   4,7,6,   0,3,7,   7,4,0,
          4,5,1,   1,0,4,   6,2,1,   1,5,6,
          7,3,2,   2,6,7,   1,2,3,   3,0,1 ];

      var geometry = new THREE.Geometry();
      for (var i = 0; i < 24; i += 3)
         geometry.vertices.push( new THREE.Vector3( verticesOfShape[i], verticesOfShape[i+1], verticesOfShape[i+2] ) );

      var color = new THREE.Color();

      for (var i = 0; i < 36; i += 3)
         geometry.faces.push( new THREE.Face3( indicesOfFaces[i], indicesOfFaces[i+1], indicesOfFaces[i+2], null, color, 0 ) );

      geometry.computeFaceNormals();
      return geometry;
   }


   JSROOT.GEO.createArb8 = function( shape ) {

      var verticesOfShape = [
            shape.fXY[0][0], shape.fXY[0][1], -shape.fDZ,
            shape.fXY[1][0], shape.fXY[1][1], -shape.fDZ,
            shape.fXY[2][0], shape.fXY[2][1], -shape.fDZ,
            shape.fXY[3][0], shape.fXY[3][1], -shape.fDZ,
            shape.fXY[4][0], shape.fXY[4][1],  shape.fDZ,
            shape.fXY[5][0], shape.fXY[5][1],  shape.fDZ,
            shape.fXY[6][0], shape.fXY[6][1],  shape.fDZ,
            shape.fXY[7][0], shape.fXY[7][1],  shape.fDZ
         ];

      var indicies = [];

      var indicesOfFaces = [
          4,6,5,   4,7,6,   0,3,7,   7,4,0,
          4,5,1,   1,0,4,   6,2,1,   1,5,6,
          7,3,2,   2,6,7,   1,2,3,   3,0,1 ];

      var geometry = new THREE.Geometry();
      for (var i = 0; i < 8; ++i) {
         var ii = i*3;
         if ((i>0) && (verticesOfShape[ii] === verticesOfShape[ii-3]) &&
             (verticesOfShape[ii+1] === verticesOfShape[ii-2]) &&
             (verticesOfShape[ii+2] === verticesOfShape[ii-1])) {
            indicies[i] = indicies[i-1];
            continue;
         }

         indicies[i] = geometry.vertices.length;

         geometry.vertices.push( new THREE.Vector3( verticesOfShape[ii], verticesOfShape[ii+1], verticesOfShape[ii+2] ) );
      }

      var color = new THREE.Color();

      for (var i = 0; i < 36; i += 3) {
         var a = indicies[indicesOfFaces[i]],
             b = indicies[indicesOfFaces[i+1]],
             c = indicies[indicesOfFaces[i+2]];
         if ((a!==b) && (b!==c) && (a!==c))
            geometry.faces.push( new THREE.Face3( a, b, c, null, color, 0 ) );
      }

      geometry.computeFaceNormals();
      return geometry;
   }


   JSROOT.GEO.createSphere = function( shape, faces_limit ) {
      var outerRadius = shape.fRmax;
      var innerRadius = shape.fRmin;
      var phiStart = shape.fPhi1 + 180;
      var phiLength = shape.fPhi2 - shape.fPhi1;
      var thetaStart = shape.fTheta1;
      var thetaLength = shape.fTheta2 - shape.fTheta1;
      var widthSegments = shape.fNseg;
      var heightSegments = shape.fNz;

      var noInside = (innerRadius <= 0);

      if (faces_limit !== undefined) {
         var fact = (noInside ? 2 : 4) * widthSegments * heightSegments / faces_limit;
         if (fact > 1.) {
            widthSegments = Math.round(widthSegments/Math.sqrt(fact));
            heightSegments = Math.round(heightSegments/Math.sqrt(fact));
         }
      }

      var sphere = new THREE.SphereGeometry( outerRadius, widthSegments, heightSegments,
                                             phiStart*Math.PI/180, phiLength*Math.PI/180, thetaStart*Math.PI/180, thetaLength*Math.PI/180);
      sphere.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );

      var geometry = new THREE.Geometry();
      var color = new THREE.Color();

      // add outer sphere
      for (var n=0; n < sphere.vertices.length; ++n)
         geometry.vertices.push(sphere.vertices[n]);

      // add faces
      for (var n=0; n < sphere.faces.length; ++n) {
         var face = sphere.faces[n];
         geometry.faces.push(new THREE.Face3( face.a, face.b, face.c, null, color, 0 ) );
      }

      var shift = geometry.vertices.length;

      if (noInside) {
         // simple sphere without inner cut
         if ((thetaLength === 180) && (phiLength === 360)) {
            geometry.computeFaceNormals();
            return geometry;
         }

         geometry.vertices.push(new THREE.Vector3(0, 0, 0));
      } else {
         var k = innerRadius / outerRadius;

         // add inner sphere
         for (var n=0; n < sphere.vertices.length; ++n) {
            var v = sphere.vertices[n];
            geometry.vertices.push(new THREE.Vector3(k*v.x, k*v.y, k*v.z));
         }
         for (var n=0; n < sphere.faces.length; ++n) {
            var face = sphere.faces[n];
            geometry.faces.push(new THREE.Face3( shift+face.b, shift+face.a, shift+face.c, null, color, 0 ) );
         }
      }

      if (thetaLength !== 180) {
         // add top cap
         for (var i = 0; i < widthSegments; ++i) {
            if (noInside) {
               geometry.faces.push( new THREE.Face3( i+0, i+1, shift, null, color, 0 ) );
            } else {
               geometry.faces.push( new THREE.Face3( i+0, i+1, i+shift, null, color, 0 ) );
               geometry.faces.push( new THREE.Face3( i+1, i+shift+1, i+shift, null, color, 0 ) );
            }
         }

         var dshift = sphere.vertices.length - widthSegments - 1;

         // add bottom cap
         for (var i = dshift; i < dshift + widthSegments; ++i) {
            if (noInside) {
               geometry.faces.push( new THREE.Face3( i+0, i+1, shift, null, color, 0 ) );
            } else {
               geometry.faces.push( new THREE.Face3( i+1, i+0, i+shift, null, color, 0 ) );
               geometry.faces.push( new THREE.Face3( i+shift+1, i+1, i+shift, null, color, 0 ) );
            }
         }
      }

      if (phiLength !== 360) {
         // one cuted side
         for (var j=0; j<heightSegments; j++) {
            var i1 = j*(widthSegments+1);
            var i2 = (j+1)*(widthSegments+1);
            if (noInside) {
               geometry.faces.push( new THREE.Face3( i1, i2, shift, null, color, 0 ) );
            } else {
               geometry.faces.push( new THREE.Face3( i2, i1, i1+shift, null, color, 0 ) );
               geometry.faces.push( new THREE.Face3( i2+shift, i2, i1+shift, null, color, 0 ));
            }
         }
         // another cuted side
         for (var j=0;j<heightSegments;j++) {
            var i1 = (j+1)*(widthSegments+1) - 1;
            var i2 = (j+2)*(widthSegments+1) - 1;
            if (noInside) {
               geometry.faces.push( new THREE.Face3( i1, i2, shift, null, color, 0 ) );
            } else {
               geometry.faces.push( new THREE.Face3( i1, i2, i1+shift, null, color, 0 ) );
               geometry.faces.push( new THREE.Face3( i2, i2+shift, i1+shift, null, color, 0));
            }
         }
      }

      geometry.computeFaceNormals();

      return geometry;
   }


   JSROOT.GEO.createTube = function( shape ) {
      var outerRadius1, innerRadius1, outerRadius2, innerRadius2;
      if ((shape._typename == "TGeoCone") || (shape._typename == "TGeoConeSeg")) {
         outerRadius1 = shape.fRmax2;
         innerRadius1 = shape.fRmin2;
         outerRadius2 = shape.fRmax1;
         innerRadius2 = shape.fRmin1;
      } else {
         outerRadius1 = outerRadius2 = shape.fRmax;
         innerRadius1 = innerRadius2 = shape.fRmin;
      }

      var hasrmin = (innerRadius1 > 0) || (innerRadius2 > 0);

      if (hasrmin) {
         if (innerRadius1 <= 0) { innerRadius1 = 0.0000001; JSROOT.GEO.warn('zero inner radius1 in tube - not yet supported'); }
         if (innerRadius2 <= 0) { innerRadius2 = 0.0000001; JSROOT.GEO.warn('zero inner radius1 in tube - not yet supported'); }
      }

      var thetaStart = 0, thetaLength = 360;
      if ((shape._typename == "TGeoConeSeg") || (shape._typename == "TGeoTubeSeg") || (shape._typename == "TGeoCtub")) {
         thetaStart = shape.fPhi1;
         thetaLength = shape.fPhi2 - shape.fPhi1;
      }

      var radiusSegments = Math.floor(thetaLength/6);
      if (radiusSegments < 4) radiusSegments = 4;

      var extrapnt = (thetaLength < 360) ? 1 : 0;

      var nsegm = radiusSegments + extrapnt;

      var phi0 = thetaStart*Math.PI/180, dphi = thetaLength/radiusSegments*Math.PI/180;

      // calculate all sin/cos tables in advance
      var _sin = new Float32Array(nsegm), _cos = new Float32Array(nsegm);
      for (var seg=0; seg<nsegm; ++seg) {
         _cos[seg] = Math.cos(phi0+seg*dphi);
         _sin[seg] = Math.sin(phi0+seg*dphi);
      }

      var geometry = new THREE.Geometry();

      // add inner tube vertices

      if (hasrmin) {
         for (var seg=0; seg<nsegm; ++seg)
            geometry.vertices.push( new THREE.Vector3( innerRadius1*_cos[seg], innerRadius1*_sin[seg], shape.fDZ));
         for (var seg=0; seg<nsegm; ++seg)
            geometry.vertices.push( new THREE.Vector3( innerRadius2*_cos[seg], innerRadius2*_sin[seg], -shape.fDZ));
      } else {
         geometry.vertices.push( new THREE.Vector3( 0, 0, shape.fDZ));
         geometry.vertices.push( new THREE.Vector3( 0, 0, -shape.fDZ));
      }

      var shift = geometry.vertices.length;

      // add outer tube vertices
      for (var seg=0; seg<nsegm; ++seg)
         geometry.vertices.push( new THREE.Vector3( outerRadius1*_cos[seg], outerRadius1*_sin[seg], shape.fDZ));
      for (var seg=0; seg<nsegm; ++seg)
         geometry.vertices.push( new THREE.Vector3( outerRadius2*_cos[seg], outerRadius2*_sin[seg], -shape.fDZ));

      // recalculate Z of all vertices for ctub shape
      if (shape._typename == "TGeoCtub")
         for (var n=0;n<geometry.vertices.length;++n) {
            var vertex = geometry.vertices[n];
            if (vertex.z<0) vertex.z = -shape.fDz-(vertex.x*shape.fNlow[0]+vertex.x*shape.fNlow[1])/shape.fNlow[2];
                       else vertex.z = shape.fDz-(vertex.y*shape.fNhigh[0]+vertex.y*shape.fNhigh[1])/shape.fNhigh[2];
         }

      var color = new THREE.Color(); // make dummy color for all faces

      // add inner tube faces
      if (hasrmin)
         for (var seg=0; seg<radiusSegments; ++seg) {
            var seg1 = (extrapnt === 1) ? (seg + 1) : (seg + 1) % radiusSegments;
            geometry.faces.push( new THREE.Face3( nsegm + seg, seg,  seg1, null, color, 0 ) );
            geometry.faces.push( new THREE.Face3( nsegm + seg, seg1, nsegm + seg1, null, color, 0 ) );
         }

      // add outer tube faces
      for (var seg=0; seg<radiusSegments; ++seg) {
         var seg1 = (extrapnt === 1) ? (seg + 1) : (seg + 1) % radiusSegments;
         geometry.faces.push( new THREE.Face3( shift+seg, shift + nsegm + seg, shift + seg1, null, color, 0 ) );
         geometry.faces.push( new THREE.Face3( shift + nsegm + seg, shift + nsegm + seg1, shift + seg1, null, color, 0 ) );
      }


      // add top cap
      for (var i = 0; i < radiusSegments; ++i){
         var i1 = (extrapnt === 1) ? (i+1) : (i+1) % radiusSegments;
         if (hasrmin) {
            geometry.faces.push( new THREE.Face3( i, i+shift, i1, null, color, 0 ) );
            geometry.faces.push( new THREE.Face3( i+shift, i1+shift, i1, null, color, 0 ) );
         } else {
            geometry.faces.push( new THREE.Face3( 0, i+shift, i1+shift, null, color, 0 ) );
         }
      }

      // add bottom cap
      for (var i = 0; i < radiusSegments; ++i) {
         var i1 = (extrapnt === 1) ? (i+1) : (i+1) % radiusSegments;
         if (hasrmin) {
            geometry.faces.push( new THREE.Face3( nsegm+i+shift, nsegm+i,  nsegm+i1, null, color, 0 ) );
            geometry.faces.push( new THREE.Face3( nsegm+i+shift, nsegm+i1, nsegm+i1+shift, null, color, 0 ) );
         } else {
            geometry.faces.push( new THREE.Face3( nsegm+i+shift, 1, nsegm+i1+shift, null, color, 0 ) );
         }
      }

      // close cut regions
      if (extrapnt === 1) {
          if (hasrmin) {
             geometry.faces.push( new THREE.Face3( 0, nsegm, shift+nsegm, null, color, 0 ) );
             geometry.faces.push( new THREE.Face3( 0, shift+nsegm, shift, null, color, 0 ) );
          } else {
             geometry.faces.push( new THREE.Face3( 0, 1, shift+nsegm, null, color, 0 ) );
             geometry.faces.push( new THREE.Face3( 0, shift+nsegm, shift, null, color, 0 ) );
          }

          if (hasrmin) {
             geometry.faces.push( new THREE.Face3( radiusSegments, shift+2*radiusSegments+1, 2*radiusSegments+1, null, color, 0 ) );
             geometry.faces.push( new THREE.Face3( radiusSegments, shift + radiusSegments, shift+2*radiusSegments+1, null, color, 0 ) );
          } else {
             geometry.faces.push( new THREE.Face3( 0, shift+2*radiusSegments+1, 1, null, color, 0 ) );
             geometry.faces.push( new THREE.Face3( 0, shift + radiusSegments, shift+2*radiusSegments+1,  null, color, 0 ) );
          }
      }

      geometry.computeFaceNormals();

      return geometry;
   }


   JSROOT.GEO.createEltu = function( shape ) {
      var geometry = new THREE.Geometry();

      var radiusSegments = Math.floor(360/6);

      // calculate all sin/cos tables in advance
      var x = new Float32Array(radiusSegments),
          y = new Float32Array(radiusSegments);
      for (var seg=0; seg<radiusSegments; ++seg) {
         var phi = seg/radiusSegments*2*Math.PI;
         x[seg] = shape.fRmin*Math.cos(phi);
         y[seg] = shape.fRmax*Math.sin(phi);
      }

      // create vertices
      for (var seg=0; seg<radiusSegments; ++seg)
         geometry.vertices.push( new THREE.Vector3( x[seg], y[seg], -shape.fDZ));
      geometry.vertices.push( new THREE.Vector3( 0, 0, -shape.fDZ));

      for (var seg=0; seg<radiusSegments; ++seg)
         geometry.vertices.push( new THREE.Vector3( x[seg], y[seg], +shape.fDZ));
      geometry.vertices.push( new THREE.Vector3( 0, 0, shape.fDZ));

      var color = new THREE.Color();

      // create tube faces
      for (var seg=0; seg<radiusSegments; ++seg) {
         var seg1 = (seg + 1) % radiusSegments;
         geometry.faces.push( new THREE.Face3( seg+radiusSegments+1, seg, seg1, null, color, 0 ) );
         geometry.faces.push( new THREE.Face3( seg+radiusSegments+1, seg1, seg1+radiusSegments+1, null, color, 0 ) );
      }

      // create bottom cap
      for (var seg=0; seg<radiusSegments; ++seg)
         geometry.faces.push( new THREE.Face3( seg, radiusSegments, (seg + 1) % radiusSegments, null, color, 0 ));

      // create upper cap
      var shift = radiusSegments + 1;
      for (var seg=0; seg<radiusSegments; ++seg)
         geometry.faces.push( new THREE.Face3( shift+seg, shift+ (seg + 1) % radiusSegments, shift+radiusSegments, null, color, 0 ));

      geometry.computeFaceNormals();
      return geometry;
   }


   JSROOT.GEO.createTorus = function( shape, faces_limit ) {
      var radius = shape.fR;
      var innerTube = shape.fRmin;
      var outerTube = shape.fRmax;
      var arc = shape.fDphi - shape.fPhi1;
      var rotation = shape.fPhi1;
      var radialSegments = 30;
      var tubularSegments = Math.floor(arc/6);
      if (tubularSegments < 8) tubularSegments = 8;

      var hasrmin = innerTube > 0, hascut = arc !== 360;

      if (faces_limit !== undefined) {
         var fact = (hasrmin ? 4 : 2) * (radialSegments + 1) * tubularSegments / faces_limit;
         if (fact > 1.) {
            radialSegments = Math.round(radialSegments/Math.sqrt(fact));
            tubularSegments = Math.round(tubularSegments/Math.sqrt(fact));
         }
      }

      var geometry = new THREE.Geometry();
      var color = new THREE.Color();

      var outerTorus = new THREE.TorusGeometry( radius, outerTube, radialSegments, tubularSegments, arc*Math.PI/180);
      outerTorus.applyMatrix( new THREE.Matrix4().makeRotationZ(rotation*Math.PI/180) );

      // add outer torus
      for (var n=0; n < outerTorus.vertices.length; ++n)
         geometry.vertices.push(outerTorus.vertices[n]);

      for (var n=0; n < outerTorus.faces.length; ++n) {
         var face = outerTorus.faces[n];
         geometry.faces.push(new THREE.Face3( face.a, face.b, face.c, null, color, 0 ) );
      }

      var shift = geometry.vertices.length;

      if (hasrmin) {
         var innerTorus = new THREE.TorusGeometry( radius, innerTube, radialSegments, tubularSegments, arc*Math.PI/180);
         innerTorus.applyMatrix( new THREE.Matrix4().makeRotationZ(rotation*Math.PI/180) );

         // add inner torus
         for (var n=0; n < innerTorus.vertices.length; ++n)
            geometry.vertices.push(innerTorus.vertices[n]);

         for (var n=0; n < innerTorus.faces.length; ++n) {
            var face = innerTorus.faces[n];
            geometry.faces.push(new THREE.Face3( shift+face.a, shift+face.c, shift+face.b, null, color, 0 ) );
         }
      } else
      if (hascut) {
         geometry.vertices.push(new THREE.Vector3(radius*Math.cos(rotation*Math.PI/180), radius*Math.sin(rotation*Math.PI/180),0));
         geometry.vertices.push(new THREE.Vector3(radius*Math.cos((rotation+arc)*Math.PI/180), radius*Math.sin((rotation+arc)*Math.PI/180),0));
      }

      if (arc !== 360) {
         // one cuted side
         for (var j=0;j<radialSegments;j++) {
            var i1 = j*(tubularSegments+1);
            var i2 = (j+1)*(tubularSegments+1);
            if (hasrmin) {
               geometry.faces.push( new THREE.Face3( i2, i1+shift, i1, null, color, 0 ) );
               geometry.faces.push( new THREE.Face3( i2, i2+shift, i1+shift,  null, color, 0 ));
            } else {
               geometry.faces.push( new THREE.Face3( shift, i1, i2, null, color, 0 ));
            }
         }

         // another cuted side
         for (var j=0;j<radialSegments;j++) {
            var i1 = (j+1)*(tubularSegments+1)-1;
            var i2 = (j+2)*(tubularSegments+1)-1;
            if (hasrmin) {
               geometry.faces.push( new THREE.Face3( i2, i1, i1+shift, null, color, 0 ) );
               geometry.faces.push( new THREE.Face3( i2, i1+shift, i2+shift, null, color, 0 ));
            } else {
               geometry.faces.push( new THREE.Face3( shift+1, i2, i1, null, color, 0 ));
            }
         }
      }

      geometry.computeFaceNormals();

      return geometry;
   }


   JSROOT.GEO.createPolygon = function( shape ) {

      var thetaStart = shape.fPhi1, thetaLength = shape.fDphi;

      var radiusSegments = 60;
      if ( shape._typename == "TGeoPgon" ) {
         radiusSegments = shape.fNedges;
      } else {
         radiusSegments = Math.floor(thetaLength/6);
         if (radiusSegments < 4) radiusSegments = 4;
      }

      var geometry = new THREE.Geometry();

      var color = new THREE.Color();

      var phi0 = thetaStart*Math.PI/180, dphi = thetaLength/radiusSegments*Math.PI/180;

      // calculate all sin/cos tables in advance
      var _sin = new Float32Array(radiusSegments+1), _cos = new Float32Array(radiusSegments+1);
      for (var seg=0;seg<=radiusSegments;++seg) {
         _cos[seg] = Math.cos(phi0+seg*dphi);
         _sin[seg] = Math.sin(phi0+seg*dphi);
      }

      var indxs = [[],[]], pnts = null, edges = null; // remember indexes for each layer
      var layerVerticies = radiusSegments; // how many verticies in one layer

      if (thetaLength !== 360) {
         pnts = []; // coordinate of point on cut edge (x,z)
         edges = [];  // number of layer for that points
         layerVerticies+=1; // one need one more vertice
      }

      var a,b,c,d,e; // used for face swapping

      for (var side = 0; side < 2; ++side) {

         var rside = (side === 0) ? 'fRmax' : 'fRmin';
         var prev_indx = geometry.vertices.length;

         for (var layer=0; layer < shape.fNz; ++layer) {

            indxs[side][layer] = geometry.vertices.length;

            // first create points for the layer
            var layerz = shape.fZ[layer], rad = shape[rside][layer];

            if ((layer > 0) && (layer < shape.fNz-1)) {
               if (((shape.fZ[layer-1] === layerz) && (shape[rside][layer-1] === rad)) ||
                   ((shape[rside][layer+1] === rad) && (shape[rside][layer-1] === rad))) {

                  // same Z and R as before - ignore
                  // or same R before and after
                  indxs[side][layer] = indxs[side][layer-1];
                  // if (len) len[side][layer] = len[side][layer-1];
                  continue;
               }
            }

            if (rad <= 0.) rad = 0.000001;

            var curr_indx = geometry.vertices.length;

            // create vertices for the layer
            for (var seg=0; seg < layerVerticies; ++seg)
               geometry.vertices.push( new THREE.Vector3( rad*_cos[seg], rad*_sin[seg], layerz ));

            if (pnts !== null) {
               if (side === 0) {
                  pnts.push(new THREE.Vector2(rad, layerz));
                  edges.push(curr_indx);
               } else
               if (rad < shape.fRmax[layer]) {
                  pnts.unshift(new THREE.Vector2(rad, layerz));
                  edges.unshift(curr_indx);
               }
            }

            if (layer>0)  // create faces
               for (var seg=0;seg < radiusSegments;++seg) {
                  var seg1 = (seg + 1) % layerVerticies;
                  geometry.faces.push( new THREE.Face3( prev_indx + seg, (side === 0) ? (prev_indx + seg1) : (curr_indx + seg) , curr_indx + seg1, null, color, 0 ) );
                  geometry.faces.push( new THREE.Face3( prev_indx + seg, curr_indx + seg1, (side === 0) ? (curr_indx + seg) : prev_indx + seg1, null, color, 0 ));
               }

            prev_indx = curr_indx;
         }
      }

      // add faces for top and bottom side
      for (var layer = 0; layer < shape.fNz; layer+= (shape.fNz-1)) {
         if (shape.fRmin[layer] >= shape.fRmax[layer]) continue;
         var inside = indxs[1][layer], outside = indxs[0][layer];
         for (var seg=0; seg < radiusSegments; ++seg) {
            var seg1 = (seg + 1) % layerVerticies;
            geometry.faces.push( new THREE.Face3( outside + seg, (layer===0) ? (inside + seg) : (outside + seg1), inside + seg1, null, color, 0 ) );
            geometry.faces.push( new THREE.Face3( outside + seg, inside + seg1, (layer===0) ? (outside + seg1) : (inside + seg), null, color, 0 ));
         }
      }

      if (pnts!==null) {
         var faces = [];
         if (pnts.length === shape.fNz * 2) {
            // special case - all layers are there, create faces ourself
            for (var layer = shape.fNz-1; layer>0; --layer) {
               if (shape.fZ[layer] === shape.fZ[layer-1]) continue;
               var right = 2*shape.fNz - 1 - layer;
               faces.push([right, layer - 1, layer]);
               faces.push([right, right + 1, layer-1]);
            }

         } else {
            // let three.js calculate our faces
            faces = THREE.ShapeUtils.triangulateShape(pnts, []);
         }

         for (var i = 0; i < faces.length; ++i) {
            var f = faces[i];
            geometry.faces.push( new THREE.Face3( edges[f[0]], edges[f[1]], edges[f[2]], null, color, 0) );
         }
         for (var i = 0; i < faces.length; ++i) {
            var f = faces[i];
            geometry.faces.push( new THREE.Face3( edges[f[0]] + radiusSegments, edges[f[2]] + radiusSegments, edges[f[1]] + radiusSegments, null, color, 0) );
         }
      }

      geometry.computeFaceNormals();

      return geometry;
   }


   JSROOT.GEO.createXtru = function( shape ) {

      var geometry = new THREE.Geometry();

      var fcolor = new THREE.Color();

      var prev = 0, curr = 0;
      for (var layer = 0; layer < shape.fNz; ++layer) {
         var layerz = shape.fZ[layer], scale = shape.fScale[layer];

         prev = curr;
         curr = geometry.vertices.length;

         // add vertices
         for (var vert = 0; vert < shape.fNvert; ++vert)
            geometry.vertices.push( new THREE.Vector3( scale * shape.fX[vert], scale * shape.fY[vert], layerz ));

         if (layer>0)  // create faces for sides
            for (var vert = 0; vert < shape.fNvert; ++vert) {
               var vert1 = (vert + 1) % shape.fNvert;
               geometry.faces.push( new THREE.Face3( prev + vert, curr + vert, curr + vert1, null, fcolor, 0 ) );
               geometry.faces.push( new THREE.Face3( prev + vert, curr + vert1, prev + vert1, null, fcolor, 0 ));
            }
      }

      // now try to make shape - use standard THREE.js utils

      var pnts = [];
      for (var vert = 0; vert < shape.fNvert; ++vert)
         pnts.push( new THREE.Vector2(shape.fX[vert], shape.fY[vert]));
      var faces = THREE.ShapeUtils.triangulateShape(pnts, []);

      for (var i = 0; i < faces.length; ++i) {
         face = faces[ i ];
         geometry.faces.push( new THREE.Face3( face[1], face[0], face[2], null, fcolor, 0) );
         geometry.faces.push( new THREE.Face3( face[0] + curr, face[1] + curr, face[2] + curr, null, fcolor, 0) );
      }

      geometry.computeFaceNormals();

      return geometry;
   }


   JSROOT.GEO.createParaboloid = function( shape, faces_limit ) {

      var radiusSegments = Math.round(360/6), heightSegments = 30;

      if (faces_limit !== undefined) {
         var fact = 2 * (radiusSegments+1) * (heightSegments+1) / faces_limit;
         if (fact > 1.) {
            radiusSegments = Math.round(radiusSegments/Math.sqrt(fact));
            heightSegments = Math.round(heightSegments/Math.sqrt(fact));
         }
      }

      // calculate all sin/cos tables in advance
      var _sin = new Float32Array(radiusSegments), _cos = new Float32Array(radiusSegments);
      for (var seg=0;seg<radiusSegments;++seg) {
         _cos[seg] = Math.cos(seg/radiusSegments*2*Math.PI);
         _sin[seg] = Math.sin(seg/radiusSegments*2*Math.PI);
      }

      var geometry = new THREE.Geometry();
      var fcolor = new THREE.Color();

      var zmin = -shape.fDZ, zmax = shape.fDZ, rmin = shape.fRlo, rmax = shape.fRhi;

      // if no radius at -z, find intersection
      if (shape.fA >= 0) {
         if (shape.fB > zmin) zmin = shape.fB;
      } else {
         if (shape.fB < zmax) zmax = shape.fB;
      }

      var ttmin = Math.atan2(zmin, rmin), ttmax = Math.atan2(zmax, rmax);

      var prev_indx = 0, prev_radius = 0;

      for (var layer = 0; layer <= heightSegments + 1; ++layer) {
         var layerz = zmax, radius = 0;

         if ((layer === heightSegments + 1) && (prev_radius === 0)) break;

         switch (layer) {
            case 0: layerz = zmin; radius = rmin; break;
            case heightSegments: layerz = zmax; radius = rmax; break;
            case heightSegments + 1: layerz = zmax; radius = 0; break;
            default: {
               var tt = Math.tan(ttmin + (ttmax-ttmin) * layer / heightSegments);
               var delta = tt*tt - 4*shape.fA*shape.fB; // should be always positive (a*b<0)
               radius = 0.5*(tt+Math.sqrt(delta))/shape.fA;
               if (radius < 1e-6) radius = 0;
               layerz = radius*tt;
            }
         }

         var curr_indx = geometry.vertices.length;

         if (radius === 0) {
            geometry.vertices.push( new THREE.Vector3( 0, 0, layerz ));
         } else {
            for (var seg=0; seg<radiusSegments; ++seg)
               geometry.vertices.push( new THREE.Vector3( radius*_cos[seg], radius*_sin[seg], layerz));
         }

         // add faces of next layer
         if (layer>0) {
            for (var seg=0; seg<radiusSegments; ++seg) {
               var seg1 = (seg+1) % radiusSegments;
               if (prev_radius === 0) {
                  geometry.faces.push( new THREE.Face3( prev_indx, curr_indx + seg1, curr_indx + seg, null, fcolor, 0) );
               } else
               if (radius == 0) {
                  geometry.faces.push( new THREE.Face3( prev_indx + seg, prev_indx + seg1, curr_indx, null, fcolor, 0) );
               } else {
                  geometry.faces.push( new THREE.Face3( prev_indx + seg, curr_indx + seg1, curr_indx + seg, null, fcolor, 0) );
                  geometry.faces.push( new THREE.Face3( prev_indx + seg, prev_indx + seg1, curr_indx + seg1,  null, fcolor, 0) );
               }
            }
         }

         prev_radius = radius;
         prev_indx = curr_indx;
      }

      geometry.computeFaceNormals();

      return geometry;
   }


   JSROOT.GEO.createHype = function( shape, faces_limit ) {

      if ((shape.fTin===0) && (shape.fTout===0))
         return JSROOT.GEO.createTube(shape);

      var radiusSegments = Math.round(360/6), heightSegments = 30;

      if (faces_limit !== undefined) {
         var fact = ((shape.fRmin <= 0) ? 2 : 4) * (radiusSegments+1) * (heightSegments+2) / faces_limit;
         if (fact > 1.) {
            radiusSegments = Math.round(radiusSegments/Math.sqrt(fact));
            heightSegments = Math.round(heightSegments/Math.sqrt(fact));
         }
      }

      // calculate all sin/cos tables in advance
      var _sin = new Float32Array(radiusSegments), _cos = new Float32Array(radiusSegments);
      for (var seg=0;seg<radiusSegments;++seg) {
         _cos[seg] = Math.cos(seg/radiusSegments*2*Math.PI);
         _sin[seg] = Math.sin(seg/radiusSegments*2*Math.PI);
      }

      var geometry = new THREE.Geometry();
      var fcolor = new THREE.Color();

      var indexes = [[],[]];

      // in-out side
      for (var side=0;side<2;++side) {

         // add only points, no faces
         if ((side===0) && (shape.fRmin <= 0)) {
            indexes[side][0] = geometry.vertices.length;
            geometry.vertices.push( new THREE.Vector3( 0, 0, -shape.fDz ) );
            indexes[side][heightSegments] = geometry.vertices.length;
            geometry.vertices.push( new THREE.Vector3( 0, 0, shape.fDz ) );
            continue;
         }

         var prev_indx = 0;
         var r0 = (side===0) ? shape.fRmin : shape.fRmax;
         var tsq = (side===0) ? shape.fTinsq : shape.fToutsq;

         // vertical layers
         for (var layer=0;layer<=heightSegments;++layer) {
            var layerz = -shape.fDz + layer/heightSegments*2*shape.fDz;

            var radius = Math.sqrt(r0*r0+tsq*layerz*layerz);
            var curr_indx = geometry.vertices.length;

            indexes[side][layer] = curr_indx;

            for (var seg=0; seg<radiusSegments; ++seg)
               geometry.vertices.push( new THREE.Vector3( radius*_cos[seg], radius*_sin[seg], layerz));

            // add faces of next layer
            if (layer>0) {
               for (var seg=0; seg<radiusSegments; ++seg) {
                  var seg1 = (seg+1) % radiusSegments;
                  geometry.faces.push( new THREE.Face3( prev_indx + seg, (side===0) ? (curr_indx + seg) : (prev_indx + seg1), curr_indx + seg1, null, fcolor, 0) );
                  geometry.faces.push( new THREE.Face3( prev_indx + seg, curr_indx + seg1, (side===0) ? (prev_indx + seg1) : (curr_indx + seg), null, fcolor, 0) );
               }
            }

            prev_indx = curr_indx;
         }
      }

      // add caps
      for(var layer=0; layer<=heightSegments; layer+=heightSegments) {
         var inside = indexes[0][layer], outside = indexes[1][layer];
         for (var seg=0; seg<radiusSegments; ++seg) {
            var seg1 = (seg+1) % radiusSegments;
            if (shape.fRmin <= 0) {
               geometry.faces.push( new THREE.Face3( inside, outside + (layer===0 ? seg1 : seg), outside + (layer===0 ? seg : seg1), null, fcolor, 0) );
            } else {
               geometry.faces.push( new THREE.Face3( inside + seg, (layer===0) ? (inside + seg1) : (outside + seg), outside + seg1, null, fcolor, 0) );
               geometry.faces.push( new THREE.Face3( inside + seg, outside + seg1, (layer===0) ? (outside + seg) : (inside + seg1), null, fcolor, 0) );
            }
         }
      }

      geometry.computeFaceNormals();

      return geometry;
   }

   JSROOT.GEO.createMatrix = function(matrix) {

      if (matrix === null) return null;

      var translation_matrix = null, rotation_matrix = null;

      if (matrix._typename == 'TGeoTranslation') {
         translation_matrix = matrix.fTranslation;
      }
      else if (matrix._typename == 'TGeoRotation') {
         rotation_matrix = matrix.fRotationMatrix;
      }
      else if (matrix._typename == 'TGeoCombiTrans') {
         translation_matrix = matrix.fTranslation;
         if (matrix.fRotation !== null)
            rotation_matrix = matrix.fRotation.fRotationMatrix;
      }
      else if (matrix._typename !== 'TGeoIdentity') {
      //   console.log('unsupported matrix ' + matrix._typename);
      }

      if ((translation_matrix === null) && (rotation_matrix === null)) return null;

      var res = new THREE.Matrix4();

      if (rotation_matrix !== null)
         res.set(rotation_matrix[0], rotation_matrix[1], rotation_matrix[2],   0,
                 rotation_matrix[3], rotation_matrix[4], rotation_matrix[5],   0,
                 rotation_matrix[6], rotation_matrix[7], rotation_matrix[8],   0,
                                  0,                  0,                  0,   1);

      if (translation_matrix !== null)
         res.setPosition(new THREE.Vector3(translation_matrix[0], translation_matrix[1], translation_matrix[2]));

      return res;
   }

   JSROOT.GEO.createComposite = function ( shape, faces_limit ) {

      if (faces_limit === undefined) faces_limit = 10000;

      var geom1 = JSROOT.GEO.createGeometry(shape.fNode.fLeft, faces_limit / 2);
      geom1.computeVertexNormals();
      var matrix1 = JSROOT.GEO.createMatrix(shape.fNode.fLeftMat);
      if (matrix1!==null) {
         if (matrix1.determinant() < -0.9) JSROOT.GEO.warn('Axis reflection in composite shape - not supported');
         geom1.applyMatrix(matrix1);
      }

      var geom2 = JSROOT.GEO.createGeometry(shape.fNode.fRight, faces_limit / 2);
      geom2.computeVertexNormals();
      var matrix2 = JSROOT.GEO.createMatrix(shape.fNode.fRightMat);
      if (matrix2 !== null) {
         if (matrix2.determinant() < -0.9) JSROOT.GEO.warn('Axis reflection in composite shape - not supported');
         geom2.applyMatrix(matrix2);
      }

      var bsp1 = new ThreeBSP(geom1);
      var bsp2 = new ThreeBSP(geom2);
      var bsp = null;

      if (shape.fNode._typename === 'TGeoIntersection')
         bsp = bsp1.intersect(bsp2);  // "*"
      else
      if (shape.fNode._typename === 'TGeoUnion')
         bsp = bsp1.union(bsp2);   // "+"
      else
      if (shape.fNode._typename === 'TGeoSubtraction')
         bsp = bsp1.subtract(bsp2); // "/"

      if (bsp === null) {
         JSROOT.GEO.warn('unsupported bool operation ' + shape.fNode._typename + ', use first geom');
         return geom1;
      }

      var res = bsp.toGeometry();

      // console.log('Composite shape left_faces ' + geom1.faces.length + ' right_faces ' + geom2.faces.length + '  res_faces ' + res.faces.length);

      return res;
   }


   JSROOT.GEO.createGeometry = function( shape, limit ) {

      switch (shape._typename) {
         case "TGeoBBox": return JSROOT.GEO.createCube( shape );
         case "TGeoPara": return JSROOT.GEO.createPara( shape );
         case "TGeoTrd1":
         case "TGeoTrd2": return JSROOT.GEO.createTrapezoid( shape );
         case "TGeoArb8":
         case "TGeoTrap":
         case "TGeoGtra": return JSROOT.GEO.createArb8( shape );
         case "TGeoSphere": return JSROOT.GEO.createSphere( shape, limit );
         case "TGeoCone":
         case "TGeoConeSeg":
         case "TGeoTube":
         case "TGeoTubeSeg":
         case "TGeoCtub": return JSROOT.GEO.createTube( shape );
         case "TGeoEltu": return JSROOT.GEO.createEltu( shape );
         case "TGeoTorus": return JSROOT.GEO.createTorus( shape, limit );
         case "TGeoPcon":
         case "TGeoPgon": return JSROOT.GEO.createPolygon( shape );
         case "TGeoXtru": return JSROOT.GEO.createXtru( shape );
         case "TGeoParaboloid": return JSROOT.GEO.createParaboloid( shape, limit );
         case "TGeoHype": return JSROOT.GEO.createHype( shape, limit );
         case "TGeoCompositeShape": return JSROOT.GEO.createComposite( shape, limit );
         case "TGeoShapeAssembly": return null;
      }

      return null;
   }

   JSROOT.GEO.VisibleByCamera = function(camera, matrix, shape) {
      return true;
   }

   return JSROOT;

}));
