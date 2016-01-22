/// @file JSRootGeoPainter.js
/// JavaScript ROOT 3D geometry painter

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      // AMD. Register as an anonymous module.
      define( ['JSRootPainter', 'JSRootGeoBase', 'THREE_ALL'], factory );
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

   if ( typeof define === "function" && define.amd )
      JSROOT.loadScript('$$$style/JSRootGeoPainter.css');

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
      if (!('fGeoAtt' in volume)) return false;
      return (volume['fGeoAtt'] & f) != 0;
   }

   JSROOT.ToggleGeoAttBit = function(volume, f) {
      if (!('fGeoAtt' in volume)) return false;

      volume['fGeoAtt'] = volume['fGeoAtt'] ^ (f & 0xffffff);
   }

   JSROOT.TGeoPainter = function( geometry ) {
      JSROOT.TBasePainter.call( this, geometry );
      this._worker = null;
      this._isworker = false;

      if ((geometry !== null) && (geometry['_typename'].indexOf('TGeoVolume') === 0))
         geometry = { _typename:"TGeoNode", fVolume: geometry, fName:"TopLevel" };

      this._geometry = geometry;
      this._scene = null;
      this._renderer = null;
      this._toplevel = null;
      this._stack = null;
   }

   JSROOT.TGeoPainter.prototype = Object.create( JSROOT.TBasePainter.prototype );

   JSROOT.TGeoPainter.prototype.GetObject = function() {
      return this._geometry;
   }

   JSROOT.TGeoPainter.prototype.decodeOptions = function(opt) {
      var res = { _grid: false, _bound: false, _debug: false, _full: false, maxlvl: -1 };

      var _opt = JSROOT.GetUrlOption('_grid');
      if (_opt !== null && _opt == "true") res._grid = true;
      var _opt = JSROOT.GetUrlOption('_debug');
      if (_opt !== null && _opt == "true") { res._debug = true; res._grid = true; }
      if (_opt !== null && _opt == "bound") { res._debug = true; res._grid = true; res._bound = true; }
      if (_opt !== null && _opt == "full") { res._debug = true; res._grid = true; res._full = true; res._bound = true; }

      opt = opt.toLowerCase();

      if (opt.indexOf("all")>=0) {
         res.maxlvl = 9999;
         opt = opt.replace("all", " ");
      }
      if (opt.indexOf("limit")>=0) {
         res.maxlvl = 1111;
         opt = opt.replace("limit", " ");
      }

      var p = opt.indexOf("maxlvl");
      if (p>=0) {
         res.maxlvl = parseInt(opt.substr(p+6, 1));
         opt = opt.replace("maxlvl" + res.maxlvl, " ");
      }

      if (opt.indexOf("d")>=0) res._debug = true;
      if (opt.indexOf("g")>=0) res._grid = true;
      if (opt.indexOf("b")>=0) res._bound = true;
      if (opt.indexOf("f")>=0) res._full = true;

      return res;
   }


   JSROOT.TGeoPainter.prototype.startWorker = function() {

      this._worker = [];

      for (var n=0;n<4;n++) {

         this._worker[n] = new Worker(JSROOT.source_dir + "scripts/JSRootGeoWorker.js");

         this._worker[n].onmessage = function(e) {

            if (typeof e.data !== 'object') return;

            if ('log' in e.data)
               return JSROOT.console('geo: ' + e.data.log);

            if ('init' in e.data)
               return JSROOT.console('full init tm: ' + ((new Date()).getTime() - e.data.tm0.getTime()));
         };

         this._worker[n].postMessage( { init: true, tm0: new Date() } );
      }
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

      if ( this.options._debug || this.options._grid ) {
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

      renderer.domElement.addEventListener('mouseover', function() {
         mouseover = true;
         animate();
      });

      renderer.domElement.addEventListener('mouseoout', function() {
         mouseover = false;
      });

      animate();
   }

   JSROOT.GEO.createNodeMesh = function(node) {
      var volume = node['fVolume'];

      var translation_matrix = null; // [0, 0, 0];
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
                node['fMatrix']['fRotation'] != null) {
               rotation_matrix = node['fMatrix']['fRotation']['fRotationMatrix'];
            }
         }
      }
      if ((node['_typename'] == "TGeoNodeOffset") && (node['fFinder'] != null)) {
         // if (node['fFinder']['_typename'] == 'TGeoPatternParaX') { }
         // if (node['fFinder']['_typename'] == 'TGeoPatternParaY') { }
         // if (node['fFinder']['_typename'] == 'TGeoPatternParaZ') { }
         // if (node['fFinder']['_typename'] == 'TGeoPatternTrapZ') { }
         // if (node['fFinder']['_typename'] == 'TGeoPatternCylR') { }
         // if (node['fFinder']['_typename'] == 'TGeoPatternSphR') { }
         // if (node['fFinder']['_typename'] == 'TGeoPatternSphTheta') { }
         // if (node['fFinder']['_typename'] == 'TGeoPatternSphPhi') { }
         // if (node['fFinder']['_typename'] == 'TGeoPatternHoneycomb') { }
         if ((node['fFinder']['_typename'] == 'TGeoPatternX') ||
             (node['fFinder']['_typename'] == 'TGeoPatternY') ||
             (node['fFinder']['_typename'] == 'TGeoPatternZ')) {
            var _shift = node.fFinder.fStart + (node.fIndex + 0.5) * node.fFinder.fStep;

            if (translation_matrix !== null)
               console.warn('translation exists - should we combine with ' + node['fFinder']['_typename']);
            else
            switch (node['fFinder']['_typename'].charAt(11)) {
               case 'X': translation_matrix = [_shift, 0, 0]; break;
               case 'Y': translation_matrix = [0, _shift, 0]; break;
               case 'Z': translation_matrix = [0, 0, _shift,]; break;
            }
         } else
         if (node['fFinder']['_typename'] == 'TGeoPatternCylPhi') {

            var _cos = 1., _sin = 0.;

            if (typeof node['fFinder']['fSinCos'] === 'undefined') {
               _cos = Math.cos((Math.PI / 180.0)*(node['fFinder']['fStart']+(node.fIndex+0.5)*node['fFinder']['fStep']));
               _sin = Math.sin((Math.PI / 180.0)*(node['fFinder']['fStart']+(node.fIndex+0.5)*node['fFinder']['fStep']));
            } else {
               _cos = node['fFinder']['fSinCos'][2*node.fIndex+1];
               _sin = node['fFinder']['fSinCos'][2*node.fIndex];
            }

            if (rotation_matrix === null) {
               rotation_matrix = [_cos, -_sin, 0,
                                  _sin,  _cos, 0,
                                     0,     0, 1];
            } else {
               console.warn('should we multiply rotation matrixes here??');
               rotation_matrix[0] = _cos;
               rotation_matrix[1] = -_sin;
               rotation_matrix[3] = _sin;
               rotation_matrix[4] = _cos;
            }
         } else {
            console.warn('Unsupported pattern type ' + node['fFinder']['_typename']);
         }
      }

      var _isdrawn = false, material = null, geom = null;

      if (node._visible) {
         _isdrawn = true;
         var _transparent = false, _opacity = 1.0, fillcolor;
         if (volume['fLineColor'] >= 0)
            fillcolor = JSROOT.Painter.root_colors[volume['fLineColor']];
         if (typeof volume['fMedium'] != 'undefined' && volume['fMedium'] !== null &&
               typeof volume['fMedium']['fMaterial'] != 'undefined' &&
               volume['fMedium']['fMaterial'] !== null) {
            var fillstyle = volume['fMedium']['fMaterial']['fFillStyle'];
            var transparency = (fillstyle < 3000 || fillstyle > 3100) ? 0 : fillstyle - 3000;
            if (transparency > 0) {
               _transparent = true;
               _opacity = (100.0 - transparency) / 100.0;
            }
            if (fillcolor === undefined)
               fillcolor = JSROOT.Painter.root_colors[volume['fMedium']['fMaterial']['fFillColor']];
         }
         if (fillcolor === undefined)
            fillcolor = "lightgrey";

         material = new THREE.MeshLambertMaterial( { transparent: _transparent,
                              opacity: _opacity, wireframe: false, color: fillcolor,
                              side: THREE.DoubleSide, vertexColors: THREE.VertexColors,
                              overdraw: false } );

      } else {

         if (this._dummy_material === undefined)
            this._dummy_material =
               new THREE.MeshLambertMaterial( { transparent: true, opacity: 0, wireframe: false,
                                                color: 'white', vertexColors: THREE.NoColors,
                                                overdraw: false, depthWrite : false, depthTest: false, visible: false } );

         material = this._dummy_material;
      }


      var geom = null;

      if ( _isdrawn ) {
         if (typeof node._geom === 'undefined') {
            console.log('why is not defined????');
            node._geom = JSROOT.GEO.createGeometry(volume.fShape);
         }
         geom = node._geom;
      }

      if (geom === null) geom = new THREE.Geometry();

      var mesh = new THREE.Mesh( geom, material);

      if (translation_matrix !== null) {
         mesh.position.x = 0.5 * translation_matrix[0];
         mesh.position.y = 0.5 * translation_matrix[1];
         mesh.position.z = 0.5 * translation_matrix[2];
      }

      if (rotation_matrix !== null) {
         var m = new THREE.Matrix4().set( rotation_matrix[0], rotation_matrix[1], rotation_matrix[2],   0,
                                          rotation_matrix[3], rotation_matrix[4], rotation_matrix[5],   0,
                                          rotation_matrix[6], rotation_matrix[7], rotation_matrix[8],   0,
                                          0,                                   0,                  0,   1 );

         if ((rotation_matrix[4] === -1) && (rotation_matrix[0] === 1) && (rotation_matrix[8] === 1)) {
            m = new THREE.Matrix4().makeRotationZ(Math.PI);
         }

         mesh.rotation.setFromRotationMatrix(m);
      }

      mesh._isdrawn = _isdrawn; // extra flag for mesh

      return mesh;
   }

   JSROOT.TGeoPainter.prototype.drawNode = function() {

      if ((this._stack == null) || (this._stack.length == 0)) return false;

      var arg = this._stack[this._stack.length - 1];

      // cut all volumes below 0 level
      // if (arg.lvl===0) { this._stack.pop(); return true; }

      if ('nchild' in arg) {
         // add next child
         if (arg.node.fVolume.fNodes.arr.length <= arg.nchild) {
            this._stack.pop();
         } else {
            this._stack.push({ toplevel: arg.mesh ? arg.mesh : arg.toplevel,
                               node: arg.node.fVolume.fNodes.arr[arg.nchild++] });
         }
         return true;
      }

      var node = arg.node;

      if ('_mesh' in node) {

         // console.log('add again ' + node.fName + ' to parent ' + arg.toplevel['name']);

         arg.toplevel.add(node._mesh.clone());

         this._stack.pop();

         return true;
      }


      node._mesh = JSROOT.GEO.createNodeMesh(node);

      //var json = mesh.toJSON();
      //var loader = new THREE.ObjectLoader();
      // mesh = loader.parse(json);

      if (this.options._debug && (mesh._isdrawn || this.options._full)) {
         var helper = new THREE.WireframeHelper(node._mesh);
         helper.material.color.set(JSROOT.Painter.root_colors[node.fVolume['fLineColor']]);
         helper.material.linewidth = node.fVolume['fLineWidth'];
         this._scene.add(helper);
      }

      if (this.options._bound && (mesh._isdrawn || this.options._full)) {
         var boxHelper = new THREE.BoxHelper( node._mesh );
         arg.toplevel.add( boxHelper );
      }

      node._mesh['name'] = node['fName'];
      // add the mesh to the scene
      arg.toplevel.add(node._mesh);

      arg.mesh = node._mesh;

      if ((typeof node.fVolume.fNodes === 'undefined') || (node.fVolume.fNodes === null) || (node.fVolume.fNodes.arr.length == 0)) {
         // do not draw childs
         this._stack.pop();
      } else {
         arg.nchild = 0; // specify that childs should be extracted
      }

      return true;
   }

   JSROOT.TGeoPainter.prototype.drawEveNode = function(scene, toplevel, node) {
      var container = toplevel;
      var shape = node['fShape'];
      var mesh = null;
      var linecolor = new THREE.Color( node['fRGBALine'][0], node['fRGBALine'][1], node['fRGBALine'][2] );
      var fillcolor = new THREE.Color( node['fRGBA'][0], node['fRGBA'][1], node['fRGBA'][2] );
      var _transparent = true;
      var _helper = false;
      if (this.options._debug) _helper = true;
      var _opacity = 0.0;
      var _isdrawn = false;
      if (node['fRnrSelf'] === true) {
         _transparent = false;
         _opacity = 1.0;
         _isdrawn = true;
      }
      if ( node['fRGBA'][3] < 1.0) {
         _transparent = true;
         _opacity = node['fRGBA'][3];
      }
      var material = new THREE.MeshLambertMaterial( { transparent: _transparent,
               opacity: _opacity, wireframe: false, color: fillcolor,
               side: THREE.DoubleSide, vertexColors: THREE.VertexColors,
               overdraw: false } );
      if ( !_isdrawn ) {
         material.depthWrite = false;
         material.depthTest = false;
         material.visible = false;
      }
      material.polygonOffset = true;
      material.polygonOffsetFactor = -1;
      if (shape !== null)
         mesh = JSROOT.GEO.createMesh(shape, material, _isdrawn);
      if (typeof mesh != 'undefined' && mesh != null) {
         mesh.position.x = 0.5 * node['fTrans'][12];
         mesh.position.y = 0.5 * node['fTrans'][13];
         mesh.position.z = 0.5 * node['fTrans'][14];

         mesh.rotation.setFromRotationMatrix( new THREE.Matrix4().set(
               node['fTrans'][0],  node['fTrans'][4],  node['fTrans'][8],  0,
               node['fTrans'][1],  node['fTrans'][5],  node['fTrans'][9],  0,
               node['fTrans'][2],  node['fTrans'][6],  node['fTrans'][10], 0,
               0, 0, 0, 1 ) );

         if (_isdrawn && _helper) {
            var helper = new THREE.WireframeHelper(mesh);
            helper.material.color.set(JSROOT.Painter.root_colors[volume['fLineColor']]);
            helper.material.linewidth = volume['fLineWidth'];
            scene.add(helper);
         }
         if (this.options._debug && this.options._bound) {
            if (_isdrawn || this.options._full) {
               var boxHelper = new THREE.BoxHelper( mesh );
               toplevel.add( boxHelper );
            }
         }
         mesh['name'] = node['fName'];
         // add the mesh to the scene
         toplevel.add(mesh);
         //if ( this.options._debug && renderer.domElement.transformControl !== null)
         //   renderer.domElement.transformControl.attach( mesh );
         container = mesh;
      }

      if (typeof node['fElements'] != 'undefined' && node['fElements'] != null) {
         var nodes = node['fElements']['arr'];
         for (var i = 0; i < nodes.length; ++i) {
            var inode = node['fElements']['arr'][i];
            this.drawEveNode(scene, container, inode);
         }
      }
   }

   JSROOT.TGeoPainter.prototype.computeBoundingBox = function( mesh, any ) {
      var bbox = null;
      for (var i = 0; i < mesh.children.length; ++i) {
         var node = mesh.children[i];
         if ( node instanceof THREE.Mesh ) {
            if ( any || node['material']['visible'] ) {
               bbox = new THREE.Box3().setFromObject( node );
               return bbox;
            } else {
               bbox = this.computeBoundingBox( node, any );
               if (bbox != null) return bbox;
            }
         }
      }
      return bbox;
   }

   JSROOT.TGeoPainter.prototype.CountGeoVolumes = function(obj, arg, lvl) {
      // count number of volumes, numver per hierarchy level, reference count, number of childs
      // also check if volume shape can be drawn

      if ((obj === undefined) || (obj===null) || (typeof obj !== 'object') ||
          (obj.fVolume === undefined) || (obj.fVolume === null)) return 0;

      if (lvl === undefined) {
         lvl = 0;
         if (!arg) arg = { erase: true };
         if (!('map' in arg)) arg.map = [];
         if (!('vis' in arg)) arg.vis = [];
         if (!('clear' in arg))
            arg.clear = function() {
               for (var n=0;n<this.map.length;++n) {
                  delete this.map[n]._refcnt;
                  delete this.map[n]._numchld;
                  delete this.map[n]._canshow;
                  delete this.map[n]._visible;
               }
               this.map = [];
               this.vis = [];
            };
      }

      if ('cnt' in arg) {
         if (arg.cnt[lvl] === undefined) arg.cnt[lvl] = 0;
         arg.cnt[lvl] += 1;
      }

      if ('_refcnt' in obj) {
          obj._refcnt++;
      } else {
         obj._refcnt = 1;
         obj._numchld = 0;
         obj._canshow = JSROOT.GEO.isShapeSupported(obj.fVolume.fShape);
         arg.map.push(obj);

         /*
         // kVisNone         : JSROOT.BIT(1),           // the volume/node is invisible, as well as daughters
         // kVisThis         : JSROOT.BIT(2),           // this volume/node is visible
         // kVisDaughters    : JSROOT.BIT(3),           // all leaves are visible
         // kVisOneLevel     : JSROOT.BIT(4),           // first level daughters are visible

         if (JSROOT.TestGeoAttBit(obj.fVolume, JSROOT.EGeoVisibilityAtt.kVisNone))
            console.log('not visible');
         else
         if (JSROOT.TestGeoAttBit(obj.fVolume, JSROOT.EGeoVisibilityAtt.kVisOneLevel))
            console.log('only one level');

         if (obj.fVolume.fShape._typename === 'TGeoPara') {
            console.log('got parall vis = ' + JSROOT.TestGeoAttBit(obj.fVolume, JSROOT.EGeoVisibilityAtt.kVisOnScreen));
            obj._visible = true;
            arg.vis.push(obj);
         }
         */


         if (!('_visible' in obj) && obj._canshow)
            if (JSROOT.TestGeoAttBit(obj.fVolume, JSROOT.EGeoVisibilityAtt.kVisOnScreen)
               || ((lvl < arg.maxlvl) && JSROOT.TestGeoAttBit(obj.fVolume, JSROOT.EGeoVisibilityAtt.kVisThis))) {
               obj._visible = true;
               arg.vis.push(obj);
            }

         var arr = (obj.fVolume.fNodes !== null) ? obj.fVolume.fNodes.arr : null;

         if (arr !== null)
            for (var i = 0; i < arr.length; ++i)
               obj._numchld += this.CountGeoVolumes(arr[i], arg, lvl+1);
      }

      if ((lvl === 0) && arg.erase) arg.clear();

      return 1 + obj._numchld;
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

      this._camera = new THREE.PerspectiveCamera(25, w / h, 1, 100000);
      var pointLight = new THREE.PointLight(0xefefef);
      this._camera.add( pointLight );
      pointLight.position.set( 10, 10, 10 );
      this._scene.add( this._camera );

      this._renderer = webgl ?
                        new THREE.WebGLRenderer({ antialias : true, logarithmicDepthBuffer: true  }) :
                        new THREE.CanvasRenderer({antialias : true });
      this._renderer.setPixelRatio(pixel_ratio);
      this._renderer.setClearColor(0xffffff, 1);
      this._renderer.setSize(w, h);

      this._toplevel = new THREE.Object3D();
      //this._toplevel.rotation.x = 30 * Math.PI / 180;
      this._toplevel.rotation.y = 90 * Math.PI / 180;
      this._scene.add(this._toplevel);

      this._overall_size = 10;
   }


   JSROOT.TGeoPainter.prototype.startDrawGeometry = function() {
      if (this._geometry['_typename'] == "TGeoNode")  {
         this._nodedraw = true;

         var shape = this._geometry['fShape'];

         var geom = new THREE.Geometry();
         var material = new THREE.MeshBasicMaterial( { visible: false, transparent: true, opacity: 0.0 } );
         this._cube = new THREE.Mesh(geom, material );
         this._toplevel.add(this._cube);

         this._stack = [ { toplevel: this._cube, node: this._geometry } ];
      }
      else if (this._geometry['_typename'] == 'TEveGeoShapeExtract') {
         this._nodedraw = false;
         if (typeof this._geometry['fElements'] != 'undefined' && this._geometry['fElements'] != null) {
            var nodes = this._geometry['fElements']['arr'];
            for (var i = 0; i < nodes.length; ++i) {
               var node = this._geometry['fElements']['arr'][i];
               this.drawEveNode(this._scene, this._toplevel, node);
            }
         }
      }
   }

   JSROOT.TGeoPainter.prototype.finishDrawGeometry = function() {
      if (this._nodedraw) {

         var max = new THREE.Box3().setFromObject(this._cube).max;

         // this._top.computeBoundingBox();
         // var max = this._top.boundingBox.max;
         this._overall_size = 4 * Math.max( Math.max(Math.abs(max.x), Math.abs(max.y)), Math.abs(max.z));

      } else {
         var max = this.computeBoundingBox(this._toplevel, true).max;
         this._overall_size = 10 * Math.max( Math.max(Math.abs(max.x), Math.abs(max.y)), Math.abs(max.z));
      }

      this._camera.near = this._overall_size / 200;
      this._camera.far = this._overall_size * 500;
      this._camera.updateProjectionMatrix();
      this._camera.position.x = this._overall_size * Math.cos( 135.0 );
      this._camera.position.y = this._overall_size * Math.cos( 45.0 );
      this._camera.position.z = this._overall_size * Math.sin( 45.0 );
   }

   JSROOT.TGeoPainter.prototype.completeScene = function() {
      if ( this.options._debug || this.options._grid ) {
         if ( this.options._full ) {
            var boxHelper = new THREE.BoxHelper(this._cube);
            this._scene.add( boxHelper );
         }
         this._scene.add( new THREE.AxisHelper( 2 * this._overall_size ) );
         this._scene.add( new THREE.GridHelper( Math.ceil( this._overall_size), Math.ceil( this._overall_size ) / 50 ) );
         this._renderer.domElement._translationSnap = Math.ceil( this._overall_size ) / 50;
         if ( this._renderer.domElement.transformControl !== null )
            this._renderer.domElement.transformControl.attach( this._toplevel );
         this.helpText("<font face='verdana' size='1' color='red'><center>Transform Controls<br>" +
               "'T' translate | 'R' rotate | 'S' scale<br>" +
               "'+' increase size | '-' decrease size<br>" +
               "'W' toggle wireframe/solid display<br>"+
         "keep 'Ctrl' down to snap to grid</center></font>");
      }
   }

   JSROOT.TGeoPainter.prototype.drawCount = function() {

      var tm1 = new Date();

      var arg = { cnt : [], maxlvl: -1 };
      var cnt = this.CountGeoVolumes(this._geometry, arg);

      var res = 'Total number: ' + cnt + '<br/>';
      for (var lvl=0;lvl<arg.cnt.length;++lvl) {
         if (arg.cnt[lvl] !== 0)
            res += ('  lvl' + lvl + ': ' + arg.cnt[lvl] + '<br/>');
      }
      res += "Unique volumes: " + arg.map.length + '<br/>';

      if (arg.vis.length === 0) {
         arg.clear(); arg.maxlvl = 9999;
         cnt = this.CountGeoVolumes(this._geometry, arg);
      }

      res += "Visible volumes: " + arg.vis.length + '<br/>';
      if (arg.vis.length < 200) {
         res += "Visible refs: [";
         for (var n=0;n<arg.vis.length;++n)
            res += " " + arg.vis[n]._refcnt;
         res += " ]<br/>";
      }

      if (cnt<200000) {
         this.ScanUniqueVisVolumes(this._geometry, 0, arg);

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


   JSROOT.TGeoPainter.prototype.drawGeometry = function(opt) {
      if (typeof opt !== 'string') opt = "";

      var dom = this.select_main().node();
      var rect = dom.getBoundingClientRect();
      var w = rect.width, h = rect.height, size = 100;
      if (h < 10) { h = parseInt(0.66*w); d.style.height = h +"px"; }

      if (opt == 'count') {
         // this.startWorker();
         return this.drawCount();
      }

      this.options = this.decodeOptions(opt);

      var webgl = (function() {
         try {
            return !!window.WebGLRenderingContext &&
                   !!document.createElement('canvas').getContext('experimental-webgl');
         } catch (e) {
            return false;
         }
       })();

      this._data = { cnt: [], maxlvl : this.options.maxlvl }; // now count volumes which should go to the processing

      var total = this.CountGeoVolumes(this._geometry, this._data);

      // if no any volume was selected, probably it is because of visibility flags
      if ((total>0) && (this._data.vis.length == 0) && (this.options.maxlvl < 0)) {
         this._data.clear();
         this._data.maxlvl = 1111;
         total = this.CountGeoVolumes(this._geometry, this._data);
      }

      var maxlimit = webgl ? 1e7 : 1e4;

      if ((this._data.maxlvl === 1111) && (total > maxlimit))  {
         var sum = 0;
         for (var lvl=1; lvl < this._data.cnt.length; ++lvl) {
            sum += this._data.cnt.cnt[lvl];
            if (sum > maxlimit) {
               this._data.maxlvl = lvl - 1;
               this._data.clear();
               this.CountGeoVolumes(this._geometry, this._data);
               break;
            }
         }
      }

      this.createScene(webgl, w, h, window.devicePixelRatio);

      dom.appendChild(this._renderer.domElement);

      this.SetDivId(); // now one could set painter pointer in child element

      this.startDrawGeometry();

      this._startm = new Date().getTime();

      this._geomcnt = 0; // counter used to create single geometries
      this._drawcnt = 0; // counter used to build final meshes

      return this.continueDraw();
   }

   JSROOT.TGeoPainter.prototype.continueDraw = function() {
      var curr = new Date().getTime();

      var log = "";

      while(true) {
         if (this._geomcnt < this._data.vis.length) {
            if (this._geomcnt < 8000) {
               this._data.vis[this._geomcnt]._geom = JSROOT.GEO.createGeometry(this._data.vis[this._geomcnt].fVolume.fShape);
            } else {
               if (this._dummy_geom === undefined) this._dummy_geom = new THREE.Geometry();
               this._data.vis[this._geomcnt]._geom = this._dummy_geom;
            }
            this._geomcnt++;
            log = "Creating geometries " + this._geomcnt + "/" + this._data.vis.length;
         } else
         if (this.drawNode()) {
            this._drawcnt++;
            log = "Creating meshes " + this._drawcnt;
         } else
            break;

         var now = new Date().getTime();

         if (this._drawcnt === 1)
            console.log('Create geom time = ' + (now - this._startm));

         if (now - curr > 300) {
            // console.log('again timeout ' + this._drawcnt);
            JSROOT.progress(log);
            setTimeout(this.continueDraw.bind(this), 0);
            return this;
         }

         // stop creation, render as is
         if (now - this._startm > 1e5) break;
      }

      var t2 = new Date().getTime();
      console.log('Create tm = ' + (t2-this._startm));

      if (t2 - this._startm > 300) {
         JSROOT.progress('Rendering geometry');
         setTimeout(this.completeDraw.bind(this, true), 0);
         return this;
      }

      return this.completeDraw();
   }

   JSROOT.TGeoPainter.prototype.completeDraw = function(close_progress) {
      this.finishDrawGeometry();

      this.addControls(this._renderer, this._scene, this._camera);

      this.completeScene();

      var t1 = new Date().getTime();
      this._renderer.render(this._scene, this._camera);
      var t2 = new Date().getTime();

      if (close_progress) JSROOT.progress();

      console.log('Render tm = ' + (t2-t1));

      // pointer used in the event handlers
      var pthis = this;

      var dom = this.select_main().node();

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
         this.focus();
      };

      return this.DrawingReady();
   }


   JSROOT.TGeoPainter.prototype.Cleanup = function() {
      this.helpText();
      if (this._scene === null ) return;

      this._renderer.domElement.clock = null;
      if (this._renderer.domElement._timeoutFunc != null)
         clearTimeout( this._renderer.domElement._timeoutFunc );
      if (this._renderer.domElement._animationId != null)
         cancelAnimationFrame( this._renderer.domElement._animationId );

      this.deleteChildren(this._scene);
      //this._renderer.initWebGLObjects(this._scene);
      delete this._scene;
      this._scene = null;
      if ( this._renderer.domElement.transformControl !== null )
         this._renderer.domElement.transformControl.dispose();
      this._renderer.domElement.transformControl = null;
      this._renderer.domElement.trackballControls = null;
      this._renderer.domElement.render = null;
      this._renderer = null;
   }

   JSROOT.TGeoPainter.prototype.helpText = function(msg) {
      var id = "jsroot_helptext";
      var box = d3.select("#"+id);
      var newmsg = true;
      if ((typeof msg == "undefined") || (msg==null)) {
         if (box.empty())
            return;
         box.property('stack').pop();
         if (box.property('stack').length==0)
            return box.remove();
         msg = box.property('stack')[box.property('stack').length-1]; // show prvious message
         newmsg = false;
      }
      if (box.empty()) {
         box = d3.select(document.body)
           .append("div")
           .attr("id", id)
           .attr("class","progressbox")
           .property("stack",new Array);

         box.append("p");
      }
      box.select("p").html(msg);
      if (newmsg) {
         box.property('stack').push(msg);
         box.property("showtm", new Date);
      }
   }

   JSROOT.TGeoPainter.prototype.CheckResize = function(size) {

      var rect = this.select_main().node().getBoundingClientRect();

      if ((size!=null) && ('width' in size) && ('height' in size)) rect = size;

      if ((rect.width<10) || (rect.height<10)) return;

      this._camera.aspect = rect.width / rect.height;
      this._camera.updateProjectionMatrix();

      this._renderer.setSize( rect.width, rect.height );

   }

   JSROOT.TGeoPainter.prototype.ownedByTransformControls = function(child) {
      var obj = child.parent;
      while (obj && !(obj instanceof THREE.TransformControls) ) {
         obj = obj.parent;
      }
      return (obj && (obj instanceof THREE.TransformControls));
   }

   JSROOT.TGeoPainter.prototype.toggleWireFrame = function(obj) {
      var f = function(obj2) {
         if ( obj2.hasOwnProperty("material") && !(obj2 instanceof THREE.GridHelper) ) {
            if (!this.ownedByTransformControls(obj2))
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

   JSROOT.Painter.drawGeometry = function(divid, geometry, opt) {

      // create painter and add it to canvas
      JSROOT.extend(this, new JSROOT.TGeoPainter(geometry));

      this.SetDivId(divid);

      return this.drawGeometry(opt);
   }

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

   JSROOT.expandGeoVolume = function(parent, volume, arg) {

      if ((parent == null) || (volume==null)) return false;

      var item = {
         _kind : "ROOT.TGeoVolume",
         _name : (arg!=null) ? arg : volume.fName,
         _title : volume.fTitle,
         _parent : parent,
         _volume : volume, // keep direct reference
         _more : (volume['fNodes'] !== undefined) && (volume['fNodes'] !== null),
         _menu : JSROOT.provideGeoMenu,
         _icon_click : JSROOT.geoIconClick,
         _get : function(item, itemname, callback) {
            if ((item!=null) && (item._volume != null))
               return JSROOT.CallBack(callback, item, item._volume);

            JSROOT.CallBack(callback, item, null);
         },
      };

      if (item['_more'])
        item['_expand'] = function(node, obj) {
           var subnodes = obj['fNodes']['arr'];
           for (var i in subnodes)
              JSROOT.expandGeoVolume(node, subnodes[i]['fVolume']);
           return true;
        }

      if (item._title == "")
         if (volume._typename != "TGeoVolume") item._title = volume._typename;

      if (volume['fShape']!=null) {
         if (item._title == "")
            item._title = volume['fShape']._typename;

         switch (volume['fShape']._typename) {
            case "TGeoArb8" : item._icon = "img_geoarb8"; break;
            case "TGeoCone" : item._icon = "img_geocone"; break;
            case "TGeoConeSeg" : item._icon = "img_geoconeseg"; break;
            case "TGeoCompositeShape" : item._icon = "img_geocomposite"; break;
            case "TGeoTube" : item._icon = "img_geotube"; break;
            case "TGeoTubeSeg" : item._icon = "img_geotubeseg"; break;
            case "TGeoPara" : item._icon = "img_geopara"; break;
            case "TGeoParaboloid" : item._icon = "img_geoparab"; break;
            case "TGeoPcon" : item._icon = "img_geopcon"; break;
            case "TGeoPgon" : item._icon = "img_geopgon"; break;
            case "TGeoShapeAssembly" : item._icon = "img_geoassembly"; break;
            case "TGeoSphere" : item._icon = "img_geosphere"; break;
            case "TGeoTorus" : item._icon = "img_geotorus"; break;
            case "TGeoTrd1" : item._icon = "img_geotrd1"; break;
            case "TGeoTrd2" : item._icon = "img_geotrd2"; break;
            case "TGeoXtru" : item._icon = "img_geoxtru"; break;
            case "TGeoTrap" : item._icon = "img_geotrap"; break;
            case "TGeoGtra" : item._icon = "img_geogtra"; break;
            case "TGeoEltu" : item._icon = "img_geoeltu"; break;
            case "TGeoHype" : item._icon = "img_geohype"; break;
            case "TGeoCtub" : item._icon = "img_geoctub"; break;
         }
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

   JSROOT.addDrawFunc({ name: "TGeoVolumeAssembly", icon: 'img_geoassembly', func: JSROOT.Painter.drawGeometry, expand: "JSROOT.expandGeoVolume", painter_kind : "base", opt : "all;count;limit;maxlvl2" });


   return JSROOT.Painter;

}));

