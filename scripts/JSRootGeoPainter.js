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


   JSROOT.TGeoPainter = function( geometry ) {
      if ((geometry !== null) && (geometry._typename.indexOf('TGeoVolume') === 0))
         geometry = { _typename:"TGeoNode", fVolume: geometry, fName:"TopLevel" };

      JSROOT.TObjectPainter.call(this, geometry);

      this.Cleanup(true);
   }

   JSROOT.TGeoPainter.prototype = Object.create( JSROOT.TObjectPainter.prototype );

   JSROOT.TGeoPainter.prototype.CreateToolbar = function(args) {
      if (this._toolbar) return;
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

      if (JSROOT.hpainter && JSROOT.hpainter.nobrowser)
         buttonList.push({
            name: 'browser',
            title: 'Show hierarchy browser',
            icon: JSROOT.ToolbarIcons.arrow_right,
            click: function() {
               if (JSROOT.hpainter)
                  JSROOT.hpainter.ToggleFloatBrowser();
            }
         });

      buttonList.push({
         name: 'menu',
         title: 'Show context menu',
         icon: JSROOT.ToolbarIcons.question,
         click: function() {

            var evnt = d3.event;

            d3.event.preventDefault();
            d3.event.stopPropagation();

            JSROOT.Painter.createMenu(function(menu) {
               menu.painter = painter; // set as this in callbacks
               painter.FillContextMenu(menu);
               menu.show(evnt);
            });
         }
      });


      this._toolbar = new JSROOT.Toolbar( this.select_main(), [buttonList] );
   }

   JSROOT.TGeoPainter.prototype.ModifyVisisbility = function(name, sign) {
      var node = this.GetObject();

      var kind = JSROOT.GEO.NodeKind(node);
      var prop = JSROOT.GEO.getNodeProperties(kind, node);

      if (name == "")
         return JSROOT.GEO.SetBit(prop.volume, JSROOT.GEO.BITS.kVisThis, (sign === "+"));

      var regexp;

      if (name.indexOf("*") < 0)
         regexp = new RegExp(name);
      else
         regexp = new RegExp("^" + name.split("*").join(".*") + "$");

      if (prop.chlds!==null)
         for (var n=0;n<prop.chlds.length;++n) {
            var chld = JSROOT.GEO.getNodeProperties(kind, prop.chlds[n]);

            if (regexp.test(chld.name) && chld.volume) {
               JSROOT.GEO.SetBit(chld.volume, JSROOT.GEO.BITS.kVisThis, (sign === "+"));
               JSROOT.GEO.SetBit(chld.volume, JSROOT.GEO.BITS.kVisDaughters, (sign === "+"));
            }
         }
   }

   JSROOT.TGeoPainter.prototype.decodeOptions = function(opt) {
      var res = { _grid: false, _bound: false, _debug: false,
                  _full: false, _axis:false, _count:false, wireframe: false,
                   scale: new THREE.Vector3(1,1,1), more:1,
                   use_worker: false, update_browser: true, clip_control: false, highlight:false };

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

         this.ModifyVisisbility(name, sign);
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

      if (opt.indexOf("clip")>=0) {
         res.clip_control = true;
         opt = opt.replace("clip", " ");
      }

      if (opt.indexOf("noworker")>=0) {
         res.use_worker = -1;
         opt = opt.replace("noworker", " ");
      }

      if (opt.indexOf("worker")>=0) {
         res.use_worker = 1;
         opt = opt.replace("worker", " ");
      }

      if (opt.indexOf("highlight")>=0) {
         res.highlight = true;
         opt = opt.replace("highlight", " ");
      }

      if (opt.indexOf("wire")>=0) {
         res.wireframe = true;
         opt = opt.replace("wire", " ");
      }

      if (opt.indexOf("invy")>=0) {
         res.scale.y = -1;
         opt = opt.replace("invy", " ");
      }
      if (opt.indexOf("invz")>=0) {
         res.scale.z = -1;
         opt = opt.replace("invz", " ");
      }

      if (opt.indexOf("count")>=0) {
         res._count = true;
         opt = opt.replace("count", " ");
      }

      if (opt.indexOf("d")>=0) res._debug = true;
      if (opt.indexOf("g")>=0) res._grid = true;
      if (opt.indexOf("b")>=0) res._bound = true;
      if (opt.indexOf("w")>=0) res.wireframe = true;
      if (opt.indexOf("f")>=0) res._full = true;
      if (opt.indexOf("a")>=0) { res._axis = true; res._yup = false; }
      if (opt.indexOf("y")>=0) res._yup = true;
      if (opt.indexOf("z")>=0) res._yup = false;

      return res;
   }

   JSROOT.TGeoPainter.prototype.ActiavteInBrowser = function(names, force) {
      if (typeof names == 'string') names = [ names ];

      if (this.GetItemName().length > 0)
         for (var n=0;n<names.length;++n)
            names[n] = this.GetItemName() + '/' + names[n];

      if (JSROOT.hpainter) {
         JSROOT.hpainter.actiavte(names, force);

         // if highlight in the browser disabled, suppress in few seconds
         if (!this.options.update_browser)
            setTimeout(function() { JSROOT.hpainter.actiavte([]); }, 2000);
      }
   }

   JSROOT.TGeoPainter.prototype.TestMatrixes = function() {
      // method can be used to check matrix calculations with current three.js model

      var painter = this, errcnt = 0, totalcnt = 0, totalmax = 0;

      var arg = {
            domatrix: true,
            func: function(node) {

               var m2 = this.getmatrix();

               var entry = this.CopyStack();

               var mesh = painter._clones.CreateObject3D(entry.stack, painter._toplevel, 'mesh');

               if (!mesh) return true;

               totalcnt++;

               var m1 = mesh.matrixWorld, flip, origm2;

               if (m1.equals(m2)) return true
               if ((m1.determinant()>0) && (m2.determinant()<-0.9)) {
                  flip = painter.getMatrixFlip(m2);
                  origm2 = m2;
                  m2 = m2.clone().scale(flip);
                  if (m1.equals(m2)) return true;
               }

               var max = 0;
               for (var k=0;k<16;++k)
                  max = Math.max(max, Math.abs(m1.elements[k] - m2.elements[k]));

               totalmax = Math.max(max, totalmax);

               if (max < 1e-4) return true;

               console.log(painter._clones.ResolveStack(entry.stack).name, 'maxdiff', max, 'determ', m1.determinant(), m2.determinant());

               errcnt++;

               return false;
            }
         };


      tm1 = new Date().getTime();

      var cnt = this._clones.ScanVisible(arg);

      tm2 = new Date().getTime();

      console.log('Compare matrixes total',totalcnt,'errors',errcnt, 'takes', tm2-tm1, 'maxdiff', totalmax);
   }


   JSROOT.TGeoPainter.prototype.TestVisibleObjects = function() {
      // this.TestMatrixes();

      return this.startDrawGeometry();


      var painter = this, cnt = 0, totalcnt = 0;

      var tm1 = new Date().getTime();

      for (var n=0;n<1;++n)
      this._scene.traverse(function(obj) {
         if (!obj.stack) return;

         var res = painter._clones.ResolveStack(obj.stack);

         var shape = painter._clones.GetNodeShape(res.id);

         var test = JSROOT.GEO.VisibleByCamera(painter._camera, obj.matrixWorld, shape);

         totalcnt++;
         if (test) cnt++;
      });

      var tm2 = new Date().getTime();

      console.log('Test visible total', totalcnt, 'visible', cnt, 'takes', tm2-tm1);

      cnt = totalcnt = 0;

      var arg = {
            domatrix: true,
            frustum: JSROOT.GEO.CreateFrustum(painter._camera),
            func: function(node) {

               totalcnt++;

               // if (node.vol<=0) return false;

               var m = this.getmatrix();

               // var res = JSROOT.GEO.VisibleByCamera(painter._camera, m, node);

               var res = this.frustum.CheckShape(m, node);

               if (res) cnt++;

               return true;
            }
         };


      this._clones.MarkVisisble();

      tm1 = new Date().getTime();

      for (var n=0;n<1;++n)
         this._clones.ScanVisible(arg);

      tm2 = new Date().getTime();

      console.log('Test visible total', totalcnt, 'visible', cnt, 'takes', tm2-tm1);
   }

   JSROOT.TGeoPainter.prototype.FillContextMenu = function(menu) {
      menu.add("header: Draw options");

      menu.addchk(this.options.update_browser, "Browser update", function() {
         this.options.update_browser = !this.options.update_browser;
         if (!this.options.update_browser) this.ActiavteInBrowser([]);
      });
      menu.addchk(this.options.clip_control, "Clip control", function() {
         this.options.clip_control = !this.options.clip_control;
         this.showClipControls(this.options.clip_control);
      });
      menu.addchk(this.options.wireframe, "Wire frame", function() {
         this.options.wireframe = !this.options.wireframe;
         this.changeWireFrame(this._scene, this.options.wireframe);
      });
      menu.addchk(this.options.wireframe, "Reset camera position", function() {
         this.adjustCameraPosition();
         this.Render3D();
      });
      menu.add("Test visisble", function() {
         this.TestVisibleObjects();
      });
   }

   JSROOT.TGeoPainter.prototype.showClipControls = function(on) {

      if (this._datgui) {
         if (on) return;

         this._datgui.destroy();
         delete this._datgui;
         return;
      }

      if (!on) return;

      var painter = this;

      this._datgui = new dat.GUI({ width: Math.min(650, painter._renderer.domElement.width / 2) });

      function setSide() {
         painter._scene.traverse( function(obj) {
            if (obj.hasOwnProperty("material") && ('emissive' in obj.material)) {
               obj.material.side = (painter.enableX || painter.enableY || painter.enableZ) ? THREE.DoubleSide : THREE.FrontSide;
               obj.material.needsUpdate = true;
            }
         });
         painter.updateClipping();
      }

      var bound = new THREE.Box3().setFromObject(this._toplevel);
      bound.expandByVector(bound.size().multiplyScalar(0.01));

      var toggleX = this._datgui.add(this, 'enableX');
      toggleX.onChange( function (value) {
         painter.enableX = value;
         setSide();
      });

      var xclip = this._datgui.add(this, 'clipX', bound.min.x, bound.max.x);

      xclip.onChange( function (value) {
         painter.clipX = value;
         if (painter.enableX) painter.updateClipping();
      });

      var toggleY = this._datgui.add(this, 'enableY');
      toggleY.onChange( function (value) {
         painter.enableY = value;
         setSide();
      });

      var yclip = this._datgui.add(this, 'clipY', bound.min.y, bound.max.y);

      yclip.onChange( function (value) {
         painter.clipY = value;
         if (painter.enableY) painter.updateClipping();
      });

      var toggleZ = this._datgui.add(this, 'enableZ');
      toggleZ.onChange( function (value) {
         painter.enableZ = value;
         setSide();
      });

      var zclip = this._datgui.add(this, 'clipZ', bound.min.z, bound.max.z);

      zclip.onChange( function (value) {
         painter.clipZ = value;
         if (painter.enableZ) painter.updateClipping();
      });
   }

   JSROOT.TGeoPainter.prototype.addOrbitControls = function() {

      if (this._controls) return;

      var painter = this;

      this.select_main().property('flex_block_drag', true);

      this._controls = new THREE.OrbitControls(this._camera, this._renderer.domElement);
      this._controls.enableDamping = false;
      this._controls.dampingFactor = 0.25;
      this._controls.enableZoom = true;
      this._controls.target.copy(this._lookat);
      this._controls.update();

      var mouse_ctxt = { x:0, y: 0, on: false },
          raycaster = new THREE.Raycaster(),
          control_active = false;

      this._controls.addEventListener( 'change', function() {
          mouse_ctxt.on = false; // disable context menu if any changes where done by orbit control
          painter.Render3D(0);
      });

      function GetMousePos(evnt, mouse) {
         mouse.x = ('offsetX' in evnt) ? evnt.offsetX : evnt.layerX;
         mouse.y = ('offsetY' in evnt) ? evnt.offsetY : evnt.layerY;
         mouse.clientX = evnt.clientX;
         mouse.clientY = evnt.clientY;
      }

      function GetIntersects(mouse) {
         var pnt = {
            x: mouse.x / painter._renderer.domElement.width * 2 - 1,
            y: -mouse.y / painter._renderer.domElement.height * 2 + 1
         }

         raycaster.setFromCamera( pnt, painter._camera );
         var intersects = raycaster.intersectObjects(painter._scene.children, true);

         return intersects;

      }

      this._controls.addEventListener( 'start', function() {
         control_active = true;
      });

      this._controls.addEventListener( 'end', function() {
         control_active = false;
         if (!mouse_ctxt.on) return;
         mouse_ctxt.on = false;
         var intersects = GetIntersects(mouse_ctxt);

         JSROOT.Painter.createMenu(function(menu) {
            menu.painter = painter; // set as this in callbacks

            if (!intersects || (intersects.length==0)) {
               painter.FillContextMenu(menu);
            } else {
               var many = (intersects.length > 1);

               if (many) menu.add("header: Nodes");

               for (var n=0;n<intersects.length;++n) {
                  var obj = intersects[n].object;
                  var name = painter._clones.ResolveStack(obj.stack).name;

                  menu.add((many ? "sub:" : "header:") + name.substr(6), name, function(arg) { this.ActiavteInBrowser([arg], true); });

                  menu.add("Browse", name, function(arg) { this.ActiavteInBrowser([arg], true); });

                  var wireframe = painter.accessObjectWireFrame(obj);

                  if (wireframe!==undefined)
                     menu.addchk(wireframe, "Wireframe", n,
                           function(indx) {
                              var m = intersects[indx].object.material;
                              m.wireframe = !m.wireframe;
                              this.Render3D();
                            });

                  menu.add("Focus", n, function(arg) {
                     this.focusCamera(intersects[arg].object);
                  });

                  if (many) menu.add("endsub:");
               }
            }

            menu.show(mouse_ctxt);
         });

      });

      this._context_menu = function(evnt) {
         evnt.preventDefault();
         GetMousePos(evnt, mouse_ctxt);
         mouse_ctxt.on = true;
      }

      this._renderer.domElement.addEventListener( 'contextmenu', this._context_menu, false );

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

      function mousemove(evnt) {
         if (control_active || !painter.options.update_browser) return;

         var mouse = {};
         GetMousePos(evnt, mouse);
         evnt.preventDefault();

         var intersects = GetIntersects(mouse);

         if (painter.options.highlight) {

            if (painter._selected.mesh !== null) {
               painter._selected.mesh.material.color = painter._selected.originalColor;
            }

            if (intersects.length > 0) {
               painter._selected.mesh = intersects[0].object;
               painter._selected.originalColor = painter._selected.mesh.material.color;
               painter._selected.mesh.material.color = new THREE.Color( 0xffaa33 );
               painter.Render3D(0);
            }
         }

         var names = [];

         for (var n=0;n<intersects.length;++n) {
            var obj = intersects[n].object;
            var name = painter._clones.ResolveStack(obj.stack).name;
            names.push(name);
         }

         painter.ActiavteInBrowser(names);
      }

      this._renderer.domElement.addEventListener('mousemove', mousemove);

      function mouseleave(evnt) {
         painter.ActiavteInBrowser([]);
      }

      this._renderer.domElement.addEventListener('mouseleave', mouseleave);
   }

   JSROOT.TGeoPainter.prototype.accountClear = function() {
      this._num_geom = 0;
      this._num_vertices = 0;
      this._num_faces = 0;
   }

   JSROOT.TGeoPainter.prototype.accountGeom = function(geom, shape_typename) {
      // used to calculate statistic over created geometries

      if (shape_typename === 'TGeoShapeAssembly') return;

      if (!geom) return JSROOT.GEO.warn('Not supported ' + shape_typename);

      this._num_geom++;

      this._num_faces += JSROOT.GEO.numGeometryFaces(geom);

      this._num_vertices += JSROOT.GEO.numGeometryVertices(geom);
   }

   JSROOT.TGeoPainter.prototype.getMatrixFlip = function(matrix) {
      // create flip vector for matrix that it does not have axis mirroring
      // such kind of mesh does not supported by three.js/webgl

      // always flip Z axis in mesh, same flip will be done for the geometry
      // Actually, it is not really matter which axis to flip
      return new THREE.Vector3(1,1,-1);

      var elem = matrix.elements, cnt = 0, flip = new THREE.Vector3(1,1,1);

      if ((elem[0] < -0.5) || (elem[4] < -0.5) || (elem[8] < -0.5)) { flip.x = -1; cnt++; }
      if ((elem[1] < -0.5) || (elem[5] < -0.5) || (elem[9] < -0.5)) { flip.y = -1; cnt++; }
      if ((elem[2] < -0.5) || (elem[6] < -0.5) || (elem[10] < -0.5)) { flip.z = -1; cnt++; }
      if  ((cnt===1) || (cnt===3)) return flip;

      flip.set(1,1,1); cnt = 0;

      if (elem[0]===-1 && elem[1]=== 0 && elem[2] === 0) { flip.x = -1; cnt++; }
      if (elem[4]=== 0 && elem[5]===-1 && elem[6] === 0) { flip.y = -1; cnt++; }
      if (elem[8]=== 0 && elem[9]=== 0 && elem[10]===-1) { flip.z = -1; cnt++; }

      if ((cnt===0) || (cnt ===2)) {
         flip.set(1,1,1); cnt = 0;
         if (Math.abs(elem[0] + elem[1] + elem[2] + 1) < 4e-8) { flip.x = -1; cnt++; }
         if (Math.abs(elem[4] + elem[5] + elem[6] + 1) < 4e-8) { flip.y = -1; cnt++; }
         if (Math.abs(elem[8] + elem[9] + elem[10] + 1) < 4e-8) { flip.z = -1; cnt++; }
         if ((cnt === 0) || (cnt === 2)) {
            console.log('determ', matrix.determinant(), 'not found flip', elem);
            flip.z = -flip.z;
         }
      }
      return flip;
   }

   JSROOT.TGeoPainter.prototype.createFlippedMesh = function(parent, shape, material) {
      // when transformation matrix includes one or several invertion of axis,
      // one should inverse geometry object, otherwise THREE.js cannot correctly draw it

      var flip = this.getMatrixFlip(parent.matrixWorld);

      var gname = "_geom";
      if (flip.x<0) gname += "X";
      if (flip.y<0) gname += "Y";
      if (flip.z<0) gname += "Z";

      var geom = shape[gname];

      if (geom === undefined) {

         geom = shape._geom.clone();

         geom.scale(flip.x, flip.y, flip.z);

         if (geom.type == 'BufferGeometry') {

            var attr = geom.getAttribute('position'), d;

            // we should swap second and third point in each face
            for (var n=0;n<attr.array.length;n+=9)
               for (var k=0;k<3;++k) {
                  d = attr.array[n+k+3];
                  attr.array[n+k+3] = attr.array[n+k+6];
                  attr.array[n+k+6] = d;
               }

            // normals are calculated with normal geometry and correctly scaled
            // geom.computeVertexNormals();

         } else {

            var face, d;
            for (var n=0;n<geom.faces.length;++n) {
               face = geom.faces[n];
               d = face.b; face.b = face.c; face.c = d;
            }

            // normals are calculated with normal geometry and correctly scaled
            // geom.computeFaceNormals();
         }

         shape[gname] = geom;
      }

      var mesh = new THREE.Mesh( geom, material );

      mesh.scale.copy(flip);

      mesh.updateMatrix();

      return mesh;
   }


   JSROOT.TGeoPainter.prototype.nextDrawAction = function() {
      // return false when nothing todo
      // return true if one could perform next action immediately
      // return 1 when call after short timeout required
      // return 2 when call must be done from processWorkerReply

      if (!this._clones || (this.drawing_stage == 0)) return false;

      if (this.drawing_stage == 1) {

         // wait until worker is really started
         if ((this.options.use_worker>0) && this._worker && !this._worker_ready) return 1;

         // first copy visibility flags and check how many unique visible nodes exists
         var numvis = this._clones.MarkVisisble();

         // extract camera projection matrix for selection
         var matrix = this._first_drawing ? null : JSROOT.GEO.CreateProjectionMatrix(this._camera);

         // here we decide if we need worker for the drawings
         // main reason - too large geometry and large time to scan all camera positions
         var need_worker = (numvis > 10000) || (matrix && (this._clones.ScanVisible() > 1e5));

         if (need_worker && !this._worker && (this.options.use_worker>=0))
            this.startWorker(); // we starting worker, but it may not be ready so fast

         if (!need_worker || !this._worker_ready) {
            var tm1 = new Date().getTime();
            this._new_draw_nodes = this._clones.CollectVisibles(this.options.maxlimit, JSROOT.GEO.CreateFrustum(matrix));
            var tm2 = new Date().getTime();
            console.log('Collect visibles', this._new_draw_nodes.length, 'takes', tm2-tm1);
            this.drawing_stage = 4;
            return true;
         }

         var job = {
               collect: this.options.maxlimit,   // indicator for the command
               visible: this._clones.GetVisibleFlags(),
               matrix: matrix ? matrix.elements : null
         };

         this.submitToWorker(job);

         this.drawing_stage = 3;

         return 2; // we now waiting for the worker reply
      }

      if (this.drawing_stage == 3) {
         // do nothing, we are waiting for worker reply

         return 2;
      }

      if (this.drawing_stage == 4) {
         // here we merge new and old list of nodes for drawing,
         // normally operation is fast and can be implemented with one call

         if (this._draw_nodes) {
            var del = this._clones.MergeVisibles(this._new_draw_nodes, this._draw_nodes), dcnt = 0;
            // remove should be fast, do it here
            for (var n=0;n<del.length;++n) {
               var mesh = this._clones.CreateObject3D(del[n].stack, this._toplevel, 'mesh');
               while (mesh && (mesh !== this._toplevel)) {
                  var prnt = mesh.parent;
                  prnt.remove(mesh); ++dcnt;
                  mesh = (prnt.children.length == 0) ? prnt : null; // remove all parents if they are not necessary
               }
            }
            console.log('delete nodes', del.length,'really', dcnt);
         }

         this._draw_nodes = this._new_draw_nodes;
         delete this._new_draw_nodes;
         this.drawing_stage = 5;
         return true;
      }

      // here is last and main stage, create geometries and build full mesh
      // TODO: make it with few more stages
      if (!this._draw_nodes) return false;

      // first of all, create geometries (using worker if available)

      var unique = [], todo = [], ready = [], waiting = 0;

      for (var n=0;n<this._draw_nodes.length;++n) {
         var entry = this._draw_nodes[n];
         if (entry.done) continue;

         var shape = this._clones.GetNodeShape(entry.nodeid);

         if (!shape) { entry.done = true; continue; }

         // if not geometry exists, either create it or submit to worker
         if (shape._geom !== undefined) {
            if (ready.length < 1000) ready.push(n);
         } else
         if (shape._geom_worker) {
            waiting++; // number of waiting geom for worker
         } else
         if (unique.indexOf(shape) < 0) {
            unique.push(shape); // only to avoid duplication
            todo.push({ indx: n, nodeid: entry.nodeid, shape: shape });
            if (todo.length > 50) break;
         }
      }

      // console.log('collected todo', todo.length,'ready', ready.length, 'waiting', waiting);

      if (todo.length > 0) {
         if (this.canSubmitToWorker()) {
            // if we could submit task to the worker - ok
            for (var s=0;s<todo.length;++s) {
               unique[s]._geom_worker = true; // mark shape as processed by worker
               todo[s].shape = JSROOT.clone(todo[s].shape, null, true);
            }
            waiting += todo.length;
            this.submitToWorker({ shapes: todo });
            return 1;
         }

         // when task cannot be submitted to worker, process it in main context

         var starttm = new Date().getTime();

         for (var s=0;s<todo.length;++s) {
            var shape = todo[s].shape;

            // do not create composite in main thread, when worker is exists (exclude first drawing)
            if (this._worker && (shape._typename == 'TGeoCompositeShape') && !this._first_drawing) continue;

            //if (shape.fName == 'Rich1AerogelWrapSubQ3') {
            //   var item = this._draw_nodes[todo[s].indx];
            //   console.log('stack ' + this._clones.ResolveStack(item.stack).name);
            //}

            shape._geom = JSROOT.GEO.createGeometry(shape);
            delete shape._geom_worker; // remove flag
            ready.push(todo[s].indx); // one could add it to ready list

            if ((s>5) && (new Date().getTime() - starttm > 100)) break;
         }
      }

      // create
      for (var n=0;n<ready.length;++n) {
         // item to draw, containes indexs of children, first element - node index

         var entry = this._draw_nodes[ready[n]];

         var obj3d = this._clones.CreateObject3D(entry.stack, this._toplevel, this.options);

         // original object, extracted from the map
         var nodeobj = this._clones.origin[entry.nodeid];
         var clone = this._clones.nodes[entry.nodeid];

         var prop = JSROOT.GEO.getNodeProperties(clone.kind, nodeobj, true);

         var mesh = null;

         if (JSROOT.GEO.numGeometryFaces(prop.shape._geom) > 0) {

            this._drawcnt++;

            this.accountGeom(prop.shape._geom, prop.shape._typename);

            prop.material.wireframe = this.options.wireframe;

            if (obj3d.matrixWorld.determinant() > -0.9) {
               mesh = new THREE.Mesh( prop.shape._geom, prop.material );
            } else {
               mesh = this.createFlippedMesh(obj3d, prop.shape, prop.material);
            }

            // keep full stack of nodes
            mesh.stack = entry.stack;

            obj3d.add(mesh);
         }

         if (mesh && (this.options._debug || this.options._full)) {
            var helper = new THREE.WireframeHelper(mesh);
            helper.material.color.set(prop.fillcolor);
            helper.material.linewidth = ('fVolume' in nodeobj) ? nodeobj.fVolume.fLineWidth : 1;
            obj3d.add(helper);
         }

         if (mesh && (this.options._bound || this.options._full)) {
            var boxHelper = new THREE.BoxHelper( mesh );
            obj3d.add( boxHelper );
         }

         entry.done = true; // mark element as processed
      }

      // doing our job well, can be called next time immediately
      if (ready.length > 0) return true;

      // if there is geometries to created, repeat with short timeout
      if (todo.length > 0) return 1;

      // all job by the worker, let him to call out function
      if (waiting > 0) return 2;

      // here everything is completed, we could cleanup data and finish

      this.drawing_stage = 0;

      return false;
   }

   JSROOT.TGeoPainter.prototype.SameMaterial = function(node1, node2) {

      if ((node1===null) || (node2===null)) return node1 === node2;

      if (node1.fVolume.fLineColor >= 0)
         return (node1.fVolume.fLineColor === node2.fVolume.fLineColor);

       var m1 = (node1.fVolume.fMedium !== null) ? node1.fVolume.fMedium.fMaterial : null;
       var m2 = (node2.fVolume.fMedium !== null) ? node2.fVolume.fMedium.fMaterial : null;

       if (m1 === m2) return true;

       if ((m1 === null) || (m2 === null)) return false;

       return (m1.fFillStyle === m2.fFillStyle) && (m1.fFillColor === m2.fFillColor);
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

      // Clipping Planes

      this.enableX = false;
      this.enableY = false;
      this.enableZ = false;
      this.clipX = 0.0;
      this.clipY = 0.0;
      this.clipZ = 0.0;

      this._clipPlanes = [ new THREE.Plane(new THREE.Vector3( 1, 0, 0), this.clipX),
                           new THREE.Plane(new THREE.Vector3( 0,-1, 0), this.clipY),
                           new THREE.Plane(new THREE.Vector3( 0, 0, 1), this.clipZ) ];

      // TODO: should we change/increase number of light points??
      var pointLight = new THREE.PointLight(0xefefef);
      this._camera.add( pointLight );
      pointLight.position.set(10, 10, 10);
      this._camera.up = this.options._yup ? new THREE.Vector3(0,1,0) : new THREE.Vector3(0,0,1);
      this._scene.add( this._camera );

      this._toplevel = new THREE.Object3D();

      this._scene.add(this._toplevel);

      this._selected = {mesh:null, originalColor:null};

      this._overall_size = 10;
   }


   JSROOT.TGeoPainter.prototype.startDrawGeometry = function(force) {

      if (!force && (this.drawing_stage!==0)) {
         this._draw_nodes_again = true;
         return;
      }

      this.accountClear();

      this._startm = new Date().getTime();
      this._last_render_at = this._startm;
      this._last_render_cnt = 0;
      this._drawcnt = 0; // counter used to build meshes
      this.drawing_stage = 1;
      delete this._draw_nodes_again; // forget about such flag

      this.continueDraw();
   }

   JSROOT.TGeoPainter.prototype.updateClipping = function(offset) {
      this._clipPlanes[0].constant = this.clipX;
      this._clipPlanes[1].constant = this.clipY;
      this._clipPlanes[2].constant = this.clipZ;
      this._renderer.clippingPlanes = [];
      if (this.enableX) this._renderer.clippingPlanes.push(this._clipPlanes[0]);
      if (this.enableY) this._renderer.clippingPlanes.push(this._clipPlanes[1]);
      if (this.enableZ) this._renderer.clippingPlanes.push(this._clipPlanes[2]);
      this.Render3D(0);
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

      if (this._controls) {
         this._controls.target.copy(this._lookat);
         this._controls.update();
      }
   }

   JSROOT.TGeoPainter.prototype.focusOnItem = function(itemname) {
      console.log('Focus on the element', itemname);

      if (!itemname || (itemname.indexOf('Nodes/')!==0) || !this._clones) return;

      var stack = this._clones.FindStackByName(itemname.substr(6));

      if (!stack) return;

      var info = this._clones.ResolveStack(stack, true);

      console.log('transfrom matrix', info.matrix.elements);

      console.log('shape dimensions', info.node.fDX, info.node.fDY, info.node.fDZ);
   }

   JSROOT.TGeoPainter.prototype.focusCamera = function( focus ) {

      var box = new THREE.Box3().setFromObject(focus);

      var sizex = box.max.x - box.min.x,
          sizey = box.max.y - box.min.y,
          sizez = box.max.z - box.min.z,
          midx = (box.max.x + box.min.x)/2,
          midy = (box.max.y + box.min.y)/2,
          midz = (box.max.z + box.min.z)/2;

      var position;
      if (this.options._yup)
         position = new THREE.Vector3(midx-2*Math.max(sizex,sizez), midy+2*sizey, midz-2*Math.max(sizex,sizez));
      else
         position = new THREE.Vector3(midx-2*Math.max(sizex,sizey), midy-2*Math.max(sizex,sizey), midz+2*sizez);

      var target = new THREE.Vector3(midx, midy, midz);

      // Find to points to animate "lookAt" between
      var dist = this._camera.position.distanceTo(target);
      var oldTarget = this._camera.getWorldDirection().multiplyScalar(dist);

      var stepcount = 150;
      // Amount to change camera position at each step
      var posDifference = position.sub(this._camera.position).divideScalar(stepcount);
      // Amount to change "lookAt" so it will end pointed at target
      var targetDifference = target.sub(oldTarget).divideScalar(stepcount);

      // Interpolate //
      var painter = this;
      for (var step = 0; step < stepcount; ++step) {
         setTimeout( function() {
           painter._camera.position.add(posDifference);
           oldTarget.add(targetDifference);
           painter._lookat = oldTarget;
           painter._camera.lookAt(painter._lookat);
           painter.Render3D();
        }, step * 20);
      }
      this._controls.target = target;
      this._controls.update();
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


   JSROOT.TGeoPainter.prototype.drawCount = function(unqievis, clonetm) {

      var res = 'Unique nodes: ' + this._clones.nodes.length + '<br/>' +
                'Unique visible: ' + unqievis + '<br/>' +
                'Time to clone: ' + clonetm + 'ms <br/>';

      // need to fill cached value line numvischld
      this._clones.ScanVisible();

      var arg = {
         cnt: [],
         func: function(node) {
            if (this.cnt[this.last]===undefined)
               this.cnt[this.last] = 1;
            else
               this.cnt[this.last]++;
            return true;
         }
      };

      var tm1 = new Date().getTime();
      var numvis = this._clones.ScanVisible(arg);
      var tm2 = new Date().getTime();

      res += 'Total visible nodes: ' + numvis + '<br/>';

      for (var lvl=0;lvl<arg.cnt.length;++lvl) {
         if (arg.cnt[lvl] !== undefined)
            res += ('  lvl' + lvl + ': ' + arg.cnt[lvl] + '<br/>');
      }

      res += "Time to scan: " + (tm2-tm1) + "ms <br/>";

      res += "<br/><br/>Check timing for matrix calculations ...<br/>";

      var elem = this.select_main().style('overflow', 'auto').html(res);

      var painter = this;

      setTimeout(function() {
         arg.domatrix = true;
         tm1 = new Date().getTime();
         numvis = painter._clones.ScanVisible(arg);
         tm2 = new Date().getTime();
         elem.append("p").text("Time to scan with matrix: " + (tm2-tm1) + "ms");
      }, 100);

      return this.DrawingReady();
   }


   JSROOT.TGeoPainter.prototype.DrawGeometry = function(opt) {
      if (typeof opt !== 'string') opt = "";

      var size = this.size_for_3d();

      this._webgl = JSROOT.Painter.TestWebGL();

      this.options = this.decodeOptions(opt);

      if (!('_yup' in this.options))
         this.options._yup = this.svg_canvas().empty();

      var tm1 = new Date().getTime();

      this._clones = new JSROOT.GEO.ClonedNodes(this.GetObject());
      var uniquevis = this._clones.MarkVisisble(true);
      if (uniquevis <= 0)
         uniquevis = this._clones.MarkVisisble(false);
      else
         uniquevis = this._clones.MarkVisisble(true, true); // copy bits once and use normal visibility bits

      var tm2 = new Date().getTime();

      console.log('Creating clones', this._clones.nodes.length, 'takes', tm2-tm1, 'uniquevis', uniquevis);

      if (this.options._count)
         return this.drawCount(uniquevis, tm2-tm1);

      this.options.maxlimit = (this._webgl ? 2000 : 1000) * this.options.more;

      this._first_drawing = true;

      // activate worker
      if (this.options.use_worker > 0) this.startWorker();

      this.createScene(this._webgl, size.width, size.height, window.devicePixelRatio);

      this.add_3d_canvas(size, this._renderer.domElement);

      this.CreateToolbar();

      this.startDrawGeometry(true);

      return this;
   }

   JSROOT.TGeoPainter.prototype.continueDraw = function() {

      // nothing to do - exit
      if (this.drawing_stage === 0) return;

      var tm0 = new Date().getTime(),
          interval = 300, now = tm0;

      while(true) {

         var res = this.nextDrawAction();

         now = new Date().getTime();

         if (!res) break;

         var log = "Creating meshes " + this._drawcnt;
         if (this.drawing_stage < 5) log = "Collecting visibles";

         // stop creation after 100 sec, render as is
         if (now - this._startm > 1e5) {
            this.drawing_stage = 0;
            break;
         }

         if ((now - tm0 > interval) || (res === 1) || (res === 2)) {
            JSROOT.progress(log);
            if (this._webgl && (this._last_render_cnt != this._drawcnt) && (now - this._last_render_at > this.last_render_tm)) {
               if (this._first_drawing)
                  this.adjustCameraPosition();
               this.Render3D(-1);
               this._last_render_at = new Date().getTime();
               this._last_render_cnt = this._drawcnt;
            }
            if (res !== 2) setTimeout(this.continueDraw.bind(this), (res === 1) ? 100 : 1);
            return;
         }
      }

      var take_time = now - this._startm;

      JSROOT.console('Create tm = ' + take_time + ' geom ' + this._num_geom + ' vertices ' + this._num_vertices + ' faces ' + this._num_faces);

      if (take_time > 300) {
         JSROOT.progress('Rendering geometry');
         return setTimeout(this.completeDraw.bind(this, true), 10);
      }

      this.completeDraw(true);
   }

   JSROOT.TGeoPainter.prototype.Render3D = function(tmout) {
      if (tmout === undefined) tmout = 5; // by default, rendering happens with timeout

      if (tmout <= 0) {
         if ('render_tmout' in this)
            clearTimeout(this.render_tmout);

         var tm1 = new Date();

         // do rendering, most consuming time
         this._renderer.render(this._scene, this._camera);

         var tm2 = new Date();

         this.last_render_tm = tm2.getTime() - tm1.getTime();

         delete this.render_tmout;

         if ((this.first_render_tm === 0) && (tmout===0)) {
            this.first_render_tm = this.last_render_tm;
            JSROOT.console('First render tm = ' + this.first_render_tm);
         }

         return;
      }

      // do not shoot timeout many times
      if (!this.render_tmout)
         this.render_tmout = setTimeout(this.Render3D.bind(this,0), tmout);
   }


   JSROOT.TGeoPainter.prototype.startWorker = function() {

      if (this._worker) return;

      this._worker_ready = false;
      this._worker_jobs = 0; // counter how many requests send to worker

      var pthis = this;

      this._worker = new Worker(JSROOT.source_dir + "scripts/JSRootGeoWorker.js");

      this._worker.onmessage = function(e) {

         if (typeof e.data !== 'object') return;

         if ('log' in e.data)
            return JSROOT.console('geo: ' + e.data.log);

         e.data.tm3 = new Date().getTime();

         if ('init' in e.data) {
            pthis._worker_ready = true;
            return JSROOT.console('Worker ready: ' + (e.data.tm3 - e.data.tm0));
         }

         pthis.processWorkerReply(e.data);
      };

      // send initialization message with clones
      this._worker.postMessage( { init: true, tm0: new Date().getTime(), clones: this._clones.nodes } );
   }

   JSROOT.TGeoPainter.prototype.canSubmitToWorker = function(force) {
      if (!this._worker) return false;

      return this._worker_ready && ((this._worker_jobs == 0) || force);
   }

   JSROOT.TGeoPainter.prototype.submitToWorker = function(job) {
      if (!this._worker) return false;

      this._worker_jobs++;

      job.tm0 = new Date().getTime();

      this._worker.postMessage(job);
   }

   JSROOT.TGeoPainter.prototype.processWorkerReply = function(job) {
      this._worker_jobs--;

      if ('collect' in job) {
         this._new_draw_nodes = job.new_nodes;
         this.drawing_stage = 4;
         // invoke methods immediately
         return this.continueDraw();
      }

      if ('shapes' in job) {
         var loader = new THREE.BufferGeometryLoader();

         for (var n=0;n<job.shapes.length;++n) {
            var item = job.shapes[n];

            var shape = this._clones.GetNodeShape(item.nodeid);

            if (item.json) {
               shape._geom = loader.parse(item.json);
            } else {
               shape._geom = null; // mark that geometry should not be created
            }

            delete shape._geom_worker;
         }

         job.tm4 = new Date().getTime();

         console.log('Get reply from worker', job.tm3-job.tm2, ' decode json in ', job.tm4-job.tm3);

         // invoke methods immediately
         return this.continueDraw();
      }

   }

   JSROOT.TGeoPainter.prototype.testGeomChanges = function() {
      this._draw_nodes_again = true;
      this.startDrawGeometry();
   }

   JSROOT.TGeoPainter.prototype.completeDraw = function(close_progress) {

      if (this._first_drawing) {
         this.adjustCameraPosition();
         this._first_drawing = false;
      }

      this.completeScene();

      if (this.options._axis) {
         var axis = JSROOT.Create("TNamed");
         axis._typename = "TAxis3D";
         axis._main = this;
         JSROOT.draw(this.divid, axis); // it will include drawing of
         this.options._axis = false;
      }

      this._scene.overrideMaterial = null;

      this.Render3D(0);

      if (close_progress) JSROOT.progress();

      this.addOrbitControls();

      this.showClipControls(this.options.clip_control);

      if (this._draw_nodes_again)
         this.startDrawGeometry(); // relaunch drawing
      else
         this.DrawingReady();
   }

   JSROOT.TGeoPainter.prototype.Cleanup = function(first_time) {

      if (!first_time) {
         this.helpText();
         if (this._scene)
            this.deleteChildren(this._scene);
         if (this._tcontrols)
            this._tcontrols.dispose();

         if (this._controls)
            this._controls.dispose();

         if (this._context_menu)
            this._renderer.domElement.removeEventListener( 'contextmenu', this._context_menu, false );

         if (this._datgui)
            this._datgui.destroy();

         var obj = this.GetObject();
         if (obj) delete obj._painter;

         if (this._worker) this._worker.terminate();
      }

      delete this._scene;
      this._scene_width = 0;
      this._scene_height = 0;
      this._renderer = null;
      this._toplevel = null;
      delete this._clone;
      this._camera = null;

      this.first_render_tm = 0;
      this.last_render_tm = 2000;

      this.drawing_stage = 0;

      delete this._datgui;
      delete this._controls;
      delete this._context_menu;
      delete this._tcontrols;
      delete this._toolbar;

      delete this._worker;
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

   JSROOT.TGeoPainter.prototype.accessObjectWireFrame = function(obj, on) {
      // either change mesh wireframe or return current value
      // return undefined when wireframe cannot be accessed

      if (!obj.hasOwnProperty("material") || (obj instanceof THREE.GridHelper)) return;

      if (this.ownedByTransformControls(obj)) return;

      if (on !== undefined)
         obj.material.wireframe = on;

      return obj.material.wireframe;
   }


   JSROOT.TGeoPainter.prototype.changeWireFrame = function(obj, on) {
      var painter = this;

      obj.traverse(function(obj2) { painter.accessObjectWireFrame(obj2, on); });

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
      if ((obj._typename === 'TGeoVolumeAssembly') || (obj._typename === 'TGeoVolume')) {
         node = obj;
      } else
      if ((obj._typename === 'TGeoManager')) {
         node = obj.fMasterVolume;
      } else
      if ('fVolume' in obj) {
         node = obj.fVolume;
      }

      if (node && (typeof node == 'object')) {
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

   JSROOT.GEO.getBrowserItem = function(item, itemname, callback) {
      JSROOT.CallBack(callback, item, item._geoobj);
   }

   JSROOT.GEO.createItem = function(node, obj, name) {
      var sub = {
         _kind: "ROOT." + obj._typename,
         _name: name ? name : obj.fName,
         _title: obj.fTitle,
         _parent: node,
         _geoobj: obj,
         _get: JSROOT.GEO.getBrowserItem
      };

      if (obj._typename == "TGeoMaterial") sub._icon = "img_geomaterial"; else
      if (obj._typename == "TGeoMedium") sub._icon = "img_geomedium"; else
      if (obj._typename == "TGeoMixture") sub._icon = "img_geomixture"; else
      if ((obj._typename.indexOf("TGeoNode")===0) && obj.fVolume) {
         sub._title = "node:"  + obj._typename;
         if (obj.fTitle.length > 0) sub._title + " " + obj.fTitle;

         sub._volume = obj.fVolume;

         if ((obj.fVolume.fNodes && obj.fVolume.fNodes.arr.length > 0)) {
            sub._more = true;
            sub._expand = JSROOT.GEO.expandObject;
         }
         if (obj.fVolume.fShape) {
            sub._icon = JSROOT.GEO.getShapeIcon(obj.fVolume.fShape);
            sub._title += " shape:" + obj.fVolume.fShape._typename;
         } else {
            sub._icon = sub._more ? "img_geocombi" : "img_geobbox";
         }

         sub._icon += JSROOT.GEO.provideVisStyle(obj.fVolume);

         sub._menu = JSROOT.GEO.provideMenu;
         sub._icon_click  = JSROOT.GEO.browserIconClick;
      } else
      if (obj._typename.indexOf("TGeoVolume")===0) {
         sub._volume = obj;
         if ((obj.fNodes && obj.fNodes.arr.length>0)) {
            sub._more = true;
            sub._expand = JSROOT.GEO.expandObject;
         } else
         if ((obj.fShape !== null) && (obj.fShape._typename === "TGeoCompositeShape") && (obj.fShape.fNode !== null)) {
            sub._more = true;
            sub._expand = function(node, obj) {
               JSROOT.GEO.createItem(node, obj.fShape.fNode.fLeft, 'Left');
               JSROOT.GEO.createItem(node, obj.fShape.fNode.fRight, 'Right');
               return true;
            }
         }

         if (sub._title == "")
            if (obj._typename != "TGeoVolume") sub._title = obj._typename;

         if (obj.fShape) {
            if (sub._title == "")
               sub._title = obj.fShape._typename;

            sub._icon = JSROOT.GEO.getShapeIcon(obj.fShape);
         } else {
            sub._icon = sub._more ? "img_geocombi" : "img_geobbox";
         }

         sub._icon += JSROOT.GEO.provideVisStyle(obj);

         sub._menu = JSROOT.GEO.provideMenu;
         sub._icon_click  = JSROOT.GEO.browserIconClick;
      } else
      if ((obj.fShapeBits !== undefined) && (obj.fShapeId !== undefined)) {
         sub._title = obj._typename;
         sub._icon = JSROOT.GEO.getShapeIcon(obj);
         if ((obj._typename === "TGeoCompositeShape") && obj.fNode) {
            sub._more = true;
            sub._expand = function(node, obj) {
               JSROOT.GEO.createItem(node, obj.fNode.fLeft, 'Left');
               JSROOT.GEO.createItem(node, obj.fNode.fRight, 'Right');
               return true;
            }
         }
      }

      if (!node._childs) node._childs = [];
      node._childs.push(sub);

      return sub;
   }

   JSROOT.GEO.createList = function(parent, lst, name, title) {

      if ((lst==null) || !('arr' in lst) || (lst.arr.length==0)) return;

      var item = {
          _name: name,
          _kind: "Folder",
          _title: title,
          _more: true,
          _geoobj: lst,
          _parent: parent,
      }

      item._get = function(item, itemname, callback) {
         if ('_geoobj' in item)
            return JSROOT.CallBack(callback, item, item._geoobj);

         JSROOT.CallBack(callback, item, null);
      }

      item._expand = function(node, lst) {
         // only childs

         if ('fVolume' in lst)
            lst = lst.fVolume.fNodes;

         if (!('arr' in lst)) return false;

         node._childs = [];

         for (var n in lst.arr)
            JSROOT.GEO.createItem(node, lst.arr[n]);

         return true;
      }

      parent._childs.push(item);

   };

   JSROOT.GEO.provideVisStyle = function(volume) {
      var res = "";

      if (JSROOT.GEO.TestBit(volume, JSROOT.GEO.BITS.kVisThis))
         res += " geovis_this";

      if (JSROOT.GEO.TestBit(volume, JSROOT.GEO.BITS.kVisDaughters))
         res += " geovis_daughters";

      return res;
   }

   JSROOT.GEO.provideMenu = function(menu, item, hpainter) {

      if (!item._volume || !item._geoobj) return false;

      menu.add("separator");
      var vol = item._volume;

      function ToggleMenuBit(arg) {
         JSROOT.GEO.ToggleBit(vol, arg);
         item._icon = item._icon.split(" ")[0] + JSROOT.GEO.provideVisStyle(vol);
         hpainter.UpdateTreeNode(item);
         JSROOT.GEO.findItemWithPainter(hitem, 'testGeomChanges');
      }

      if ((item._geoobj._typename.indexOf("TGeoNode")===0) && JSROOT.GEO.findItemWithPainter(item))
         menu.add("Focus", function() {

           var drawitem = JSROOT.GEO.findItemWithPainter(item);
           if (!drawitem) return;

           var fullname = hpainter.itemFullName(item, drawitem);
           if (drawitem._painter && typeof drawitem._painter.focusOnItem == 'function')
              drawitem._painter.focusOnItem(fullname);
         });

      menu.addchk(JSROOT.GEO.TestBit(vol, JSROOT.GEO.BITS.kVisNone), "Invisible",
            JSROOT.GEO.BITS.kVisNone, ToggleMenuBit);
      menu.addchk(JSROOT.GEO.TestBit(vol, JSROOT.GEO.BITS.kVisThis), "Visible",
            JSROOT.GEO.BITS.kVisThis, ToggleMenuBit);
      menu.addchk(JSROOT.GEO.TestBit(vol, JSROOT.GEO.BITS.kVisDaughters), "Daughters",
            JSROOT.GEO.BITS.kVisDaughters, ToggleMenuBit);
      menu.addchk(JSROOT.GEO.TestBit(vol, JSROOT.GEO.BITS.kVisOneLevel), "1lvl daughters",
            JSROOT.GEO.BITS.kVisOneLevel, ToggleMenuBit);

      return true;
   }

   JSROOT.GEO.findItemWithPainter = function(hitem, funcname) {
      while (hitem) {
         if (hitem._painter) {
            if (funcname && typeof hitem._painter[funcname] == 'function')
               hitem._painter[funcname]();
            return hitem;
         }
         hitem = hitem._parent;
      }
      return null;
   }

   JSROOT.GEO.browserIconClick = function(hitem, hpainter) {
      if (!hitem._volume) return false;

      if (hitem._more)
         JSROOT.GEO.ToggleBit(hitem._volume, JSROOT.GEO.BITS.kVisDaughters);
      else
         JSROOT.GEO.ToggleBit(hitem._volume, JSROOT.GEO.BITS.kVisThis);
      hitem._icon = hitem._icon.split(" ")[0] + JSROOT.GEO.provideVisStyle(hitem._volume);

      hpainter.ForEach(function(item) {
         // update all other items with that volume
         if (item._volume === hitem._volume) {
            if (item!==hitem) item._icon = hitem._icon;
            hpainter.UpdateTreeNode(item);
         }
      });

      JSROOT.GEO.findItemWithPainter(hitem, 'testGeomChanges');
      return false; // no need to update icon - we did it ourself
   }

   JSROOT.GEO.getShapeIcon = function(shape) {
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

   JSROOT.GEO.expandObject = function(parent, obj) {
      if (!parent || !obj) return false;

      var isnode = (obj._typename.indexOf('TGeoNode') === 0),
          isvolume = (obj._typename.indexOf('TGeoVolume') === 0),
          ismanager = (obj._typename === 'TGeoManager');

      if (!isnode && !isvolume && !ismanager) return false;

      if (!parent._childs) parent._childs = [];

      var volume = isnode ? obj.fVolume : obj;

      if ((parent._geoobj === undefined) || ismanager) {
         if (ismanager) {
            volume = obj.fMasterVolume;
            JSROOT.GEO.createList(parent, obj.fMaterials, "Materials", "list of materials");
            JSROOT.GEO.createList(parent, obj.fMedia, "Media", "list of media");
            JSROOT.GEO.createList(parent, obj.fTracks, "Tracks", "list of tracks");
         }

         if (volume) {
            JSROOT.GEO.createItem(parent, volume, "Volumes");
            JSROOT.GEO.createList(parent, volume.fNodes, "Nodes", "Hierarchy of TGeoNodes");
         }

         return true;
      }

      if (!volume) return false;

      var subnodes = volume.fNodes.arr, map = [];

      for (var i=0;i<subnodes.length;++i) {
         if (isnode)
            JSROOT.GEO.createItem(parent, subnodes[i]);
         else
         if (isvolume) {
            var vol = subnodes[i].fVolume;
            if (map.indexOf(vol) < 0) {
               map.push(vol); // avoid duplication of similar volume
               JSROOT.GEO.createItem(parent, vol);
            }
         }
      }

      return true;
   }


   JSROOT.addDrawFunc({ name: "TGeoVolumeAssembly", icon: 'img_geoassembly', func: JSROOT.Painter.drawGeometry, expand: JSROOT.GEO.expandObject, opt: ";more;all;count" });
   JSROOT.addDrawFunc({ name: "TAxis3D", func: JSROOT.Painter.drawAxis3D });

   return JSROOT.Painter;

}));

