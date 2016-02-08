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

      return new THREE.BoxGeometry( 2*shape['fDX'], 2*shape['fDY'], 2*shape['fDZ'] );

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

      var indicesOfFaces = [ 4,5,6,   4,7,6,   0,3,7,   7,4,0,
                             4,5,1,   1,0,4,   6,2,1,   1,5,6,
                             7,3,2,   2,6,7,   1,2,3,   3,0,1 ];

      var geom = new THREE.Geometry();

      for (var i = 0; i < verticesOfShape.length; i += 3)
         geom.vertices.push( new THREE.Vector3( verticesOfShape[i], verticesOfShape[i+1], verticesOfShape[i+2] ) );

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
            shape['fXY'][0][0], shape['fXY'][0][1], -shape['fDZ'],
            shape['fXY'][1][0], shape['fXY'][1][1], -shape['fDZ'],
            shape['fXY'][2][0], shape['fXY'][2][1], -shape['fDZ'],
            shape['fXY'][3][0], shape['fXY'][3][1], -shape['fDZ'],
            shape['fXY'][4][0], shape['fXY'][4][1],  shape['fDZ'],
            shape['fXY'][5][0], shape['fXY'][5][1],  shape['fDZ'],
            shape['fXY'][6][0], shape['fXY'][6][1],  shape['fDZ'],
            shape['fXY'][7][0], shape['fXY'][7][1],  shape['fDZ']
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
      for (var i = 0; i < 24; i += 3)
         geometry.vertices.push( new THREE.Vector3( verticesOfShape[i], verticesOfShape[i+1], verticesOfShape[i+2] ) );

      for (var i = 0; i < 36; i += 3)
         geometry.faces.push( new THREE.Face3( indicesOfFaces[i], indicesOfFaces[i+1], indicesOfFaces[i+2] ) );

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

      var outerSphere = new THREE.SphereGeometry( outerRadius, widthSegments, heightSegments,
                                                 phiStart*Math.PI/180, phiLength*Math.PI/180, thetaStart*Math.PI/180, thetaLength*Math.PI/180);
      outerSphere.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );

      var innerSphere = new THREE.SphereGeometry( innerRadius, widthSegments, heightSegments,
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
         thetaStart = shape['fPhi1'];
         thetaLength = shape['fPhi2'] - shape['fPhi1'];
      }

      var radiusSegments = Math.floor(thetaLength/6);
      if (radiusSegments < 4) radiusSegments = 4;

      var phi0 = thetaStart*Math.PI/180, dphi = thetaLength/radiusSegments*Math.PI/180;

      // calculate all sin/cos tables in advance
      var _sin = new Float32Array(radiusSegments+1),
          _cos = new Float32Array(radiusSegments+1);
      for (var seg=0; seg<=radiusSegments; ++seg) {
         var phi = phi0 + seg*dphi;
         _cos[seg] = Math.cos(phi);
         _sin[seg] = Math.sin(phi);
      }

      var geometry = new THREE.Geometry();

      // add inner tube vertices
      for (var seg=0; seg<=radiusSegments; ++seg)
         geometry.vertices.push( new THREE.Vector3( innerRadius1*_cos[seg], innerRadius1*_sin[seg], shape['fDZ']));
      for (var seg=0; seg<=radiusSegments; ++seg)
         geometry.vertices.push( new THREE.Vector3( innerRadius2*_cos[seg], innerRadius2*_sin[seg], -shape['fDZ']));

      var shift = geometry.vertices.length;

      // add outer tube vertices
      for (var seg=0; seg<=radiusSegments; ++seg)
         geometry.vertices.push( new THREE.Vector3( outerRadius1*_cos[seg], outerRadius1*_sin[seg], shape['fDZ']));
      for (var seg=0; seg<=radiusSegments; ++seg)
         geometry.vertices.push( new THREE.Vector3( outerRadius2*_cos[seg], outerRadius2*_sin[seg], -shape['fDZ']));


      // add inner tube faces
      for (var seg=0; seg<radiusSegments; ++seg) {
         geometry.faces.push( new THREE.Face3( seg, seg+radiusSegments+1, seg+radiusSegments+2 ) );
         geometry.faces.push( new THREE.Face3( seg, seg+radiusSegments+2, seg+1 ) );
      }

      // add outer tube faces
      for (var seg=shift; seg < shift+radiusSegments; ++seg) {
         geometry.faces.push( new THREE.Face3( seg, seg+radiusSegments+1, seg+radiusSegments+2 ) );
         geometry.faces.push( new THREE.Face3( seg, seg+radiusSegments+2, seg+1 ) );
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
      if (thetaLength !== 360) {
          geometry.faces.push( new THREE.Face3( 0, radiusSegments+1 , shift+radiusSegments+1 ) );
          geometry.faces.push( new THREE.Face3( 0, shift+radiusSegments+1, shift ) );

          geometry.faces.push( new THREE.Face3( radiusSegments, 2*radiusSegments+1, shift+2*radiusSegments+1 ) );
          geometry.faces.push( new THREE.Face3( radiusSegments, shift+2*radiusSegments+1, shift + radiusSegments ) );
      }

      geometry.computeFaceNormals();

      console.log(shape['_typename'] + ' vertices ' + geometry.vertices.length + ' faces ' + geometry.faces.length);

      return geometry;
   }

   JSROOT.GEO.createTorus = function( shape ) {
      var radius = shape['fR'];
      var innerTube = shape['fRmin'];
      var outerTube = shape['fRmax'];
      var arc = shape['fDphi'] - shape['fPhi1'];
      var rotation = shape['fPhi1'];
      var radialSegments = 30;
      var tubularSegments = Math.floor(arc/6);
      if (tubularSegments < 8) tubularSegments = 8;

      var geometry = new THREE.Geometry();

      var outerTorus = new THREE.TorusGeometry( radius, outerTube, radialSegments, tubularSegments, arc*Math.PI/180);
      outerTorus.applyMatrix( new THREE.Matrix4().makeRotationZ( rotation*Math.PI/180) );

      var innerTorus = new THREE.TorusGeometry( radius, innerTube, radialSegments, tubularSegments, arc*Math.PI/180);
      innerTorus.applyMatrix( new THREE.Matrix4().makeRotationZ( rotation*Math.PI/180 ) );

      // add inner torus
      for (var n=0; n < innerTorus.vertices.length; ++n)
         geometry.vertices.push(innerTorus.vertices[n]);

      for (var n=0; n < innerTorus.faces.length; ++n)
         geometry.faces.push(innerTorus.faces[n]);

      var shift = geometry.vertices.length;

      // add outer torus
      for (var n=0; n < outerTorus.vertices.length; ++n)
         geometry.vertices.push(outerTorus.vertices[n]);

      for (var n=0; n < outerTorus.faces.length; ++n) {
         var face = outerTorus.faces[n];
         face.a += shift; face.b += shift; face.c += shift;
         geometry.faces.push(face);
      }

      if (arc !== 360) {
         // one cuted side
         for (var j=0;j<radialSegments;j++) {
            var i1 = j*(tubularSegments+1);
            var i2 = (j+1)*(tubularSegments+1);
            geometry.faces.push( new THREE.Face3( i1, i2, i1+shift ) );
            geometry.faces.push( new THREE.Face3( i2, i2+shift, i1+shift));
         }

         // another cuted side
         for (var j=0;j<radialSegments;j++) {
            var i1 = (j+1)*(tubularSegments+1) - 1;
            var i2 = (j+2)*(tubularSegments+1) - 1;
            geometry.faces.push( new THREE.Face3( i1, i2, i1+shift ) );
            geometry.faces.push( new THREE.Face3( i2, i2+shift, i1+shift));
         }
      }

      geometry.computeFaceNormals();

      return geometry;
   }

   JSROOT.GEO.createPolygon = function( shape ) {

      // TODO: if same in/out radius on the top/bottom,
      //         skip duplicated vertices and zero faces

      var thetaStart = shape['fPhi1'], thetaLength = shape['fDphi'];

      var radiusSegments = 60;
      if ( shape['_typename'] == "TGeoPgon" ) {
         radiusSegments = shape['fNedges'];
      } else {
         radiusSegments = Math.floor(thetaLength/6);
         if (radiusSegments < 4) radiusSegments = 4;
      }

      var geometry = new THREE.Geometry();

      var phi0 = thetaStart*Math.PI/180, dphi = thetaLength/radiusSegments*Math.PI/180;

      // calculate all sin/cos tables in advance
      var _sin = new Float32Array(radiusSegments+1),
          _cos = new Float32Array(radiusSegments+1);
      for (var seg=0;seg<=radiusSegments;++seg) {
         var phi = phi0 + seg*dphi;
         _cos[seg] = Math.cos(phi);
         _sin[seg] = Math.sin(phi);
      }

      var indxs = [[],[]]; // remember indexes for each layer

      for (var side = 0; side < 2; ++side) {

         var rside = (side === 0) ? 'fRmax' : 'fRmin';
         var prev_indx = geometry.vertices.length;

         for (var layer=0; layer < shape.fNz; ++layer) {

            indxs[side][layer] = geometry.vertices.length;

            // first create points for the layer
            var layerz = shape['fZ'][layer], rad = shape[rside][layer];

            var only_end_sides = false;

            // same Z and R
            if ( (layer > 0) && ((shape['fZ'][layer-1] === layerz) && (shape[rside][layer-1] === rad)) ) {
               only_end_sides = true;
            } else
               // same R in next and previous layer
               if ( (layer > 0) && (layer < shape.fNz-1) &&
                     ((shape[rside][layer+1] === rad) && (shape[rside][layer-1] === rad)) ) only_end_sides = true;

            if (rad <= 0.) rad = 0.000001;

            if (only_end_sides) {
               if (thetaLength === 360) continue;
               geometry.vertices.push( new THREE.Vector3( rad*_cos[0], rad*_sin[0], layerz ));
               geometry.vertices.push( new THREE.Vector3( rad*_cos[radiusSegments], rad*_sin[radiusSegments], layerz ));
            } else {
               var curr_indx = geometry.vertices.length;

               // create vertices for the layer
               for (var seg=0; seg <= radiusSegments; ++seg)
                  geometry.vertices.push( new THREE.Vector3( rad*_cos[seg], rad*_sin[seg], layerz ));

               if (layer>0)  // create faces
                  for (var seg=0;seg<radiusSegments;++seg) {
                     geometry.faces.push( new THREE.Face3( prev_indx + seg, curr_indx + seg, curr_indx + seg + 1 ) );
                     geometry.faces.push( new THREE.Face3( prev_indx + seg, curr_indx + seg + 1, prev_indx + seg + 1));
                  }

                prev_indx = curr_indx;
            }
         }
         indxs[side].push(geometry.vertices.length);
      }

      // add faces for top and bottom side
      for (var top = 0; top < 2; ++top) {
         var inside = (top === 0) ? indxs[1][0] : indxs[1][shape.fNz-1];
         var outside = (top === 0) ? indxs[0][0] : indxs[0][shape.fNz-1];
         for (var seg=0; seg < radiusSegments; ++seg) {
            geometry.faces.push( new THREE.Face3( outside + seg, inside + seg, inside + seg + 1 ) );
            geometry.faces.push( new THREE.Face3( outside + seg, inside + seg + 1, outside + seg + 1));
         }
      }

      // add faces for cuted region
      if (thetaLength !== 360)
         for (var layer=1; layer < shape.fNz; ++layer) {
            if (shape['fZ'][layer-1] === shape['fZ'][layer]) continue;

            geometry.faces.push( new THREE.Face3( indxs[0][layer-1], indxs[1][layer-1], indxs[1][layer] ) );
            geometry.faces.push( new THREE.Face3( indxs[0][layer-1], indxs[1][layer], indxs[0][layer]) );
            geometry.faces.push( new THREE.Face3( indxs[0][layer]-1, indxs[1][layer]-1, indxs[1][layer+1]-1 ) );
            geometry.faces.push( new THREE.Face3( indxs[0][layer]-1, indxs[1][layer+1]-1, indxs[0][layer+1]-1 ) );
         }

      geometry.computeFaceNormals();

      console.log('pgon vertices ' + geometry.vertices.length + ' faces ' + geometry.faces.length);

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
