/// @file JSRootPainter.hist3d.js
/// 3D histogram graphics

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      // AMD. Register as an anonymous module.
      define( ['JSRootPainter.hist', 'd3', 'threejs', 'threejs_all'], factory );
   } else
   if (typeof exports === 'object' && typeof module !== 'undefined') {
      var jsroot = require("./JSRootPainter.hist.js");
      factory(jsroot, require("./d3.min.js"), require("./three.min.js"), require("./three.extra.min.js"),
              jsroot.nodejs || (typeof document=='undefined') ? jsroot.nodejs_document : document);
   } else {

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'JSRootPainter.hist3d.js');

      if (typeof d3 != 'object')
         throw new Error('This extension requires d3.js', 'JSRootPainter.hist3d.js');

      if (typeof THREE == 'undefined')
         throw new Error('THREE is not defined', 'JSRoot3DPainter.js');

      // Browser globals
      factory(JSROOT, d3, THREE);
   }
} (function(JSROOT, d3, THREE, THREE_MORE, document) {

   JSROOT.sources.push("hist3d");

   if ((typeof document=='undefined') && (typeof window=='object')) document = window.document;

   if (typeof JSROOT.Painter != 'object')
      throw new Error('JSROOT.Painter is not defined', 'JSRootPainter.hist3d.js');

   JSROOT.THistPainter.prototype.Create3DScene = function(arg) {

      if ((arg!==undefined) && (arg<0)) {

         if (typeof this.TestAxisVisibility === 'function')
            this.TestAxisVisibility(null, this.toplevel);

         this.clear_3d_canvas();

         JSROOT.Painter.DisposeThreejsObject(this.scene);
         if (this.control) this.control.Cleanup();

         if (this.renderer) {
            if (this.renderer.dispose) this.renderer.dispose();
            if (this.renderer.context) delete this.renderer.context;
         }

         delete this.size_xy3d;
         delete this.size_z3d;
         delete this.scene;
         delete this.toplevel;
         delete this.tooltip_mesh;
         delete this.camera;
         delete this.pointLight;
         delete this.renderer;
         delete this.control;
         if ('render_tmout' in this) {
            clearTimeout(this.render_tmout);
            delete this.render_tmout;
         }
         return;
      }

      if ('toplevel' in this) {
         // it is indication that all 3D object created, just replace it with empty
         this.scene.remove(this.toplevel);
         JSROOT.Painter.DisposeThreejsObject(this.toplevel);
         delete this.toplevel;
         delete this.tooltip_mesh;
         if (this.control) this.control.HideTooltip();

         var newtop = new THREE.Object3D();
         this.scene.add(newtop);
         this.toplevel = newtop;

         this.Resize3D(); // set actual sizes

         return;
      }

      this.usesvg = JSROOT.BatchMode; // SVG used in batch mode

      var sz = this.size_for_3d(this.usesvg ? 3 : undefined);

      this.size_z3d = 100;
      this.size_xy3d = (sz.height > 10) && (sz.width > 10) ? Math.round(sz.width/sz.height*this.size_z3d) : this.size_z3d;

      // three.js 3D drawing
      this.scene = new THREE.Scene();
      //scene.fog = new THREE.Fog(0xffffff, 500, 3000);

      this.toplevel = new THREE.Object3D();
      this.scene.add(this.toplevel);
      this.scene_width = sz.width;
      this.scene_height = sz.height;

      this.camera = new THREE.PerspectiveCamera(45, this.scene_width / this.scene_height, 1, 40*this.size_z3d);

      var max3d = Math.max(0.75*this.size_xy3d, this.size_z3d);
      this.camera.position.set(-1.6*max3d, -3.5*max3d, 1.4*this.size_z3d);

      this.pointLight = new THREE.PointLight(0xffffff,1);
      this.camera.add( this.pointLight );
      this.pointLight.position.set( this.size_xy3d/2, this.size_xy3d/2, this.size_z3d/2 );

      var lookat = new THREE.Vector3(0,0,0.8*this.size_z3d);

      this.camera.up = new THREE.Vector3(0,0,1);
      this.camera.lookAt(lookat);
      this.scene.add( this.camera );

      if (this.usesvg) {
         this.renderer = JSROOT.gStyle.SVGRenderer ?
                           new THREE.SVGRendererNew() :
                           new THREE.SVGRenderer({ precision: 0, astext: true });
         if (this.renderer.outerHTML !== undefined) {
            // this is indication of new three.js functionality
            if (!JSROOT.svg_workaround) JSROOT.svg_workaround = [];
            this.renderer.domElement = document.createElementNS( 'http://www.w3.org/2000/svg', 'path');
            this.renderer.workaround_id = JSROOT.svg_workaround.length;
            this.renderer.domElement.setAttribute('jsroot_svg_workaround', this.renderer.workaround_id);
            JSROOT.svg_workaround[this.renderer.workaround_id] = "<svg></svg>"; // dummy, need to be replaced
         }
      } else {
         this.webgl = JSROOT.Painter.TestWebGL();
         this.renderer = this.webgl ? new THREE.WebGLRenderer({ antialias : true, alpha: true }) :
                                      new THREE.CanvasRenderer({ antialias : true, alpha: true });
      }

      //renderer.setClearColor(0xffffff, 1);
      // renderer.setClearColor(0x0, 0);
      this.renderer.setSize(this.scene_width, this.scene_height);

      this.add_3d_canvas(sz, this.renderer.domElement);

      this.Render3D = JSROOT.Painter.Render3D;
      this.Resize3D = JSROOT.Painter.Resize3D;
      this.BinHighlight3D = JSROOT.Painter.BinHighlight3D;

      this.first_render_tm = 0;
      this.enable_hightlight = false;
      this.tooltip_allowed = (JSROOT.gStyle.Tooltip > 0);

      if (JSROOT.BatchMode) return;

      this.control = JSROOT.Painter.CreateOrbitControl(this, this.camera, this.scene, this.renderer, lookat);

      var painter = this;

      this.control.ProcessMouseMove = function(intersects) {
         var tip = null, mesh = null, zoom_mesh = null;

         for (var i = 0; i < intersects.length; ++i) {
            if (intersects[i].object.tooltip) {
               tip = intersects[i].object.tooltip(intersects[i]);
               if (tip) { mesh = intersects[i].object; break; }
            } else
            if (intersects[i].object.zoom && !zoom_mesh) zoom_mesh = intersects[i].object;
         }

         if (tip && !tip.use_itself) {
            var delta_xy = 1e-4*painter.size_xy3d, delta_z = 1e-4*painter.size_z3d;
            if ((tip.x1 > tip.x2) || (tip.y1 > tip.y2) || (tip.z1 > tip.z2)) console.warn('check 3D hints coordinates');
            tip.x1 -= delta_xy; tip.x2 += delta_xy;
            tip.y1 -= delta_xy; tip.y2 += delta_xy;
            tip.z1 -= delta_z; tip.z2 += delta_z;
         }

         painter.BinHighlight3D(tip, mesh);

         if (!tip && zoom_mesh && painter.Get3DZoomCoord) {
            var pnt = zoom_mesh.GlobalIntersect(this.raycaster),
                axis_name = zoom_mesh.zoom,
                axis_value = painter.Get3DZoomCoord(pnt, axis_name);

            if ((axis_name==="z") && zoom_mesh.use_y_for_z) axis_name = "y";

            var taxis = this.histo ? this.histo['f'+axis_name.toUpperCase()+"axis"] : null;

            var hint = { name: axis_name,
                         title: "TAxis",
                         line: "any info",
                         only_status: true};

            if (taxis) { hint.name = taxis.fName; hint.title = taxis.fTitle || "histogram TAxis object"; }

            hint.line = axis_name + " : " + painter.AxisAsText(axis_name, axis_value);

            return hint;
         }

         return (tip && tip.lines) ? tip : "";
      }

      this.control.ProcessMouseLeave = function() {
         painter.BinHighlight3D(null);
      }

      this.control.ContextMenu = function(pos, intersects) {
         var kind = "hist", p = painter;
         if (intersects)
            for (var n=0;n<intersects.length;++n) {
               var mesh = intersects[n].object;
               if (mesh.zoom) { kind = mesh.zoom; break; }
               if (mesh.painter && typeof mesh.painter.ShowContextMenu ==='function') {
                  p = mesh.painter; break;
               }
            }

         p.ShowContextMenu(kind, pos);
      }
   }


   JSROOT.THistPainter.prototype.DrawXYZ = function(toplevel, opts) {
      if (!opts) opts = {};

      var grminx = -this.size_xy3d, grmaxx = this.size_xy3d,
          grminy = -this.size_xy3d, grmaxy = this.size_xy3d,
          grminz = 0, grmaxz = 2*this.size_z3d,
          textsize = Math.round(this.size_z3d * 0.05),
          pad = this.root_pad(),
          histo = this.histo,
          xmin = this.xmin, xmax = this.xmax,
          ymin = this.ymin, ymax = this.ymax,
          zmin = this.zmin, zmax = this.zmax,
          y_zoomed = false, z_zoomed = false;

      if (!this.size_z3d) {
         grminx = this.xmin; grmaxx = this.xmax;
         grminy = this.ymin; grmaxy = this.ymax;
         grminz = this.zmin; grmaxz = this.zmax;
         textsize = (grmaxz - grminz) * 0.05;
      }

      if (('zoom_xmin' in this) && ('zoom_xmax' in this) && (this.zoom_xmin !== this.zoom_xmax)) {
         xmin = this.zoom_xmin; xmax = this.zoom_xmax;
      }
      if (('zoom_ymin' in this) && ('zoom_ymax' in this) && (this.zoom_ymin !== this.zoom_ymax)) {
         ymin = this.zoom_ymin; ymax = this.zoom_ymax; y_zoomed = true;
      }

      if (('zoom_zmin' in this) && ('zoom_zmax' in this) && (this.zoom_zmin !== this.zoom_zmax)) {
         zmin = this.zoom_zmin; zmax = this.zoom_zmax; z_zoomed = true;
      }

      if (opts.use_y_for_z) {
         this.zmin = this.ymin; this.zmax = this.ymax;
         zmin = ymin; zmax = ymax; z_zoomed = y_zoomed;
         // if (!z_zoomed && (this.hmin!==this.hmax)) { zmin = this.hmin; zmax = this.hmax; }
         ymin = 0; ymax = 1;
      }

      // z axis range used for lego plot
      this.lego_zmin = zmin; this.lego_zmax = zmax;

      // factor 1.1 used in ROOT for lego plots
      if ((opts.zmult !== undefined) && !z_zoomed) zmax *= opts.zmult;

      this.TestAxisVisibility = JSROOT.Painter.HPainter_TestAxisVisibility;

      if (pad && pad.fLogx) {
         if (xmax <= 0) xmax = 1.;
         if ((xmin <= 0) && (this.nbinsx > 0))
            for (var i=0;i<this.nbinsx;++i) {
               xmin = Math.max(xmin, this.GetBinX(i));
               if (xmin>0) break;
            }
         if (xmin <= 0) xmin = 1e-4*xmax;
         this.grx = d3.scaleLog();
         this.x_kind = "log";
      } else {
         this.grx = d3.scaleLinear();
         if (histo && histo.fXaxis.fLabels) this.x_kind = "labels";
                                       else this.x_kind = "lin";
      }

      this.logx = (this.x_kind === "log");

      this.grx.domain([ xmin, xmax ]).range([ grminx, grmaxx ]);
      this.x_handle = new JSROOT.TAxisPainter(histo ? histo.fXaxis : null);
      this.x_handle.SetAxisConfig("xaxis", this.x_kind, this.grx, this.xmin, this.xmax, xmin, xmax);
      this.x_handle.CreateFormatFuncs();
      this.scale_xmin = xmin; this.scale_xmax = xmax;

      if (pad && pad.fLogy && !opts.use_y_for_z) {
         if (ymax <= 0) ymax = 1.;
         if ((ymin <= 0) && (this.nbinsy>0))
            for (var i=0;i<this.nbinsy;++i) {
               ymin = Math.max(ymin, this.GetBinY(i));
               if (ymin>0) break;
            }

         if (ymin <= 0) ymin = 1e-4*ymax;
         this.gry = d3.scaleLog();
         this.y_kind = "log";
      } else {
         this.gry = d3.scaleLinear();
         if (histo && histo.fYaxis.fLabels) this.y_kind = "labels";
                                       else this.y_kind = "lin";
      }

      this.logy = (this.y_kind === "log");

      this.gry.domain([ ymin, ymax ]).range([ grminy, grmaxy ]);
      this.y_handle = new JSROOT.TAxisPainter(histo ? histo.fYaxis : null);
      this.y_handle.SetAxisConfig("yaxis", this.y_kind, this.gry, this.ymin, this.ymax, ymin, ymax);
      this.y_handle.CreateFormatFuncs();
      this.scale_ymin = ymin; this.scale_ymax = ymax;

      if (pad && pad.fLogz) {
         if (zmax <= 0) zmax = 1;
         if (zmin <= 0) zmin = 1e-4*zmax;
         this.grz = d3.scaleLog();
         this.z_kind = "log";
      } else {
         this.grz = d3.scaleLinear();
         this.z_kind = "lin";
      }

      this.logz = (this.z_kind === "log");

      this.grz.domain([ zmin, zmax ]).range([ grminz, grmaxz ]);

      this.z_handle = new JSROOT.TAxisPainter(histo ? histo.fZaxis : null);
      this.z_handle.SetAxisConfig("zaxis", this.z_kind, this.grz, this.zmin, this.zmax, zmin, zmax);
      this.z_handle.CreateFormatFuncs();
      this.scale_zmin = zmin; this.scale_zmax = zmax;

      var textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }),
          lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 }),
          ticklen = textsize*0.5, text, tick, lbls = [], text_scale = 1,
          xticks = this.x_handle.CreateTicks(),
          yticks = this.y_handle.CreateTicks(),
          zticks = this.z_handle.CreateTicks();


      // main element, where all axis elements are placed
      var top = new THREE.Object3D();
      top.axis_draw = true; // mark element as axis drawing
      toplevel.add(top);

      var ticks = [], maxtextheight = 0;

      while (xticks.next()) {
         var grx = xticks.grpos;
         var is_major = (xticks.kind===1);
         var lbl = this.x_handle.format(xticks.tick, true, true);
         if (xticks.last_major()) lbl = "x"; else
            if (lbl === null) { is_major = false; lbl = ""; }

         if (is_major && lbl && (lbl.length>0)) {
            var text3d = new THREE.TextGeometry(lbl, { font: JSROOT.threejs_font_helvetiker_regular, size: textsize, height: 0, curveSegments: 5 });
            text3d.computeBoundingBox();
            var draw_width = text3d.boundingBox.max.x - text3d.boundingBox.min.x,
                draw_height = text3d.boundingBox.max.y - text3d.boundingBox.min.y;
            text3d.translate(-draw_width/2, 0, 0);

            maxtextheight = Math.max(maxtextheight, draw_height);

            text3d.grx = grx;
            lbls.push(text3d);

            if (!xticks.last_major()) {
               var space = (xticks.next_major_grpos() - grx);
               if (draw_width > 0)
                  text_scale = Math.min(text_scale, 0.9*space/draw_width)
               if (this.x_handle.IsCenterLabels()) text3d.grx += space/2;
            }
         }

         ticks.push(grx, 0, 0, grx, (is_major ? -ticklen : -ticklen * 0.6), 0);
      }

