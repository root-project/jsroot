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
      var res = { _grid: false, _bound: false, _debug: false, _full: false, _axis:false, _count:false, scale: new THREE.Vector3(1,1,1), more:1, use_worker: false };

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

      if (opt.indexOf("worker")>=0) {
         res.use_worker = true;
         opt = opt.replace("worker", " ");
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
      if (opt.indexOf("f")>=0) res._full = true;
      if (opt.indexOf("a")>=0) { res._axis = true; res._yup = false; }
      if (opt.indexOf("y")>=0) res._yup = true;
      if (opt.indexOf("z")>=0) res._yup = false;

      return res;
   }


   JSROOT.TGeoPainter.prototype.addControls = function() {

      if (this._controls) return;

      var painter = this;

      this.select_main().property('flex_block_drag', true);

      this._controls = new THREE.OrbitControls(this._camera, this._renderer.domElement);
      this._controls.enableDamping = false;
      this._controls.dampingFactor = 0.25;
      this._controls.enableZoom = true;
      this._controls.target.copy(this._lookat);
      this._controls.update();

      var control_changed = false, mouse = { x:0, y: 0 };

      this._controls.addEventListener( 'change', function() { control_changed = true; painter.Render3D(0); } );

      this._controls.addEventListener( 'end', function() {
         if (control_changed) return;

         mouse.x = mouse.x / painter._renderer.domElement.width * 2 - 1;
         mouse.y = -mouse.y / painter._renderer.domElement.height * 2 + 1;
         var raycaster = new THREE.Raycaster();

         raycaster.setFromCamera( mouse, painter._camera );
         var intersects = raycaster.intersectObjects(painter._scene.children, true);

         console.log('context', mouse, 'intersects', intersects.length);

         for (var n=0;n<intersects.length;++n) {
            var obj = intersects[n].object;
            console.log(obj.type, 'name', obj.name,'nname', obj.nname);
         }

         control_changed = true;
      });

      this._context_menu = function(evnt) {
         control_changed = false;

         mouse.x = ('offsetX' in evnt) ? evnt.offsetX : evnt.layerX;
         mouse.y = ('offsetY' in evnt) ? evnt.offsetY : evnt.layerY;
      }

      this._datgui = new dat.GUI({width:650});
      var self = this;
      var toggleclip = this._datgui.add(this, 'enableClipping');
      toggleclip.onChange( function (value) {
         self.enableClipping = value;
         self.updateClipping();
      });

      var xclip = this._datgui.add(this, 'clipX', -2000, 2000);
      var yclip = this._datgui.add(this, 'clipY', -2000, 2000);
      var zclip = this._datgui.add(this, 'clipZ', -2000, 2000);
      xclip.onChange( function (value) {
         self.clipX = value;
         self.updateClipping();
      });
      yclip.onChange( function (value) {
         self.clipY = value;
         self.updateClipping();
      });
      zclip.onChange( function (value) {
         self.clipZ = value;
         self.updateClipping();
      });


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
      // used to calculate statistic over created geometries

      if (shape_typename === 'TGeoShapeAssembly') return;

      if (!geom) return JSROOT.GEO.warn('Not supported ' + shape_typename);

      this._num_geom++;

      this._num_faces += JSROOT.GEO.numGeometryFaces(geom);

      this._num_vertices += JSROOT.GEO.numGeometryVertices(geom);
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

         this.accountGeom(geom, shape._typename);
      }

      var mesh = new THREE.Mesh( geom, material );

      mesh.scale.copy(flip);

      mesh.updateMatrix();

      return mesh;
   }


   JSROOT.TGeoPainter.prototype.drawNode = function() {
      // return false when nothing todo
      // return true if creates next node
      // return 1 when call after short timeout
      // return 2 when call be done from processWorkerReply

      if (!this._clones || !this._draw_nodes || this._draw_nodes_ready) return false;

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
            waiting++; // number of waiting for worker
         } else
         if (unique.indexOf(shape) < 0) {
            unique.push(shape); // only to avoid duplication
            todo.push({ indx: n, nodeid: entry.nodeid, shape: shape });
            if (todo.length > 50) break;
         }
      }

      // console.log('collected todo', todo.length,'ready', ready.length, 'waiting', waiting);

      if ((todo.length > 0) && this.options.use_worker) {
         if (this.canSubmitToWorker()) {
            for (var s=0;s<todo.length;++s) {
               unique[s]._geom_worker = true; // mark shape as processed by worker
               todo[s].shape = JSROOT.clone(todo[s].shape, null, true);
            }
            waiting += todo.length;
            this.submitToWorker({ shapes: todo });
         } else {
            if (!this._worker_ready) return 1;
         }

         todo = [];
      }

      // we wait reply from the worker, no need to set timeout
      if ((waiting > 0) && this.options.use_worker && (ready.length == 0)) return 2;

      // create geometries
      if (todo.length > 0) {
         for (var s=0;s<todo.length;++s) {
            var shape = todo[s].shape;
            shape._geom = JSROOT.GEO.createGeometry(shape);
            this.accountGeom(shape._geom, shape._typename);
            delete shape._geom_worker; // remove flag
            ready.push(todo[s].indx); // one could add it to ready list
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

         this._drawcnt++;

         var mesh = null;

         if (JSROOT.GEO.numGeometryFaces(prop.shape._geom) > 0) {
            if (obj3d.matrixWorld.determinant() > -0.9) {
               mesh = new THREE.Mesh( prop.shape._geom, prop.material );
            } else {
               mesh = this.createFlippedMesh(obj3d, prop.shape, prop.material);
            }

            mesh.name = prop.name;
            mesh.nname = prop.nname;

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

      // doing its job well, can be called next time
      if ((todo.length > 0) || (ready.length > 0)) return true;

      // worker does not deliver results, wait little longer
      if (waiting > 0) return 1;

      // here everything is completed, we could cleanup data and finish

      this._draw_nodes_ready = true;

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
      this.enableClipping = false;
      this.clipX = 0.0;
      this.clipY = 0.0;
      this.clipZ = 0.0;

      this._clipPlanes = [ new THREE.Plane(new THREE.Vector3( 1, 0, 0), this.clipX), 
                           new THREE.Plane(new THREE.Vector3( 0,-1, 0), this.clipY),
                           new THREE.Plane(new THREE.Vector3( 0, 0, 1), this.clipZ) ];

      var pointLight = new THREE.PointLight(0xefefef);
      this._camera.add( pointLight );
      pointLight.position.set(10, 10, 10);
      this._camera.up = this.options._yup ? new THREE.Vector3(0,1,0) : new THREE.Vector3(0,0,1);
      this._scene.add( this._camera );

      this._toplevel = new THREE.Object3D();

      this._scene.add(this._toplevel);

      this._overall_size = 10;
   }


   JSROOT.TGeoPainter.prototype.startDrawGeometry = function(force) {

      if (!force && !this._draw_nodes_ready) {
         this._draw_nodes_again = true;
         return;
      }

      this.accountClear();

      tm1 = new Date().getTime();

      if (this._draw_nodes_again) this._clones.MarkVisisble();

      var res2 = this._clones.DefineVisible(this.options.maxlimit);
      var newnodes = this._clones.CollectVisibles(res2.minVol);
      tm2 = new Date().getTime();

      console.log('Collect visibles', newnodes.length, 'minvol', res2.minVol, 'takes', tm2-tm1);

      if (this._draw_nodes) {
         var del = this._clones.MergeVisibles(newnodes, this._draw_nodes);
         // remove should be fast, do it here
         for (var n=0;n<del.length;++n) {
            var obj3d = this._clones.CreateObject3D(del[n].stack, this._toplevel, this.options);
            if (obj3d) obj3d.parent.remove(obj3d);
         }
      }

      this._draw_nodes = newnodes;

      this._startm = new Date().getTime();
      this._last_render_tm = this._startm;
      this._last_render_cnt = 0;
      this._drawcnt = 0; // counter used to build meshes
      this._draw_nodes_ready = false;
      delete this._draw_nodes_again; // forget about such flag

      this.continueDraw();
   }

   JSROOT.TGeoPainter.prototype.updateClipping = function(offset) {
      this._renderer.clippingPlanes = this.enableClipping ? this._clipPlanes : [];
      this._clipPlanes[0].constant = this.clipX;
      this._clipPlanes[1].constant = this.clipY;
      this._clipPlanes[2].constant = this.clipZ;
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

      this.options = this.decodeOptions(opt);

      if (!('_yup' in this.options))
         this.options._yup = this.svg_canvas().empty();

      this._webgl = JSROOT.Painter.TestWebGL();

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
      if (this.options.use_worker) this.startWorker();

      this.createScene(this._webgl, size.width, size.height, window.devicePixelRatio);

      this.add_3d_canvas(size, this._renderer.domElement);

      this.CreateToolbar();

      this.startDrawGeometry(true);

      return this;
   }

   JSROOT.TGeoPainter.prototype.continueDraw = function() {

      var currtm = new Date().getTime();

      var interval = 300;

      while(true) {

         var res = this.drawNode();

         if (!res) break;

         var log = "Creating meshes " + this._drawcnt;

         var now = new Date().getTime();

         // stop creation after 100 sec, render as is
         if (now - this._startm > 1e5) break;

         if ((now - currtm > interval) || (res === 1) || (res === 2)) {
            JSROOT.progress(log);
            if (this._webgl && (now - this._last_render_tm > interval) && (this._last_render_cnt != this._drawcnt)) {
               if (this._first_drawing)
                  this.adjustCameraPosition();
               this._renderer.render(this._scene, this._camera);
               this._last_render_tm = new Date().getTime();
               this._last_render_cnt = this._drawcnt;
            }
            if (res !== 2) setTimeout(this.continueDraw.bind(this), (res === 1) ? 100 : 1);
            return;
         }
      }

      var t2 = new Date().getTime();
      JSROOT.console('Create tm = ' + (t2-this._startm) + ' geom ' + this._num_geom + ' vertices ' + this._num_vertices + ' faces ' + this._num_faces + ' nodes ' + this._num_nodes);

      if (t2 - this._startm > 300) {
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

         delete this.render_tmout;

         if (this.first_render_tm === 0) {
            this.first_render_tm = tm2.getTime() - tm1.getTime();
            JSROOT.console('First render tm = ' + this.first_render_tm);
            this.addControls();
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

   JSROOT.TGeoPainter.prototype.canSubmitToWorker = function() {
      if (!this._worker) return false;

      return this._worker_ready && (this._worker_jobs == 0);
   }

   JSROOT.TGeoPainter.prototype.submitToWorker = function(job) {
      if (!this._worker) return false;

      this._worker_jobs++;

      job.tm0 = new Date().getTime();

      this._worker.postMessage(job);
   }

   JSROOT.TGeoPainter.prototype.processWorkerReply = function(job) {
      this._worker_jobs--;

      if ('shapes' in job) {
         var loader = new THREE.BufferGeometryLoader();

         for (var n=0;n<job.shapes.length;++n) {
            var item = job.shapes[n];

            var shape = this._clones.GetNodeShape(item.nodeid);

            if (item.json) {
               var object = loader.parse(item.json);
               shape._geom = object;
               this.accountGeom(shape._geom, shape._typename);
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

      // pointer used in the event handlers
      var pthis = this;
      var dom = this.select_main().node();

      if (dom) {
         dom.focus();
         dom.tabIndex = 0;
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

   JSROOT.TGeoPainter.prototype.toggleWireFrame = function(obj) {
      var painter = this;

      obj.traverse(function(obj2) {
         if ( obj2.hasOwnProperty("material") && !(obj2 instanceof THREE.GridHelper) ) {
            if (!painter.ownedByTransformControls(obj2))
               obj2.material.wireframe = !obj2.material.wireframe;
         }
      });
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

      geometry._painter = this; // set painter, use for drawing update

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
         node._painter = this; // set painter, use for drawing update
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

   JSROOT.GEO.expandList = function(item, lst) {
      if ((lst==null) || !('arr' in lst) || (lst.arr.length==0)) return;

      item._more = true;
      item._geoobj = lst;

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
            if (obj._typename == "TGeoMixture") sub._icon = "img_geomixture"; else
            if (obj.fVolume) {
               sub._title = "node:"  + obj._typename;
               if (obj.fTitle.length > 0) sub._title + " " + obj.fTitle;
               if (obj.fVolume.fShape) {
                  sub._icon = JSROOT.GEO.getShapeIcon(obj.fVolume.fShape);
                  sub._title += " shape:" + obj.fVolume.fShape._typename;
               }
               if ((obj.fVolume.fNodes && obj.fVolume.fNodes.arr.length>0)) {
                  sub._more = true;
                  sub._expand = node._expand;
               }
            }

            node._childs.push(sub);
         }

         return true;
      }
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
      if (! ('_volume' in item)) return false;

      menu.add("separator");
      var vol = item._volume;

      function ToggleMenuBit(arg) {
         JSROOT.GEO.ToggleBit(vol, arg);
         item._icon = item._icon.split(" ")[0] + JSROOT.GEO.provideVisStyle(vol);
         hpainter.UpdateTreeNode(item);
         JSROOT.GEO.browserItemChanged(item);
      }

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

   JSROOT.GEO.browserItemChanged = function(hitem) {
      while (hitem) {
         if (hitem._volume && hitem._volume._painter)
            return hitem._volume._painter.testGeomChanges();

         hitem = hitem._parent;
      }
   }

   JSROOT.GEO.browserIconClick = function(hitem) {
      if ((hitem==null) || (hitem._volume == null)) return false;

      if (hitem._more)
         JSROOT.GEO.ToggleBit(hitem._volume, JSROOT.GEO.BITS.kVisDaughters);
      else
         JSROOT.GEO.ToggleBit(hitem._volume, JSROOT.GEO.BITS.kVisThis);
      hitem._icon = hitem._icon.split(" ")[0] + JSROOT.GEO.provideVisStyle(hitem._volume);
      JSROOT.GEO.browserItemChanged(hitem);
      return true;
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

   JSROOT.GEO.expandShape = function(parent, shape, itemname) {
      var item = {
            _kind : "ROOT." + shape._typename,
            _name : itemname,
            _title : shape._typename,
            _icon : JSROOT.GEO.getShapeIcon(shape),
            _parent : parent,
            _shape : shape,
            _get : function(item, itemname, callback) {
               if ((item!==null) && ('_shape' in item))
                  return JSROOT.CallBack(callback, item, item._shape);
               JSROOT.CallBack(callback, item, null);
            }
         };

      if (!('_childs' in parent)) parent._childs = [];
      parent._childs.push(item);
      return true;
   }

   JSROOT.GEO.expandVolume = function(parent, volume, arg) {

      if (!parent || !volume) return false;

      var item = {
         _kind : "ROOT.TGeoVolume",
         _name : arg ? arg : volume.fName,
         _title : volume.fTitle,
         _parent : parent,
         _volume : volume, // keep direct reference
         _more : (volume.fNodes !== undefined) && (volume.fNodes !== null),
         _menu : JSROOT.GEO.provideMenu,
         _icon_click : JSROOT.GEO.browserIconClick,
         _get : function(item, itemname, callback) {
            if ((item!=null) && ('_volume' in item))
               return JSROOT.CallBack(callback, item, item._volume);

            JSROOT.CallBack(callback, item, null);
         }
      };

      if (item._more) {
        item._expand = function(node, obj) {
           var subnodes = obj.fNodes.arr, map = [];
           for (var i=0;i<subnodes.length;++i) {
              var vol = subnodes[i].fVolume;
              if (map.indexOf(vol) < 0) {
                 // avoid duplication of similar volume
                 map.push(vol);
                 JSROOT.GEO.expandVolume(node, vol);
              }
           }

           return true;
        }
      } else
      if ((volume.fShape !== null) && (volume.fShape._typename === "TGeoCompositeShape") && (volume.fShape.fNode !== null)) {
         item._more = true;
         item._expand = function(node, obj) {
            JSROOT.GEO.expandShape(node, obj.fShape.fNode.fLeft, 'Left');
            JSROOT.GEO.expandShape(node, obj.fShape.fNode.fRight, 'Right');
            return true;
         }
      }

      if (item._title == "")
         if (volume._typename != "TGeoVolume") item._title = volume._typename;

      if (volume.fShape !== null) {
         if (item._title == "")
            item._title = volume.fShape._typename;

         item._icon = JSROOT.GEO.getShapeIcon(volume.fShape);
      }

      if (!('_childs' in parent)) parent._childs = [];

      if (!('_icon' in item))
         item._icon = item._more ? "img_geocombi" : "img_geobbox";

      item._icon += JSROOT.GEO.provideVisStyle(volume);

      // avoid name duplication of the items
      for (var cnt=0;cnt<1000000;cnt++) {
         var curr_name = item._name;
         if (curr_name.length == 0) curr_name = "item";
         if (cnt>0) curr_name+= "_"+cnt;
         // avoid name duplication
         for (var n in parent._childs) {
            if (parent._childs[n]._name == curr_name) {
               curr_name = ""; break;
            }
         }
         if (curr_name.length > 0) {
            if (cnt>0) item._name = curr_name;
            break;
         }
      }

      parent._childs.push(item);

      return true;
   }


   JSROOT.GEO.expandManagerHierarchy = function(hitem, obj) {

      if ((hitem==null) || (obj==null)) return false;

      hitem._childs = [];

      var item1 = { _name: "Materials", _kind: "Folder", _title: "list of materials" };
      JSROOT.GEO.expandList(item1, obj.fMaterials);
      hitem._childs.push(item1);

      var item2 = { _name: "Media", _kind: "Folder", _title: "list of media" };
      JSROOT.GEO.expandList(item2, obj.fMedia);
      hitem._childs.push(item2);

      var item3 = { _name: "Tracks", _kind: "Folder", _title: "list of tracks" };
      JSROOT.GEO.expandList(item3, obj.fTracks);
      hitem._childs.push(item3);

      if (obj.fMasterVolume) {
         JSROOT.GEO.expandVolume(hitem, obj.fMasterVolume, "Volume");
         var item4 = { _name: "Nodes", _kind: "Folder", _title: "Hierarchy of TGeoNodes" };
         JSROOT.GEO.expandList(item4, obj.fMasterVolume.fNodes);
         hitem._childs.push(item4);
      }

      return true;
   }

   JSROOT.addDrawFunc({ name: "TGeoVolumeAssembly", icon: 'img_geoassembly', func: JSROOT.Painter.drawGeometry, expand: JSROOT.GEO.expandVolume, opt : ";more;all;count" });
   JSROOT.addDrawFunc({ name: "TAxis3D", func: JSROOT.Painter.drawAxis3D });

   return JSROOT.Painter;

}));

