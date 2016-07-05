/// @file JSRootGeoPainter.js
/// JavaScript ROOT 3D geometry painter

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      // AMD. Register as an anonymous module.
      define( [ 'd3', 'JSRootPainter', 'JSRoot3DPainter', 'JSRootGeoBase' ], factory );
   } else {

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'JSRootGeoPainter.js');

      if (typeof JSROOT.Painter != 'object')
         throw new Error('JSROOT.Painter is not defined', 'JSRootGeoPainter.js');

      if (typeof d3 == 'undefined')
         throw new Error('d3 is not defined', 'JSRootGeoPainter.js');

      if (typeof THREE == 'undefined')
         throw new Error('THREE is not defined', 'JSRootGeoPainter.js');

      factory( d3, JSROOT);
   }
} (function( d3, JSROOT ) {

   if ( typeof define === "function" && define.amd )
      JSROOT.loadScript('$$$style/JSRootGeoPainter.css');

   if (typeof JSROOT.GEO !== 'object')
      console.error('JSROOT.GEO namespace is not defined')

   /**
    * @class JSROOT.TGeoPainter Holder of different functions and classes for drawing geometries
    */

   // ======= Geometry painter================================================


   JSROOT.EGeoVisibilityAtt = {
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

   JSROOT.TestGeoAttBit = function(volume, f) {
      var att = volume.fGeoAtt;
      return att === undefined ? false : ((att & f) !== 0);
   }

   JSROOT.SetGeoAttBit = function(volume, f, value) {
      if (volume.fGeoAtt === undefined) return;
      volume.fGeoAtt = value ? (volume.fGeoAtt | f) : (volume.fGeoAtt & ~f);
   }


   JSROOT.ToggleGeoAttBit = function(volume, f) {
      if (volume.fGeoAtt !== undefined)
         volume.fGeoAtt = volume.fGeoAtt ^ (f & 0xffffff);
   }

   JSROOT.TGeoPainter = function( geometry ) {
      if ((geometry !== null) && (geometry._typename.indexOf('TGeoVolume') === 0))
         geometry = { _typename:"TGeoNode", fVolume: geometry, fName:"TopLevel" };

      JSROOT.TObjectPainter.call(this, geometry);

      this.Cleanup(true);
   }

   JSROOT.TGeoPainter.prototype = Object.create( JSROOT.TObjectPainter.prototype );

   JSROOT.TGeoPainter.prototype.CreateToolbar = function(args) {
      if ( this._toolbar !== null ) return;
      var painter = this;
      var buttonList = [{
         name: 'toImage',
         title: 'Save as PNG',
         icon: JSROOT.ToolbarIcons.camera,
         click: function() {
            var dataUrl = painter._renderer.domElement.toDataURL("image/png");
            dataUrl.replace("image/png", "image/octet-stream");
            var link = document.createElement('a');
            if (typeof link.download === 'string') {
               document.body.appendChild(link); //Firefox requires the link to be in the body
               link.download = "geometry.png";
               link.href = dataUrl;
               link.click();
               document.body.removeChild(link); //remove the link when done
            }
         }
      }];
      this._toolbar = new JSROOT.Toolbar( this.select_main(), [buttonList] );
   }

   JSROOT.TGeoPainter.prototype.decodeOptions = function(opt) {
      var res = { _grid: false, _bound: false, _debug: false, _full: false, screen_vis: true, _axis:false, scale: new THREE.Vector3(1,1,1), more:1 };

      var _opt = JSROOT.GetUrlOption('_grid');
      if (_opt !== null && _opt == "true") res._grid = true;
      var _opt = JSROOT.GetUrlOption('_debug');
      if (_opt !== null && _opt == "true") { res._debug = true; res._grid = true; }
      if (_opt !== null && _opt == "bound") { res._debug = true; res._grid = true; res._bound = true; }
      if (_opt !== null && _opt == "full") { res._debug = true; res._grid = true; res._full = true; res._bound = true; }


      while (true) {
         var pp = opt.indexOf("+"), pm = opt.indexOf("-");
         if ((pp<0) && (pm<0)) break;
         var p1 = pp, sign = "+";
         if ((p1<0) || ((pm>=0) && (pm<pp))) { p1 = pm; sign = "-"; }

         var p2 = p1+1, regexp = new RegExp('[,; .]');
         while ((p2<opt.length) && !regexp.test(opt[p2]) && (opt[p2]!='+') && (opt[p2]!='-')) p2++;

         var name = opt.substring(p1+1, p2);
         opt = opt.substr(0,p1) + opt.substr(p2);

         console.log("Modify visibility", sign,':',name);

         var node = this.GetObject();

         var kind = JSROOT.GEO.NodeKind(node);
         var prop = this.getNodeProperties(kind, node);

         if (name == "") {
            JSROOT.SetGeoAttBit(prop.volume, JSROOT.EGeoVisibilityAtt.kVisThis, (sign === "+"));
            continue;
         }

         if (name.indexOf("*") < 0)
            regexp = new RegExp(name);
         else
            regexp = new RegExp("^" + name.split("*").join(".*") + "$");

         if (prop.chlds!==null)
            for (var n=0;n<prop.chlds.length;++n) {
               var chld = this.getNodeProperties(kind, prop.chlds[n]);

               if (regexp.test(chld.name) && chld.volume) {
                  JSROOT.SetGeoAttBit(chld.volume, JSROOT.EGeoVisibilityAtt.kVisThis, (sign === "+"));
                  JSROOT.SetGeoAttBit(chld.volume, JSROOT.EGeoVisibilityAtt.kVisDaughters, (sign === "+"));
               }
            }
      }

      opt = opt.toLowerCase();

      if (opt.indexOf("more3")>=0) {
         opt = opt.replace("more3", " ");
         res.more = 3;
      }
      if (opt.indexOf("more")>=0) {
         opt = opt.replace("more", " ");
         res.more = 2;
      }
      if (opt.indexOf("all")>=0) {
         opt = opt.replace("all", " ");
         res.more = 100;
      }
      if (opt.indexOf("invx")>=0) {
         res.scale.x = -1;
         opt = opt.replace("invx", " ");
      }
      if (opt.indexOf("invy")>=0) {
         res.scale.y = -1;
         opt = opt.replace("invy", " ");
      }
      if (opt.indexOf("invz")>=0) {
         res.scale.z = -1;
         opt = opt.replace("invz", " ");
      }

      if (opt.indexOf("d")>=0) res._debug = true;
      if (opt.indexOf("g")>=0) res._grid = true;
      if (opt.indexOf("b")>=0) res._bound = true;
      if (opt.indexOf("f")>=0) res._full = true;
      if (opt.indexOf("a")>=0) { res._axis = true; res._yup = false; }
      if (opt.indexOf("y")>=0) res._yup = true;
      if (opt.indexOf("z")>=0) res._yup = false;

      return res;
   }


   JSROOT.TGeoPainter.prototype.addControls = function() {

      if (this._controls !== null) return;

      var painter = this;

      this.select_main().property('flex_block_drag', true);

      this._controls = new THREE.OrbitControls(this._camera, this._renderer.domElement);
      this._controls.enableDamping = false;
      this._controls.dampingFactor = 0.25;
      this._controls.enableZoom = true;
      this._controls.target.copy(this._lookat);
      this._controls.update();

      this._controls.addEventListener( 'change', function() { painter.Render3D(0); } );

      if ( this.options._debug || this.options._grid ) {
         this._tcontrols = new THREE.TransformControls( this._camera, this._renderer.domElement );
         this._scene.add( this._tcontrols );
         this._tcontrols.attach( this._toplevel );
         //this._tcontrols.setSize( 1.1 );

         window.addEventListener( 'keydown', function ( event ) {
            switch ( event.keyCode ) {
               case 81: // Q
                  painter._tcontrols.setSpace( painter._tcontrols.space === "local" ? "world" : "local" );
                  break;
               case 17: // Ctrl
                  painter._tcontrols.setTranslationSnap( Math.ceil( painter._overall_size ) / 50 );
                  painter._tcontrols.setRotationSnap( THREE.Math.degToRad( 15 ) );
                  break;
               case 84: // T (Translate)
                  painter._tcontrols.setMode( "translate" );
                  break;
               case 82: // R (Rotate)
                  painter._tcontrols.setMode( "rotate" );
                  break;
               case 83: // S (Scale)
                  painter._tcontrols.setMode( "scale" );
                  break;
               case 187:
               case 107: // +, =, num+
                  painter._tcontrols.setSize( painter._tcontrols.size + 0.1 );
                  break;
               case 189:
               case 109: // -, _, num-
                  painter._tcontrols.setSize( Math.max( painter._tcontrols.size - 0.1, 0.1 ) );
                  break;
            }
         });
         window.addEventListener( 'keyup', function ( event ) {
            switch ( event.keyCode ) {
               case 17: // Ctrl
                  painter._tcontrols.setTranslationSnap( null );
                  painter._tcontrols.setRotationSnap( null );
                  break;
            }
         });

         this._tcontrols.addEventListener( 'change', function() { painter.Render3D(0); } );
      }

      var raycaster = new THREE.Raycaster(), INTERSECTED = null;

      function findIntersection(mouse) {
         // find intersections

         // if (JSROOT.gStyle.Tooltip<=0) return tooltip.hide();

         raycaster.setFromCamera( mouse, painter._camera );
         var intersects = raycaster.intersectObjects(painter._scene.children, true);
         if (intersects.length > 0) {
            var pick = null;
            for (var i = 0; i < intersects.length; ++i) {
               if ('emissive' in intersects[i].object.material) {
                  pick = intersects[i].object;
                  break;
               }
            }
            if (pick && INTERSECTED != pick) {
               INTERSECTED = pick;

               var name = INTERSECTED.name;

               var p = INTERSECTED.parent;
               while ((p!==undefined) && (p!==null)) {
                  if ('name' in p) name = p.name+'/'+name;
                  p = p.parent;
               }

               // console.log('intersect ' + name);
            }
         } else {
            // INTERSECTED = null;
         }
      };

      function mousemove(e) {
         var mouse_x = ('offsetX' in e) ? e.offsetX : e.layerX;
         var mouse_y = ('offsetY' in e) ? e.offsetY : e.layerY;
         var mouse = { x: (mouse_x / painter._renderer.domElement.width) * 2 - 1,
                   y: -(mouse_y / painter._renderer.domElement.height) * 2 + 1 };

         findIntersection(mouse);
         e.preventDefault();
      }

      this._renderer.domElement.addEventListener('mousemove', mousemove);
   }

   JSROOT.TGeoPainter.prototype.accountClear = function() {
      this._num_geom = 0;
      this._num_vertices = 0;
      this._num_faces = 0;
      this._num_nodes = 0;
   }

   JSROOT.TGeoPainter.prototype.accountGeom = function(geom, shape_typename) {

      if (geom && ((geom.vertices.length==0) || (geom.faces.length==0))) {
         console.log('Problem with ' + shape_typename);
      }

      // used to calculate statistic over created geometry
      if (shape_typename === 'TGeoShapeAssembly')
         return;
      if (geom === null)
         return JSROOT.GEO.warn('Not supported ' + shape_typename);

      this._num_geom++;
      if (('vertices' in geom) && ('faces' in geom)) {
         this._num_vertices += geom.vertices.length;
         this._num_faces += geom.faces.length;
      } else {

         var attr = geom.getAttribute('position');
         // this._num_vertices += attr.count() / 3;
         // this._num_faces += geom.index.count() / 3;
      }
   }

   JSROOT.TGeoPainter.prototype.accountNodes = function(mesh) {
      // used to calculate statistic over created meshes
      if (mesh !== null) this._num_nodes++;
   }

   JSROOT.TGeoPainter.prototype.createFlippedMesh = function(parent, shape, material) {
      // when transformation matrix includes one or several invertion of axis,
      // one should inverse geometry object, otherwise THREE.js cannot correctly draw it

      var m = parent.matrixWorld;

      var cnt = 0, flip = new THREE.Vector3(1,1,1);

      if (m.elements[0]===-1 && m.elements[1]=== 0 && m.elements[2] === 0) { flip.x = -1; cnt++; }
      if (m.elements[4]=== 0 && m.elements[5]===-1 && m.elements[6] === 0) { flip.y = -1; cnt++; }
      if (m.elements[8]=== 0 && m.elements[9]=== 0 && m.elements[10]===-1) { flip.z = -1; cnt++; }

      if ((cnt===0) || (cnt ===2)) {
         flip.set(1,1,1); cnt = 0;
         if (m.elements[0] + m.elements[1] + m.elements[2] === -1) { flip.x = -1; cnt++; }
         if (m.elements[4] + m.elements[5] + m.elements[6] === -1) { flip.y = -1; cnt++; }
         if (m.elements[8] + m.elements[9] + m.elements[10] === -1) { flip.z = -1; cnt++; }
         if ((cnt === 0) || (cnt === 2)) {
            // console.log('not found proper axis, use Z ' + JSON.stringify(flip) + '  m = ' + JSON.stringify(m.elements));
            flip.z = -flip.z;
         }
      }
      var gname = "_geom";
      if (flip.x<0) gname += "X";
      if (flip.y<0) gname += "Y";
      if (flip.z<0) gname += "Z";

      var geom = shape[gname];

      if (geom === undefined) {

         geom = shape._geom.clone();

         geom.scale(flip.x, flip.y, flip.z);

         var face, d;
         for (var n=0;n<geom.faces.length;++n) {
            face = geom.faces[n];
            d = face.b; face.b = face.c; face.c = d;
         }

         // geom.computeBoundingSphere();
         geom.computeFaceNormals();

         shape[gname] = geom;

         this.accountGeom(geom);
      }

      var mesh = new THREE.Mesh( geom, material );

      mesh.scale.copy(flip);

      mesh.updateMatrix();

      return mesh;
   }

   JSROOT.TGeoPainter.prototype.getNodeProperties = function(kind, node, visible) {
      // function return matrix, shape and material for specified node
      // Only if node visible, material is created

      if (kind === 1) {
         // special handling for EVE nodes

         var prop = { name: node.fName, shape: node.fShape, material: null, chlds: null };

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
                             side: THREE.FrontSide, vertexColors: THREE.NoColors /*THREE.VertexColors */,
                             overdraw: 0. } );
         }

         return prop;
      }

      var volume = node.fVolume;

      var prop = { name: volume.fName, volume: node.fVolume, shape: volume.fShape, material: null, chlds: null };

      if (node.fVolume.fNodes !== null) prop.chlds = node.fVolume.fNodes.arr;

      if (visible) {
         var _transparent = false, _opacity = 1.0;
         if ((volume.fFillColor > 1) && (volume.fLineColor == 1))
            prop.fillcolor = JSROOT.Painter.root_colors[volume.fFillColor];
         else
         if (volume.fLineColor >= 0)
            prop.fillcolor = JSROOT.Painter.root_colors[volume.fLineColor];

         if (('fMedium' in volume) && (volume.fMedium !== null) &&
             ('fMaterial' in volume.fMedium) && (volume.fMedium.fMaterial !== null)) {
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
                              side: THREE.FrontSide, vertexColors: THREE.NoColors /*THREE.VertexColors*/,
                              overdraw: 0. } );
      }

      return prop;
   }


   JSROOT.TGeoPainter.prototype.create3DObjects = function(arg) {
      // function used to create Object3D hierarchy to current stack point
      // Called only if object need to be drawn

      if (arg.mesh) return arg.mesh;

      var parent = this._stack[0].toplevel;

      for (var n=0;n<this._stack.length;++n) {
         arg = this._stack[n];
         if (arg.mesh === undefined) {
            if (arg.node._matrix === undefined)
               arg.node._matrix = JSROOT.GEO.getNodeMatrix(JSROOT.GEO.NodeKind(arg.node), arg.node);

            var nodeObj = new THREE.Object3D();
            if (arg.node._matrix) nodeObj.applyMatrix(arg.node._matrix);
            this.accountNodes(nodeObj);

            nodeObj.name = arg.node.fName;

            // add the mesh to the scene
            parent.add(nodeObj);

            // this is only for debugging - test invertion of whole geometry
            if (arg.main && (this.options.scale !== null)) {
               if ((this.options.scale.x<0) || (this.options.scale.y<0) || (this.options.scale.z<0)) {
                  nodeObj.scale.copy(this.options.scale);
                  nodeObj.updateMatrix();
               }
            }

            nodeObj.updateMatrixWorld();

            arg.mesh = nodeObj;
         }

         parent = arg.mesh;
      }

      return arg.mesh;
   }

   // Central function of TGeoNode drawing
   // Automatically traverse complete hierarchy
   // Also can be used to update existing drawing

   JSROOT.TGeoPainter.prototype.drawNode = function() {

      if (!this._stack || (this._stack.length == 0)) return false;

      var arg = this._stack[this._stack.length - 1];

      if (arg.main && arg.mesh) {
         // end of iteration
         this._stack.pop();
         return false;
      }

      if ('nchild' in arg) {
         if (arg.nchild >= arg.chlds.length) {
            this._stack.pop();
            return true; // no more childs
         }
         // extract next child
         arg.node = arg.chlds[arg.nchild++];
         delete arg.mesh; // remove mesh on previous child
      }

      var kind = JSROOT.GEO.NodeKind(arg.node);
      if (kind < 0) return false;

      var visible = arg.node._visible && (arg.node._volume > this._data.minVolume) && (arg.vislvl >= 0);
      if (arg.main) this.create3DObjects(arg);

      var prop = this.getNodeProperties(kind, arg.node, visible);

      // console.log(this._stack.length, 'vislvl', arg.vislvl, 'visible', visible, 'chlds', prop.chlds, 'numvis', arg.node._numvischld);

      if (visible) {
         var nodeObj = this.create3DObjects(arg);

         this._drawcnt++;

         if (typeof prop.shape._geom === 'undefined') {
            prop.shape._geom = JSROOT.GEO.createGeometry(prop.shape);
            this.accountGeom(prop.shape._geom, prop.shape._typename);
         }

         var mesh = null;

         if ((prop.shape._geom !== null) && (prop.shape._geom.faces.length > 0)) {

            if (nodeObj.matrixWorld.determinant() > -0.9) {
               mesh = new THREE.Mesh( prop.shape._geom, prop.material );
            } else {
               mesh = this.createFlippedMesh(nodeObj, prop.shape, prop.material);
            }

            nodeObj.add(mesh);
         }

         if (mesh && (this.options._debug || this.options._full)) {
            var helper = new THREE.WireframeHelper(mesh);
            helper.material.color.set(prop.fillcolor);
            helper.material.linewidth = ('fVolume' in arg.node) ? arg.node.fVolume.fLineWidth : 1;
            nodeObj.add(helper);
         }

         if (mesh && (this.options._bound || this.options._full)) {
            var boxHelper = new THREE.BoxHelper( mesh );
            nodeObj.add( boxHelper );
         }
      }

      var vislvl = ('_visdepth' in arg.node) ? arg.node._visdepth : arg.vislvl;

      if (prop.chlds && (prop.chlds.length > 0) && (arg.node._numvischld > 0) && (vislvl > 0)) {
         this._stack.push({
            nchild: 0,
            chlds: prop.chlds,
            vislvl: vislvl - 1,
         });
      }

      return true;
   }

   JSROOT.TGeoPainter.prototype.CountGeoNodes = function(obj, arg, lvl) {
      // Scan nodes hierarchy, finds unique nodes and create map of such nodes
      // Extract visibility flags. calculates volume
      // Function should be called once every time object flags are changed
      // Selection based on camera position will be done in different place

      var kind = JSROOT.GEO.NodeKind(obj);
      var res = { cnt: 0, vis: 0 }; // return number of nodes and number of visible nodes
      if (kind < 0) return res;

      if (lvl === undefined) {
         lvl = 0;
         if (!arg) arg = { erase: true };
         if (!('map' in arg)) arg.map = [];
         if (!('clear' in arg))
            arg.clear = function() {
               for (var n=0;n<this.map.length;++n) {
                  delete this.map[n]._refcnt;
                  delete this.map[n]._numchld;
                  delete this.map[n]._numvischld;
                  delete this.map[n]._visible;
                  delete this.map[n]._visdepth;
                  delete this.map[n]._volume;
                  delete this.map[n]._matrix;
                  delete this.map[n]._viscnt;
                  delete this.map[n]._camcnt;
               }
               this.map = [];
               delete this.vismap;
               delete this.cammap;
            };
      }

      var chlds = null, shape = null, vis = false;
      if (kind === 0) {
         // kVisNone         : JSROOT.BIT(1),           // the volume/node is invisible, as well as daughters
         // kVisThis         : JSROOT.BIT(2),           // this volume/node is visible
         // kVisDaughters    : JSROOT.BIT(3),           // all leaves are visible
         // kVisOneLevel     : JSROOT.BIT(4),           // first level daughters are visible

         if ((obj.fVolume === undefined) || (obj.fVolume === null)) return res;
         shape = obj.fVolume.fShape;
         chlds = (obj.fVolume.fNodes !== null) ? obj.fVolume.fNodes.arr : null;

         if (arg.screen_vis) {
            vis = JSROOT.TestGeoAttBit(obj.fVolume, JSROOT.EGeoVisibilityAtt.kVisOnScreen);
         } else {
            vis = JSROOT.TestGeoAttBit(obj.fVolume, JSROOT.EGeoVisibilityAtt.kVisThis);
            if (JSROOT.TestGeoAttBit(obj.fVolume, JSROOT.EGeoVisibilityAtt.kVisOneLevel)) obj._visdepth = 1; else
            if (!JSROOT.TestGeoAttBit(obj.fVolume, JSROOT.EGeoVisibilityAtt.kVisDaughters)) obj._visdepth = 0;
         }

      } else {
         if (obj.fShape === undefined) return res;
         shape = obj.fShape;
         chlds = (obj.fElements !== null) ? obj.fElements.arr : null;
         vis = obj.fRnrSelf;
      }

      if ('cnt' in arg) {
         if (arg.cnt[lvl] === undefined) arg.cnt[lvl] = 0;
         arg.cnt[lvl] += 1;
      }

      if ('_refcnt' in obj) {
          obj._refcnt++;
      } else {
         obj._refcnt = 1;
         obj._numchld = 0; // count number of childs
         obj._numvischld = 0; // count number of visible childs
         arg.map.push(obj);

         //  var min = Math.min( Math.min( shape.fDX, shape.fDY ), shape.fDZ );
         obj._volume = shape ? shape.fDX * shape.fDY * shape.fDZ : 0;
         obj._visible = vis;

         if (chlds !== null)
            for (var i = 0; i < chlds.length; ++i) {
               var chld_res = this.CountGeoNodes(chlds[i], arg, lvl+1);
               obj._numchld += chld_res.cnt;
               obj._numvischld += chld_res.vis;
            }
      }

      if ((lvl === 0) && arg.erase) arg.clear();

      res.cnt = 1 + obj._numchld; // account number of volumes
      res.vis = (obj._visible ? 1 : 0) + obj._numvischld; // account number of visible volumes

      return res;
   }

   JSROOT.TGeoPainter.prototype.CreateClonedStructures = function(arg) {
      if (!arg || !arg.map) return;

      var tm1 = new Date().getTime();

      for (var n=0;n<arg.map.length;++n)
         arg.map[n]._refid = n; // mark all objects, need for the dereferencing

      var cloned_map = [];

      // first create nodes themself
      for (var n=0;n<arg.map.length;++n) {
         var obj = arg.map[n];
         cloned_map.push({ vol: obj._volume,  vis: obj._visible });
      }

      // than fill childrens lists
      for (var n=0;n<arg.map.length;++n) {
         var obj = arg.map[n];

         var kind = JSROOT.GEO.NodeKind(obj);

         var chlds = null, shape = null;

         if (kind === 0) {
            if (obj.fVolume) {
               shape = obj.fVolume.fShape;
               if (obj.fVolume.fNodes) chlds = obj.fVolume.fNodes;
            }
         } else {
            shape = obj.fShape;
            if (obj.fElements) chlds = obj.fElements.arr;
         }

         var clone = cloned_map[n];

         var matrix = JSROOT.GEO.getNodeMatrix(kind, obj);
         if (matrix) clone.matrix = matrix.elements; // take only matrix elements, matrix will be constructed in worker
         if (shape) {
            clone.fDX = shape.fDX;
            clone.fDY = shape.fDY;
            clone.fDZ = shape.fDZ;
         }

         if (!chlds) continue;

         clone.chlds = [];
         for (var k=0;k<chlds.length;++k) {
            var chld = chlds[k];
            clone.chlds.push(cloned_map[chld._refid]);
         }
      }

      var tm2 = new Date().getTime();

      console.log('Creating clone takes', tm2-tm1);

      this.startWorker();

      var tm3 = new Date().getTime();

      console.log('Start worker in main context takes', tm3-tm2);

      this._worker.postMessage( { map: cloned_map, tm0: new Date() } );

      var tm4 = new Date().getTime();

      console.log('Post message in main thread takes ', tm4-tm3);

      console.log('Full clone and worker initialization took ', tm4-tm1);
   }

   JSROOT.TGeoPainter.prototype.CountVisibleNodes = function(obj, arg, vislvl) {
      // after flags are set, one should eplicitly count how often each nodes is visible
      // one could use volume cut if necessary
      // At the end list of visible nodes are created (arg.vismap) and counter how often each node is shown

      if (!arg) return 0;

      if (vislvl === undefined) {
         vislvl = 9999;
         arg.vismap = []; // list of all visible nodes (after volume cut)
         if (arg.minVolume === undefined) arg.minVolume = 0;

         for (var n=0;n<arg.map.length;++n) {
            delete arg.map[n]._viscnt; // how often node was counted as visible
         }
      }

      var kind = JSROOT.GEO.NodeKind(obj);
      if ((kind<0) || (vislvl<0)) return 0;

      var chlds = null, res = 0;
      if (kind === 0) {
         if ((obj.fVolume === undefined) || (obj.fVolume === null)) return 0;
         chlds = (obj.fVolume.fNodes !== null) ? obj.fVolume.fNodes.arr : null;
      } else {
         chlds = (obj.fElements !== null) ? obj.fElements.arr : null;
      }

      if (obj._visible && (obj._volume > arg.minVolume)) {
         if (obj._viscnt === undefined) {
             obj._viscnt = 0;
             arg.vismap.push(obj);
         }
         obj._viscnt++;
         res++;
      }

      if ('_visdepth' in obj) vislvl = obj._visdepth;

      if ((chlds !== null) && (obj._numvischld > 0) && (vislvl > 0))
         for (var i = 0; i < chlds.length; ++i)
            res += this.CountVisibleNodes(chlds[i], arg, vislvl-1);

      return res;
   }

   JSROOT.TGeoPainter.prototype.CountCameraNodes = function(obj, arg, vislvl, parentMatrix) {
      // Count how many nodes are seen by camera
      // Only node which inside (minCamVolume..minVolume] interval are recognized
      // At the end list of visible nodes are created (arg.vismap) and counter how often each node is shown

      if (!arg) return 0;

      if (vislvl === undefined) {
         vislvl = 9999;
         arg.cammap = []; // list of all visible by camera nodes (after volume cut)
         if (arg.minCamVolume === undefined) arg.minCamVolume = 0;
         for (var n=0;n<arg.map.length;++n)
            delete arg.map[n]._camcnt; // how often node was counted as visible by camera
      }

      var kind = JSROOT.GEO.NodeKind(obj);
      if ((kind<0) || (vislvl<0)) return 0;

      var chlds = null, shape, matrix, res = 0;
      if (kind === 0) {
         if ((obj.fVolume === undefined) || (obj.fVolume === null)) return 0;
         shape = obj.fVolume.fShape;
         chlds = (obj.fVolume.fNodes !== null) ? obj.fVolume.fNodes.arr : null;
      } else {
         shape = obj.fShape;
         chlds = (obj.fElements !== null) ? obj.fElements.arr : null;
      }

      if ('_visdepth' in obj) vislvl = obj._visdepth;

      if (parentMatrix) matrix = parentMatrix.clone();
                   else matrix = new THREE.Matrix4();

      if (obj._matrix === undefined)
         obj._matrix = JSROOT.GEO.getNodeMatrix(kind, obj);

      if (obj._matrix) matrix.multiply(obj._matrix);

      if (obj._visible && (obj._volume <= arg.minVolume) && (obj._volume > arg.minCamVolume))
         if (JSROOT.GEO.VisibleByCamera(this._camera, matrix, shape)) {
            if (!('_camcnt' in obj)) {
               obj._camcnt = 0;
               arg.cammap.push(obj);
            }
            obj._camcnt++;
            res++;
         }

      if ((chlds !== null) && (obj._numvischld > 0) && (vislvl > 0))
         for (var i = 0; i < chlds.length; ++i)
            res += this.CountCameraNodes(chlds[i], arg, vislvl-1, matrix);

      return res;
   }


   JSROOT.TGeoPainter.prototype.SameMaterial = function(node1, node2) {

      if ((node1===null) || (node2===null)) return node1 === node2;

      if (node1.fVolume.fLineColor >= 0)
         return (node1.fVolume.fLineColor === node2.fVolume.fLineColor);

       var m1 = (node1.fVolume['fMedium'] !== null) ? node1.fVolume['fMedium']['fMaterial'] : null;
       var m2 = (node2.fVolume['fMedium'] !== null) ? node2.fVolume['fMedium']['fMaterial'] : null;

       if (m1 === m2) return true;

       if ((m1 === null) || (m2 === null)) return false;

       return (m1.fFillStyle === m2.fFillStyle) && (m1.fFillColor === m2.fFillColor);
    }

   JSROOT.TGeoPainter.prototype.ScanUniqueVisVolumes = function(obj, lvl, arg) {
      if ((obj === undefined) || (obj===null) || (typeof obj !== 'object') ||
          (obj.fVolume === undefined) || (obj.fVolume == null)) return 0;

      if (lvl === 0) {
         arg.master = null;
         arg.vis_unique = true;
         arg.vis_master = null; // master used to verify material attributes
         arg.same_material = true;
      }

      var res = obj._visible ? 1 : 0;

      if (obj._refcnt > 1) arg.vis_unique = false;
      if (arg.master!==null)
         if (!this.SameMaterial(arg.master, obj)) arg.same_material = false;

      var top_unique = arg.vis_unique;
      arg.vis_unique = true;

      var top_master = arg.master, top_same = arg.same_material;

      arg.master = obj._visible ? obj : null;
      arg.same_material = true;

      var arr = (obj.fVolume.fNodes !== null) ? obj.fVolume.fNodes.arr : null;

      var numvis = 0;
      if (arr !== null)
         for (var i = 0; i < arr.length; ++i)
            numvis += this.ScanUniqueVisVolumes(arr[i], lvl+1, arg);

      obj._numvis = numvis;
      obj._visunique  = arg.vis_unique;
      obj._samematerial = arg.same_material;

      if (obj._samematerial) {
         if (top_same && (top_master!=null) && (arg.master!==null))
            arg.same_material = this.SameMaterial(top_master, arg.master);
         else
            arg.same_material = top_same;

         if (top_master !== null) arg.master = top_master;
      } else {
         arg.master = null; // when material differ, no need to preserve master
         arg.same_material = false;
      }

      arg.vis_unique = top_unique && obj._visunique;

      return res + numvis;
   }

   JSROOT.TGeoPainter.prototype.createScene = function(webgl, w, h, pixel_ratio) {
      // three.js 3D drawing
      this._scene = new THREE.Scene();
      this._scene.fog = new THREE.Fog(0xffffff, 500, 300000);
      this._scene.overrideMaterial = new THREE.MeshLambertMaterial( { color: 0x7000ff, transparent: true, opacity: 0.2, depthTest: false } );

      this._scene_width = w;
      this._scene_height = h;

      this._camera = new THREE.PerspectiveCamera(25, w / h, 1, 100000);

      this._renderer = webgl ?
                        new THREE.WebGLRenderer({ antialias : true, logarithmicDepthBuffer: true,
                                                  preserveDrawingBuffer: true }) :
                        new THREE.CanvasRenderer({antialias : true });
      this._renderer.setPixelRatio(pixel_ratio);
      this._renderer.setClearColor(0xffffff, 1);
      this._renderer.setSize(w, h);

      var pointLight = new THREE.PointLight(0xefefef);
      this._camera.add( pointLight );
      pointLight.position.set(10, 10, 10);
      this._camera.up = this.options._yup ? new THREE.Vector3(0,1,0) : new THREE.Vector3(0,0,1);
      this._scene.add( this._camera );

      this._toplevel = new THREE.Object3D();

      this._scene.add(this._toplevel);

      this._overall_size = 10;
   }


   JSROOT.TGeoPainter.prototype.startDrawGeometry = function() {
      if (this.MatchObjectType("TGeoNode"))  {
         this._stack = [ { toplevel: this._toplevel, node: this.GetObject(), vislvl:9999, main: true } ];
      }
      else if (this.MatchObjectType('TEveGeoShapeExtract')) {
         this._stack = [ { toplevel: this._toplevel, node: this.GetObject(), vislvl:9999, main: true } ];
      }

      this.accountClear();
   }

   JSROOT.TGeoPainter.prototype.adjustCameraPosition = function() {

      var box = new THREE.Box3().setFromObject(this._toplevel);

      var sizex = box.max.x - box.min.x,
          sizey = box.max.y - box.min.y,
          sizez = box.max.z - box.min.z,
          midx = (box.max.x + box.min.x)/2,
          midy = (box.max.y + box.min.y)/2,
          midz = (box.max.z + box.min.z)/2;

      this._overall_size = 2 * Math.max( sizex, sizey, sizez);

      this._camera.near = this._overall_size / 500;
      this._camera.far = this._overall_size * 500;
      this._camera.updateProjectionMatrix();

//      if (this.options._yup)
//         this._camera.position.set(midx-this._overall_size, midy+this._overall_size, midz-this._overall_size);
//      else
//         this._camera.position.set(midx-this._overall_size, midy-this._overall_size, midz+this._overall_size);

      if (this.options._yup)
         this._camera.position.set(midx-2*Math.max(sizex,sizez), midy+2*sizey, midz-2*Math.max(sizex,sizez));
       else
          this._camera.position.set(midx-2*Math.max(sizex,sizey), midy-2*Math.max(sizex,sizey), midz+2*sizez);


      this._lookat = new THREE.Vector3(midx, midy, midz);
      this._camera.lookAt(this._lookat);

      if (this._controls !== null) {
         this._controls.target.copy(this._lookat);
         this._controls.update();
      }
   }

   JSROOT.TGeoPainter.prototype.completeScene = function() {
      if ( this.options._debug || this.options._grid ) {
         if ( this.options._full ) {
            var boxHelper = new THREE.BoxHelper(this._toplevel);
            this._scene.add( boxHelper );
         }
         this._scene.add( new THREE.AxisHelper( 2 * this._overall_size ) );
         this._scene.add( new THREE.GridHelper( Math.ceil( this._overall_size), Math.ceil( this._overall_size ) / 50 ) );
         this.helpText("<font face='verdana' size='1' color='red'><center>Transform Controls<br>" +
               "'T' translate | 'R' rotate | 'S' scale<br>" +
               "'+' increase size | '-' decrease size<br>" +
               "'W' toggle wireframe/solid display<br>"+
         "keep 'Ctrl' down to snap to grid</center></font>");
      }
   }


   JSROOT.TGeoPainter.prototype.drawCount = function() {

      var tm1 = new Date();

      var arg = { cnt : [], screen_vis: true };
      var count = this.CountGeoNodes(this.GetObject(), arg);

      var res = 'Total number: ' + count.cnt + '<br/>';
      for (var lvl=0;lvl<arg.cnt.length;++lvl) {
         if (arg.cnt[lvl] !== 0)
            res += ('  lvl' + lvl + ': ' + arg.cnt[lvl] + '<br/>');
      }
      res += "Unique volumes: " + arg.map.length + '<br/>';

      if (count.vis === 0) {
         arg.clear(); arg.screen_vis = false;
         count = this.CountGeoNodes(this.GetObject(), arg);
      }

      res += "Visible volumes: " + count.vis + '<br/>';

      if (count.cnt<200000) {
         this.ScanUniqueVisVolumes(this.GetObject(), 0, arg);

         for (var n=0;n<arg.map.length;++n)
            if (arg.map[n]._refcnt > 1) {
               res += (arg.map[n]._visible ? "vis" : "map") + n + " " + arg.map[n].fName + "  nref:"+arg.map[n]._refcnt +
               ' chld:'+ arg.map[n]._numvis + "(" + arg.map[n]._numchld + ')' +
               " unique:" + arg.map[n]._visunique + " same:" + arg.map[n]._samematerial;

               if (arg.map[n]._samematerial) {
                  if (arg.map[n]._visunique && (arg.map[n]._numvis>0)) res+=" (can merge with childs in Worker)"; else
                     if ((arg.map[n]._refcnt > 4) && (arg.map[n]._numvis>1)) res+=" (make sense merge in main thread)";
               }

               res += "<br/>";
            }
      }

      var tm2 = new Date();

      res +=  "Elapsed time: " + (tm2.getTime() - tm1.getTime()) + "ms <br/>";

      this.select_main().style('overflow', 'auto').html(res);

      return this.DrawingReady();
   }


   JSROOT.TGeoPainter.prototype.DrawGeometry = function(opt) {
      if (typeof opt !== 'string') opt = "";

      if (opt === 'count')
         return this.drawCount();

      var size = this.size_for_3d();

      this.options = this.decodeOptions(opt);

      if (!('_yup' in this.options))
         this.options._yup = this.svg_canvas().empty();

      this._webgl = JSROOT.Painter.TestWebGL();

      this._data = { cnt: [], screen_vis: true }; // now count volumes which should go to the processing

      var total = this.CountGeoNodes(this.GetObject(), this._data);

      // if no any volume was selected, probably it is because of visibility flags
      if ((total.cnt > 0) && (total.vis == 0)) {

         console.log('switch to normal visisbility flags');

         this._data.clear();
         this._data.screen_vis = false;
         total = this.CountGeoNodes(this.GetObject(), this._data);
      }

      // scan hierarchy completely, taking into account visibility flags
      var numvis = this.CountVisibleNodes(this.GetObject(), this._data);

      console.log('unique nodes', this._data.map.length, 'with flag', total.vis, 'visible',  numvis);

      var maxlimit = this._webgl ? 2000 : 1000; // maximal number of allowed nodes to be displayed at once
      maxlimit *= this.options.more;

      if (numvis > maxlimit)  {

         console.log('selected number of volumes ' + numvis + ' cannot be disaplyed, try to reduce');

         var t1 = new Date().getTime();
         // sort in reverse order (big first)
         this._data.vismap.sort(function(a,b) { return b._volume - a._volume; })
         var t2 = new Date().getTime();
         console.log('sort time', (t2-t1).toFixed(1));

         var cnt = 0, indx = 0;
         while ((cnt < maxlimit) && (indx < this._data.vismap.length-1))
            cnt += this._data.vismap[indx++]._viscnt;

         this._data.minVolume = this._data.vismap[indx]._volume;

         console.log('Select ', cnt, 'nodes, minimal volume', this._data.minVolume);

         numvis = this.CountVisibleNodes(this.GetObject(), this._data);

         console.log('Selected numvis', numvis);
/*
         t1 = new Date().getTime();
         var numcam = this.CountCameraNodes(this.GetObject(), this._data);
         t2 = new Date().getTime();

         console.log('Selected numcam', numcam, 'time', (t2-t1).toFixed(1));
         if (numcam > maxlimit) {
            console.log('too many object seen by camera, reduce map', this._data.cammap.length)
            this._data.cammap.sort(function(a,b) { return b._volume - a._volume; })
            var cnt = 0, indx = 0;
            while ((cnt < maxlimit) && (indx < this._data.cammap.length-1))
               cnt += this._data.cammap[indx++]._camcnt;
            this._data.minCamVolume = this._data.cammap[indx]._volume;
            console.log('Select ', cnt, 'nodes for camera, minimal volume', this._data.minCamVolume);
            t1 = new Date().getTime();
            numcam = this.CountCameraNodes(this.GetObject(), this._data);
            t2 = new Date().getTime();
            console.log('Selected numcam again', numcam, 'time', (t2-t1).toFixed(1));
            return;
         }
*/
      }

      this.createScene(this._webgl, size.width, size.height, window.devicePixelRatio);

      this.add_3d_canvas(size, this._renderer.domElement);

      this.startDrawGeometry();

      this._startm = new Date().getTime();

      this._drawcnt = 0; // counter used to build meshes

      this.CreateToolbar( { container: this.select_main().node() } );

      return this.continueDraw();
   }

   JSROOT.TGeoPainter.prototype.continueDraw = function() {
      var curr = new Date().getTime();

      var log = "";
      var previewInterval = this._webgl ? 1000 : 2000;

      while(true) {
         if (this.drawNode()) {
            log = "Creating meshes " + this._drawcnt;
         } else
            break;

         var now = new Date().getTime();

         if (now - curr > previewInterval) {
            JSROOT.progress(log);
            setTimeout(this.continueDraw.bind(this), 0);
            this.adjustCameraPosition();
            this._renderer.render(this._scene, this._camera);
            return this;
         }

         // stop creation, render as is
         if (now - this._startm > 1e5) break;
      }

      var t2 = new Date().getTime();
      JSROOT.console('Create tm = ' + (t2-this._startm) + ' geom ' + this._num_geom + ' vertices ' + this._num_vertices + ' faces ' + this._num_faces + ' nodes ' + this._num_nodes);

      if (t2 - this._startm > 300) {
         JSROOT.progress('Rendering geometry');
         setTimeout(this.completeDraw.bind(this, true), 0);
         return this;
      }

      return this.completeDraw(true);
   }

   JSROOT.TGeoPainter.prototype.Render3D = function(tmout) {
      if (tmout === undefined) tmout = 5; // by default, rendering happens with timeout

      if (tmout <= 0) {
         if ('render_tmout' in this)
            clearTimeout(this['render_tmout']);

         var tm1 = new Date();

         // do rendering, most consuming time
         this._renderer.render(this._scene, this._camera);

         var tm2 = new Date();

         delete this['render_tmout'];

         if (this.first_render_tm === 0) {
            this.first_render_tm = tm2.getTime() - tm1.getTime();
            JSROOT.console('First render tm = ' + this.first_render_tm);
            this.addControls();
         }

         return;
      }

      // no need to shoot rendering once again
      if ('render_tmout' in this) return;

      this['render_tmout'] = setTimeout(this.Render3D.bind(this,0), tmout);
   }


   JSROOT.TGeoPainter.prototype.startWorker = function() {

      this._worker = new Worker(JSROOT.source_dir + "scripts/JSRootGeoWorker.js");

      this._worker.onmessage = function(e) {

         if (typeof e.data !== 'object') return;

         if ('log' in e.data)
            return JSROOT.console('geo: ' + e.data.log);

         if ('init' in e.data)
            return JSROOT.console('full init tm: ' + ((new Date()).getTime() - e.data.tm0.getTime()));
      };

      this._worker.postMessage( { init: true, tm0: new Date() } );
   }


   JSROOT.TGeoPainter.prototype.completeDraw = function(close_progress) {

      this.adjustCameraPosition();

      this.completeScene();

      if (this.options._axis) {
         var axis = JSROOT.Create("TNamed");
         axis._typename = "TAxis3D";
         axis._main = this;
         JSROOT.draw(this.divid, axis); // it will include drawing of
      }

      this._scene.overrideMaterial = null;

      this.Render3D();

      if (close_progress) JSROOT.progress();

      this.CreateClonedStructures(this._data);

      this._data.clear();

      // pointer used in the event handlers
      var pthis = this;
      var dom = this.select_main().node();

      if (dom !== null) {
         dom.tabIndex = 0;
         dom.focus();
         dom.onkeypress = function(e) {
            if (!e) e = event;
            switch ( e.keyCode ) {
               case 87:  // W
               case 119: // w
                  pthis.toggleWireFrame(pthis._scene);
                  break;
            }
         };
         dom.onclick = function(e) {
            dom.focus();
         };
      }

      return this.DrawingReady();
   }


   JSROOT.TGeoPainter.prototype.Cleanup = function(first_time) {

      if (first_time === undefined) {
         this.helpText();
         if (this._scene !== null)
            this.deleteChildren(this._scene);
         if ( this._tcontrols !== null)
            this._tcontrols.dispose();
         if (this._controls !== null)
            this._controls.dispose();
      }

      this._scene = null;
      this._scene_width = 0;
      this._scene_height = 0;
      this._renderer = null;
      this._toplevel = null;
      this._stack = null;
      this._camera = null;

      this.first_render_tm = 0;

      this._controls = null;
      this._tcontrols = null;
      this._toolbar = null;
   }

   JSROOT.TGeoPainter.prototype.helpText = function(msg) {
      JSROOT.progress(msg);
   }

   JSROOT.TGeoPainter.prototype.CheckResize = function() {

      var pad_painter = this.pad_painter();

      // firefox is the only browser which correctly supports resize of embedded canvas,
      // for others we should force canvas redrawing at every step
      if (pad_painter)
         if (!pad_painter.CheckCanvasResize(size, JSROOT.browser.isFirefox ? false : true)) return false;

      var size3d = this.size_for_3d();

      if ((this._scene_width === size3d.width) && (this._scene_height === size3d.height)) return false;
      if ((size3d.width<10) || (size3d.height<10)) return;

      this._scene_width = size3d.width;
      this._scene_height = size3d.height;

      this._camera.aspect = this._scene_width / this._scene_height;
      this._camera.updateProjectionMatrix();

      this._renderer.setSize( this._scene_width, this._scene_height );

      this.Render3D();

      return true;
   }

   JSROOT.TGeoPainter.prototype.ownedByTransformControls = function(child) {
      var obj = child.parent;
      while (obj && !(obj instanceof THREE.TransformControls) ) {
         obj = obj.parent;
      }
      return (obj && (obj instanceof THREE.TransformControls));
   }

   JSROOT.TGeoPainter.prototype.toggleWireFrame = function(obj) {
      var painter = this;

      var f = function(obj2) {
         if ( obj2.hasOwnProperty("material") && !(obj2 instanceof THREE.GridHelper) ) {
            if (!painter.ownedByTransformControls(obj2))
               obj2.material.wireframe = !obj2.material.wireframe;
         }
      }
      obj.traverse(f);
      this.Render3D();
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

   JSROOT.Painter.drawGeometry = function(divid, geometry, opt) {

      // create painter and add it to canvas
      JSROOT.extend(this, new JSROOT.TGeoPainter(geometry));

      this.SetDivId(divid, 5);

      return this.DrawGeometry(opt);
   }

   JSROOT.Painter.drawGeoObject = function(divid, obj, opt) {
      if (obj === null) return this.DrawingReady();

      var node = null;

      if (('fShapeBits' in obj) && ('fShapeId' in obj)) {
         node = JSROOT.Create("TEveGeoShapeExtract");
         JSROOT.extend(node, { fTrans:null, fShape: obj, fRGBA: [ 0, 1, 0, 1], fElements: null, fRnrSelf: true });
      } else
      if ((obj._typename === 'TGeoVolumeAssembly') || (obj._typename === 'TGeoVolume'))
         node = obj;

      if (node !== null) {
         JSROOT.extend(this, new JSROOT.TGeoPainter(node));
         this.SetDivId(divid, 5);
         return this.DrawGeometry(opt);
      }

      return this.DrawingReady();
   }

   // ===================================================================================

   JSROOT.Painter.drawAxis3D = function(divid, axis, opt) {

      var painter = new JSROOT.TObjectPainter(axis);

      if (!('_main' in axis))
         painter.SetDivId(divid);

      painter['Draw3DAxis'] = function() {
         var main = this.main_painter();

         if ((main === null) && ('_main' in this.GetObject()))
            main = this.GetObject()._main; // simple workaround to get geo painter

         if ((main === null) || (main._toplevel === undefined))
            return console.warn('no geo object found for 3D axis drawing');

         var box = new THREE.Box3().setFromObject(main._toplevel);

         this.xmin = box.min.x; this.xmax = box.max.x;
         this.ymin = box.min.y; this.ymax = box.max.y;
         this.zmin = box.min.z; this.zmax = box.max.z;

         this.size3d = 0; // use min/max values directly as graphical coordinates

         this['DrawXYZ'] = JSROOT.Painter.HPainter_DrawXYZ;

         this.toplevel = main._toplevel;

         this.DrawXYZ();

         main.adjustCameraPosition();

         main.Render3D();
      }

      painter.Draw3DAxis();

      return painter.DrawingReady();
   }

   // ===============================================================================

   JSROOT.expandGeoList = function(item, lst) {
      if ((lst==null) || !('arr' in lst) || (lst.arr.length==0)) return;

      item['_more'] = true;
      item['_geolst'] = lst;

      item['_get'] = function(item, itemname, callback) {
         if ('_geolst' in item)
            JSROOT.CallBack(callback, item, item._geolst);

         if ('_geoobj' in item)
            return JSROOT.CallBack(callback, item, item._geoobj);

         JSROOT.CallBack(callback, item, null);
      }
      item['_expand'] = function(node, lst) {
         // only childs
         if (!('arr' in lst)) return false;

         node['_childs'] = [];

         for (var n in lst.arr) {
            var obj = lst.arr[n];
            var sub = {
               _kind : "ROOT." + obj._typename,
               _name : obj.fName,
               _title : obj.fTitle,
               _parent : node,
               _geoobj : obj
            };

            if (obj._typename == "TGeoMaterial") sub._icon = "img_geomaterial"; else
            if (obj._typename == "TGeoMedium") sub._icon = "img_geomedium"; else
            if (obj._typename == "TGeoMixture") sub._icon = "img_geomixture";

            node['_childs'].push(sub);
         }

         return true;
      }
   };

   JSROOT.provideGeoVisStyle = function(volume) {
      var res = "";

      if (JSROOT.TestGeoAttBit(volume, JSROOT.EGeoVisibilityAtt.kVisThis))
         res += " geovis_this";

      if (JSROOT.TestGeoAttBit(volume, JSROOT.EGeoVisibilityAtt.kVisDaughters))
         res += " geovis_daughters";

      return res;
   }

   JSROOT.provideGeoMenu = function(menu, item, hpainter) {
      if (! ('_volume' in item)) return false;

      menu.add("separator");
      var vol = item._volume;

      function ToggleMenuBit(arg) {
         JSROOT.ToggleGeoAttBit(vol, arg);
         item._icon = item._icon.split(" ")[0] + JSROOT.provideGeoVisStyle(vol);
         hpainter.UpdateTreeNode(item);
      }

      menu.addchk(JSROOT.TestGeoAttBit(vol, JSROOT.EGeoVisibilityAtt.kVisNone), "Invisible",
            JSROOT.EGeoVisibilityAtt.kVisNone, ToggleMenuBit);
      menu.addchk(JSROOT.TestGeoAttBit(vol, JSROOT.EGeoVisibilityAtt.kVisThis), "Visible",
            JSROOT.EGeoVisibilityAtt.kVisThis, ToggleMenuBit);
      menu.addchk(JSROOT.TestGeoAttBit(vol, JSROOT.EGeoVisibilityAtt.kVisDaughters), "Daughters",
            JSROOT.EGeoVisibilityAtt.kVisDaughters, ToggleMenuBit);
      menu.addchk(JSROOT.TestGeoAttBit(vol, JSROOT.EGeoVisibilityAtt.kVisOneLevel), "1lvl daughters",
            JSROOT.EGeoVisibilityAtt.kVisOneLevel, ToggleMenuBit);

      return true;
   }

   JSROOT.geoIconClick = function(hitem) {
      if ((hitem==null) || (hitem._volume == null)) return false;
      JSROOT.ToggleGeoAttBit(hitem._volume, JSROOT.EGeoVisibilityAtt.kVisDaughters);
      hitem._icon = hitem._icon.split(" ")[0] + JSROOT.provideGeoVisStyle(hitem._volume);
      return true; // hpainter.UpdateTreeNode(hitem);
   }

   JSROOT.getGeoShapeIcon = function(shape) {
      switch (shape._typename) {
         case "TGeoArb8" : return "img_geoarb8"; break;
         case "TGeoCone" : return "img_geocone"; break;
         case "TGeoConeSeg" : return "img_geoconeseg"; break;
         case "TGeoCompositeShape" : return "img_geocomposite"; break;
         case "TGeoTube" : return "img_geotube"; break;
         case "TGeoTubeSeg" : return "img_geotubeseg"; break;
         case "TGeoPara" : return "img_geopara"; break;
         case "TGeoParaboloid" : return "img_geoparab"; break;
         case "TGeoPcon" : return "img_geopcon"; break;
         case "TGeoPgon" : return "img_geopgon"; break;
         case "TGeoShapeAssembly" : return "img_geoassembly"; break;
         case "TGeoSphere" : return "img_geosphere"; break;
         case "TGeoTorus" : return "img_geotorus"; break;
         case "TGeoTrd1" : return "img_geotrd1"; break;
         case "TGeoTrd2" : return "img_geotrd2"; break;
         case "TGeoXtru" : return "img_geoxtru"; break;
         case "TGeoTrap" : return "img_geotrap"; break;
         case "TGeoGtra" : return "img_geogtra"; break;
         case "TGeoEltu" : return "img_geoeltu"; break;
         case "TGeoHype" : return "img_geohype"; break;
         case "TGeoCtub" : return "img_geoctub"; break;
      }
      return "img_geotube";
   }

   JSROOT.expandGeoShape = function(parent, shape, itemname) {
      var item = {
            _kind : "ROOT." + shape._typename,
            _name : itemname,
            _title : shape._typename,
            _icon : JSROOT.getGeoShapeIcon(shape),
            _parent : parent,
            _shape : shape,
            _get : function(item, itemname, callback) {
               if ((item!==null) && ('_shape' in item))
                  return JSROOT.CallBack(callback, item, item._shape);
               JSROOT.CallBack(callback, item, null);
            }
         };

      if (!('_childs' in parent)) parent['_childs'] = [];
      parent._childs.push(item);
      return true;
   }

   JSROOT.expandGeoVolume = function(parent, volume, arg) {

      if ((parent == null) || (volume==null)) return false;

      // avoid duplication
      if ('_childs' in parent)
         for (var n=0;n<parent._childs.length;++n)
            if (volume === parent._childs[n]._volume) return true;

      var item = {
         _kind : "ROOT.TGeoVolume",
         _name : (arg!=null) ? arg : volume.fName,
         _title : volume.fTitle,
         _parent : parent,
         _volume : volume, // keep direct reference
         _more : (volume.fNodes !== undefined) && (volume.fNodes !== null),
         _menu : JSROOT.provideGeoMenu,
         _icon_click : JSROOT.geoIconClick,
         _get : function(item, itemname, callback) {
            if ((item!=null) && ('_volume' in item))
               return JSROOT.CallBack(callback, item, item._volume);

            JSROOT.CallBack(callback, item, null);
         }
      };

      if (item['_more']) {
        item['_expand'] = function(node, obj) {
           var subnodes = obj.fNodes.arr;
           for (var i in subnodes)
              JSROOT.expandGeoVolume(node, subnodes[i].fVolume);
           return true;
        }
      } else
      if ((volume.fShape !== null) && (volume.fShape._typename === "TGeoCompositeShape") && (volume.fShape.fNode !== null)) {
         item['_more'] = true;
         item['_expand'] = function(node, obj) {
            JSROOT.expandGeoShape(node, obj.fShape.fNode.fLeft, 'Left');
            JSROOT.expandGeoShape(node, obj.fShape.fNode.fRight, 'Right');
            return true;
         }
      }

      if (item._title == "")
         if (volume._typename != "TGeoVolume") item._title = volume._typename;

      if (volume.fShape !== null) {
         if (item._title == "")
            item._title = volume.fShape._typename;

         item._icon = JSROOT.getGeoShapeIcon(volume.fShape);
      }

      if (!('_childs' in parent)) parent['_childs'] = [];

      if (!('_icon' in item))
         item._icon = item['_more'] ? "img_geocombi" : "img_geobbox";

      item._icon += JSROOT.provideGeoVisStyle(volume);

      // avoid name duplication of the items
      for (var cnt=0;cnt<1000000;cnt++) {
         var curr_name = item._name;
         if (curr_name.length == 0) curr_name = "item";
         if (cnt>0) curr_name+= "_"+cnt;
         // avoid name duplication
         for (var n in parent['_childs']) {
            if (parent['_childs'][n]['_name'] == curr_name) {
               curr_name = ""; break;
            }
         }
         if (curr_name.length > 0) {
            if (cnt>0) item._name = curr_name;
            break;
         }
      }

      parent['_childs'].push(item);

      return true;
   }

   JSROOT.expandGeoManagerHierarchy = function(hitem, obj) {
      if ((hitem==null) || (obj==null)) return false;

      hitem['_childs'] = [];

      var item1 = { _name : "Materials", _kind : "Folder", _title : "list of materials" };
      JSROOT.expandGeoList(item1, obj.fMaterials);
      hitem['_childs'].push(item1);

      var item2 = { _name : "Media", _kind : "Folder", _title : "list of media" };
      JSROOT.expandGeoList(item2, obj.fMedia);
      hitem['_childs'].push(item2);

      var item3 = { _name : "Tracks", _kind : "Folder", _title : "list of tracks" };
      JSROOT.expandGeoList(item3, obj.fTracks);
      hitem['_childs'].push(item3);

      JSROOT.expandGeoVolume(hitem, obj.fMasterVolume, "Volume");

      return true;
   }

   JSROOT.addDrawFunc({ name: "TGeoVolumeAssembly", icon: 'img_geoassembly', func: JSROOT.Painter.drawGeometry, expand: "JSROOT.expandGeoVolume", opt : "all;count" });
   JSROOT.addDrawFunc({ name: "TAxis3D", func: JSROOT.Painter.drawAxis3D });

   return JSROOT.Painter;

}));