/*
      var ggg1 = new THREE.Geometry(), ggg2 = new THREE.Geometry();

      lbls.forEach(function(lbl) {
         var m = new THREE.Matrix4();
         // matrix to swap y and z scales and shift along z to its position
         m.set(text_scale, 0,           0,  lbl.grx,
               0,          text_scale,  0,  -maxtextheight*text_scale - 1.5*ticklen,
               0,          0,           1,  0);

         ggg1.merge(lbl, m);

         m.set(-text_scale, 0,           0, lbl.grx,
               0,           text_scale,  0, -maxtextheight*text_scale - 1.5*ticklen,
               0,           0,           1, 0);

         ggg2.merge(lbl, m);
      });
*/

      this.Get3DZoomCoord = function(point, kind) {
         // return axis coordinate from intersection point with axis geometry
         var pos = point[kind], min = this['scale_'+kind+'min'], max = this['scale_'+kind+'max'];

         if (kind==="z") pos = pos/2/this.size_z3d;
                   else  pos = (pos+this.size_xy3d)/2/this.size_xy3d;

         if (this["log"+kind]) {
            pos = Math.exp(Math.log(min) + pos*(Math.log(max)-Math.log(min)));
         } else {
            pos = min + pos*(max-min);
         }
         return pos;
      }

      function CreateZoomMesh(kind, size_3d, use_y_for_z) {
         var geom = new THREE.Geometry();

         if (kind==="z")
            geom.vertices.push(
                  new THREE.Vector3(0,0,0),
                  new THREE.Vector3(ticklen*4, 0, 0),
                  new THREE.Vector3(ticklen*4, 0, 2*size_3d),
                  new THREE.Vector3(0, 0, 2*size_3d));
         else
            geom.vertices.push(
                  new THREE.Vector3(-size_3d,0,0),
                  new THREE.Vector3(size_3d,0,0),
                  new THREE.Vector3(size_3d,-ticklen*4,0),
                  new THREE.Vector3(-size_3d,-ticklen*4,0));

         geom.faces.push(new THREE.Face3(0, 2, 1));
         geom.faces.push(new THREE.Face3(0, 3, 2));
         geom.computeFaceNormals();

         var material = new THREE.MeshBasicMaterial({ transparent: true,
                                   vertexColors: THREE.NoColors, //   THREE.FaceColors,
                                   side: THREE.DoubleSide,
                                   opacity: 0 });

         var mesh = new THREE.Mesh(geom, material);
         mesh.zoom = kind;
         mesh.size_3d = size_3d;
         mesh.use_y_for_z = use_y_for_z;
         if (kind=="y") mesh.rotateZ(Math.PI/2).rotateX(Math.PI);

         mesh.GlobalIntersect = function(raycaster) {
            var plane = new THREE.Plane(),
                geom = this.geometry;

            plane.setFromCoplanarPoints(geom.vertices[0], geom.vertices[1], geom.vertices[2]);
            plane.applyMatrix4(this.matrixWorld);

            var v1 = raycaster.ray.origin.clone(),
                v2 = v1.clone().addScaledVector(raycaster.ray.direction, 1e10);

            var pnt = plane.intersectLine(new THREE.Line3(v1,v2));

            if (!pnt) return undefined;

            var min = -this.size_3d, max = this.size_3d;
            if (this.zoom==="z") { min = 0; max = 2*this.size_3d; }

            if (pnt[this.zoom] < min) pnt[this.zoom] = min; else
            if (pnt[this.zoom] > max) pnt[this.zoom] = max;

            return pnt;
         }

         mesh.ShowSelection = function(pnt1,pnt2) {
            // used to show selection

            var tgtmesh = this.children[0], gg, kind = this.zoom;
            if (!pnt1 || !pnt2) {
               if (tgtmesh) {
                  this.remove(tgtmesh)
                  JSROOT.Painter.DisposeThreejsObject(tgtmesh);
               }
               return tgtmesh;
            }

            if (!tgtmesh) {
               gg = this.geometry.clone();
               if (kind==="z") gg.vertices[1].x = gg.vertices[2].x = ticklen;
                          else gg.vertices[2].y = gg.vertices[3].y = -ticklen;
               tgtmesh = new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ color: 0xFF00, side: THREE.DoubleSide }));
               this.add(tgtmesh);
            } else {
               gg = tgtmesh.geometry;
            }

            if (kind=="z") {
               gg.vertices[0].z = gg.vertices[1].z = pnt1[kind];
               gg.vertices[2].z = gg.vertices[3].z = pnt2[kind];
            } else {
               gg.vertices[0].x = gg.vertices[3].x = pnt1[kind];
               gg.vertices[1].x = gg.vertices[2].x = pnt2[kind];
            }

            gg.computeFaceNormals();

            gg.verticesNeedUpdate = true;
            gg.normalsNeedUpdate = true;

            return true;
         }

         return mesh;
      }

      var xcont = new THREE.Object3D();
      xcont.position.set(0, grminy, grminz)
      xcont.rotation.x = 1/4*Math.PI;
      xcont.xyid = 2;
      var xtickslines = JSROOT.Painter.createLineSegments( ticks, lineMaterial );
      xcont.add(xtickslines);

      lbls.forEach(function(lbl) {
         var m = new THREE.Matrix4();
         // matrix to swap y and z scales and shift along z to its position
         m.set(text_scale, 0,           0,  lbl.grx,
               0,          text_scale,  0,  -maxtextheight*text_scale - 1.5*ticklen,
               0,          0,           1,  0,
               0,          0,           0,  1);

         var mesh = new THREE.Mesh(lbl, textMaterial);
         mesh.applyMatrix(m);
         xcont.add(mesh);
      });

      // xcont.add(new THREE.Mesh(ggg1, textMaterial));

      if (opts.zoom) xcont.add(CreateZoomMesh("x", this.size_xy3d));
      top.add(xcont);

      xcont = new THREE.Object3D();
      xcont.position.set(0, grmaxy, grminz);
      xcont.rotation.x = 3/4*Math.PI;
      xcont.add(new THREE.LineSegments(xtickslines.geometry, lineMaterial));
      lbls.forEach(function(lbl) {
         var m = new THREE.Matrix4();
         // matrix to swap y and z scales and shift along z to its position
         m.set(-text_scale, 0,           0, lbl.grx,
               0,           text_scale,  0, -maxtextheight*text_scale - 1.5*ticklen,
               0,           0,           -1, 0,
               0,            0,           0, 1);
         var mesh = new THREE.Mesh(lbl, textMaterial);
         mesh.applyMatrix(m);
         xcont.add(mesh);
      });

      //xcont.add(new THREE.Mesh(ggg2, textMaterial));
      xcont.xyid = 4;
      if (opts.zoom) xcont.add(CreateZoomMesh("x", this.size_xy3d));
      top.add(xcont);

      lbls = []; text_scale = 1; maxtextheight = 0; ticks = [];

      while (yticks.next()) {
         var gry = yticks.grpos;
         var is_major = (yticks.kind===1);
         var lbl = this.y_handle.format(yticks.tick, true, true);
         if (yticks.last_major()) lbl = "y"; else
            if (lbl === null) { is_major = false; lbl = ""; }

         if (is_major) {
            var text3d = new THREE.TextGeometry(lbl, { font: JSROOT.threejs_font_helvetiker_regular, size: textsize, height: 0, curveSegments: 5 });
            text3d.computeBoundingBox();
            var draw_width = text3d.boundingBox.max.x - text3d.boundingBox.min.x,
                draw_height = text3d.boundingBox.max.y - text3d.boundingBox.min.y;
            text3d.translate(-draw_width/2, 0, 0);

            maxtextheight = Math.max(maxtextheight, draw_height);

            text3d.gry = gry;
            lbls.push(text3d);

            if (!yticks.last_major()) {
               var space = (yticks.next_major_grpos() - gry);
               if (draw_width > 0)
                  text_scale = Math.min(text_scale, 0.9*space/draw_width)
               if (this.y_handle.IsCenterLabels()) text3d.gry += space/2;
            }
         }
         ticks.push(0,gry,0, (is_major ? -ticklen : -ticklen*0.6), gry, 0);
      }

