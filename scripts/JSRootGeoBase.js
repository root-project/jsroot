/// @file JSRootGeoBase.js
/// Basic functions for work with TGeo classes

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

   /// @namespace JSROOT.GEO
   /// Holder of all TGeo-related functions and classes
   JSROOT.GEO = {};

   /// @memberof JSROOT.GEO
   JSROOT.GEO.BITS = {
         kVisOverride     : JSROOT.BIT(0),           // volume's vis. attributes are overidden
         kVisNone         : JSROOT.BIT(1),           // the volume/node is invisible, as well as daughters
         kVisThis         : JSROOT.BIT(2),           // this volume/node is visible
         kVisDaughters    : JSROOT.BIT(3),           // all leaves are visible
         kVisOneLevel     : JSROOT.BIT(4),           // first level daughters are visible
         kVisStreamed     : JSROOT.BIT(5),           // true if attributes have been streamed
         kVisTouched      : JSROOT.BIT(6),           // true if attributes are changed after closing geom
         kVisOnScreen     : JSROOT.BIT(7),           // true if volume is visible on screen
         kVisContainers   : JSROOT.BIT(12),          // all containers visible
         kVisOnly         : JSROOT.BIT(13),          // just this visible
         kVisBranch       : JSROOT.BIT(14),          // only a given branch visible
         kVisRaytrace     : JSROOT.BIT(15)           // raytracing flag
      };


   JSROOT.GEO.TestBit = function(volume, f) {
      var att = volume.fGeoAtt;
      return att === undefined ? false : ((att & f) !== 0);
   }

   JSROOT.GEO.SetBit = function(volume, f, value) {
      if (volume.fGeoAtt === undefined) return;
      volume.fGeoAtt = value ? (volume.fGeoAtt | f) : (volume.fGeoAtt & ~f);
   }

   JSROOT.GEO.ToggleBit = function(volume, f) {
      if (volume.fGeoAtt !== undefined)
         volume.fGeoAtt = volume.fGeoAtt ^ (f & 0xffffff);
   }

   // method used to avoid duplication of warnings
   JSROOT.GEO.warn = function(msg) {
      if (JSROOT.GEO._warn_msgs === undefined) JSROOT.GEO._warn_msgs = {};
      if (JSROOT.GEO._warn_msgs[msg] !== undefined) return;
      JSROOT.GEO._warn_msgs[msg] = true;
      console.warn(msg);
   }

   JSROOT.GEO.NodeKind = function(obj) {
      // return kind of the geo nodes
      // 0 - TGeoNode
      // 1 - TEveGeoNode
      // -1 - unsupported type

      if ((obj === undefined) || (obj === null) || (typeof obj !== 'object')) return -1;

      return ('fShape' in obj) && ('fTrans' in obj) ? 1 : 0;
   }

   JSROOT.GEO.getNodeProperties = function(kind, node, visible) {
      // function return different properties for specified node
      // Only if node visible, material will be created

      if (kind === 1) {
         // special handling for EVE nodes

         var prop = { name: node.fName, nname: node.fName, shape: node.fShape, material: null, chlds: null };

         if (node.fElements !== null) prop.chlds = node.fElements.arr;

         if (visible) {
            var _transparent = false, _opacity = 1.0;
            if ( node.fRGBA[3] < 1.0) {
               _transparent = true;
               _opacity = node.fRGBA[3];
            }
            prop.fillcolor = new THREE.Color( node.fRGBA[0], node.fRGBA[1], node.fRGBA[2] );
            prop.material = new THREE.MeshLambertMaterial( { transparent: _transparent,
                             opacity: _opacity, wireframe: false, color: prop.fillcolor,
                             side: THREE.FrontSide /* THREE.DoubleSide*/, vertexColors: THREE.NoColors /*THREE.VertexColors */,
                             overdraw: 0. } );
            prop.material.alwaysTransparent = _transparent;
            prop.material.inherentOpacity = _opacity;
         }

         return prop;
      }

      var volume = node.fVolume;

      var prop = { name: volume.fName, nname: node.fName, volume: node.fVolume, shape: volume.fShape, material: null, chlds: null };

      if (node.fVolume.fNodes !== null) prop.chlds = node.fVolume.fNodes.arr;

      if (visible) {
         var _transparent = false, _opacity = 1.0;
         if ((volume.fFillColor > 1) && (volume.fLineColor == 1))
            prop.fillcolor = JSROOT.Painter.root_colors[volume.fFillColor];
         else
         if (volume.fLineColor >= 0)
            prop.fillcolor = JSROOT.Painter.root_colors[volume.fLineColor];

         if (volume.fMedium && volume.fMedium.fMaterial) {
            var fillstyle = volume.fMedium.fMaterial.fFillStyle;
            var transparency = (fillstyle < 3000 || fillstyle > 3100) ? 0 : fillstyle - 3000;
            if (transparency > 0) {
               _transparent = true;
               _opacity = (100.0 - transparency) / 100.0;
            }
            if (prop.fillcolor === undefined)
               prop.fillcolor = JSROOT.Painter.root_colors[volume.fMedium.fMaterial.fFillColor];
         }
         if (prop.fillcolor === undefined)
            prop.fillcolor = "lightgrey";

         prop.material = new THREE.MeshLambertMaterial( { transparent: _transparent,
                              opacity: _opacity, wireframe: false, color: prop.fillcolor,
                              side: THREE.FrontSide /* THREE.DoubleSide */, vertexColors: THREE.NoColors /*THREE.VertexColors*/,
                              overdraw: 0. } );
         prop.material.alwaysTransparent = _transparent;
         prop.material.inherentOpacity = _opacity;
      }

      return prop;
   }

   // ==========================================================================

   JSROOT.GEO.GeometryCreator = function(numfaces) {
      this.nfaces = numfaces;
      this.indx = 0;
      this.pos = new Float32Array(numfaces*9);
      this.norm = new Float32Array(numfaces*9);

      return this;
   }

   JSROOT.GEO.GeometryCreator.prototype.AddFace3 = function(x1,y1,z1,
                                                            x2,y2,z2,
                                                            x3,y3,z3) {
      var indx = this.indx, pos = this.pos;
      pos[indx] = x1;
      pos[indx+1] = y1;
      pos[indx+2] = z1;
      pos[indx+3] = x2;
      pos[indx+4] = y2;
      pos[indx+5] = z2;
      pos[indx+6] = x3;
      pos[indx+7] = y3;
      pos[indx+8] = z3;
      this.last4 = false;
      this.indx = indx + 9;
   }

   JSROOT.GEO.GeometryCreator.prototype.StartPolygon = function() {}
   JSROOT.GEO.GeometryCreator.prototype.StopPolygon = function() {}

   JSROOT.GEO.GeometryCreator.prototype.AddFace4 = function(x1,y1,z1,
                                                            x2,y2,z2,
                                                            x3,y3,z3,
                                                            x4,y4,z4,
                                                            reduce) {
      // from four vertices one normally creates two faces (1,2,3) and (1,3,4)
      // if (reduce==1), first face is reduced
      // if (reduce==2), second face is reduced

      var indx = this.indx, pos = this.pos;

      if (reduce!==1) {
         pos[indx] = x1;
         pos[indx+1] = y1;
         pos[indx+2] = z1;
         pos[indx+3] = x2;
         pos[indx+4] = y2;
         pos[indx+5] = z2;
         pos[indx+6] = x3;
         pos[indx+7] = y3;
         pos[indx+8] = z3;
         indx+=9;
      }

      if (reduce!==2) {
         pos[indx] = x1;
         pos[indx+1] = y1;
         pos[indx+2] = z1;
         pos[indx+3] = x3;
         pos[indx+4] = y3;
         pos[indx+5] = z3;
         pos[indx+6] = x4;
         pos[indx+7] = y4;
         pos[indx+8] = z4;
         indx+=9;
      }

      this.last4 = (indx !== this.indx + 9);
      this.indx = indx;
   }

   JSROOT.GEO.GeometryCreator.prototype.SetNormal4 = function(nx1,ny1,nz1,
                                                              nx2,ny2,nz2,
                                                              nx3,ny3,nz3,
                                                              nx4,ny4,nz4,
                                                              reduce) {
     // same as AddFace4, assign normals for each individual vertex
     // reduce has same meening and should be the same

      if (this.last4 && reduce)
         return console.error('missmatch between AddFace4 and SetNormal4 calls');

      var indx = this.indx - (this.last4 ? 18 : 9), norm = this.norm;

      if (reduce!==1) {
         norm[indx] = nx1;
         norm[indx+1] = ny1;
         norm[indx+2] = nz1;
         norm[indx+3] = nx2;
         norm[indx+4] = ny2;
         norm[indx+5] = nz2;
         norm[indx+6] = nx3;
         norm[indx+7] = ny3;
         norm[indx+8] = nz3;
         indx+=9;
      }

      if (reduce!==2) {
         norm[indx] = nx1;
         norm[indx+1] = ny1;
         norm[indx+2] = nz1;
         norm[indx+3] = nx3;
         norm[indx+4] = ny3;
         norm[indx+5] = nz3;
         norm[indx+6] = nx4;
         norm[indx+7] = ny4;
         norm[indx+8] = nz4;
      }
   }

   JSROOT.GEO.GeometryCreator.prototype.RecalcZ = function(func) {
      var pos = this.pos,
          last = this.indx,
          indx = last - (this.last4 ? 18 : 9);

      while (indx < last) {
         pos[indx+2] = func(pos[indx], pos[indx+1], pos[indx+2]);
         indx+=3;
      }
   }

   JSROOT.GEO.GeometryCreator.prototype.CalcNormal = function() {
      var indx = this.indx, norm = this.norm, cb = this.cb;

      if (!cb) {
         this.pA = new THREE.Vector3();
         this.pB = new THREE.Vector3();
         this.pC = new THREE.Vector3();
         cb = this.cb = new THREE.Vector3();
         this.ab = new THREE.Vector3();
      }

      this.pA.fromArray( this.pos, this.indx - 9 );
      this.pB.fromArray( this.pos, this.indx - 6 );
      this.pC.fromArray( this.pos, this.indx - 3 );

      cb.subVectors( this.pC, this.pB );
      this.ab.subVectors( this.pA, this.pB );
      cb.cross( this.ab );

      this.SetNormal(cb.x, cb.y, cb.z);
   }

   JSROOT.GEO.GeometryCreator.prototype.SetNormal = function(nx,ny,nz) {
      var indx = this.indx - 9, norm = this.norm;

      norm[indx]   = norm[indx+3] = norm[indx+6] = nx;
      norm[indx+1] = norm[indx+4] = norm[indx+7] = ny;
      norm[indx+2] = norm[indx+5] = norm[indx+8] = nz;

      if (this.last4) {
         indx -= 9;
         norm[indx]   = norm[indx+3] = norm[indx+6] = nx;
         norm[indx+1] = norm[indx+4] = norm[indx+7] = ny;
         norm[indx+2] = norm[indx+5] = norm[indx+8] = nz;
      }
   }

   JSROOT.GEO.GeometryCreator.prototype.SetNormal_12_34 = function(nx12,ny12,nz12,nx34,ny34,nz34) {
      // special shortcut, when same normals can be applied for 1-2 point and 3-4 point
      if (!this.last4)
         return console.error('can not use SetNormal_12_34 if not face4');

      var indx = this.indx - 18, norm = this.norm;

      norm[indx]   = norm[indx+3] = norm[indx+9]  = nx12;
      norm[indx+1] = norm[indx+4] = norm[indx+10] = ny12;
      norm[indx+2] = norm[indx+5] = norm[indx+11] = nz12;

      norm[indx+6] = norm[indx+12] = norm[indx+15] = nx34;
      norm[indx+7] = norm[indx+13] = norm[indx+16] = ny34;
      norm[indx+8] = norm[indx+14] = norm[indx+17] = nz34;
   }


   JSROOT.GEO.GeometryCreator.prototype.Create = function() {
      if (this.nfaces !== this.indx/9)
         console.error('Mismatch with created ' + this.nfaces + ' and filled ' + this.indx/9 + ' number of faces');

      var geometry = new THREE.BufferGeometry();
      geometry.addAttribute( 'position', new THREE.BufferAttribute( this.pos, 3 ) );
      geometry.addAttribute( 'normal', new THREE.BufferAttribute( this.norm, 3 ) );
      return geometry;
   }

   // ================================================================================

   // same methods as GeometryCreator, but this different implementation

   JSROOT.GEO.PolygonsCreator = function() {
      this.polygons = [];
   }

   JSROOT.GEO.PolygonsCreator.prototype.StartPolygon = function() {
      return;
      this.multi = 1;
      this.mleft = [];
      this.mright = [];
   }

   JSROOT.GEO.PolygonsCreator.prototype.StopPolygon = function() {
      if (!this.multi) return;
      if (this.mleft.length + this.mright.length > 2) {
         var polygon = new ThreeBSP.Polygon;
         for (var n=0;n<this.mleft.length;++n)
            polygon.vertices.push(this.mleft[n]);
         for (var n=this.mright.length-1;n>=0;--n)
            polygon.vertices.push(this.mright[n]);

         console.log('polygon ',polygon.vertices.length);

         this.polygons.push(polygon);
      }

      this.multi = 0;
      this.mleft = this.mright = null;
   }


   JSROOT.GEO.PolygonsCreator.prototype.AddFace4 = function(x1,y1,z1,
                                                            x2,y2,z2,
                                                            x3,y3,z3,
                                                            x4,y4,z4,
                                                            reduce) {
      // from four vertices one normaly creates two faces (1,2,3) and (1,3,4)
      // if (reduce==1), first face is reduced
      //  if (reduce==2), second face is reduced

      if (reduce === undefined) reduce = 0;

      if (this.multi===2) {
         // place where we can repair logic
         var lv3 = this.mleft[1], lv4 = this.mright[1];

         if ((lv3.x !== x2) || (lv3.y !== y2) || (lv3.z !== z2) ||
             (lv4.x !== x1) || (lv4.y !== y1) || (lv4.z !== z1)) {
            // fail to contstruct polygon, try to create as expected

            console.log('try to repair with the polygon');

            this.multi = 0;
            this.mleft = this.mright = null;
            var polygon = new ThreeBSP.Polygon;
            polygon.vertices.push(this.v1, this.v2, this.v3, this.v4);
            this.polygons.push(polygon);
         }
      }


      this.v1 = new ThreeBSP.Vertex( x1, y1, z1 );
      this.v2 = new ThreeBSP.Vertex( x2, y2, z2 );
      this.v3 = new ThreeBSP.Vertex( x3, y3, z3 );
      this.v4 = new ThreeBSP.Vertex( x4, y4, z4 );

      this.reduce = reduce;

      if (this.multi) {
         //console.log('v1:' + x1.toFixed(1) + ':' + y1.toFixed(1) + ':'+ z1.toFixed(1));
         //console.log('v2:' + x2.toFixed(1) + ':' + y2.toFixed(1) + ':'+ z2.toFixed(1));
         //console.log('v3:' + x3.toFixed(1) + ':' + y3.toFixed(1) + ':'+ z3.toFixed(1));
         //console.log('v4:' + x4.toFixed(1) + ':' + y4.toFixed(1) + ':'+ z4.toFixed(1));

         if (reduce!==0) console.error('polygon not yet supported for reduced surfaces')

         if (this.multi++ === 1) {
            this.mleft.push(this.v2);
            this.mright.push(this.v1);
         } else {
            // just to ensure that everything correct
            var lv3 = this.mleft[this.mleft.length-1],
                lv4 = this.mright[this.mright.length-1];

            if ((lv3.x !== x2) || (lv3.y !== y2) || (lv3.z !== z2))
               console.error('vertex missmatch when building polygon');

            if ((lv4.x !== x1) || (lv4.y !== y1) || (lv4.z !== z1))
               console.error('vertex missmatch when building polygon');
         }

         this.mleft.push(this.v3);
         this.mright.push(this.v4);
         return;
      }

      var polygon = new ThreeBSP.Polygon;

      switch (reduce) {
         case 0: polygon.vertices.push(this.v1, this.v2, this.v3, this.v4); break;
         case 1: polygon.vertices.push(this.v1, this.v3, this.v4); break;
         case 2: polygon.vertices.push(this.v1, this.v2, this.v3); break;
      }

      this.polygons.push(polygon);
   }

   JSROOT.GEO.PolygonsCreator.prototype.SetNormal4 = function(nx1,ny1,nz1,
                                                              nx2,ny2,nz2,
                                                              nx3,ny3,nz3,
                                                              nx4,ny4,nz4,
                                                              reduce) {
      this.v1.normal.set(nx1,ny1,nz1);
      this.v2.normal.set(nx2,ny2,nz2);
      this.v3.normal.set(nx3,ny3,nz3);
      this.v4.normal.set(nx4,ny4,nz4);
   }

   JSROOT.GEO.PolygonsCreator.prototype.SetNormal_12_34 = function(nx12,ny12,nz12,nx34,ny34,nz34) {
      // special shortcut, when same normals can be applied for 1-2 point and 3-4 point
      this.v1.normal.set(nx12,ny12,nz12);
      this.v2.normal.set(nx12,ny12,nz12);
      this.v3.normal.set(nx34,ny34,nz34);
      this.v4.normal.set(nx34,ny34,nz34);
   }

   JSROOT.GEO.PolygonsCreator.prototype.CalcNormal = function() {

      if (!this.cb) {
         this.pA = new THREE.Vector3();
         this.pB = new THREE.Vector3();
         this.pC = new THREE.Vector3();
         this.cb = new THREE.Vector3();
         this.ab = new THREE.Vector3();
      }

      this.pA.set( this.v1.x, this.v1.y, this.v1.z);

      if (this.reduce!==1) {
         this.pB.set( this.v2.x, this.v2.y, this.v2.z);
         this.pC.set( this.v3.x, this.v3.y, this.v3.z);
      } else {
         this.pB.set( this.v3.x, this.v3.y, this.v3.z);
         this.pC.set( this.v4.x, this.v4.y, this.v4.z);
      }

      this.cb.subVectors( this.pC, this.pB );
      this.ab.subVectors( this.pA, this.pB );
      this.cb.cross( this.ab );

      this.SetNormal(this.cb.x, this.cb.y, this.cb.z);
   }


   JSROOT.GEO.PolygonsCreator.prototype.SetNormal = function(nx,ny,nz) {
      this.v1.normal.set(nx,ny,nz);
      this.v2.normal.set(nx,ny,nz);
      this.v3.normal.set(nx,ny,nz);
      this.v4.normal.set(nx,ny,nz);
   }

   JSROOT.GEO.GeometryCreator.prototype.RecalcZ = function(func) {
      this.v1.z = func(this.v1.x, this.v1.y, this.v1.z);
      this.v2.z = func(this.v2.x, this.v2.y, this.v2.z);
      this.v3.z = func(this.v3.x, this.v3.y, this.v3.z);
      this.v4.z = func(this.v4.x, this.v4.y, this.v4.z);
   }


   JSROOT.GEO.PolygonsCreator.prototype.Create = function() {
      return { polygons: this.polygons };
   }

   // ================= all functions to create geometry ===================================

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


   JSROOT.GEO.createCubeBuffer = function( shape, face_limit, return_bsp ) {

      var dx = shape.fDX, dy = shape.fDY, dz = shape.fDZ;

      var creator = (return_bsp || (face_limit!==undefined)) ? new JSROOT.GEO.PolygonsCreator : new JSROOT.GEO.GeometryCreator(12);

      // var creator = new JSROOT.GEO.GeometryCreator(12);

      creator.AddFace4(dx,dy,dz, dx,-dy,dz, dx,-dy,-dz, dx,dy,-dz); creator.SetNormal(1,0,0);

      creator.AddFace4(-dx,dy,-dz, -dx,-dy,-dz, -dx,-dy,dz, -dx,dy,dz); creator.SetNormal(-1,0,0);

      creator.AddFace4(-dx,dy,-dz, -dx,dy,dz, dx,dy,dz, dx,dy,-dz); creator.SetNormal(0,1,0);

      creator.AddFace4(-dx,-dy,dz, -dx,-dy,-dz, dx,-dy,-dz, dx,-dy,dz); creator.SetNormal(0,-1,0);

      creator.AddFace4(-dx,dy,dz, -dx,-dy,dz, dx,-dy,dz, dx,dy,dz); creator.SetNormal(0,0,1);

      creator.AddFace4(dx,dy,-dz, dx,-dy,-dz, -dx,-dy,-dz, -dx,dy,-dz); creator.SetNormal(0,0,-1);

      return creator.Create();
   }


   JSROOT.GEO.createCubeBufferPrev = function( shape ) {
      var vertices = [
        shape.fDX,  shape.fDY,  shape.fDZ,
        shape.fDX,  shape.fDY, -shape.fDZ,
        shape.fDX, -shape.fDY,  shape.fDZ,
        shape.fDX, -shape.fDY, -shape.fDZ,
       -shape.fDX,  shape.fDY, -shape.fDZ,
       -shape.fDX,  shape.fDY,  shape.fDZ,
       -shape.fDX, -shape.fDY, -shape.fDZ,
       -shape.fDX, -shape.fDY,  shape.fDZ];

      var indicies = [0,2,1, 2,3,1, 4,6,5, 6,7,5, 4,5,1, 5,0,1, 7,6,2, 6,3,2, 5,7,0, 7,2,0, 1,3,4, 3,6,4];

      // normals for each  pair of faces
      var normals = [ 1,0,0, -1,0,0, 0,1,0, 0,-1,0, 0,0,1,  0,0,-1 ];

      var buf_pos = new Float32Array(indicies.length*3),
          buf_norm = new Float32Array(indicies.length*3);

      var indx = 0, indx_norm = 0;
      for (var n=0; n < indicies.length; ++n) {
         var v = indicies[n] * 3;
         buf_pos[indx] = vertices[v];
         buf_pos[indx+1] = vertices[v+1];
         buf_pos[indx+2] = vertices[v+2];

         buf_norm[indx] = normals[indx_norm];
         buf_norm[indx+1] = normals[indx_norm+1];
         buf_norm[indx+2] = normals[indx_norm+2];

         indx+=3;
         if (indx % 18 === 0) indx_norm+=3;
      }

      // console.log('indx', indx, 'len', indicies.length*3, 'indx_normal',indx_norm,'len', normals.length);

      var geometry = new THREE.BufferGeometry();
      geometry.addAttribute( 'position', new THREE.BufferAttribute( buf_pos, 3 ) );
      geometry.addAttribute( 'normal', new THREE.BufferAttribute( buf_norm, 3 ) );

      return geometry;
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

   JSROOT.GEO.createParaBuffer = function( shape ) {

      var txy = shape.fTxy, txz = shape.fTxz, tyz = shape.fTyz;

      var vertices = [
          -shape.fZ*txz-txy*shape.fY-shape.fX, -shape.fY-shape.fZ*tyz,  -shape.fZ,
          -shape.fZ*txz+txy*shape.fY-shape.fX,  shape.fY-shape.fZ*tyz,  -shape.fZ,
          -shape.fZ*txz+txy*shape.fY+shape.fX,  shape.fY-shape.fZ*tyz,  -shape.fZ,
          -shape.fZ*txz-txy*shape.fY+shape.fX, -shape.fY-shape.fZ*tyz,  -shape.fZ,
           shape.fZ*txz-txy*shape.fY-shape.fX, -shape.fY+shape.fZ*tyz,   shape.fZ,
           shape.fZ*txz+txy*shape.fY-shape.fX,  shape.fY+shape.fZ*tyz,   shape.fZ,
           shape.fZ*txz+txy*shape.fY+shape.fX,  shape.fY+shape.fZ*tyz,   shape.fZ,
           shape.fZ*txz-txy*shape.fY+shape.fX, -shape.fY+shape.fZ*tyz,   shape.fZ ];

      var indicies = [ 4,6,5,   4,7,6,   0,3,7,   7,4,0,
                       4,5,1,   1,0,4,   6,2,1,   1,5,6,
                       7,3,2,   2,6,7,   1,2,3,   3,0,1 ];

      var buf_pos = new Float32Array(indicies.length*3);

      var indx = 0;
      for (var n=0; n < indicies.length; ++n) {
         var v = indicies[n] * 3;
         buf_pos[indx] = vertices[v];
         buf_pos[indx+1] = vertices[v+1];
         buf_pos[indx+2] = vertices[v+2];
         indx+=3;
      }

      var geometry = new THREE.BufferGeometry();
      geometry.addAttribute( 'position', new THREE.BufferAttribute( buf_pos, 3 ) );
      geometry.computeVertexNormals();
      return geometry;
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


   JSROOT.GEO.createTrapezoidBuffer = function( shape ) {
      var y1, y2;
      if (shape._typename == "TGeoTrd1") {
         y1 = y2 = shape.fDY;
      } else {
         y1 = shape.fDy1; y2 = shape.fDy2;
      }

      var vertices = [
            -shape.fDx1,  y1, -shape.fDZ,
             shape.fDx1,  y1, -shape.fDZ,
             shape.fDx1, -y1, -shape.fDZ,
            -shape.fDx1, -y1, -shape.fDZ,
            -shape.fDx2,  y2,  shape.fDZ,
             shape.fDx2,  y2,  shape.fDZ,
             shape.fDx2, -y2,  shape.fDZ,
            -shape.fDx2, -y2,  shape.fDZ
         ];

      var indicies = [
          4,6,5,   4,7,6,   0,3,7,   7,4,0,
          4,5,1,   1,0,4,   6,2,1,   1,5,6,
          7,3,2,   2,6,7,   1,2,3,   3,0,1 ];

      var buf_pos = new Float32Array(indicies.length*3);

      var indx = 0;
      for (var n=0; n < indicies.length; ++n) {
         var v = indicies[n] * 3;
         buf_pos[indx] = vertices[v];
         buf_pos[indx+1] = vertices[v+1];
         buf_pos[indx+2] = vertices[v+2];
         indx+=3;
      }

      var geometry = new THREE.BufferGeometry();
      geometry.addAttribute( 'position', new THREE.BufferAttribute( buf_pos, 3 ) );
      geometry.computeVertexNormals();
      return geometry;
   }


   JSROOT.GEO.createArb8 = function( shape ) {

      var vertices = [
           shape.fXY[0][0], shape.fXY[0][1], -shape.fDZ,
           shape.fXY[1][0], shape.fXY[1][1], -shape.fDZ,
           shape.fXY[2][0], shape.fXY[2][1], -shape.fDZ,
           shape.fXY[3][0], shape.fXY[3][1], -shape.fDZ,
           shape.fXY[4][0], shape.fXY[4][1],  shape.fDZ,
           shape.fXY[5][0], shape.fXY[5][1],  shape.fDZ,
           shape.fXY[6][0], shape.fXY[6][1],  shape.fDZ,
           shape.fXY[7][0], shape.fXY[7][1],  shape.fDZ
      ];
      var indicies = [
                      4,6,5,   4,7,6,   0,3,7,   7,4,0,
                      4,5,1,   1,0,4,   6,2,1,   1,5,6,
                      7,3,2,   2,6,7,   1,2,3,   3,0,1 ];

      // detect same vertecies
      for (var n=3; n<vertices.length; n+=3) {
         if ((vertices[n-3] === vertices[n]) &&
             (vertices[n-2] === vertices[n+1]) &&
             (vertices[n-1] === vertices[n+2])) {
                for (var k=0;k<indicies.length;++k)
                   if (indicies[k] === n/3) indicies[k] = n/3-1;
            }
         }


      // detect duplicated faces or faces with same vertex
      var map = []; // list of existing faces (with all rotations
      var usage = [0,0,0,0,0,0,0,0]; // usage counter

      for (var k=0;k<indicies.length;k+=3) {
         var id1 = indicies[k]*100   + indicies[k+1]*10 + indicies[k+2],
             id2 = indicies[k+1]*100 + indicies[k+2]*10 + indicies[k],
             id3 = indicies[k+2]*100 + indicies[k]*10   + indicies[k+1];

         if ((indicies[k] == indicies[k+1]) || (indicies[k] == indicies[k+2]) || (indicies[k+1] == indicies[k+2]) ||
             (map.indexOf(id1)>=0) || (map.indexOf(id2)>=0) || (map.indexOf(id3)>=0)) {
            indicies[k] = indicies[k+1] = indicies[k+2] = -1;
         } else {
            map.push(id1,id2,id3);
            usage[indicies[k]]++;
            usage[indicies[k+1]]++;
            usage[indicies[k+2]]++;
         }
      }

      var geometry = new THREE.Geometry();
      for (var i = 0; i < 8; ++i) {
         if (usage[i] > 0) {
            usage[i] = geometry.vertices.length; // use array to remap old vertices
            geometry.vertices.push( new THREE.Vector3( vertices[i*3], vertices[i*3+1], vertices[i*3+2] ) );
         }
         else {
            usage[i] = -1;
         }
      }

      var color = new THREE.Color();

      for (var i = 0; i < 36; i += 3) {
         if (indicies[i]<0) continue;

         var a = usage[indicies[i]],
             b = usage[indicies[i+1]],
             c = usage[indicies[i+2]];

         geometry.faces.push( new THREE.Face3( a, b, c, null, color, 0 ) );
      }

      geometry.computeFaceNormals();
      return geometry;
   }

   JSROOT.GEO.createArb8Buffer = function( shape ) {

      var vertices = [
            shape.fXY[0][0], shape.fXY[0][1], -shape.fDZ,
            shape.fXY[1][0], shape.fXY[1][1], -shape.fDZ,
            shape.fXY[2][0], shape.fXY[2][1], -shape.fDZ,
            shape.fXY[3][0], shape.fXY[3][1], -shape.fDZ,
            shape.fXY[4][0], shape.fXY[4][1],  shape.fDZ,
            shape.fXY[5][0], shape.fXY[5][1],  shape.fDZ,
            shape.fXY[6][0], shape.fXY[6][1],  shape.fDZ,
            shape.fXY[7][0], shape.fXY[7][1],  shape.fDZ
         ];

      var indicies = [
          4,6,5,   4,7,6,   0,3,7,   7,4,0,
          4,5,1,   1,0,4,   6,2,1,   1,5,6,
          7,3,2,   2,6,7,   1,2,3,   3,0,1 ];

      // detect same vertecies
      for (var n=3; n<vertices.length; n+=3) {
         if ((vertices[n-3] === vertices[n]) &&
             (vertices[n-2] === vertices[n+1]) &&
             (vertices[n-1] === vertices[n+2])) {
                for (var k=0;k<indicies.length;++k)
                   if (indicies[k] === n/3) indicies[k] = n/3-1;
            }
         }


      var map = []; // list of existing faces (with all rotations)
      var numfaces = 0;

      for (var k=0;k<indicies.length;k+=3) {
         var id1 = indicies[k]*100   + indicies[k+1]*10 + indicies[k+2],
             id2 = indicies[k+1]*100 + indicies[k+2]*10 + indicies[k],
             id3 = indicies[k+2]*100 + indicies[k]*10   + indicies[k+1];

         if ((indicies[k] == indicies[k+1]) || (indicies[k] == indicies[k+2]) || (indicies[k+1] == indicies[k+2]) ||
             (map.indexOf(id1)>=0) || (map.indexOf(id2)>=0) || (map.indexOf(id3)>=0)) {
            indicies[k] = indicies[k+1] = indicies[k+2] = -1;
         } else {
            map.push(id1,id2,id3);
            numfaces++;
         }
      }

      var buf_pos = new Float32Array(numfaces*9);

      var indx = 0;
      for (var n=0; n < indicies.length; ++n) {
         if (indicies[n] < 0) continue;
         var v = indicies[n] * 3;
         buf_pos[indx] = vertices[v];
         buf_pos[indx+1] = vertices[v+1];
         buf_pos[indx+2] = vertices[v+2];
         indx+=3;
      }

      var geometry = new THREE.BufferGeometry();
      geometry.addAttribute( 'position', new THREE.BufferAttribute( buf_pos, 3 ) );
      geometry.computeVertexNormals();
      return geometry;
   }



   JSROOT.GEO.createSphere = function( shape, faces_limit ) {
      var outerRadius = shape.fRmax,
          innerRadius = shape.fRmin,
          phiStart = shape.fPhi1 + 180,
          phiLength = shape.fPhi2 - shape.fPhi1,
          thetaStart = shape.fTheta1,
          thetaLength = shape.fTheta2 - shape.fTheta1,
          widthSegments = shape.fNseg,
          heightSegments = shape.fNz;

      var noInside = (innerRadius <= 0);

      while (phiStart >= 360) phiStart-=360;

      if (faces_limit !== undefined) {

         console.log('create sphere ' + outerRadius + ' ' + innerRadius + ' nseg ' + widthSegments + ":" +  heightSegments + ' expected ' + (noInside ? 2 : 4) * widthSegments * heightSegments);
         console.log('phi ' + phiStart + ' : ' + phiLength + '  theta ' + thetaStart + ' : ' + thetaLength);

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

      /*
      for (var n=0;n<2;n++) {
         var face = geometry.faces[n],
             v1 = geometry.vertices[face.a],
             v2 = geometry.vertices[face.b],
             v3 = geometry.vertices[face.c];
         console.log(n,'v1', v1.x.toFixed(2), v1.y.toFixed(2), v1.z.toFixed(2));
         console.log(n,'v2', v2.x.toFixed(2), v2.y.toFixed(2), v2.z.toFixed(2));
         console.log(n,'v3', v3.x.toFixed(2), v3.y.toFixed(2), v3.z.toFixed(2));
      }

      this.createSphereBuffer(shape, undefined);
      */

      return geometry;
   }


   JSROOT.GEO.createSphereBuffer = function( shape, faces_limit, return_bsp ) {
      var radius = [shape.fRmax, shape.fRmin],
          phiStart = shape.fPhi1,
          phiLength = shape.fPhi2 - shape.fPhi1,
          thetaStart = shape.fTheta1,
          thetaLength = shape.fTheta2 - shape.fTheta1,
          widthSegments = shape.fNseg,
          heightSegments = shape.fNz;

      var noInside = (radius[1] <= 0);

      //phiStart = 0; phiLength = 360; thetaStart = 0;  thetaLength = 180;

      if (faces_limit !== undefined) {
         var fact = (noInside ? 2 : 4) * widthSegments * heightSegments / faces_limit;

         if (fact > 1.) {
            widthSegments = Math.max(4, Math.floor(widthSegments/Math.sqrt(fact)));
            heightSegments = Math.max(4, Math.floor(heightSegments/Math.sqrt(fact)));
         }
      }

      var _sinp = new Float32Array(widthSegments+1),
          _cosp = new Float32Array(widthSegments+1),
          _sint = new Float32Array(heightSegments+1),
          _cost = new Float32Array(heightSegments+1);

      for (var n=0;n<=heightSegments;++n) {
         var theta = (thetaStart + thetaLength/heightSegments*n)*Math.PI/180;
         _sint[n] = Math.sin(theta);
         _cost[n] = Math.cos(theta);
      }

      for (var n=0;n<=widthSegments;++n) {
         var phi = (phiStart + phiLength/widthSegments*n)*Math.PI/180;
         _sinp[n] = Math.sin(phi);
         _cosp[n] = Math.cos(phi);
      }

      var numoutside = widthSegments * heightSegments * 2,
          numtop = widthSegments * 2,
          numbottom = widthSegments * 2,
          numcut = 0;

      if (phiLength < 360)
         numcut = heightSegments * (noInside ? 2 : 4);

      if (noInside) numbottom = numtop = widthSegments;

      if (_sint[0] === 0) { numoutside -= widthSegments; numtop = 0; }
      if (_sint[heightSegments] === 0) { numoutside -= widthSegments; numbottom = 0; }

      var numfaces = numoutside * (noInside ? 1 : 2) + numtop + numbottom + numcut;

      var creator = (return_bsp || (faces_limit!==undefined)) ? new JSROOT.GEO.PolygonsCreator : new JSROOT.GEO.GeometryCreator(numfaces);

      // var creator = new JSROOT.GEO.GeometryCreator(numfaces);

      for (var side=0;side<2;++side) {
         if ((side===1) && noInside) break;

         var r = radius[side],
             s = (side===0) ? 1 : -1,
             d1 = 1 - side, d2 = 1 - d1;

         // use direct algorithm for the sphere - here normals and position can be calculated direclty
         for (var k=0;k<heightSegments;++k) {

            var k1 = k + d1, k2 = k + d2;

            var skip = 0;
            if (_sint[k1] === 0) skip = 1; else
            if (_sint[k2] === 0) skip = 2;

            for (var n=0;n<widthSegments;++n) {
               creator.AddFace4(
                     r*_sint[k1]*_cosp[n],   r*_sint[k1] *_sinp[n],   r*_cost[k1],
                     r*_sint[k1]*_cosp[n+1], r*_sint[k1] *_sinp[n+1], r*_cost[k1],
                     r*_sint[k2]*_cosp[n+1], r*_sint[k2] *_sinp[n+1], r*_cost[k2],
                     r*_sint[k2]*_cosp[n],   r*_sint[k2] *_sinp[n],   r*_cost[k2],
                     skip);
               creator.SetNormal4(
                     s*_sint[k1]*_cosp[n],   s*_sint[k1] *_sinp[n],   s*_cost[k1],
                     s*_sint[k1]*_cosp[n+1], s*_sint[k1] *_sinp[n+1], s*_cost[k1],
                     s*_sint[k2]*_cosp[n+1], s*_sint[k2] *_sinp[n+1], s*_cost[k2],
                     s*_sint[k2]*_cosp[n],   s*_sint[k2] *_sinp[n],   s*_cost[k2],
                     skip);
            }
         }
      }
      /*
      var pos = creator.pos;
      for (var n=0;n<2 && pos;n++) {
         var k = n*9;
         console.log(n,'v1', pos[k].toFixed(2),  pos[k+1].toFixed(2),pos[k+2].toFixed(2));
         console.log(n,'v2', pos[k+3].toFixed(2),pos[k+4].toFixed(2),pos[k+5].toFixed(2));
         console.log(n,'v3', pos[k+6].toFixed(2),pos[k+7].toFixed(2),pos[k+8].toFixed(2));
      }
      */

      // top/bottom
      for (var side=0; side<=heightSegments; side+=heightSegments)
         if (_sint[side] !== 0) {
            var ss = _sint[side], cc = _cost[side],
                d1 = (side===0) ? 0 : 1, d2 = 1 - d1;
            for (var n=0;n<widthSegments;++n) {
               creator.AddFace4(
                     radius[1] * ss * _cosp[n+d1], radius[1] * ss * _sinp[n+d1], radius[1] * cc,
                     radius[0] * ss * _cosp[n+d1], radius[0] * ss * _sinp[n+d1], radius[0] * cc,
                     radius[0] * ss * _cosp[n+d2], radius[0] * ss * _sinp[n+d2], radius[0] * cc,
                     radius[1] * ss * _cosp[n+d2], radius[1] * ss * _sinp[n+d2], radius[1] * cc,
                     noInside ? 2 : 0);
               creator.CalcNormal();
            }
         }

      // cut left/right sides
      if (phiLength < 360) {
         for (var side=0;side<=widthSegments;side+=widthSegments) {
            var ss = _sinp[side], cc = _cosp[side],
                d1 = (side === 0) ? 1 : 0, d2 = 1 - d1;

            //if (!noInside) creator.StartPolygon();
            for (var k=0;k<heightSegments;++k) {
               creator.AddFace4(
                     radius[1] * _sint[k+d1] * cc, radius[1] * _sint[k+d1] * ss, radius[1] * _cost[k+d1],
                     radius[0] * _sint[k+d1] * cc, radius[0] * _sint[k+d1] * ss, radius[0] * _cost[k+d1],
                     radius[0] * _sint[k+d2] * cc, radius[0] * _sint[k+d2] * ss, radius[0] * _cost[k+d2],
                     radius[1] * _sint[k+d2] * cc, radius[1] * _sint[k+d2] * ss, radius[1] * _cost[k+d2],
                     noInside ? 2 : 0);
               creator.CalcNormal();
            }
            //if (!noInside) creator.StopPolygon();
         }
      }

      // console.log('Sphere numfaces', numfaces);

      return creator.Create();
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
            if (vertex.z<0) vertex.z = -shape.fDz-(vertex.x*shape.fNlow[0]+vertex.y*shape.fNlow[1])/shape.fNlow[2];
                       else vertex.z = shape.fDz-(vertex.x*shape.fNhigh[0]+vertex.y*shape.fNhigh[1])/shape.fNhigh[2];
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


   JSROOT.GEO.createTubeBuffer = function( shape, faces_limit, return_bsp) {
      var outerR, innerR; // inner/outer tube radius
      if ((shape._typename == "TGeoCone") || (shape._typename == "TGeoConeSeg")) {
         outerR = [ shape.fRmax2, shape.fRmax1 ];
         innerR = [ shape.fRmin2, shape.fRmin1 ];
      } else {
         outerR = [ shape.fRmax, shape.fRmax ];
         innerR = [ shape.fRmin, shape.fRmin ];
      }

      var hasrmin = (innerR[0] > 0) || (innerR[1] > 0);

      if (hasrmin) {
         if (innerR[0] <= 0) { innerR[0] = Math.min(outerR[0] * 1e-5, 1e-5); JSROOT.GEO.warn('zero inner radius1 in tube - not yet supported'); }
         if (innerR[1] <= 0) { innerR[1] = Math.min(outerR[1] * 1e-5, 1e-5); JSROOT.GEO.warn('zero inner radius2 in tube - not yet supported'); }
      }

      var thetaStart = 0, thetaLength = 360;
      if ((shape._typename == "TGeoConeSeg") || (shape._typename == "TGeoTubeSeg") || (shape._typename == "TGeoCtub")) {
         thetaStart = shape.fPhi1;
         thetaLength = shape.fPhi2 - shape.fPhi1;
      }

      var radiusSegments = Math.max(5, Math.floor(thetaLength/6) + 1);

      var phi0 = thetaStart*Math.PI/180, dphi = thetaLength/(radiusSegments-1)*Math.PI/180;

      // calculate all sin/cos tables in advance
      var _sin = new Float32Array(radiusSegments),
          _cos = new Float32Array(radiusSegments);
      for (var seg=0; seg<radiusSegments; ++seg) {
         _cos[seg] = Math.cos(phi0+seg*dphi);
         _sin[seg] = Math.sin(phi0+seg*dphi);
      }


      var numfaces = (radiusSegments-1) * (hasrmin ? 4 : 2) +
                     (radiusSegments-1) * (hasrmin ? 4 : 2) +
                     (thetaLength < 360 ? 4 : 0);

      var creator = (return_bsp || (faces_limit!==undefined)) ? new JSROOT.GEO.PolygonsCreator : new JSROOT.GEO.GeometryCreator(numfaces);

      // var creator = new JSROOT.GEO.GeometryCreator(numfaces);

      var calcZ;

      if (shape._typename == "TGeoCtub")
         calcZ = function(x,y,z) {
            var arr = (z<0) ? shape.fNlow : shape.fNhigh;
            return ((z<0) ? -shape.fDz : shape.fDz) - (x*arr[0] + y*arr[1]) / arr[2];
         }

      // create outer/inner tube
      for (var side = 0; side<2; ++side) {
         if ((side === 1) && !hasrmin) break;

         var R = (side === 0) ? outerR : innerR,
             d1 = side, d2 = 1 - side, nxy = 1., nz = 0;

         if (R[0] !== R[1]) {
            var angle = Math.atan2((R[1]-R[0]), 2*shape.fDZ);
            nxy = Math.cos(angle);
            nz = Math.sin(angle);
         }

         if (side === 1) { nxy *= -1; nz *= -1; };

         for (var seg=0;seg<radiusSegments-1;++seg) {
            creator.AddFace4(
                  R[0] * _cos[seg+d1], R[0] * _sin[seg+d1],  shape.fDZ,
                  R[1] * _cos[seg+d1], R[1] * _sin[seg+d1], -shape.fDZ,
                  R[1] * _cos[seg+d2], R[1] * _sin[seg+d2], -shape.fDZ,
                  R[0] * _cos[seg+d2], R[0] * _sin[seg+d2],  shape.fDZ );

            if (calcZ) creator.RecalcZ(calcZ);

            creator.SetNormal_12_34(nxy*_cos[seg+d1], nxy*_sin[seg+d1], nz, nxy*_cos[seg+d2], nxy*_sin[seg+d2], nz);
         }
      }

      // create upper/bottom part
      for (var side = 0; side<2; ++side) {
         var d1 = side, d2 = 1- side, sign = (side == 0) ? 1 : -1;
         for (var seg=0;seg<radiusSegments-1;++seg) {
            creator.AddFace4(
                  innerR[side] * _cos[seg+d1], innerR[side] * _sin[seg+d1], sign*shape.fDZ,
                  outerR[side] * _cos[seg+d1], outerR[side] * _sin[seg+d1], sign*shape.fDZ,
                  outerR[side] * _cos[seg+d2], outerR[side] * _sin[seg+d2], sign*shape.fDZ,
                  innerR[side] * _cos[seg+d2], innerR[side] * _sin[seg+d2], sign*shape.fDZ,
                  hasrmin ? 0 : 2);
            if (calcZ) {
               creator.RecalcZ(calcZ);
               creator.CalcNormal();
            } else {
               creator.SetNormal(0,0,sign);
            }
         }
      }

      // create cut surfaces
      if (thetaLength < 360) {
         creator.AddFace4(innerR[1] * _cos[0], innerR[1] * _sin[0], -shape.fDZ,
                          outerR[1] * _cos[0], outerR[1] * _sin[0], -shape.fDZ,
                          outerR[0] * _cos[0], outerR[0] * _sin[0],  shape.fDZ,
                          innerR[0] * _cos[0], innerR[0] * _sin[0],  shape.fDZ);
         if (calcZ) creator.RecalcZ(calcZ);
         creator.CalcNormal();

         creator.AddFace4(innerR[0] * _cos[radiusSegments-1], innerR[0] * _sin[radiusSegments-1],  shape.fDZ,
                          outerR[0] * _cos[radiusSegments-1], outerR[0] * _sin[radiusSegments-1],  shape.fDZ,
                          outerR[1] * _cos[radiusSegments-1], outerR[1] * _sin[radiusSegments-1], -shape.fDZ,
                          innerR[1] * _cos[radiusSegments-1], innerR[1] * _sin[radiusSegments-1], -shape.fDZ);

         if (calcZ) creator.RecalcZ(calcZ);
         creator.CalcNormal();
      }

      return creator.Create();
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


   JSROOT.GEO.createEltuBuffer = function( shape ) {
      var radiusSegments = Math.floor(360/6);

      // calculate all sin/cos tables in advance
      var x = new Float32Array(radiusSegments+1),
          y = new Float32Array(radiusSegments+1);
      for (var seg=0; seg<=radiusSegments; ++seg) {
          var phi = seg/radiusSegments*2*Math.PI;
          x[seg] = shape.fRmin*Math.cos(phi);
          y[seg] = shape.fRmax*Math.sin(phi);
      }

      var creator = new JSROOT.GEO.GeometryCreator(radiusSegments*4);

      var nx1 = 1, ny1 = 0, nx2 = 1, ny2 = 0;

      // create tube faces
      for (var seg=0; seg<radiusSegments; ++seg) {
         creator.AddFace4(x[seg],   y[seg],   +shape.fDZ,
                          x[seg],   y[seg],   -shape.fDZ,
                          x[seg+1], y[seg+1], -shape.fDZ,
                          x[seg+1], y[seg+1],  shape.fDZ);

         // calculate normals ourself
         nx1 = nx2; ny1 = ny2;
         nx2 = x[seg+1] * shape.fRmax / shape.fRmin;
         ny2 = y[seg+1] * shape.fRmin / shape.fRmax;
         var dist = Math.sqrt(nx2*nx2 + ny2*ny2);
         nx2 = nx2 / dist; ny2 = ny2/dist;

         creator.SetNormal_12_34(nx1,ny1,0,nx2,ny2,0);
      }

      // create top/bottom sides
      for (var side=0;side<2;++side) {
         var sign = (side===0) ? 1 : -1, d1 = side, d2 = 1 - side;
         for (var seg=0; seg<radiusSegments; ++seg) {
            creator.AddFace3(0,          0,          sign*shape.fDZ,
                             x[seg+d1],  y[seg+d1],  sign*shape.fDZ,
                             x[seg+d2],  y[seg+d2],  sign*shape.fDZ);
            creator.SetNormal(0, 0, sign);
         }
      }

      return creator.Create();
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

      var hasrmin = false;
      for (var layer=0; layer < shape.fNz; ++layer)
         if (shape.fRmin[layer] > 0) hasrmin = true;

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

            // create vertices for the layer (if rmin===0, only central point is included
            if ((side===0) || hasrmin)
               for (var seg=0; seg < layerVerticies; ++seg)
                  geometry.vertices.push( new THREE.Vector3( rad*_cos[seg], rad*_sin[seg], layerz ));
            else
               geometry.vertices.push( new THREE.Vector3( 0, 0, layerz ));

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

            if ((layer>0) && ((side===0) || hasrmin))  // create faces
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
            if (hasrmin) {
               geometry.faces.push( new THREE.Face3( outside + seg, (layer===0) ? (inside + seg) : (outside + seg1), inside + seg1, null, color, 0 ) );
               geometry.faces.push( new THREE.Face3( outside + seg, inside + seg1, (layer===0) ? (outside + seg1) : (inside + seg), null, color, 0 ));
            } else
            if (layer==0) {
               geometry.faces.push( new THREE.Face3( outside + seg, inside, outside + seg1, null, color, 0 ));
            } else {
               geometry.faces.push( new THREE.Face3( outside + seg1, inside, outside + seg, null, color, 0 ));
            }
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


   JSROOT.GEO.createPolygonBuffer = function( shape ) {

      var thetaStart = shape.fPhi1,
          thetaLength = shape.fDphi,
          radiusSegments = 60;

      if ( shape._typename == "TGeoPgon" )
         radiusSegments = shape.fNedges;
      else
         radiusSegments = Math.max(Math.floor(thetaLength/6), 5);

      // coordinate of point on cut edge (x,z)
      var pnts = (thetaLength === 360) ? null : [];

      var usage = new Int16Array(2*shape.fNz), numusedlayers = 0, hasrmin = false;

      for (var layer=0; layer < shape.fNz; ++layer)
         if (shape.fRmin[layer] > 0) hasrmin = true;

      // first analyse levels - if we need to create all of them
      for (var side = 0; side < 2; ++side) {
         var rside = (side === 0) ? 'fRmax' : 'fRmin';

         for (var layer=0; layer < shape.fNz; ++layer) {

            // first create points for the layer
            var layerz = shape.fZ[layer], rad = shape[rside][layer];

            usage[layer*2+side] = 0;

            if ((layer > 0) && (layer < shape.fNz-1))
               if (((shape.fZ[layer-1] === layerz) && (shape[rside][layer-1] === rad)) ||
                   ((shape[rside][layer+1] === rad) && (shape[rside][layer-1] === rad))) {

                  // same Z and R as before - ignore
                  // or same R before and after

                  continue;
               }

            if ((layer>0) && ((side === 0) || hasrmin)) {
               usage[layer*2+side] = 1;
               numusedlayers++;
            }

            if (pnts !== null) {
               if (side === 0) {
                  pnts.push(new THREE.Vector2(rad, layerz));
               } else
               if (rad < shape.fRmax[layer]) {
                  pnts.unshift(new THREE.Vector2(rad, layerz));
               }
            }
         }
      }

      var numfaces = numusedlayers*radiusSegments*2;
      if (shape.fRmin[0] !== shape.fRmax[0]) numfaces += radiusSegments * (hasrmin ? 2 : 1);
      if (shape.fRmin[shape.fNz-1] !== shape.fRmax[shape.fNz-1]) numfaces += radiusSegments * (hasrmin ? 2 : 1);

      var cut_faces = null;

      if (pnts!==null) {
         if (pnts.length === shape.fNz * 2) {
            // special case - all layers are there, create faces ourself
            cut_faces = [];
            for (var layer = shape.fNz-1; layer>0; --layer) {
               if (shape.fZ[layer] === shape.fZ[layer-1]) continue;
               var right = 2*shape.fNz - 1 - layer;
               cut_faces.push([right, layer - 1, layer]);
               cut_faces.push([right, right + 1, layer-1]);
            }

         } else {
            // let three.js calculate our faces
            cut_faces = THREE.ShapeUtils.triangulateShape(pnts, []);
         }
         numfaces += cut_faces.length*2;
      }

      var phi0 = thetaStart*Math.PI/180, dphi = thetaLength/radiusSegments*Math.PI/180;

      // calculate all sin/cos tables in advance
      var _sin = new Float32Array(radiusSegments+1),
          _cos = new Float32Array(radiusSegments+1);
      for (var seg=0;seg<=radiusSegments;++seg) {
         _cos[seg] = Math.cos(phi0+seg*dphi);
         _sin[seg] = Math.sin(phi0+seg*dphi);
      }

      var creator = new JSROOT.GEO.GeometryCreator(numfaces);

      // add sides
      for (var side = 0; side < 2; ++side) {
         var rside = (side === 0) ? 'fRmax' : 'fRmin',
             z1 = shape.fZ[0], r1 = shape[rside][0],
             d1 = 1 - side, d2 = side;

         for (var layer=0; layer < shape.fNz; ++layer) {

            if (usage[layer*2+side] === 0) continue;

            var z2 = shape.fZ[layer], r2 = shape[rside][layer],
                nxy = 1, nz = 0;

            if ((r2 !== r1)) {
               var angle = Math.atan2((r2-r1), (z2-z1));
               nxy = Math.cos(angle);
               nz = Math.sin(angle);
            }

            if (side>0) { nxy*=-1; nz*=-1; }

            for (var seg=0;seg < radiusSegments;++seg) {
               creator.AddFace4(r1 * _cos[seg+d1], r1 * _sin[seg+d1], z1,
                                r2 * _cos[seg+d1], r2 * _sin[seg+d1], z2,
                                r2 * _cos[seg+d2], r2 * _sin[seg+d2], z2,
                                r1 * _cos[seg+d2], r1 * _sin[seg+d2], z1);
               creator.SetNormal_12_34(nxy*_cos[seg+d1], nxy*_sin[seg+d1], nz, nxy*_cos[seg+d2], nxy*_sin[seg+d2], nz);
            }

            z1 = z2; r1 = r2;
         }
      }

      // add top/bottom
      for (var layer=0; layer < shape.fNz; layer += (shape.fNz-1)) {

         var rmin = shape.fRmin[layer], rmax = shape.fRmax[layer];

         if (rmin === rmax) continue;

         var layerz = shape.fZ[layer],
             d1 = (layer===0) ? 1 : 0, d2 = 1 - d1,
             normalz = (layer===0) ? -1: 1;

         for (var seg=0;seg < radiusSegments;++seg) {
            creator.AddFace4(rmin * _cos[seg+d1], rmin * _sin[seg+d1], layerz,
                             rmax * _cos[seg+d1], rmax * _sin[seg+d1], layerz,
                             rmax * _cos[seg+d2], rmax * _sin[seg+d2], layerz,
                             rmin * _cos[seg+d2], rmin * _sin[seg+d2], layerz,
                             hasrmin ? 0 : 2);
            creator.SetNormal(0, 0, normalz);
         }

      }

      if (cut_faces)
         for (var seg = 0; seg <= radiusSegments; seg += radiusSegments) {
            var d1 = (seg === 0) ? 1 : 2, d2 = 3 - d1;
            for (var n=0;n<cut_faces.length;++n) {
               var a = pnts[cut_faces[n][0]],
                   b = pnts[cut_faces[n][d1]],
                   c = pnts[cut_faces[n][d2]];

               creator.AddFace3(a.x * _cos[seg], a.x * _sin[seg], a.y,
                                b.x * _cos[seg], b.x * _sin[seg], b.y,
                                c.x * _cos[seg], c.x * _sin[seg], c.y);

               creator.CalcNormal();
            }
         }

      return creator.Create();
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


   JSROOT.GEO.createParaboloidBuffer = function( shape, faces_limit ) {

      var radiusSegments = Math.round(360/6), heightSegments = 30;

      if (faces_limit !== undefined) {
         var fact = 2*radiusSegments*(heightSegments+1) / faces_limit;
         if (fact > 1.) {
            radiusSegments = Math.max(5, Math.floor(radiusSegments/Math.sqrt(fact)));
            heightSegments = Math.max(5, Math.floor(heightSegments/Math.sqrt(fact)));
         }
      }

      // calculate all sin/cos tables in advance
      var _sin = new Float32Array(radiusSegments+1),
          _cos = new Float32Array(radiusSegments+1);
      for (var seg=0;seg<=radiusSegments;++seg) {
         _cos[seg] = Math.cos(seg/radiusSegments*2*Math.PI);
         _sin[seg] = Math.sin(seg/radiusSegments*2*Math.PI);
      }

      var zmin = -shape.fDZ, zmax = shape.fDZ, rmin = shape.fRlo, rmax = shape.fRhi;

      // if no radius at -z, find intersection
      if (shape.fA >= 0) {
         if (shape.fB > zmin) zmin = shape.fB;
      } else {
         if (shape.fB < zmax) zmax = shape.fB;
      }

      var ttmin = Math.atan2(zmin, rmin), ttmax = Math.atan2(zmax, rmax);

      var numfaces = (heightSegments+1)*radiusSegments*2;
      if (rmin===0) numfaces -= radiusSegments*2; // complete layer
      if (rmax===0) numfaces -= radiusSegments*2; // complete layer

      var creator = new JSROOT.GEO.GeometryCreator(numfaces);


      var lastz = zmin, lastr = 0, lastnxy = 0, lastnz = -1;

      for (var layer = 0; layer <= heightSegments + 1; ++layer) {

         var layerz = 0, radius = 0, nxy = 0, nz = -1;

         if ((layer === 0) && (rmin===0)) continue;

         if ((layer === heightSegments + 1) && (lastr === 0)) break;

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

         nxy = shape.fA * radius;
         nz = (shape.fA > 0) ? -1 : 1;

         var skip = 0;
         if (lastr === 0) skip = 1; else
         if (radius === 0) skip = 2;

         for (var seg=0; seg<radiusSegments; ++seg) {
            creator.AddFace4(radius*_cos[seg],   radius*_sin[seg], layerz,
                             lastr*_cos[seg],    lastr*_sin[seg], lastz,
                             lastr*_cos[seg+1],  lastr*_sin[seg+1], lastz,
                             radius*_cos[seg+1], radius*_sin[seg+1], layerz, skip);

            // use analitic normal values when open/closing parabaloid around 0
            // cutted faces (top or bottom) set with simple normal
            if ((skip===0) || ((layer===1) && (rmin===0)) || ((layer===heightSegments+1) && (rmax===0)))
               creator.SetNormal4(nxy*_cos[seg],       nxy*_sin[seg],       nz,
                                  lastnxy*_cos[seg],   lastnxy*_sin[seg],   lastnz,
                                  lastnxy*_cos[seg+1], lastnxy*_sin[seg+1], lastnz,
                                  nxy*_cos[seg+1],     nxy*_sin[seg+1],     nz, skip);
            else
               creator.SetNormal(0, 0, (layer < heightSegments) ? -1 : 1);
         }

         lastz = layerz; lastr = radius;
         lastnxy = nxy; lastnz = nz;
      }

      return creator.Create();
   }



   JSROOT.GEO.createHype = function( shape, faces_limit ) {

      if ((shape.fTin===0) && (shape.fTout===0))
         return JSROOT.GEO.createTubeBuffer(shape);

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

   JSROOT.GEO.getNodeMatrix = function(kind, node) {
      // returns transformation matrix for the node
      // created after node visibility flag is checked and volume cut is performed

      var matrix = null;

      if (kind === 1) {
         // special handling for EVE nodes

         matrix = new THREE.Matrix4();

         if (node.fTrans!==null) {
            matrix.set(node.fTrans[0],  node.fTrans[4],  node.fTrans[8],  0,
                       node.fTrans[1],  node.fTrans[5],  node.fTrans[9],  0,
                       node.fTrans[2],  node.fTrans[6],  node.fTrans[10], 0,
                                    0,               0,                0, 1);
            // second - set position with proper sign
            matrix.setPosition({ x: node.fTrans[12], y: node.fTrans[13], z: node.fTrans[14] });
         }
      } else
      if (('fMatrix' in node) && (node.fMatrix !== null))
         matrix = JSROOT.GEO.createMatrix(node.fMatrix);
      else
      if ((node._typename == "TGeoNodeOffset") && (node.fFinder !== null)) {
         // if (node.fFinder._typename === 'TGeoPatternTrapZ') { }
         // if (node.fFinder._typename === 'TGeoPatternCylR') { }
         // if (node.fFinder._typename === 'TGeoPatternSphR') { }
         // if (node.fFinder._typename === 'TGeoPatternSphTheta') { }
         // if (node.fFinder._typename === 'TGeoPatternSphPhi') { }
         // if (node.fFinder._typename === 'TGeoPatternHoneycomb') { }
         if ((node.fFinder._typename === 'TGeoPatternX') ||
             (node.fFinder._typename === 'TGeoPatternY') ||
             (node.fFinder._typename === 'TGeoPatternZ') ||
             (node.fFinder._typename === 'TGeoPatternParaX') ||
             (node.fFinder._typename === 'TGeoPatternParaY') ||
             (node.fFinder._typename === 'TGeoPatternParaZ')) {
            var _shift = node.fFinder.fStart + (node.fIndex + 0.5) * node.fFinder.fStep;

            matrix = new THREE.Matrix4();

            switch (node.fFinder._typename.charAt(node.fFinder._typename.length - 1)) {
               case 'X': matrix.setPosition(new THREE.Vector3(_shift, 0, 0)); break;
               case 'Y': matrix.setPosition(new THREE.Vector3(0, _shift, 0)); break;
               case 'Z': matrix.setPosition(new THREE.Vector3(0, 0, _shift)); break;
            }
         } else
         if (node.fFinder._typename === 'TGeoPatternCylPhi') {
            var phi = (Math.PI/180)*(node.fFinder.fStart+(node.fIndex+0.5)*node.fFinder.fStep);
            var _cos = Math.cos(phi), _sin = Math.sin(phi);

            matrix = new THREE.Matrix4();

            matrix.set(_cos, -_sin, 0,  0,
                      _sin,  _cos, 0,  0,
                         0,     0, 1,  0,
                         0,     0, 0,  1);
         } else
         if (node.fFinder._typename === 'TGeoPatternCylR') {
            // seems to be, require no transformation
            matrix = new THREE.Matrix4();
         } else {
           JSROOT.GEO.warn('Unsupported pattern type ' + node.fFinder._typename);
         }
      }

      return matrix;
   }


   JSROOT.GEO.createComposite = function ( shape, faces_limit, return_bsp ) {

      if (faces_limit && !return_bsp) console.warn('unnecessary conversion');


      if (faces_limit === undefined) faces_limit = 10000;

      var bsp1, bsp2;

      var matrix1 = JSROOT.GEO.createMatrix(shape.fNode.fLeftMat);
      var matrix2 = JSROOT.GEO.createMatrix(shape.fNode.fRightMat);

      // console.log('Create composite m1 = ', (matrix1!==null), ' m2=', (matrix2!==null));

      var supported = ["TGeoCompositeShape", "TGeoBBox"];

      if (supported.indexOf(shape.fNode.fLeft._typename)<0)
         console.log('Left type ', shape.fNode.fLeft._typename);

      if (supported.indexOf(shape.fNode.fRight._typename)<0)
         console.log('Right type ', shape.fNode.fRight._typename);

      var geom1 = JSROOT.GEO.createGeometry(shape.fNode.fLeft, faces_limit / 2, !matrix1);

      if (geom1 instanceof ThreeBSP) {
         bsp1 = geom1;
      } else {
         if (geom1 instanceof THREE.Geometry) geom1.computeVertexNormals();
         if (matrix1 && (matrix1.determinant() < -0.9))
            JSROOT.GEO.warn('Axis reflection in composite shape - not supported');

         bsp1 = new ThreeBSP(geom1, matrix1);
      }


      var geom2 = JSROOT.GEO.createGeometry(shape.fNode.fRight, faces_limit / 2, !matrix2);

      if (geom2 instanceof ThreeBSP) {
         bsp2 = geom2;
      } else {
         if (geom2 instanceof THREE.Geometry) geom2.computeVertexNormals();
         if (matrix2 && (matrix2.determinant() < -0.9))
            JSROOT.GEO.warn('Axis reflections in composite shape - not supported');
         bsp2 = new ThreeBSP(geom2, matrix2);
      }

      var bsp = null;

      // console.log('comp type ' + shape.fNode._typename);

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
         bsp = bsp1;
      }

      var res = return_bsp ? bsp : bsp.toBufferGeometry();

      if (JSROOT.GEO.numGeometryFaces(res) === 0) {
         JSROOT.GEO.warn('Zero faces in comp shape'
                          + ' left: ' + shape.fNode.fLeft._typename +  ' ' + JSROOT.GEO.numGeometryFaces(geom1) + ' faces'
                          + ' right: ' + shape.fNode.fRight._typename + ' ' + JSROOT.GEO.numGeometryFaces(geom2) + ' faces');
         return null;
      }

      return res;
   }


   JSROOT.GEO.createGeometry = function( shape, limit, return_bsp ) {

      var geom = null;

      switch (shape._typename) {
         case "TGeoBBox": geom = JSROOT.GEO.createCubeBuffer( shape, limit, return_bsp ); break;
         case "TGeoPara": geom = JSROOT.GEO.createParaBuffer( shape ); break;
         case "TGeoTrd1":
         case "TGeoTrd2": geom = JSROOT.GEO.createTrapezoidBuffer( shape ); break;
         case "TGeoArb8":
         case "TGeoTrap":
         case "TGeoGtra": geom = JSROOT.GEO.createArb8Buffer( shape ); break;
         case "TGeoSphere": geom = JSROOT.GEO.createSphereBuffer( shape, limit, return_bsp ); break;
         case "TGeoCone":
         case "TGeoConeSeg":
         case "TGeoTube":
         case "TGeoTubeSeg":
         case "TGeoCtub": geom = JSROOT.GEO.createTubeBuffer( shape, limit, return_bsp ); break;
         case "TGeoEltu": geom = JSROOT.GEO.createEltuBuffer( shape ); break;
         case "TGeoTorus": geom = JSROOT.GEO.createTorus( shape, limit ); break;
         case "TGeoPcon":
         case "TGeoPgon": geom = JSROOT.GEO.createPolygonBuffer( shape ); break;
         case "TGeoXtru": geom = JSROOT.GEO.createXtru( shape ); break;
         case "TGeoParaboloid": geom = JSROOT.GEO.createParaboloidBuffer( shape, limit ); break;
         case "TGeoHype": geom = JSROOT.GEO.createHype( shape, limit ); break;
         case "TGeoCompositeShape": geom = JSROOT.GEO.createComposite( shape, limit, return_bsp ); break;
         case "TGeoShapeAssembly": break;
      }

      if (geom && (geom instanceof THREE.Geometry)) {
         // console.log('Still '+ shape._typename + ' as geometry,  faces ' + geom.faces.length);
         // geom = new THREE.BufferGeometry().fromGeometry(geom);
      }

      return geom;
   }

   JSROOT.GEO.CreateProjectionMatrix = function(camera) {
      var cameraProjectionMatrix = new THREE.Matrix4();

      camera.updateMatrixWorld();
      camera.matrixWorldInverse.getInverse( camera.matrixWorld );
      cameraProjectionMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse);

      return cameraProjectionMatrix;
   }

   JSROOT.GEO.CreateFrustum = function(source) {
      if (!source) return null;

      if (source instanceof THREE.PerspectiveCamera)
         source = JSROOT.GEO.CreateProjectionMatrix(source);

      var frustum = new THREE.Frustum();
      frustum.setFromMatrix(source);

      frustum.corners = [
         new THREE.Vector3(  0.5,  0.5,  0.5 ),
         new THREE.Vector3(  0.5,  0.5, -0.5 ),
         new THREE.Vector3(  0.5, -0.5,  0.5 ),
         new THREE.Vector3(  0.5, -0.5, -0.5 ),
         new THREE.Vector3( -0.5,  0.5,  0.5 ),
         new THREE.Vector3( -0.5,  0.5, -0.5 ),
         new THREE.Vector3( -0.5, -0.5,  0.5 ),
         new THREE.Vector3( -0.5, -0.5, -0.5 )
      ];

      frustum.test = new THREE.Vector3(0,0,0);

      frustum.CheckShape = function(matrix, shape) {
         for (var i = 0; i < this.corners.length; i++) {
            this.test.x = this.corners[i].x * shape.fDX;
            this.test.y = this.corners[i].y * shape.fDY;
            this.test.z = this.corners[i].z * shape.fDZ;
            if (this.containsPoint(this.test.applyMatrix4(matrix))) return true;
        }
        return false;

      }

      return frustum;
   }

   JSROOT.GEO.VisibleByCamera = function(camera, matrix, shape) {
      var frustum = new THREE.Frustum();
      var cameraProjectionMatrix = new THREE.Matrix4();

      camera.updateMatrixWorld();
      camera.matrixWorldInverse.getInverse( camera.matrixWorld );
      cameraProjectionMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromMatrix( cameraProjectionMatrix );

      var corners = [
         new THREE.Vector3(  shape.fDX/2.0,  shape.fDY/2.0,   shape.fDZ/2.0 ),
         new THREE.Vector3(  shape.fDX/2.0,  shape.fDY/2.0,  -shape.fDZ/2.0 ),
         new THREE.Vector3(  shape.fDX/2.0, -shape.fDY/2.0,   shape.fDZ/2.0 ),
         new THREE.Vector3(  shape.fDX/2.0, -shape.fDY/2.0,  -shape.fDZ/2.0 ),
         new THREE.Vector3( -shape.fDX/2.0,  shape.fDY/2.0,   shape.fDZ/2.0 ),
         new THREE.Vector3( -shape.fDX/2.0,  shape.fDY/2.0,  -shape.fDZ/2.0 ),
         new THREE.Vector3( -shape.fDX/2.0, -shape.fDY/2.0,   shape.fDZ/2.0 ),
         new THREE.Vector3( -shape.fDX/2.0, -shape.fDY/2.0,  -shape.fDZ/2.0 )
               ];
      for (var i = 0; i < corners.length; i++) {
         if (frustum.containsPoint(corners[i].applyMatrix4(matrix))) return true;
      }

      return false;
   }

   JSROOT.GEO.numGeometryFaces = function(geom) {
      if (!geom) return 0;

      if (geom instanceof ThreeBSP)
         return geom.tree.numPolygons();

      if (geom.type == 'BufferGeometry') {
         var attr = geom.getAttribute('position');
         return attr ? attr.count / 3 : 0;
      }

      if (geom && geom.polygons) return geom.polygons.length;

      return geom.faces.length;
   }

   JSROOT.GEO.numGeometryVertices = function(geom) {
      if (!geom) return 0;

      if (geom instanceof ThreeBSP)
         return geom.tree.numPolygons() * 3;

      if (geom.type == 'BufferGeometry') {
         var attr = geom.getAttribute('position');
         return attr ? attr.count : 0;
      }

      if (geom && geom.polygons) return geom.polygons.length * 4;

      return geom.vertices.length;
   }

   // ====================================================================

   // class for working with cloned nodes

   JSROOT.GEO.ClonedNodes = function(obj, clones) {
      if (obj) this.CreateClones(obj); else
      if (clones) this.nodes = clones;
   }

   JSROOT.GEO.ClonedNodes.prototype.GetNodeShape = function(indx) {
      if (!this.origin || !this.nodes) return null;
      var obj = this.origin[indx], clone = this.nodes[indx];
      if (!obj || !clone) return null;
      if (clone.kind === 0) {
         if (obj.fVolume) return obj.fVolume.fShape;
      } else {
         return obj.fShape;
      }
      return null;
   }

   JSROOT.GEO.ClonedNodes.prototype.CreateClones = function(obj, sublevel) {
       if (!sublevel) {
          this.origin = [];
          sublevel = 1;
       }

       var kind = JSROOT.GEO.NodeKind(obj);
       if ((kind < 0) || ('_refid' in obj)) return;

       obj._refid = this.origin.length;
       this.origin.push(obj);

       var chlds = null;
       if (kind === 0) {
          chlds = (obj.fVolume && obj.fVolume.fNodes) ? obj.fVolume.fNodes.arr : null;
       } else {
          chlds = obj.fElements ? obj.fElements.arr : null;
       }

       if (chlds !== null)
          for (var i = 0; i < chlds.length; ++i)
            this.CreateClones(chlds[i], sublevel+1);

       if (sublevel > 1) return;

       this.nodes = [];

       // first create nodes objects
       for (var n=0; n<this.origin.length; ++n) {
          var obj = this.origin[n];
          this.nodes.push({ id: n, kind: JSROOT.GEO.NodeKind(obj), vol: 0, numvischld: 1, idshift: 0 });
       }

       // than fill childrens lists
       for (var n=0;n<this.origin.length;++n) {
          var obj = this.origin[n], clone = this.nodes[n];

          var chlds = null, shape = null;

          if (clone.kind === 0) {
             if (obj.fVolume) {
                shape = obj.fVolume.fShape;
                if (obj.fVolume.fNodes) chlds = obj.fVolume.fNodes.arr;
             }
          } else {
             shape = obj.fShape;
             if (obj.fElements) chlds = obj.fElements.arr;
          }

          var matrix = JSROOT.GEO.getNodeMatrix(clone.kind, obj);
          if (matrix) {
             clone.matrix = matrix.elements; // take only matrix elements, matrix will be constructed in worker
             if (clone.matrix[0] === 1) {
                var issimple = true;
                for (var k=1;(k<clone.matrix.length) && issimple;++k)
                   issimple = (clone.matrix[k] === ((k===5) || (k===10) || (k===15) ? 1 : 0));
                if (issimple) delete clone.matrix;
             }
          }
          if (shape) {
             clone.fDX = shape.fDX;
             clone.fDY = shape.fDY;
             clone.fDZ = shape.fDZ;
             clone.vol = shape.fDX*shape.fDY*shape.fDZ;
          }

          if (!chlds) continue;

          // in cloned object childs is only list of ids
          clone.chlds = new Int32Array(chlds.length);
          for (var k=0;k<chlds.length;++k)
             clone.chlds[k] = chlds[k]._refid;
       }

       // remove _refid identifiers from original objects
       for (var n=0;n<this.origin.length;++n)
          delete this.origin[n]._refid;
   }


   JSROOT.GEO.ClonedNodes.prototype.MarkVisisble = function(on_screen, copy_bits, cloning) {
      if (!this.nodes) return 0;

      var res = 0, simple_copy = cloning && (cloning.length === this.nodes.length);

      if (!simple_copy && !this.origin) return 0;

      for (var n=0;n<this.nodes.length;++n) {
         var clone = this.nodes[n];

         clone.vis = false;
         clone.numvischld = 1; // reset vis counter, will be filled with next scan
         clone.idshift = 0;
         delete clone.depth;

         if (simple_copy) {
            clone.vis = cloning[n].vis;
            if (cloning[n].depth !== undefined) clone.depth = cloning[n].depth;
            if (clone.vis) res++;
            continue;
         }

         var obj = this.origin[n];

         if (clone.kind === 0) {
            if (obj.fVolume) {
               if (on_screen) {
                  clone.vis = JSROOT.GEO.TestBit(obj.fVolume, JSROOT.GEO.BITS.kVisOnScreen);
                  if (copy_bits) {
                     JSROOT.GEO.SetBit(obj.fVolume, JSROOT.GEO.BITS.kVisNone, false);
                     JSROOT.GEO.SetBit(obj.fVolume, JSROOT.GEO.BITS.kVisThis, clone.vis);
                     JSROOT.GEO.SetBit(obj.fVolume, JSROOT.GEO.BITS.kVisDaughters, true);
                  }
               } else {
                  clone.vis = !JSROOT.GEO.TestBit(obj.fVolume, JSROOT.GEO.BITS.kVisNone) &&
                               JSROOT.GEO.TestBit(obj.fVolume, JSROOT.GEO.BITS.kVisThis);
                  if (!JSROOT.GEO.TestBit(obj.fVolume, JSROOT.GEO.BITS.kVisDaughters))
                     clone.depth = JSROOT.GEO.TestBit(obj.fVolume, JSROOT.GEO.BITS.kVisOneLevel) ? 1 : 0;
               }
            }
         } else {
            clone.vis = obj.fRnrSelf;
         }

         if (clone.vis) res++;
      }

      return res;
   }

   JSROOT.GEO.ClonedNodes.prototype.GetVisibleFlags = function() {
      // function extract only visibility flags, used to transfer them to the worker
      var res = [];
      for (var n=0;n<this.nodes.length;++n) {
         var elem = { vis: this.nodes[n].vis };
         if ('depth' in this.nodes[n]) elem.depth = this.nodes[n].depth;
         res.push(elem);
      }
      return res;
   }

   JSROOT.GEO.ClonedNodes.prototype.ScanVisible = function(arg, vislvl) {
      // Scan visible nodes in hierarchy, starting from nodeid
      // Each entry in hierarchy get its unique id, which is not changed with visibility flags

      if (!this.nodes) return 0;

      if (vislvl === undefined) {
         vislvl = 99999;
         if (!arg) arg = {};
         arg.stack = new Int32Array(100); // current stack
         arg.nodeid = 0;
         arg.counter = 0; // sequence ID of the node, used to identify it later
         arg.last = 0;
         arg.CopyStack = function() {
            var entry = { nodeid: this.nodeid, seqid: this.counter, stack: new Int32Array(this.last) };
            for (var n=0;n<this.last;++n) entry.stack[n] = this.stack[n+1];
            return entry;
         }

         if (arg.domatrix) {
            arg.matrices = [];
            arg.mpool = [ new THREE.Matrix4() ]; // pool of Matrix objects to avoid permanent creation
            arg.getmatrix = function() { return this.matrices[this.last]; }
         }
      }

      var res = 0, node = this.nodes[arg.nodeid];

      if (arg.domatrix) {
         if (!arg.mpool[arg.last+1])
            arg.mpool[arg.last+1] = new THREE.Matrix4();

         var prnt = (arg.last > 0) ? arg.matrices[arg.last-1] : new THREE.Matrix4();
         if (node.matrix) {
            arg.matrices[arg.last] = arg.mpool[arg.last].fromArray(prnt.elements);
            arg.matrices[arg.last].multiply(arg.mpool[arg.last+1].fromArray(node.matrix));
         } else {
            arg.matrices[arg.last] = prnt;
         }
      }

      if (node.vis && (vislvl>=0)) {
         if (!arg.func || arg.func(node)) res++;
      }

      arg.counter++;

      if ((node.depth !== undefined) && (vislvl > node.depth)) vislvl = node.depth;

      if (arg.last > arg.stack.length - 2)
         throw 'stack capacity is not enough ' + arg.stack.length;

      if (node.chlds && (node.numvischld > 0)) {
         var currid = arg.counter, numvischld = 0;
         arg.last++;
         for (var i = 0; i < node.chlds.length; ++i) {
            arg.nodeid = node.chlds[i];
            arg.stack[arg.last] = i; // in the stack one store index of child, it is path in the hierarchy
            numvischld += this.ScanVisible(arg, vislvl-1);
         }
         arg.last--;
         res += numvischld;
         if (numvischld === 0) {
            node.numvischld = 0;
            node.idshift = arg.counter - currid;
         }
      } else {
         arg.counter += node.idshift;
      }

      if (arg.last === 0) {
         delete arg.last;
         delete arg.stack;
         delete arg.CopyStack;
         delete arg.counter;
         delete arg.matrices;
         delete arg.mpool;
         delete arg.getmatrix;
      }

      return res;
   }

   JSROOT.GEO.ClonedNodes.prototype.ResolveStack = function(stack, withmatrix) {

      var res = { id: 0, obj: null, node: this.nodes[0], name: "Nodes" };

      if (withmatrix) {
         res.matrix = new THREE.Matrix4();
         if (res.node.matrix) res.matrix.fromArray(res.node.matrix);
      }

      if (this.origin) res.obj = this.origin[0];

      if (stack)
         for(var lvl=0;lvl<stack.length;++lvl) {
            res.id = res.node.chlds[stack[lvl]];
            res.node = this.nodes[res.id];
            if (this.origin) {
               res.obj = this.origin[res.id];
               res.name += "/" + res.obj.fName;
            }

            if (withmatrix && res.node.matrix)
               res.matrix.multiply(new THREE.Matrix4().fromArray(res.node.matrix));
         }

      return res;
   }

   JSROOT.GEO.ClonedNodes.prototype.FindStackByName = function(fullname) {
      if (!this.origin) return null;

      var names = fullname.split('/');

      var currid = 0, stack = [];

      for (var n=0;n<names.length;++n) {
         var node = this.nodes[currid];
         if (!node.chlds) return null;

         for (var k=0;k<node.chlds.length;++k) {
            var chldid = node.chlds[k];
            var obj = this.origin[chldid];
            if (obj && (obj.fName === names[n])) { stack.push(k); currid = chldid; break; }
         }

         // no new entry - not found stack
         if (stack.length == n) return null;
      }

      return stack;
   }

   JSROOT.GEO.ClonedNodes.prototype.CreateObject3D = function(stack, toplevel, options) {
      // create hierarchy of Object3D for given stack entry
      // such hierarchy repeats hierarchy of TGeoNodes and set matrix for the objects drawing

      var node = this.nodes[0], three_prnt = toplevel,
          force = (typeof options == 'object') || (options==='force');

      for(var lvl=0; lvl<=stack.length; ++lvl) {
         var nchld = (lvl > 0) ? stack[lvl-1] : 0;
         // extract current node
         if (lvl>0)  node = this.nodes[node.chlds[nchld]];

         var obj3d = undefined;

         if (three_prnt.children)
            for (var i=0;i<three_prnt.children.length;++i) {
               if (three_prnt.children[i].nchld === nchld) {
                  obj3d = three_prnt.children[i];
                  break;
               }
            }

         if (obj3d) {
            three_prnt = obj3d;
            continue;
         }

         if (!force) return null;

         obj3d = new THREE.Object3D();

         if (node.matrix) {
            obj3d.matrix.fromArray(node.matrix);
            obj3d.matrix.decompose( obj3d.position, obj3d.quaternion, obj3d.scale );
         }

         // this.accountNodes(obj3d);
         obj3d.nchld = nchld; // mark index to find it again later

         // add the mesh to the scene
         three_prnt.add(obj3d);

         // this is only for debugging - test invertion of whole geometry
         if ((lvl==0) && (typeof options == 'object') && options.scale) {
            if ((options.scale.x<0) || (options.scale.y<0) || (options.scale.z<0)) {
               obj3d.scale.copy(options.scale);
               obj3d.updateMatrix();
            }
         }

         obj3d.updateMatrixWorld();

         three_prnt = obj3d;
      }

      if (options === 'mesh') {
         if (three_prnt)
            for (var n=0;n<three_prnt.children.length;++n) {
               var chld = three_prnt.children[n];
               if ((chld.type === 'Mesh') && (chld.nchld === undefined)) return chld;
            }

         return null;
      }

      return three_prnt;
   }

   JSROOT.GEO.ClonedNodes.prototype.GetVolumeBoundary = function(viscnt, limit) {
      var vismap = [];

      for (var id=0;id<viscnt.length;++id)
         if (viscnt[id] > 0)
            vismap.push(this.nodes[id]);

      // sort in reverse order (big volumes first)
      vismap.sort(function(a,b) { return b.vol - a.vol; })

      var indx = 0, cnt = 0;
      while ((cnt < limit) && (indx < vismap.length-1))
         cnt += viscnt[vismap[indx++].id];

      console.log('Volume voundary ' + vismap[indx].vol + '  counter ' + cnt);

      return vismap[indx].vol;
   }


   JSROOT.GEO.ClonedNodes.prototype.CollectVisibles = function(maxnum, frustum) {
      // function collects visible nodes, using maxlimit
      // one can use map to define cut based on the volume or serious of cuts

      var arg = {
         viscnt: new Int32Array(this.nodes.length), // counter for each node
         // nodes: this.nodes,
         func: function(node) {
            this.viscnt[node.id]++;
            return true;
         }
      };

      for (var n=0;n<arg.viscnt.length;++n) arg.viscnt[n] = 0;

      var total = this.ScanVisible(arg), minVol = 0, camVol = -1;

      console.log('Total visible nodes ' + total);

      if (total > maxnum) {

         // define minimal volume, which always shown
         minVol = this.GetVolumeBoundary(arg.viscnt, maxnum);

         // if we have camera and too many volumes, try to select some of them in camera view
         if (frustum && (total>=maxnum*1.25)) {
             arg.domatrix = true;
             arg.frustum = frustum;
             arg.totalcam = 0;
             arg.func = function(node) {
                if (node.vol <= minVol) // only small volumes are interesting
                   if (this.frustum.CheckShape(this.getmatrix(), node)) {
                      this.viscnt[node.id]++;
                      this.totalcam++;
                   }

                return true;
             }

             for (var n=0;n<arg.viscnt.length;++n) arg.viscnt[n] = 0;

             this.ScanVisible(arg);

             if (arg.totalcam > maxnum*0.25)
                camVol = this.GetVolumeBoundary(arg.viscnt, maxnum*0.25);
             else
                camVol = 0;

             console.log('Limit for camera ' + camVol + '  objects in camera view ' + arg.totalcam);
         }
      }

      arg.items = [];

      arg.func = function(node) {
         if (node.vol > minVol) {
            this.items.push(this.CopyStack());
         } else
         if ((camVol >= 0) && (node.vol > camVol))
            if (this.frustum.CheckShape(this.getmatrix(), node)) {
               this.items.push(this.CopyStack());
            }
         return true;
      }

      this.ScanVisible(arg);

      return arg.items;
   }

   JSROOT.GEO.ClonedNodes.prototype.MergeVisibles = function(current, prev) {
      // merge list of drawn objects
      // in current list we should mark if object already exists
      // from previous list we should collect objects which are not there

      var indx2 = 0, del = [];
      for (var indx1=0; (indx1<current.length) && (indx2<prev.length); ++indx1) {

         while ((indx2 < prev.length) && (prev[indx2].seqid < current[indx1].seqid)) {
            del.push(prev[indx2++]); // this entry should be removed
         }

         if ((indx2 < prev.length) && (prev[indx2].seqid === current[indx1].seqid)) {
            if (prev[indx2].done) current[indx1].done = true; // copy ready flag
            indx2++;
         }
      }

      // remove rest
      while (indx2<prev.length)
         del.push(prev[indx2++]);

      return del; //
   }

   return JSROOT;

}));