/*
      var ggg1 = new THREE.Geometry(), ggg2 = new THREE.Geometry();

      lbls.forEach(function(lbl) {
         var m = new THREE.Matrix4();
         m.set(0, text_scale,  0, -maxtextheight*text_scale - 1.5*ticklen,
               -text_scale,  0, 0, lbl.gry,
               0, 0,  1, 0);

         ggg1.merge(lbl, m);

         m.set(0, text_scale,  0, -maxtextheight*text_scale - 1.5*ticklen,
               text_scale,  0, 0, lbl.gry,
               0, 0,  1, 0);

         ggg2.merge(lbl, m);

      });

      ggg1 = new THREE.BufferGeometry().fromGeometry(ggg1);
      ggg2 = new THREE.BufferGeometry().fromGeometry(ggg2);
    */

      if (!opts.use_y_for_z) {

         var yticksline = JSROOT.Painter.createLineSegments( ticks, lineMaterial );

         var ycont = new THREE.Object3D();
         ycont.position.set(grminx, 0, grminz);
         ycont.rotation.y = -1/4*Math.PI;
         ycont.add(yticksline);
         //ycont.add(new THREE.Mesh(ggg1, textMaterial));

         lbls.forEach(function(lbl) {
            var m = new THREE.Matrix4();
            // matrix to swap y and z scales and shift along z to its position
            m.set(0, text_scale,  0, -maxtextheight*text_scale - 1.5*ticklen,
                  -text_scale,  0, 0, lbl.gry,
                  0, 0,  1, 0,
                  0, 0,  0, 1);

            var mesh = new THREE.Mesh(lbl, textMaterial);
            mesh.applyMatrix(m);
            ycont.add(mesh);
         });

         ycont.xyid = 3;
         if (opts.zoom) ycont.add(CreateZoomMesh("y", this.size_xy3d));
         top.add(ycont);

         ycont = new THREE.Object3D();
         ycont.position.set(grmaxx, 0, grminz);
         ycont.rotation.y = -3/4*Math.PI;
         ycont.add(new THREE.LineSegments(yticksline.geometry, lineMaterial));
         //ycont.add(new THREE.Mesh(ggg2, textMaterial));
         lbls.forEach(function(lbl) {
            var m = new THREE.Matrix4();
            m.set(0, text_scale, 0,  -maxtextheight*text_scale - 1.5*ticklen,
                  text_scale, 0, 0,  lbl.gry,
                  0,         0, -1,  0,
                  0, 0, 0, 1);

            var mesh = new THREE.Mesh(lbl, textMaterial);
            mesh.applyMatrix(m);
            ycont.add(mesh);
         });
         ycont.xyid = 1;
         if (opts.zoom) ycont.add(CreateZoomMesh("y", this.size_xy3d));
         top.add(ycont);
      }


      lbls = []; text_scale = 1;

      ticks = []; // just array, will be used for the buffer geometry

      var zgridx = null, zgridy = null, lastmajorz = null;
      if (this.size_z3d) {
         zgridx = []; zgridy = [];
      }

      while (zticks.next()) {
         var grz = zticks.grpos;
         var is_major = zticks.kind == 1;

         var lbl = this.z_handle.format(zticks.tick, true, true);
         if (lbl === null) { is_major = false; lbl = ""; }

         if (is_major && lbl && (lbl.length > 0)) {
            var text3d = new THREE.TextGeometry(lbl, { font: JSROOT.threejs_font_helvetiker_regular, size : textsize, height : 0, curveSegments : 5 });
            text3d.computeBoundingBox();
            var draw_width = text3d.boundingBox.max.x - text3d.boundingBox.min.x,
                draw_height = text3d.boundingBox.max.y - text3d.boundingBox.min.y;
            text3d.translate(-draw_width, -draw_height/2, 0);
            text3d.grz = grz;
            lbls.push(text3d);

            if ((lastmajorz !== null) && (draw_height>0))
               text_scale = Math.min(text_scale, 0.9*(grz - lastmajorz)/draw_height);

            lastmajorz = grz;
         }

         // create grid
         if (zgridx && is_major)
            zgridx.push(grminx, 0, grz, grmaxx, 0, grz);

         if (zgridy && is_major)
            zgridy.push(0, grminy, grz, 0, grmaxy, grz);

         ticks.push(0, 0, grz, (is_major ? ticklen : ticklen * 0.6), 0, grz);
      }

      if (zgridx && (zgridx.length > 0)) {

         // var material = new THREE.LineBasicMaterial({ color: 0x0, linewidth: 0.5 });
         var material = new THREE.LineDashedMaterial( { color: 0x0, dashSize: 2, gapSize: 2 } );

         var lines1 = JSROOT.Painter.createLineSegments(zgridx, material);

         lines1.position.set(0,grmaxy,0);
         lines1.grid = 2; // mark as grid
         lines1.visible = false;
         top.add(lines1);

         var lines2 = new THREE.LineSegments(lines1.geometry, material);
         lines2.position.set(0,grminy,0);
         lines2.grid = 4; // mark as grid
         lines2.visible = false;
         top.add(lines2);
      }

      if (zgridy && (zgridy.length > 0)) {

         // var material = new THREE.LineBasicMaterial({ color: 0x0, linewidth: 0.5 });
         var material = new THREE.LineDashedMaterial( { color: 0x0, dashSize: 2, gapSize: 2  } );

         var lines1 = JSROOT.Painter.createLineSegments( zgridy, material );

         lines1.position.set(grmaxx,0, 0);
         lines1.grid = 3; // mark as grid
         lines1.visible = false;
         top.add(lines1);

         var lines2 = new THREE.LineSegments(lines1.geometry, material);
         lines2.position.set(grminx, 0, 0);
         lines2.grid = 1; // mark as grid
         lines2.visible = false;
         top.add(lines2);
      }


/*      var ggg = new THREE.Geometry();

      lbls.forEach(function(lbl) {
         var m = new THREE.Matrix4();
         // matrix to swap y and z scales and shift along z to its position
         m.set(-text_scale,          0,  0, 2*ticklen,
                        0,          0,  1, 0,
                        0, text_scale,  0, lbl.grz);

         ggg.merge(lbl, m);
      });

      ggg = new THREE.BufferGeometry().fromGeometry(ggg);
*/


      var zcont = [], zticksline = JSROOT.Painter.createLineSegments( ticks, lineMaterial );
      for (var n=0;n<4;++n) {
         zcont.push(new THREE.Object3D());
         //zcont[n].add(new THREE.Mesh(ggg, textMaterial));

         lbls.forEach(function(lbl) {
            var m = new THREE.Matrix4();
            // matrix to swap y and z scales and shift along z to its position
            m.set(-text_scale,          0,  0, 2*ticklen,
                            0,          0,  1, 0,
                            0, text_scale,  0, lbl.grz);
            var mesh = new THREE.Mesh(lbl, textMaterial);
            mesh.applyMatrix(m);
            zcont[n].add(mesh);
         });

         zcont[n].add(n==0 ? zticksline : new THREE.LineSegments(zticksline.geometry, lineMaterial));
         if (opts.zoom) zcont[n].add(CreateZoomMesh("z", this.size_z3d, opts.use_y_for_z));

         zcont[n].zid = n + 2;
         top.add(zcont[n]);
      }

      zcont[0].position.set(grminx,grmaxy,0);
      zcont[0].rotation.z = 3/4*Math.PI;

      zcont[1].position.set(grmaxx,grmaxy,0);
      zcont[1].rotation.z = 1/4*Math.PI;

      zcont[2].position.set(grmaxx,grminy,0);
      zcont[2].rotation.z = -1/4*Math.PI;

      zcont[3].position.set(grminx,grminy,0);
      zcont[3].rotation.z = -3/4*Math.PI;


      // for TAxis3D do not show final cube
      if (this.size_z3d === 0) return;

      var linex_geom = JSROOT.Painter.createLineSegments( [grminx, 0, 0, grmaxx, 0, 0], lineMaterial, null, true);
      for(var n=0;n<2;++n) {
         var line = new THREE.LineSegments(linex_geom, lineMaterial);
         line.position.set(0, grminy, (n===0) ? grminz : grmaxz);
         line.xyboxid = 2; line.bottom = (n == 0);
         top.add(line);

         line = new THREE.LineSegments(linex_geom, lineMaterial);
         line.position.set(0, grmaxy, (n===0) ? grminz : grmaxz);
         line.xyboxid = 4; line.bottom = (n == 0);
         top.add(line);
      }

      var liney_geom = JSROOT.Painter.createLineSegments( [0, grminy,0, 0, grmaxy, 0], lineMaterial, null, true );
      for(var n=0;n<2;++n) {
         var line = new THREE.LineSegments(liney_geom, lineMaterial);
         line.position.set(grminx, 0, (n===0) ? grminz : grmaxz);
         line.xyboxid = 3; line.bottom = (n == 0);
         top.add(line);

         line = new THREE.LineSegments(liney_geom, lineMaterial);
         line.position.set(grmaxx, 0, (n===0) ? grminz : grmaxz);
         line.xyboxid = 1; line.bottom = (n == 0);
         top.add(line);
      }

      var linez_geom = JSROOT.Painter.createLineSegments( [0, 0, grminz, 0, 0, grmaxz], lineMaterial, null, true );
      for(var n=0;n<4;++n) {
         var line = new THREE.LineSegments(linez_geom, lineMaterial);
         line.zboxid = zcont[n].zid;
         line.position.copy(zcont[n].position);
         top.add(line);
      }
   }


   // ===================================================================================

   JSROOT.Painter.drawAxis3D = function(divid, axis, opt) {

      var painter = new JSROOT.TObjectPainter(axis);

      if (!('_main' in axis))
         painter.SetDivId(divid);

      painter.Draw3DAxis = function() {
         var main = this.main_painter();

         if (!main && ('_main' in this.GetObject()))
            main = this.GetObject()._main; // simple workaround to get geo painter

         if (!main || !main._toplevel)
            return console.warn('no geo object found for 3D axis drawing');

         var box = new THREE.Box3().setFromObject(main._toplevel);

         this.xmin = box.min.x; this.xmax = box.max.x;
         this.ymin = box.min.y; this.ymax = box.max.y;
         this.zmin = box.min.z; this.zmax = box.max.z;

         // use min/max values directly as graphical coordinates
         this.size_xy3d = this.size_z3d =  0;

         this.DrawXYZ = JSROOT.THistPainter.prototype.DrawXYZ; // just reuse axis drawing

         this.DrawXYZ(main._toplevel);

         main.adjustCameraPosition();

         main.TestAxisVisibility = JSROOT.Painter.HPainter_TestAxisVisibility;

         main.Render3D();
      }

      painter.Draw3DAxis();

      return painter.DrawingReady();
   }

   // ==========================================================================================

   JSROOT.TH1Painter.prototype.Draw3D = function(call_back, resize) {
      // function called with this as painter

      var main = this.main_painter();

      if (resize)  {

         if ((main === this) && (this.Resize3D !== undefined) && this.Resize3D()) this.Render3D();

      } else {

         this.Draw3DBins = JSROOT.Painter.HistPainter_DrawLego;

         this.DeleteAtt();

         if (main === this) {
            this.Create3DScene();
            this.DrawXYZ(this.toplevel, { use_y_for_z: true, zmult: 1.1, zoom: JSROOT.gStyle.Zooming });
         }

         this.ScanContent(true);

         this.Draw3DBins();

         main.Render3D();

         main.UpdateStatWebCanvas();

         this.AddKeysHandler();
      }

      if (main === this) {
         // (re)draw palette by resize while canvas may change dimension
         this.DrawColorPalette((this.options.Zscale > 0) && ((this.options.Lego===12) || (this.options.Lego===14)));

         this.DrawTitle();
      }

      JSROOT.CallBack(call_back);
   }

   // ==========================================================================================

   JSROOT.TH2Painter.prototype.Draw3D = function(call_back, resize) {

      this.mode3d = true;

      var main = this.main_painter();

      if (resize) {

         if ((main === this) && (this.Resize3D !== undefined) && this.Resize3D()) this.Render3D();

      } else {

         this.Draw3DBins = JSROOT.Painter.HistPainter_DrawLego;

         var pad = this.root_pad();
         // if (pad && pad.fGridz === undefined) pad.fGridz = false;

         this.zmin = pad.fLogz ? this.gminposbin * 0.3 : this.gminbin;
         this.zmax = this.gmaxbin;

         var zmult = 1.1;

         if (this.options.minimum !== -1111) this.zmin = this.options.minimum;
         if (this.options.maximum !== -1111) { this.zmax = this.options.maximum; zmult = 1; }

         if (pad.fLogz && (this.zmin<=0)) this.zmin = this.zmax * 1e-5;

         this.DeleteAtt();

         if (main === this) {
            this.Create3DScene();
            this.DrawXYZ(this.toplevel, { zmult: zmult, zoom: JSROOT.gStyle.Zooming });
         }

         this.Draw3DBins();

         main.Render3D();

         this.UpdateStatWebCanvas();

         this.AddKeysHandler();
      }

      if (main === this) {

         //  (re)draw palette by resize while canvas may change dimension
         this.DrawColorPalette((this.options.Zscale > 0) && ((this.options.Lego===12) || (this.options.Lego===14) ||
                                (this.options.Surf===11) || (this.options.Surf===12)));

         this.DrawTitle();
      }

      JSROOT.CallBack(call_back);
   }

   // ==============================================================================

   JSROOT.TH3Painter = function(histo) {
      JSROOT.THistPainter.call(this, histo);

      this.mode3d = true;
   }

   JSROOT.TH3Painter.prototype = Object.create(JSROOT.THistPainter.prototype);

   JSROOT.TH3Painter.prototype.ScanContent = function(when_axis_changed) {

      // no need to rescan histogram while result does not depend from axis selection
      if (when_axis_changed && this.nbinsx && this.nbinsy && this.nbinsz) return;

      var histo = this.GetObject();

      this.nbinsx = histo.fXaxis.fNbins;
      this.nbinsy = histo.fYaxis.fNbins;
      this.nbinsz = histo.fZaxis.fNbins;

      this.xmin = histo.fXaxis.fXmin;
      this.xmax = histo.fXaxis.fXmax;

      this.ymin = histo.fYaxis.fXmin;
      this.ymax = histo.fYaxis.fXmax;

      this.zmin = histo.fZaxis.fXmin;
      this.zmax = histo.fZaxis.fXmax;

      // global min/max, used at the moment in 3D drawing

      this.gminbin = this.gmaxbin = histo.getBinContent(1,1,1);

      for (var i = 0; i < this.nbinsx; ++i)
         for (var j = 0; j < this.nbinsy; ++j)
            for (var k = 0; k < this.nbinsz; ++k) {
               var bin_content = histo.getBinContent(i+1, j+1, k+1);
               if (bin_content < this.gminbin) this.gminbin = bin_content; else
               if (bin_content > this.gmaxbin) this.gmaxbin = bin_content;
            }

      this.draw_content = this.gmaxbin > 0;

      this.CreateAxisFuncs(true, true);
   }

   JSROOT.TH3Painter.prototype.CountStat = function() {
      var histo = this.GetObject(),
          stat_sum0 = 0, stat_sumx1 = 0, stat_sumy1 = 0,
          stat_sumz1 = 0, stat_sumx2 = 0, stat_sumy2 = 0, stat_sumz2 = 0,
          i1 = this.GetSelectIndex("x", "left"),
          i2 = this.GetSelectIndex("x", "right"),
          j1 = this.GetSelectIndex("y", "left"),
          j2 = this.GetSelectIndex("y", "right"),
          k1 = this.GetSelectIndex("z", "left"),
          k2 = this.GetSelectIndex("z", "right"),
          res = { entries: 0, integral: 0, meanx: 0, meany: 0, meanz: 0, rmsx: 0, rmsy: 0, rmsz: 0 },
          xi, yi, zi, xx, xside, yy, yside, zz, zside, cont;

      for (xi = 0; xi < this.nbinsx+2; ++xi) {

         xx = this.GetBinX(xi - 0.5);
         xside = (xi < i1) ? 0 : (xi > i2 ? 2 : 1);

         for (yi = 0; yi < this.nbinsy+2; ++yi) {

            yy = this.GetBinY(yi - 0.5);
            yside = (yi < j1) ? 0 : (yi > j2 ? 2 : 1);

            for (zi = 0; zi < this.nbinsz+2; ++zi) {

               zz = this.GetBinZ(zi - 0.5);
               zside = (zi < k1) ? 0 : (zi > k2 ? 2 : 1);

               cont = histo.getBinContent(xi, yi, zi);
               res.entries += cont;

               if ((xside==1) && (yside==1) && (zside==1)) {
                  stat_sum0 += cont;
                  stat_sumx1 += xx * cont;
                  stat_sumy1 += yy * cont;
                  stat_sumz1 += zz * cont;
                  stat_sumx2 += xx * xx * cont;
                  stat_sumy2 += yy * yy * cont;
                  stat_sumz2 += zz * zz * cont;
               }
            }
         }
      }

      if ((histo.fTsumw > 0) && !this.IsAxisZoomed("x") && !this.IsAxisZoomed("y") && !this.IsAxisZoomed("z")) {
         stat_sum0  = histo.fTsumw;
         stat_sumx1 = histo.fTsumwx;
         stat_sumx2 = histo.fTsumwx2;
         stat_sumy1 = histo.fTsumwy;
         stat_sumy2 = histo.fTsumwy2;
         stat_sumz1 = histo.fTsumwz;
         stat_sumz2 = histo.fTsumwz2;
      }

      if (stat_sum0 > 0) {
         res.meanx = stat_sumx1 / stat_sum0;
         res.meany = stat_sumy1 / stat_sum0;
         res.meanz = stat_sumz1 / stat_sum0;
         res.rmsx = Math.sqrt(Math.abs(stat_sumx2 / stat_sum0 - res.meanx * res.meanx));
         res.rmsy = Math.sqrt(Math.abs(stat_sumy2 / stat_sum0 - res.meany * res.meany));
         res.rmsz = Math.sqrt(Math.abs(stat_sumz2 / stat_sum0 - res.meanz * res.meanz));
      }

      res.integral = stat_sum0;

      if (histo.fEntries > 1) res.entries = histo.fEntries;

      return res;
   }

   JSROOT.TH3Painter.prototype.FillStatistic = function(stat, dostat, dofit) {
      if (this.GetObject()===null) return false;

      var pave = stat.GetObject(),
          data = this.CountStat(),
          print_name = dostat % 10,
          print_entries = Math.floor(dostat / 10) % 10,
          print_mean = Math.floor(dostat / 100) % 10,
          print_rms = Math.floor(dostat / 1000) % 10,
          print_under = Math.floor(dostat / 10000) % 10,
          print_over = Math.floor(dostat / 100000) % 10,
          print_integral = Math.floor(dostat / 1000000) % 10;
      //var print_skew = Math.floor(dostat / 10000000) % 10;
      //var print_kurt = Math.floor(dostat / 100000000) % 10;

      if (print_name > 0)
         pave.AddText(this.GetObject().fName);

      if (print_entries > 0)
         pave.AddText("Entries = " + stat.Format(data.entries,"entries"));

      if (print_mean > 0) {
         pave.AddText("Mean x = " + stat.Format(data.meanx));
         pave.AddText("Mean y = " + stat.Format(data.meany));
         pave.AddText("Mean z = " + stat.Format(data.meanz));
      }

      if (print_rms > 0) {
         pave.AddText("Std Dev x = " + stat.Format(data.rmsx));
         pave.AddText("Std Dev y = " + stat.Format(data.rmsy));
         pave.AddText("Std Dev z = " + stat.Format(data.rmsz));
      }

      if (print_integral > 0) {
         pave.AddText("Integral = " + stat.Format(data.integral,"entries"));
      }

      // adjust the size of the stats box with the number of lines

      var nlines = pave.fLines.arr.length,
          stath = nlines * JSROOT.gStyle.StatFontSize;
      if (stath <= 0 || 3 == (JSROOT.gStyle.StatFont % 10)) {
         stath = 0.25 * nlines * JSROOT.gStyle.StatH;
         pave.fY1NDC = 0.93 - stath;
         pave.fY2NDC = 0.93;
      }

      return true;
   }

   JSROOT.TH3Painter.prototype.GetBinTips = function (ix, iy, iz) {
      var lines = [], pmain = this.main_painter();

      lines.push(this.GetTipName());

      if (pmain.x_kind == 'labels')
         lines.push("x = " + pmain.AxisAsText("x", this.GetBinX(ix)) + "  xbin=" + (ix+1));
      else
         lines.push("x = [" + pmain.AxisAsText("x", this.GetBinX(ix)) + ", " + pmain.AxisAsText("x", this.GetBinX(ix+1)) + ")   xbin=" + (ix+1));

      if (pmain.y_kind == 'labels')
         lines.push("y = " + pmain.AxisAsText("y", this.GetBinY(iy))  + "  ybin=" + (iy+1));
      else
         lines.push("y = [" + pmain.AxisAsText("y", this.GetBinY(iy)) + ", " + pmain.AxisAsText("y", this.GetBinY(iy+1)) + ")  ybin=" + (iy+1));

      if (pmain.z_kind == 'labels')
         lines.push("z = " + pmain.AxisAsText("z", this.GetBinZ(iz))  + "  zbin=" + (iz+1));
      else
         lines.push("z = [" + pmain.AxisAsText("z", this.GetBinZ(iz)) + ", " + pmain.AxisAsText("z", this.GetBinZ(iz+1)) + ")  zbin=" + (iz+1));

      var binz = this.GetObject().getBinContent(ix+1, iy+1, iz+1);
      if (binz === Math.round(binz))
         lines.push("entries = " + binz);
      else
         lines.push("entries = " + JSROOT.FFormat(binz, JSROOT.gStyle.fStatFormat));

      return lines;
   }

   JSROOT.TH3Painter.prototype.Draw3DScatter = function() {
      // try to draw 3D histogram as scatter plot
      // if too many points, box will be displayed

      var histo = this.GetObject(),
          main = this.main_painter(),
          i1 = this.GetSelectIndex("x", "left", 0.5),
          i2 = this.GetSelectIndex("x", "right", 0),
          j1 = this.GetSelectIndex("y", "left", 0.5),
          j2 = this.GetSelectIndex("y", "right", 0),
          k1 = this.GetSelectIndex("z", "left", 0.5),
          k2 = this.GetSelectIndex("z", "right", 0),
          name = this.GetTipName("<br/>"),
          i, j, k, bin_content;

      if ((i2<=i1) || (j2<=j1) || (k2<=k1)) return true;

      // scale down factor if too large values
      var coef = (this.gmaxbin > 1000) ? 1000/this.gmaxbin : 1,
          numpixels = 0, content_lmt = Math.max(0, this.gminbin);

      for (i = i1; i < i2; ++i) {
         for (j = j1; j < j2; ++j) {
            for (k = k1; k < k2; ++k) {
               bin_content = histo.getBinContent(i+1, j+1, k+1);
               if (bin_content <= content_lmt) continue;
               numpixels += Math.round(bin_content*coef);
            }
         }
      }

      // too many pixels - use box drawing
      if (numpixels > (main.webgl ? 100000 : 30000)) return false;

      var pnts = new JSROOT.Painter.PointsCreator(numpixels, main.webgl, main.size_xy3d/200),
          bins = new Int32Array(numpixels), nbin = 0;

      for (i = i1; i < i2; ++i) {
         for (j = j1; j < j2; ++j) {
            for (k = k1; k < k2; ++k) {
               bin_content = histo.getBinContent(i+1, j+1, k+1);
               if (bin_content <= content_lmt) continue;
               var num = Math.round(bin_content*coef);

               for (var n=0;n<num;++n) {
                  var binx = this.GetBinX(i+Math.random()),
                      biny = this.GetBinY(j+Math.random()),
                      binz = this.GetBinZ(k+Math.random());

                  // remember bin index for tooltip
                  bins[nbin++] = histo.getBin(i+1, j+1, k+1);

                  pnts.AddPoint(main.grx(binx), main.gry(biny), main.grz(binz));

               }
            }
         }
      }

      var mesh = pnts.CreatePoints(JSROOT.Painter.root_colors[histo.fMarkerColor]);
      main.toplevel.add(mesh);

      mesh.bins = bins;
      mesh.painter = this;
      mesh.tip_color = (histo.fMarkerColor===3) ? 0xFF0000 : 0x00FF00;

      mesh.tooltip = function(intersect) {
         var indx = Math.floor(intersect.index / this.nvertex);
         if ((indx<0) || (indx >= this.bins.length)) return null;

         var p = this.painter,
             tip = p.Get3DToolTip(this.bins[indx]);

         tip.x1 = p.grx(p.GetBinX(tip.ix-1));
         tip.x2 = p.grx(p.GetBinX(tip.ix));
         tip.y1 = p.gry(p.GetBinY(tip.iy-1));
         tip.y2 = p.gry(p.GetBinY(tip.iy));
         tip.z1 = p.grz(p.GetBinZ(tip.iz-1));
         tip.z2 = p.grz(p.GetBinZ(tip.iz));
         tip.color = this.tip_color;
         tip.opacity = 0.3;

         return tip;
      }


      return true;
   }

   JSROOT.TH3Painter.prototype.Draw3DBins = function() {

      if (!this.draw_content) return;

      if (!this.options.Box && !this.options.GLBox && !this.options.GLColor && !this.options.Lego)
         if (this.Draw3DScatter()) return;

      var rootcolor = this.GetObject().fFillColor,
          fillcolor = JSROOT.Painter.root_colors[rootcolor],
          buffer_size = 0, use_lambert = false,
          use_helper = false, use_colors = false, use_opacity = 1, use_scale = true,
          single_bin_verts, single_bin_norms,
          box_option = this.options.Box,
          tipscale = 0.5;

      if (!box_option && this.options.Lego) box_option = (this.options.Lego===1) ? 10 : this.options.Lego;

      if ((this.options.GLBox === 11) || (this.options.GLBox === 12)) {

         tipscale = 0.4;
         use_lambert = true;
         if (this.options.GLBox === 12) use_colors = true;

         var geom = JSROOT.Painter.TestWebGL() ? new THREE.SphereGeometry(0.5, 16, 12) : new THREE.SphereGeometry(0.5, 8, 6);
         geom.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );

         buffer_size = geom.faces.length*9;
         single_bin_verts = new Float32Array(buffer_size);
         single_bin_norms = new Float32Array(buffer_size);

         // Fill a typed array with cube geometry that will be shared by all
         // (This technically could be put into an InstancedBufferGeometry but
         // performance gain is likely not huge )
         for (var face = 0; face < geom.faces.length; ++face) {
            single_bin_verts[9*face  ] = geom.vertices[geom.faces[face].a].x;
            single_bin_verts[9*face+1] = geom.vertices[geom.faces[face].a].y;
            single_bin_verts[9*face+2] = geom.vertices[geom.faces[face].a].z;
            single_bin_verts[9*face+3] = geom.vertices[geom.faces[face].b].x;
            single_bin_verts[9*face+4] = geom.vertices[geom.faces[face].b].y;
            single_bin_verts[9*face+5] = geom.vertices[geom.faces[face].b].z;
            single_bin_verts[9*face+6] = geom.vertices[geom.faces[face].c].x;
            single_bin_verts[9*face+7] = geom.vertices[geom.faces[face].c].y;
            single_bin_verts[9*face+8] = geom.vertices[geom.faces[face].c].z;

            single_bin_norms[9*face  ] = geom.faces[face].vertexNormals[0].x;
            single_bin_norms[9*face+1] = geom.faces[face].vertexNormals[0].y;
            single_bin_norms[9*face+2] = geom.faces[face].vertexNormals[0].z;
            single_bin_norms[9*face+3] = geom.faces[face].vertexNormals[1].x;
            single_bin_norms[9*face+4] = geom.faces[face].vertexNormals[1].y;
            single_bin_norms[9*face+5] = geom.faces[face].vertexNormals[1].z;
            single_bin_norms[9*face+6] = geom.faces[face].vertexNormals[2].x;
            single_bin_norms[9*face+7] = geom.faces[face].vertexNormals[2].y;
            single_bin_norms[9*face+8] = geom.faces[face].vertexNormals[2].z;
         }

      } else {

         var indicies = JSROOT.Painter.Box_Indexes,
             normals = JSROOT.Painter.Box_Normals,
             vertices = JSROOT.Painter.Box_Vertices;

         buffer_size = indicies.length*3;
         single_bin_verts = new Float32Array(buffer_size);
         single_bin_norms = new Float32Array(buffer_size);

         for (var k=0,nn=-3;k<indicies.length;++k) {
            var vert = vertices[indicies[k]];
            single_bin_verts[k*3]   = vert.x-0.5;
            single_bin_verts[k*3+1] = vert.y-0.5;
            single_bin_verts[k*3+2] = vert.z-0.5;

            if (k%6===0) nn+=3;
            single_bin_norms[k*3]   = normals[nn];
            single_bin_norms[k*3+1] = normals[nn+1];
            single_bin_norms[k*3+2] = normals[nn+2];
         }
         use_helper = true;

         if (box_option===12) { use_colors = true; } else
         if (box_option===13) { use_colors = true; use_helper = false; }  else
         if (this.options.GLColor) { use_colors = true; use_opacity = 0.5; use_scale = false; use_helper = false; use_lambert = true; }
      }

      if (use_scale)
         use_scale = (this.gminbin || this.gmaxbin) ? 1 / Math.max(Math.abs(this.gminbin), Math.abs(this.gmaxbin)) : 1;

      var histo = this.GetObject(),
          i1 = this.GetSelectIndex("x", "left", 0.5),
          i2 = this.GetSelectIndex("x", "right", 0),
          j1 = this.GetSelectIndex("y", "left", 0.5),
          j2 = this.GetSelectIndex("y", "right", 0),
          k1 = this.GetSelectIndex("z", "left", 0.5),
          k2 = this.GetSelectIndex("z", "right", 0),
          name = this.GetTipName("<br/>");

      if ((i2<=i1) || (j2<=j1) || (k2<=k1)) return;

      var scalex = (this.grx(this.GetBinX(i2)) - this.grx(this.GetBinX(i1))) / (i2-i1),
          scaley = (this.gry(this.GetBinY(j2)) - this.gry(this.GetBinY(j1))) / (j2-j1),
          scalez = (this.grz(this.GetBinZ(k2)) - this.grz(this.GetBinZ(k1))) / (k2-k1);

      var nbins = 0, i, j, k, wei, bin_content, cols_size = [], num_colors = 0, cols_sequence = [];

      for (i = i1; i < i2; ++i) {
         for (j = j1; j < j2; ++j) {
            for (k = k1; k < k2; ++k) {
               bin_content = histo.getBinContent(i+1, j+1, k+1);
               if ((bin_content===0) || (bin_content < this.gminbin)) continue;
               wei = use_scale ? Math.pow(Math.abs(bin_content*use_scale), 0.3333) : 1;
               if (wei < 1e-3) continue; // do not draw empty or very small bins

               nbins++;

               if (!use_colors) continue;

               var colindx = this.getValueColor(bin_content, true);
               if (colindx != null) {
                  if (cols_size[colindx] === undefined) {
                     cols_size[colindx] = 0;
                     cols_sequence[colindx] = num_colors++;
                  }
                  cols_size[colindx]+=1;
               } else {
                  console.error('not found color for', bin_content);
               }
            }
         }
      }

      if (!use_colors) {
         cols_size.push(nbins);
         num_colors = 1;
         cols_sequence = [0];
      }

      var cols_nbins = new Array(num_colors),
          bin_verts = new Array(num_colors),
          bin_norms = new Array(num_colors),
          bin_tooltips = new Array(num_colors),
          helper_kind = new Array(num_colors),
          helper_indexes = new Array(num_colors),  // helper_kind == 1, use original vertices
          helper_positions = new Array(num_colors);  // helper_kind == 2, all vertices copied into separate buffer

      for(var ncol=0;ncol<cols_size.length;++ncol) {
         if (!cols_size[ncol]) continue; // ignore dummy colors

         nbins = cols_size[ncol]; // how many bins with specified color
         var nseq = cols_sequence[ncol];

         cols_nbins[nseq] = 0; // counter for the filled bins

         helper_kind[nseq] = 0;

         // 1 - use same vertices to create helper, one can use maximal 64K vertices
         // 2 - all vertices copied into separate buffer
         if (use_helper)
            helper_kind[nseq] = (nbins * buffer_size / 3 > 0xFFF0) ? 2 : 1;

         bin_verts[nseq] = new Float32Array(nbins * buffer_size);
         bin_norms[nseq] = new Float32Array(nbins * buffer_size);
         bin_tooltips[nseq] = new Int32Array(nbins);

         if (helper_kind[nseq]===1)
            helper_indexes[nseq] = new Uint16Array(nbins * JSROOT.Painter.Box_MeshSegments.length);

         if (helper_kind[nseq]===2)
            helper_positions[nseq] = new Float32Array(nbins * JSROOT.Painter.Box_Segments.length * 3);
      }

      var binx, grx, biny, gry, binz, grz;

      for (i = i1; i < i2; ++i) {
         binx = this.GetBinX(i+0.5); grx = this.grx(binx);
         for (j = j1; j < j2; ++j) {
            biny = this.GetBinY(j+0.5); gry = this.gry(biny);
            for (k = k1; k < k2; ++k) {
               bin_content = histo.getBinContent(i+1, j+1, k+1);
               if ((bin_content===0) || (bin_content < this.gminbin)) continue;

               wei = use_scale ? Math.pow(Math.abs(bin_content*use_scale), 0.3333) : 1;
               if (wei < 1e-3) continue; // do not show very small bins

               var nseq = 0;
               if (use_colors) {
                  var colindx = this.getValueColor(bin_content, true);
                  if (colindx === null) continue;
                  nseq = cols_sequence[colindx];
               }

               nbins = cols_nbins[nseq];

               binz = this.GetBinZ(k+0.5); grz = this.grz(binz);

               // remember bin index for tooltip
               bin_tooltips[nseq][nbins] = histo.getBin(i+1, j+1, k+1);

               var vvv = nbins * buffer_size, bin_v = bin_verts[nseq], bin_n = bin_norms[nseq];

               // Grab the coordinates and scale that are being assigned to each bin
               for (var vi = 0; vi < buffer_size; vi+=3, vvv+=3) {
                  bin_v[vvv]   = grx + single_bin_verts[vi]*scalex*wei;
                  bin_v[vvv+1] = gry + single_bin_verts[vi+1]*scaley*wei;
                  bin_v[vvv+2] = grz + single_bin_verts[vi+2]*scalez*wei;

                  bin_n[vvv]   = single_bin_norms[vi];
                  bin_n[vvv+1] = single_bin_norms[vi+1];
                  bin_n[vvv+2] = single_bin_norms[vi+2];
               }

               if (helper_kind[nseq]===1) {
                  // reuse vertices created for the mesh
                  var helper_segments = JSROOT.Painter.Box_MeshSegments;
                  vvv = nbins * helper_segments.length;
                  var shift = Math.round(nbins * buffer_size/3),
                      helper_i = helper_indexes[nseq];
                  for (var n=0;n<helper_segments.length;++n)
                     helper_i[vvv+n] = shift + helper_segments[n];
               }

               if (helper_kind[nseq]===2) {
                  var helper_segments = JSROOT.Painter.Box_Segments,
                      helper_p = helper_positions[nseq];
                  vvv = nbins * helper_segments.length * 3;
                  for (var n=0;n<helper_segments.length;++n, vvv+=3) {
                     var vert = JSROOT.Painter.Box_Vertices[helper_segments[n]];
                     helper_p[vvv]   = grx + (vert.x-0.5)*scalex*wei;
                     helper_p[vvv+1] = gry + (vert.y-0.5)*scaley*wei;
                     helper_p[vvv+2] = grz + (vert.z-0.5)*scalez*wei;
                  }
               }

               cols_nbins[nseq] = nbins+1;
            }
         }
      }

      for(var ncol=0;ncol<cols_size.length;++ncol) {
         if (!cols_size[ncol]) continue; // ignore dummy colors

         nbins = cols_size[ncol]; // how many bins with specified color
         var nseq = cols_sequence[ncol];

         // BufferGeometries that store geometry of all bins
         var all_bins_buffgeom = new THREE.BufferGeometry();

         // Create mesh from bin buffergeometry
         all_bins_buffgeom.addAttribute('position', new THREE.BufferAttribute( bin_verts[nseq], 3 ) );
         all_bins_buffgeom.addAttribute('normal', new THREE.BufferAttribute( bin_norms[nseq], 3 ) );

         if (use_colors) fillcolor = this.fPalette[ncol];

         var material = use_lambert ? new THREE.MeshLambertMaterial({ color: fillcolor, opacity: use_opacity, transparent: (use_opacity<1) })
                                    : new THREE.MeshBasicMaterial({ color: fillcolor, opacity: use_opacity });

         var combined_bins = new THREE.Mesh(all_bins_buffgeom, material);

         combined_bins.bins = bin_tooltips[nseq];
         combined_bins.bins_faces = buffer_size/3;
         combined_bins.painter = this;

         combined_bins.scalex = tipscale*scalex;
         combined_bins.scaley = tipscale*scaley;
         combined_bins.scalez = tipscale*scalez;
         combined_bins.tip_color = (rootcolor===3) ? 0xFF0000 : 0x00FF00;
         combined_bins.use_scale = use_scale;

         combined_bins.tooltip = function(intersect) {
            var indx = Math.floor(intersect.index / this.bins_faces);
            if ((indx<0) || (indx >= this.bins.length)) return null;

            var p = this.painter,
                tip = p.Get3DToolTip(this.bins[indx]),
                grx = p.grx(p.GetBinX(tip.ix-0.5)),
                gry = p.gry(p.GetBinY(tip.iy-0.5)),
                grz = p.grz(p.GetBinZ(tip.iz-0.5)),
                wei = this.use_scale ? Math.pow(Math.abs(tip.value*this.use_scale), 0.3333) : 1;

            tip.x1 = grx - this.scalex*wei; tip.x2 = grx + this.scalex*wei;
            tip.y1 = gry - this.scaley*wei; tip.y2 = gry + this.scaley*wei;
            tip.z1 = grz - this.scalez*wei; tip.z2 = grz + this.scalez*wei;

            tip.color = this.tip_color;

            return tip;
         }

         this.toplevel.add(combined_bins);

         if (helper_kind[nseq] > 0) {
            var lcolor = JSROOT.Painter.root_colors[this.GetObject().fLineColor],
                helper_material = new THREE.LineBasicMaterial( { color: lcolor } ),
                lines = null;

            if (helper_kind[nseq] === 1) {
               // reuse positions from the mesh - only special index was created
               lines = JSROOT.Painter.createLineSegments( bin_verts[nseq], helper_material, helper_indexes[nseq] );
            } else {
               lines = JSROOT.Painter.createLineSegments( helper_positions[nseq], helper_material );
            }

            this.toplevel.add(lines);
         }
      }
   }

   JSROOT.TH3Painter.prototype.Redraw = function(resize) {
      if (resize) {

         if (this.Resize3D()) this.Render3D();

      } else {

         this.Create3DScene();
         this.DrawXYZ(this.toplevel, { zoom: JSROOT.gStyle.Zooming });
         this.Draw3DBins();
         this.Render3D();
         this.UpdateStatWebCanvas();
         this.AddKeysHandler();

      }
      this.DrawTitle();
   }

   JSROOT.TH3Painter.prototype.FillToolbar = function() {
      var pp = this.pad_painter(true);
      if (pp===null) return;

      pp.AddButton(JSROOT.ToolbarIcons.auto_zoom, 'Unzoom all axes', 'ToggleZoom', "Ctrl *");
      if (this.draw_content)
         pp.AddButton(JSROOT.ToolbarIcons.statbox, 'Toggle stat box', "ToggleStatBox");
   }

   JSROOT.TH3Painter.prototype.CanZoomIn = function(axis,min,max) {
      // check if it makes sense to zoom inside specified axis range

      if ((axis=="x") && (this.GetIndexX(max,0.5) - this.GetIndexX(min,0) > 1)) return true;

      if ((axis=="y") && (this.GetIndexY(max,0.5) - this.GetIndexY(min,0) > 1)) return true;

      if ((axis=="z") && (this.GetIndexZ(max,0.5) - this.GetIndexZ(min,0) > 1)) return true;

      return false;
   }

   JSROOT.TH3Painter.prototype.AutoZoom = function() {
      var i1 = this.GetSelectIndex("x", "left"),
          i2 = this.GetSelectIndex("x", "right"),
          j1 = this.GetSelectIndex("y", "left"),
          j2 = this.GetSelectIndex("y", "right"),
          k1 = this.GetSelectIndex("z", "left"),
          k2 = this.GetSelectIndex("z", "right"),
          i,j,k, histo = this.GetObject();

      if ((i1 === i2) || (j1 === j2) || (k1 === k2)) return;

      // first find minimum
      var min = histo.getBinContent(i1 + 1, j1 + 1, k1+1);
      for (i = i1; i < i2; ++i)
         for (j = j1; j < j2; ++j)
            for (k = k1; k < k2; ++k)
               min = Math.min(min, histo.getBinContent(i+1, j+1, k+1));

      if (min>0) return; // if all points positive, no chance for autoscale

      var ileft = i2, iright = i1, jleft = j2, jright = j1, kleft = k2, kright = k1;

      for (i = i1; i < i2; ++i)
         for (j = j1; j < j2; ++j)
            for (k = k1; k < k2; ++k)
               if (histo.getBinContent(i+1, j+1, k+1) > min) {
                  if (i < ileft) ileft = i;
                  if (i >= iright) iright = i + 1;
                  if (j < jleft) jleft = j;
                  if (j >= jright) jright = j + 1;
                  if (k < kleft) kleft = k;
                  if (k >= kright) kright = k + 1;
               }

      var xmin, xmax, ymin, ymax, zmin, zmax, isany = false;

      if ((ileft === iright-1) && (ileft > i1+1) && (iright < i2-1)) { ileft--; iright++; }
      if ((jleft === jright-1) && (jleft > j1+1) && (jright < j2-1)) { jleft--; jright++; }
      if ((kleft === kright-1) && (kleft > k1+1) && (kright < k2-1)) { kleft--; kright++; }

      if ((ileft > i1 || iright < i2) && (ileft < iright - 1)) {
         xmin = this.GetBinX(ileft);
         xmax = this.GetBinX(iright);
         isany = true;
      }

      if ((jleft > j1 || jright < j2) && (jleft < jright - 1)) {
         ymin = this.GetBinY(jleft);
         ymax = this.GetBinY(jright);
         isany = true;
      }

      if ((kleft > k1 || kright < k2) && (kleft < kright - 1)) {
         zmin = this.GetBinZ(kleft);
         zmax = this.GetBinZ(kright);
         isany = true;
      }

      if (isany) this.Zoom(xmin, xmax, ymin, ymax, zmin, zmax);
   }


   JSROOT.TH3Painter.prototype.FillHistContextMenu = function(menu) {

      var sett = JSROOT.getDrawSettings("ROOT." + this.GetObject()._typename, 'nosame');

      menu.addDrawMenu("Draw with", sett.opts, function(arg) {
         if (arg==='inspect')
            return JSROOT.draw(this.divid, this.GetObject(),arg);

         this.options = this.DecodeOptions(arg);
         this.Redraw();
      });
   }

   JSROOT.Painter.drawHistogram3D = function(divid, histo, opt) {
      // create painter and add it to canvas
      var painter = new JSROOT.TH3Painter(histo);

      painter.SetDivId(divid, 4);

      painter.options = painter.DecodeOptions(opt);

      painter.CheckPadRange();

      painter.ScanContent();

      painter.Redraw();

      if (JSROOT.gStyle.AutoStat && (painter.create_canvas || histo.$snapid)) {
         var stats = painter.CreateStat(histo.$custom_stat);
         if (stats) JSROOT.draw(painter.divid, stats, "");
      }

      painter.FillToolbar();

      return painter.DrawingReady();
   }

   return JSROOT;
}));
