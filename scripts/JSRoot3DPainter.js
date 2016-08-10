/// @file JSRoot3DPainter.js
/// JavaScript ROOT 3D graphics

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      // AMD. Register as an anonymous module.
      define( ['d3', 'JSRootPainter', 'threejs_all'], factory );
   } else {

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'JSRoot3DPainter.js');

      if (typeof d3 != 'object')
         throw new Error('This extension requires d3.v3.js', 'JSRoot3DPainter.js');

      if (typeof JSROOT.Painter != 'object')
         throw new Error('JSROOT.Painter is not defined', 'JSRoot3DPainter.js');

      if (typeof THREE == 'undefined')
         throw new Error('THREE is not defined', 'JSRoot3DPainter.js');

      factory(d3, JSROOT);
   }
} (function(d3, JSROOT) {

   JSROOT.Painter.TestWebGL = function() {
      // return true if WebGL should be used
      /**
       * @author alteredq / http://alteredqualia.com/
       * @author mr.doob / http://mrdoob.com/
       */

      if (JSROOT.gStyle.NoWebGL) return false;

      if ('_Detect_WebGL' in this) return this._Detect_WebGL;

      try {
         var canvas = document.createElement( 'canvas' );
         this._Detect_WebGL = !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );
         //res = !!window.WebGLRenderingContext &&  !!document.createElement('canvas').getContext('experimental-webgl');
       } catch (e) {
           return false;
       }

       return this._Detect_WebGL;
   }

   JSROOT.Painter.TooltipFor3D = function(prnt) {
      this.tt = null;
      this.cont = null;
      this.lastlbl = '';
      this.parent = prnt ? prnt : document.body;
      this.abspos = !prnt;

      this.pos = function(e) {
         if (this.tt === null) return;
         var u,l;
         if (this.abspos) {
            l = JSROOT.browser.isIE ? (e.clientX + document.documentElement.scrollLeft) : e.pageX;
            u = JSROOT.browser.isIE ? (e.clientY + document.documentElement.scrollTop) : e.pageY;
         } else {
            l = e.pageX - this.parent.offsetLeft;
            u = e.pageY - this.parent.offsetTop;

            //l = ('offsetX' in e) ? e.offsetX : e.layerX;
            //u = ('offsetY' in e) ? e.offsetY : e.layerY;

            if (l + this.tt.offsetWidth + 3 >= this.parent.offsetWidth)
               l = this.parent.offsetWidth - this.tt.offsetWidth - 3;

            if (u + this.tt.offsetHeight + 15 >= this.parent.offsetHeight)
               u = this.parent.offsetHeight - this.tt.offsetHeight - 15;
         }

         this.tt.style.top = (u + 15) + 'px';
         this.tt.style.left = (l + 3) + 'px';
      };

      this.show  = function(v) {
         if (JSROOT.gStyle.Tooltip <= 0) return;
         if (!v || v==="") return this.hide();

         if (this.tt === null) {
            this.tt = document.createElement('div');
            this.tt.setAttribute('class', 'jsroot');
            var t = document.createElement('div');
            t.setAttribute('class', 'tt3d_border');
            this.cont = document.createElement('div');
            this.cont.setAttribute('class', 'tt3d_cont');
            var b = document.createElement('div');
            b.setAttribute('class', 'tt3d_border');
            this.tt.appendChild(t);
            this.tt.appendChild(this.cont);
            this.tt.appendChild(b);
            this.tt.style.opacity = 1;
            this.tt.style.filter = 'alpha(opacity=1)';
            this.tt.style.position = 'absolute';
            this.tt.style.display = 'block';
            this.tt.style.overflow = 'hidden';
            this.parent.appendChild(this.tt);
         }

         if (this.lastlbl !== v) {
            this.cont.innerHTML = v;
            this.lastlbl = v;
            this.tt.style.width = 'auto'; // let it be automatically resizing...
            if (JSROOT.browser.isIE)
               this.tt.style.width = this.tt.offsetWidth;
         }
      };

      this.hide  = function() {
         if (this.tt !== null)
            this.parent.removeChild(this.tt);

         this.tt = null;
         this.lastlbl = "";
      }

      return this;
   }


   JSROOT.Painter.CreateOrbitControl = function(painter, camera, scene, renderer, lookat) {
      var control = new THREE.OrbitControls(camera, renderer.domElement);
      control.enableDamping = false;
      control.dampingFactor = 1.0;
      control.enableZoom = true;
      if (lookat) control.target.copy(lookat);
      control.update();

      var mouse_ctxt = { x:0, y: 0, on: false },
          raycaster = new THREE.Raycaster(),
          webgl = renderer instanceof THREE.WebGLRenderer,
          control_active = false,
          control_changed = false,
          block_ctxt = false, // require to block context menu command appearing after control ends, required in chrome which inject contextmenu when key released
          tooltip = new JSROOT.Painter.TooltipFor3D(painter.select_main().node()),
          camposition0 = camera.position.clone();

      control.ResetCamera = function() {
         camera.position.copy(camposition0);
         if (lookat) {
            control.target.copy(lookat);
            camera.lookAt(lookat);
         }
         control.update();
         painter.Render3D();
      }

      control.ProcessMouseDblclick = control.ResetCamera;

      function GetMousePos(evnt, mouse) {
         mouse.x = ('offsetX' in evnt) ? evnt.offsetX : evnt.layerX;
         mouse.y = ('offsetY' in evnt) ? evnt.offsetY : evnt.layerY;
         mouse.clientX = evnt.clientX;
         mouse.clientY = evnt.clientY;
      }

      function GetIntersects(mouse) {
         // domElement gives correct coordinate with canvas render, but isn't always right for webgl renderer
         var sz = webgl ? renderer.getSize() : renderer.domElement;
         var pnt = { x: mouse.x / sz.width * 2 - 1, y: -mouse.y / sz.height * 2 + 1 };

         raycaster.setFromCamera( pnt, camera );
         var intersects = raycaster.intersectObjects(scene.children, true);

         // painter may want to filter intersects
         if (typeof painter.FilterIntersects == 'function')
            intersects = painter.FilterIntersects(intersects);

         return intersects;
      }

      control.addEventListener( 'change', function() {
         mouse_ctxt.on = false; // disable context menu if any changes where done by orbit control
         painter.Render3D(0);
         control_changed = true;
      });

      control.addEventListener( 'start', function() {
         control_active = true;
         block_ctxt = false;
         mouse_ctxt.on = false;

         tooltip.hide();

         // do not reset here, problem of events sequence in orbitcontrol
         // it issue change/start/stop event when do zooming
         // control_changed = false;
      });

      control.addEventListener( 'end', function() {
         control_active = false;
         if (mouse_ctxt.on) {
            mouse_ctxt.on = false;
            control.ContextMenu(mouse_ctxt, GetIntersects(mouse_ctxt));
            // painter.OrbitContext(mouse_ctxt, GetIntersects(mouse_ctxt));
         } else
         if (control_changed) {
            // react on camera change when required
         }
         control_changed = false;
      });

      function control_contextmenu(evnt) {
         evnt.preventDefault();
         GetMousePos(evnt, mouse_ctxt);
         if (control_active)
            mouse_ctxt.on = true;
         else
         if (block_ctxt)
            block_ctxt = false;
         else
            control.ContextMenu(mouse_ctxt, GetIntersects(mouse_ctxt));

            // console.log('call context menu');
            // painter.OrbitContext(mouse_ctxt, GetIntersects(mouse_ctxt));
      };

      function control_touchstart(evnt) {
         if (!evnt.touches) return;

      // disable context menu if any changes where done by orbit control
         if (!control_changed && !mouse_ctxt.touchtm) {
            GetMousePos(evnt.touches[0], mouse_ctxt);
            mouse_ctxt.touchtm = new Date().getTime();
         }
      };

      function control_touchend(evnt) {
         if (!evnt.touches) return;

         if (control_changed || !mouse_ctxt.touchtm) return;

         var diff = new Date().getTime() - mouse_ctxt.touchtm;
         delete mouse_ctxt.touchtm;
         if (diff < 200) return;

         var pos = {};
         GetMousePos(evnt.touches[0], pos);

         if ((Math.abs(pos.x - mouse_ctxt.x) <= 10) && (Math.abs(pos.y - mouse_ctxt.y) <= 10))
            control.ContextMenu(mouse_ctxt, GetIntersects(mouse_ctxt));
      };

      control.ContextMenu = function(pos, intersects) {
         // do nothing, function called when context menu want to be activated
      }

      function control_mousemove(evnt) {
         if (control_active && evnt.buttons && (evnt.buttons & 2)) {
            block_ctxt = true; // if right button in control was active, block next context menu
         }

         if (control_active) return;
         if (!control.ProcessMouseMove) return;

         var mouse = {};
         GetMousePos(evnt, mouse);
         evnt.preventDefault();

         var intersects = GetIntersects(mouse);

         var info = control.ProcessMouseMove(intersects);

         if (info && (info.length>0)) {
            tooltip.show(info, 200);
            tooltip.pos(evnt)
         } else {
            tooltip.hide();
         }

         // console.log('provide tooltip', intersects.length);
      };

      function control_mouseleave() {
         tooltip.hide();
         if (control.ProcessMouseLeave) control.ProcessMouseLeave();
      };

      renderer.domElement.addEventListener( 'dblclick', function() { control.ProcessMouseDblclick(); });

      renderer.domElement.addEventListener('contextmenu', control_contextmenu);
      renderer.domElement.addEventListener('mousemove', control_mousemove);
      renderer.domElement.addEventListener('mouseleave', control_mouseleave);

      // do not use touch events, context menu should be activated via button
      //painter.renderer.domElement.addEventListener('touchstart', control_touchstart);
      //painter.renderer.domElement.addEventListener('touchend', control_touchend);


      return control;
   }

   JSROOT.Painter.HPainter_Create3DScene = function(arg) {

      if ((arg!==undefined) && (arg<0)) {
         this.clear_3d_canvas();
         delete this.size3d;
         delete this.scene;
         delete this.toplevel;
         delete this.camera;
         delete this.renderer;
         if (this.control) {
            this.control.dispose();
            delete this.control;
         }
         if ('render_tmout' in this) {
            clearTimeout(this.render_tmout);
            delete this.render_tmout;
         }
         return;
      }

      if ('toplevel' in this) {
         // it is indication that all 3D object created, just replace it with empty

         var newtop = new THREE.Object3D();

         newtop.rotation.x = this.toplevel.rotation.x;
         newtop.rotation.y = this.toplevel.rotation.y;

         this.scene.remove(this.toplevel);

         this.scene.add(newtop);

         this.toplevel = newtop;

         return;
      }

      var size = this.size_for_3d();

      this.size3d = 100;

      // three.js 3D drawing
      this.scene = new THREE.Scene();
      //scene.fog = new THREE.Fog(0xffffff, 500, 3000);

      this.toplevel = new THREE.Object3D();
      //this.toplevel.rotation.x = 30 * Math.PI / 180;
      //this.toplevel.rotation.y = 30 * Math.PI / 180;
      this.scene.add(this.toplevel);
      this.scene_width = size.width;
      this.scene_height = size.height

      this.camera = new THREE.PerspectiveCamera(45, this.scene_width / this.scene_height, 1, 40*this.size3d);
      var pointLight = new THREE.PointLight(0xcfcfcf);
      this.camera.add( pointLight );
      pointLight.position.set( this.size3d / 10, this.size3d / 10, this.size3d / 10 );
      this.camera.position.set(-3*this.size3d, -3*this.size3d, 3*this.size3d);
      this.camera.up = new THREE.Vector3(0,0,1);
      this.camera.lookAt(new THREE.Vector3(0,0,this.size3d));
      this.scene.add( this.camera );

      var webgl = JSROOT.Painter.TestWebGL();

      this.renderer = webgl ? new THREE.WebGLRenderer({ antialias : true, alpha: true }) :
                              new THREE.CanvasRenderer({ antialias : true, alpha: true  });
      //renderer.setClearColor(0xffffff, 1);
      // renderer.setClearColor(0x0, 0);
      this.renderer.setSize(this.scene_width, this.scene_height);

      this.add_3d_canvas(size, this.renderer.domElement);

      this.DrawXYZ = JSROOT.Painter.HPainter_DrawXYZ;
      this.Render3D = JSROOT.Painter.Render3D;
      this.Resize3D = JSROOT.Painter.Resize3D;

      this.first_render_tm = 0;
   }

   JSROOT.Painter.HPainter_TestAxisVisibility = function(camera, toplevel, fb, bb) {
      var top;
      for (var n=0;n<toplevel.children.length;++n) {
         top = toplevel.children[n];
         if (top.axis_draw) break;
         top = undefined;
      }

      if (!top) return;

      fb = fb ? true : false;
      bb = bb ? true : false;

      var qudrant = 1, pos = camera.position;
      if ((pos.x < 0) && (pos.y >= 0)) qudrant = 2;
      if ((pos.x >= 0) && (pos.y >= 0)) qudrant = 3;
      if ((pos.x >= 0) && (pos.y < 0)) qudrant = 4;

      function testvisible(id, range) {
         if (id <= qudrant) id+=4;
         return (id > qudrant) && (id < qudrant+range);
      }

      for (var n=0;n<top.children.length;++n) {
         var chld = top.children[n];
         if (chld.grid) chld.visible = bb && testvisible(chld.grid, 3); else
         if (chld.zid) chld.visible = testvisible(chld.zid, 2); else
         if (chld.xyid) chld.visible = testvisible(chld.xyid, 3); else
         if (chld.xyboxid) {
            var range = 5, shift = 0;
            if (bb && !fb) { range = 3; shift = -2; } else
            if (fb && !bb) range = 3; else
            if (!fb && !bb) range = (chld.bottom ? 3 : 0);
            chld.visible = testvisible(chld.xyboxid + shift, range);
            if (!chld.visible && chld.bottom && bb)
               chld.visible = testvisible(chld.xyboxid, 3);
         } else
         if (chld.zboxid) {
            var range = 2, shift = 0;
            if (fb && bb) range = 5; else
            if (bb && !fb) range = 4; else
            if (!bb && fb) { shift = -2; range = 4; }
            chld.visible = testvisible(chld.zboxid + shift, range);
         }
      }
   }

   JSROOT.Painter.HPainter_DrawXYZ = function(use_y_for_z, zmult) {

      var grminx = -this.size3d, grmaxx = this.size3d,
          grminy = -this.size3d, grmaxy = this.size3d,
          grminz = 0, grmaxz = 2*this.size3d,
          textsize = Math.round(this.size3d * 0.05),
          pad = this.root_pad(),
          histo = this.histo,
          xmin = this.xmin, xmax = this.xmax,
          ymin = this.ymin, ymax = this.ymax,
          zmin = this.zmin, zmax = this.zmax,
          y_zoomed = false, z_zoomed = false;

      if (this.size3d === 0) {
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

      if (use_y_for_z) {
         zmin = ymin; zmax = ymax; z_zoomed = y_zoomed;
         ymin = 0; ymax = 1;
      }

      // z axis range used for lego plot
      this.lego_zmin = zmin; this.lego_zmax = zmax;

      // factor 1.1 used in ROOT for lego plots
      if ((zmult !== undefined) && !z_zoomed) zmax *= zmult;

      this.TestAxisVisibility = JSROOT.Painter.HPainter_TestAxisVisibility;

      if (pad && pad.fLogx) {
         if (xmax <= 0) xmax = 1.;
         if ((xmin <= 0) && (this.nbinsx > 0))
            for (var i=0;i<this.nbinsx;++i) {
               xmin = Math.max(xmin, this.GetBinX(i));
               if (xmin>0) break;
            }
         if (xmin <= 0) xmin = 1e-4*xmax;
         this.tx = d3.scale.log();
         this.x_kind = "log";
      } else {
         this.tx = d3.scale.linear();
         if (histo && histo.fXaxis.fLabels) this.x_kind = "labels";
                                       else this.x_kind = "lin";
      }

      this.tx.domain([ xmin, xmax ]).range([ grminx, grmaxx ]);
      this.x_handle = new JSROOT.TAxisPainter(histo ? histo.fXaxis : null);
      this.x_handle.SetAxisConfig("xaxis", this.x_kind, this.tx, this.xmin, this.xmax, xmin, xmax);
      this.x_handle.CreateFormatFuncs();

      if (pad && pad.fLogy && !use_y_for_z) {
         if (ymax <= 0) ymax = 1.;
         if ((ymin <= 0) && (this.nbinsy>0))
            for (var i=0;i<this.nbinsy;++i) {
               ymin = Math.max(ymin, this.GetBinY(i));
               if (ymin>0) break;
            }

         if (ymin <= 0) ymin = 1e-4*ymax;
         this.ty = d3.scale.log();
         this.y_kind = "log";
      } else {
         this.ty = d3.scale.linear();
         if (histo && histo.fYaxis.fLabels) this.y_kind = "labels";
                                       else this.y_kind = "lin";
      }
      this.ty.domain([ ymin, ymax ]).range([ grminy, grmaxy ]);
      this.y_handle = new JSROOT.TAxisPainter(histo ? histo.fYaxis : null);
      this.y_handle.SetAxisConfig("yaxis", this.y_kind, this.ty, this.ymin, this.ymax, ymin, ymax);
      this.y_handle.CreateFormatFuncs();

      if (pad && pad.fLogz) {
         if (zmax <= 0) zmax = 1;
         if (zmin <= 0) zmin = 1e-4*zmax;
         this.tz = d3.scale.log();
         this.z_kind = "log";
      } else {
         this.tz = d3.scale.linear();
         this.z_kind = "lin";
      }
      this.tz.domain([ zmin, zmax ]).range([ grminz, grmaxz ]);

      this.z_handle = new JSROOT.TAxisPainter(histo ? histo.fZaxis : null);
      this.z_handle.SetAxisConfig("zaxis", this.z_kind, this.tz, this.zmin, this.zmax, zmin, zmax);
      this.z_handle.CreateFormatFuncs();

      var textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }),
          lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 }),
          ticklen = textsize*0.5, text, tick, lbls = [], text_scale = 1,
          xticks = this.x_handle.CreateTicks(),
          yticks = this.y_handle.CreateTicks(),
          zticks = this.z_handle.CreateTicks();


      // main element, where all axis elements are placed
      var top = new THREE.Object3D();
      top.axis_draw = true; // mark element as axis drawing
      this.toplevel.add(top);

      var ticks = [], maxtextheight = 0;

      while (xticks.next()) {
         var grx = xticks.grpos;
         var is_major = (xticks.kind===1);
         var lbl = this.x_handle.format(xticks.tick, true, true);
         if (xticks.last_major()) lbl = "x"; else
            if (lbl === null) { is_major = false; lbl = ""; }

         if (is_major && lbl && (lbl.length>0)) {
            var text3d = new THREE.TextGeometry(lbl, { font: JSROOT.threejs_font_helvetiker_regular, size: textsize, height: 0, curveSegments: 10 });
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

      var ggg1 = new THREE.Geometry(), ggg2 = new THREE.Geometry();

      lbls.forEach(function(lbl) {
         var m = new THREE.Matrix4();
         // matrix to swap y and z scales and shift along z to its position
         m.set(text_scale,          0,  0, lbl.grx,
                        0, text_scale,  0, -maxtextheight*text_scale - 1.5*ticklen,
                        0, 0,  1, 0);

         ggg1.merge(lbl, m);

         m.set(-text_scale,          0,  0, lbl.grx,
               0, text_scale,  0, -maxtextheight*text_scale - 1.5*ticklen,
               0, 0,  1, 0);

         ggg2.merge(lbl, m);
      });

      ggg1 = new THREE.BufferGeometry().fromGeometry(ggg1);
      ggg2 = new THREE.BufferGeometry().fromGeometry(ggg2);

      var ticksgeom = new THREE.BufferGeometry();
      ticksgeom.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(ticks), 3 ) );

      var xcont = new THREE.Object3D();
      xcont.position.set(0, grminy, grminz)
      xcont.rotation.x = 1/4*Math.PI;
      xcont.xyid = 2;
      xcont.add(new THREE.LineSegments(ticksgeom, lineMaterial));
      xcont.add(new THREE.Mesh(ggg1, textMaterial));
      top.add(xcont);

      xcont = new THREE.Object3D();
      xcont.position.set(0, grmaxy, grminz);
      xcont.rotation.x = 3/4*Math.PI;
      xcont.add(new THREE.LineSegments(ticksgeom, lineMaterial));
      xcont.add(new THREE.Mesh(ggg2, textMaterial));
      xcont.xyid = 4;
      top.add(xcont);


      lbls = []; text_scale = 1; maxtextheight = 0; ticks = [];

      while (yticks.next()) {
         var gry = yticks.grpos;
         var is_major = (yticks.kind===1);
         var lbl = this.y_handle.format(yticks.tick, true, true);
         if (yticks.last_major()) lbl = "y"; else
            if (lbl === null) { is_major = false; lbl = ""; }

         if (is_major) {
            var text3d = new THREE.TextGeometry(lbl, { font: JSROOT.threejs_font_helvetiker_regular, size: textsize, height: 0, curveSegments: 10 });
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

      var ticksgeom = new THREE.BufferGeometry();
      ticksgeom.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(ticks), 3 ) );

      if (!use_y_for_z) {
         var ycont = new THREE.Object3D();
         ycont.position.set(grminx, 0, grminz);
         ycont.rotation.y = -1/4*Math.PI;
         ycont.add(new THREE.LineSegments(ticksgeom, lineMaterial));
         ycont.add(new THREE.Mesh(ggg1, textMaterial));
         ycont.xyid = 3;
         top.add(ycont);

         ycont = new THREE.Object3D();
         ycont.position.set(grmaxx, 0, grminz);
         ycont.rotation.y = -3/4*Math.PI;
         ycont.add(new THREE.LineSegments(ticksgeom, lineMaterial));
         ycont.add(new THREE.Mesh(ggg2, textMaterial));
         ycont.xyid = 1;
         top.add(ycont);
      }


      lbls = []; text_scale = 1;

      var ticks = []; // just array, will be used for the buffer geometry

      var zgridx = null, zgridy = null, lastmajorz = null;
      if (this.size3d !== 0) {
         zgridx = []; zgridy = [];
      }

      while (zticks.next()) {
         var grz = zticks.grpos;
         var is_major = zticks.kind == 1;

         var lbl = this.z_handle.format(zticks.tick, true, true);
         if (lbl === null) { is_major = false; lbl = ""; }

         if (is_major && lbl && (lbl.length > 0)) {
            var text3d = new THREE.TextGeometry(lbl, { font: JSROOT.threejs_font_helvetiker_regular, size : textsize, height : 0, curveSegments : 10 });
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
         var material = new THREE.LineDashedMaterial( { color: 0x0, dashSize: 10, gapSize: 2, linewidth: 0.5 } );

         var geom =  new THREE.BufferGeometry();
         geom.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(zgridx), 3 ) );

         var lines = new THREE.LineSegments(geom, material);
         lines.position.set(0,grmaxy,0);
         lines.grid = 2; // mark as grid
         lines.visible = false;
         top.add(lines);

         lines = new THREE.LineSegments(geom, material);
         lines.position.set(0,grminy,0);
         lines.grid = 4; // mark as grid
         lines.visible = false;
         top.add(lines);
      }

      if (zgridy && (zgridy.length > 0)) {

         // var material = new THREE.LineBasicMaterial({ color: 0x0, linewidth: 0.5 });
         var material = new THREE.LineDashedMaterial( { color: 0x0, dashSize: 10, gapSize: 2, linewidth: 0.5 } );

         var geom =  new THREE.BufferGeometry();
         geom.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(zgridy), 3 ) );

         var lines = new THREE.LineSegments(geom, material);
         lines.position.set(grmaxx,0, 0);
         lines.grid = 3; // mark as grid
         lines.visible = false;
         top.add(lines);

         lines = new THREE.LineSegments(geom, material);
         lines.position.set(grminx, 0, 0);
         lines.grid = 1; // mark as grid
         lines.visible = false;
         top.add(lines);
      }


      var ggg = new THREE.Geometry();

      lbls.forEach(function(lbl) {
         var m = new THREE.Matrix4();
         // matrix to swap y and z scales and shift along z to its position
         m.set(-text_scale,          0,  0, 2*ticklen,
                        0,          0,  1, 0,
                        0, text_scale,  0, lbl.grz);

         ggg.merge(lbl, m);
      });

      ggg = new THREE.BufferGeometry().fromGeometry(ggg);

      var ticksgeom = new THREE.BufferGeometry();
      ticksgeom.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(ticks), 3 ) );

      // ticks = new THREE.BufferGeometry().fromGeometry(ticks);

      var zcont = [];
      for (var n=0;n<4;++n) {
         zcont.push(new THREE.Object3D());
         zcont[n].add(new THREE.Mesh(ggg, textMaterial));
         zcont[n].add(new THREE.LineSegments(ticksgeom, lineMaterial));
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
      if (this.size3d === 0) return;

      var linex = new THREE.BufferGeometry();
      linex.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array([grminx, 0, 0, grmaxx, 0, 0]), 3 ) );
      for(var n=0;n<2;++n) {
         var line = new THREE.LineSegments(linex, lineMaterial);
         line.position.set(0, grminy, (n===0) ? grminz : grmaxz);
         line.xyboxid = 2; line.bottom = (n == 0);
         top.add(line);

         line = new THREE.LineSegments(linex, lineMaterial);
         line.position.set(0, grmaxy, (n===0) ? grminz : grmaxz);
         line.xyboxid = 4; line.bottom = (n == 0);
         top.add(line);
      }

      var liney = new THREE.BufferGeometry();
      liney.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array([0, grminy,0, 0, grmaxy, 0]), 3 ) );
      for(var n=0;n<2;++n) {
         var line = new THREE.LineSegments(liney, lineMaterial);
         line.position.set(grminx, 0, (n===0) ? grminz : grmaxz);
         line.xyboxid = 3; line.bottom = (n == 0);
         top.add(line);

         line = new THREE.LineSegments(liney, lineMaterial);
         line.position.set(grmaxx, 0, (n===0) ? grminz : grmaxz);
         line.xyboxid = 1; line.bottom = (n == 0);
         top.add(line);
      }

      var linez = new THREE.BufferGeometry();
      linez.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array([0, 0, grminz, 0, 0, grmaxz]), 3 ) );
      for(var n=0;n<4;++n) {
         var line = new THREE.LineSegments(linez, lineMaterial);
         line.zboxid = zcont[n].zid;
         line.position.copy(zcont[n].position);
         top.add(line);
      }
   }

   JSROOT.Painter.HistPainter_DrawLego = function() {
      // Perform TH1/TH2 lego plot with BufferGeometry

      var vertices = [];
      vertices.push( new THREE.Vector3(1, 1, 1) );
      vertices.push( new THREE.Vector3(1, 1, 0) );
      vertices.push( new THREE.Vector3(1, 0, 1) );
      vertices.push( new THREE.Vector3(1, 0, 0) );
      vertices.push( new THREE.Vector3(0, 1, 0) );
      vertices.push( new THREE.Vector3(0, 1, 1) );
      vertices.push( new THREE.Vector3(0, 0, 0) );
      vertices.push( new THREE.Vector3(0, 0, 1) );

      var indicies = [0,2,1, 2,3,1, 4,6,5, 6,7,5, 4,5,1, 5,0,1, 7,6,2, 6,3,2, 5,7,0, 7,2,0, 1,3,4, 3,6,4];

      // normals for each  pair of faces
      var vnormals = [ 1,0,0, -1,0,0, 0,1,0, 0,-1,0, 0,0,1, 0,0,-1 ];

      // line segments
      var segments = [0, 2, 2, 7, 7, 5, 5, 0, 1, 3, 3, 6, 6, 4, 4, 1, 1, 0, 3, 2, 6, 7, 4, 5];

      // reduced line segments
      var rsegments = [0, 1, 1, 2, 2, 3, 3, 0];

      // reduced vertices
      var rvertices = [];
      rvertices.push( new THREE.Vector3(0, 0, 0) );
      rvertices.push( new THREE.Vector3(0, 1, 0) );
      rvertices.push( new THREE.Vector3(1, 1, 0) );
      rvertices.push( new THREE.Vector3(1, 0, 0) );

      var axis_zmin = this.tz.domain()[0], axis_zmax = this.tz.domain()[1];

      // create the bin cubes
      var showmin = !this.options.Zero, hdim = this.Dimension();

      var i1 = this.GetSelectIndex("x", "left", 0),
          i2 = this.GetSelectIndex("x", "right", 1),
          j1 = (hdim===1) ? 0 : this.GetSelectIndex("y", "left", 0),
          j2 = (hdim===1) ? 1 : this.GetSelectIndex("y", "right", 1),
          i, j, x1, x2, y1, y2, binz,
          main = this.main_painter();

      var xx = new Float32Array(i2+1),
          yy = new Float32Array(j2+1);

      // first adjust ranges
      for (i=i1;i<=i2;++i) {
         x1 = this.GetBinX(i);
         if (main.logx && (x1 <= 0)) { i1 = i+1; continue; }
         xx[i] = this.tx(x1);

         if (xx[i] < -1.001*this.size3d) i1 = i+1;
         if (xx[i] > 1.001*this.size3d) i2 = i-1;
      }

      if (hdim===1) {
         yy[0] = this.ty(0);
         yy[1] = this.ty(1);
      } else {
         for (j=j1;j<=j2;++j) {
            y1 = this.GetBinY(j);
            if (main.logy && (y1 <= 0)) { j1 = j+1; continue; }
            yy[j] = this.ty(y1);
            if (yy[j] < -1.001*this.size3d) j1 = j+1;
            if (yy[j] > 1.001*this.size3d) j2 = j-1;
         }
      }

      if ((i1 >= i2) || (j1>=j2)) return;

      // DRAW ALL CUBES

      var levels = [ axis_zmin, axis_zmax ], palette = null, totalvertices = 0;

      if ((this.options.Lego === 12) || (this.options.Lego === 14)) {
         levels = this.CreateContour(20, this.lego_zmin, this.lego_zmax);
         palette = this.GetPalette();
      }

      for (var nlevel=0; nlevel<levels.length-1;++nlevel) {

         var zmin = levels[nlevel], zmax = levels[nlevel+1],
             z1 = this.tz(zmin), z2 = 0, zzz = this.tz(zmax),
             numvertices = 0;

         // now calculate size of buffer geometry for boxes

         for (i=i1;i<i2;++i)
            for (j=j1;j<j2;++j) {
               var binz = this.histo.getBinContent(i+1, j+1);
               if (binz < zmin) continue;
               var reduced = (binz === zmin);
               if (reduced && ((nlevel>0) || !showmin)) continue;
               var nobottom = !reduced && (nlevel>0);
               var notop = !reduced && (binz > zmax) && (nlevel < levels.length-2);

               numvertices += (reduced ? 12 : indicies.length);
               if (nobottom) numvertices -= 6;
               if (notop) numvertices -= 6;
            }

         totalvertices += numvertices;

         var positions = new Float32Array(numvertices*3),
             normals = new Float32Array(numvertices*3),
             bins_index = new Uint32Array(numvertices),
             v = 0, vert, bin, k, nn;

         for (i=i1;i<i2;++i) {
            x1 = xx[i];
            x2 = xx[i+1];
            for (j=j1;j<j2;++j) {
               var binz = this.histo.getBinContent(i+1, j+1);
               if (binz < zmin) continue;
               var reduced = (binz === zmin);
               if (reduced && ((nlevel>0) || !showmin)) continue;
               var nobottom = !reduced && (nlevel>0);
               var notop = !reduced && (binz > zmax) && (nlevel < levels.length-2);

               y1 = yy[j];
               y2 = yy[j+1];

               z2 = (binz > zmax) ? zzz : this.tz(binz);

               nn = 0; // counter over the normals, each normals correspond to 6 vertices
               k = 0; // counter over vertices

               if (reduced) {
                  // we skip all side faces, keep only top and bottom
                  nn += 12;
                  k += 24;
               }

               var size = indicies.length, bin_index = this.histo.getBin(i+1, j+1);
               if (nobottom) size -= 6;

               // array over all vertices of the single bin
               while(k < size) {

                  vert = vertices[indicies[k]];

                  positions[v]   = x1 + vert.x * (x2 - x1);
                  positions[v+1] = y1 + vert.y * (y2 - y1);
                  positions[v+2] = z1 + vert.z * (z2 - z1);

                  normals[v] = vnormals[nn];
                  normals[v+1] = vnormals[nn+1];
                  normals[v+2] = vnormals[nn+2];

                  bins_index[v/3] = bin_index; // remember which bin corresponds to the vertex

                  v+=3; ++k;

                  if (k%6 === 0) {
                     nn+=3;
                     if (notop && (k === indicies.length - 12)) {
                        k+=6; nn+=3; // jump over notop indexes
                     }
                  }
               }
            }
         }

         var geometry = new THREE.BufferGeometry();
         geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
         geometry.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );

         // color is not handled in CanvasRenderer, keep it away
         // geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

         var fcolor = JSROOT.Painter.root_colors[this.GetObject().fFillColor];

         if (palette) {
            var indx = Math.floor((nlevel+0.99)*palette.length/(levels.length-1));
            if (indx > palette.length-1) indx = palette.length-1;
            fcolor = palette[indx];
         }

         var material = new THREE.MeshLambertMaterial( { transparent: false,
            opacity: 1, wireframe: false, color: new THREE.Color(fcolor),
            side: THREE.FrontSide /* THREE.DoubleSide */, vertexColors: THREE.NoColors /*THREE.FaceColors*/,
            overdraw: 0. } );

         var mesh = new THREE.Mesh(geometry, material);

         mesh.bins_index = bins_index;
         mesh.painter = this;

         mesh.tooltip = function(intersect) {
            if ((intersect.index<0) || (intersect.index >= this.bins_index.length)) return null;
            return this.painter.Get3DToolTip(this.bins_index[intersect.index]);
         }

         this.toplevel.add(mesh);
      }

      // lego3 or lego4 do not draw border lines
      if (this.options.Lego > 12) return;

      // DRAW LINE BOXES

      var numlinevertices = 0, numsegments = 0;

      for (i=i1;i<i2;++i)
         for (j=j1;j<j2;++j) {
            var binz = this.histo.getBinContent(i+1, j+1);
            if (binz < axis_zmin) continue;
            var reduced = (binz == axis_zmin);
            if (reduced && !showmin) continue;

            // calculate required buffer size for line segments
            numlinevertices += (reduced ? rvertices.length : vertices.length);
            numsegments += (reduced ? rsegments.length : segments.length);
         }


      var lpositions = new Float32Array( numlinevertices * 3 );
      var lindicies = new Uint32Array( numsegments );
      var lines_index = new Uint32Array( numsegments );

      var z1 = this.tz(axis_zmin), z2 = 0, zzz = this.tz(axis_zmax);

      var ll = 0, ii = 0;

      for (i=i1;i<i2;++i) {
         x1 = xx[i];
         x2 = xx[i+1];
         for (j=j1;j<j2;++j) {

            var binz = this.histo.getBinContent(i+1, j+1);
            if (binz < axis_zmin) continue;
            var reduced = (binz == axis_zmin);
            if (reduced && !showmin) continue;

            y1 = yy[j];
            y2 = yy[j+1];

            z2 = (binz > zmax) ? zzz : this.tz(binz);

            var seg = reduced ? rsegments : segments;
            var vvv = reduced ? rvertices : vertices;

            var bin_index = this.histo.getBin(i+1, j+1);

            // array of indicies for the lines, to avoid duplication of points
            for (k=0; k < seg.length; ++k) {
               lines_index[ii] = bin_index;
               lindicies[ii++] = ll/3 + seg[k];
            }

            for (k=0; k < vvv.length; ++k) {
               vert = vvv[k];
               lpositions[ll]   = x1 + vert.x * (x2 - x1);
               lpositions[ll+1] = y1 + vert.y * (y2 - y1);
               lpositions[ll+2] = z1 + vert.z * (z2 - z1);
               ll+=3;
            }
         }
      }

      // create boxes
      geometry = new THREE.BufferGeometry();
      geometry.addAttribute( 'position', new THREE.BufferAttribute( lpositions, 3 ) );
      geometry.setIndex(new THREE.BufferAttribute(lindicies, 1));

      var lcolor = JSROOT.Painter.root_colors[this.GetObject().fLineColor];

      material = new THREE.LineBasicMaterial({ color: new THREE.Color(lcolor), linewidth: this.GetObject().fLineWidth });

      var line = new THREE.LineSegments(geometry, material);
      line.lines_index = lines_index;
      line.painter = this;

      line.tooltip = function(intersect) {
         if ((intersect.index<0) || (intersect.index >= this.lines_index.length)) return null;
         return this.painter.Get3DToolTip(this.lines_index[intersect.index]);
      }

      this.toplevel.add(line);
   }

   JSROOT.Painter.Render3D = function(tmout) {
      if (tmout === undefined) tmout = 5; // by default, rendering happens with timeout

      if (tmout <= 0) {
         if ('render_tmout' in this)
            clearTimeout(this.render_tmout);

         if (this.renderer === undefined) return;

         var tm1 = new Date();

         if (typeof this.TestAxisVisibility === 'function')
            this.TestAxisVisibility(this.camera, this.toplevel, this.options.FrontBox, this.options.BackBox);

         // do rendering, most consuming time
         this.renderer.render(this.scene, this.camera);

         var tm2 = new Date();

         delete this.render_tmout;

         if (this.first_render_tm === 0) {
            this.first_render_tm = tm2.getTime() - tm1.getTime();
            console.log('First render tm = ' + this.first_render_tm);

            if (!this.control) {
               this.control = JSROOT.Painter.CreateOrbitControl(this, this.camera, this.scene, this.renderer, new THREE.Vector3(0,0,this.size3d));

               this.control.ProcessMouseMove = function(intersects) {
                  for (var i = 0; i < intersects.length; ++i) {
                     if (intersects[i].object.tooltip)
                        return intersects[i].object.tooltip(intersects[i]);

                     if (typeof intersects[i].object.name == 'string')
                        return intersects[i].object.name;
                  }

                  return "";
               }

               this.control.ContextMenu = this.ShowContextMenu.bind(this, "hist");
            }

         }

         return;
      }

      // no need to shoot rendering once again
      if ('render_tmout' in this) return;

      this.render_tmout = setTimeout(this.Render3D.bind(this,0), tmout);
   }

   JSROOT.Painter.Resize3D = function() {

      var size3d = this.size_for_3d(this.svg_pad().property('can3d'));

      this.apply_3d_size(size3d);

      if ((this.scene_width === size3d.width) && (this.scene_height === size3d.height)) return;

      if ((size3d.width<10) || (size3d.height<10)) return;

      this.scene_width = size3d.width;
      this.scene_height = size3d.height;

      this.camera.aspect = this.scene_width / this.scene_height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize( this.scene_width, this.scene_height );

      this.Render3D();
   }

   JSROOT.Painter.TH1Painter_Draw3D = function(call_back) {
      // function called with this as painter

      this.Create3DScene();
      this.Draw3DBins = JSROOT.Painter.HistPainter_DrawLego;

      //var pad = this.root_pad();
      // if (pad && pad.fGridz === undefined) pad.fGridz = false;

      //this.zmin = pad.fLogz ? this.gmin0bin * 0.3 : this.gminbin;
      //this.zmax = this.gmaxbin;

      //if (this.histo.fMinimum !== -1111) this.zmin = this.histo.fMinimum;
      //if (this.histo.fMaximum !== -1111) this.zmax = this.histo.fMaximum;

      //if (pad.fLogz && (this.zmin<=0)) this.zmin = this.zmax * 1e-5;

      //this.zmax *= 1.1; // as it done in ROOT

      this.DrawXYZ(true, 1.1);

      this.Draw3DBins();

      // if (this.options.Zscale > 0) this.DrawNewPalette(true);

      this.DrawTitle();

      this.Render3D();

      JSROOT.CallBack(call_back);
   }


   JSROOT.Painter.TH2Painter_Draw3D = function(call_back) {
      // function called with this as painter

      this.Create3DScene();
      this.Draw3DBins = JSROOT.Painter.HistPainter_DrawLego;

      var pad = this.root_pad();
      // if (pad && pad.fGridz === undefined) pad.fGridz = false;

      this.zmin = pad.fLogz ? this.gmin0bin * 0.3 : this.gminbin;
      this.zmax = this.gmaxbin;

      if (this.histo.fMinimum !== -1111) this.zmin = this.histo.fMinimum;
      if (this.histo.fMaximum !== -1111) this.zmax = this.histo.fMaximum;

      if (pad.fLogz && (this.zmin<=0)) this.zmin = this.zmax * 1e-5;

      this.DrawXYZ(false, 1.1);

      this.Draw3DBins();

      if (this.options.Zscale > 0) this.DrawNewPalette(true);

      this.DrawTitle();

      this.Render3D();

      JSROOT.CallBack(call_back);
   }

   // ==============================================================================


   JSROOT.TH3Painter = function(histo) {
      JSROOT.THistPainter.call(this, histo);

      this.Create3DScene = JSROOT.Painter.HPainter_Create3DScene;
   }

   JSROOT.TH3Painter.prototype = Object.create(JSROOT.THistPainter.prototype);

   JSROOT.TH3Painter.prototype.ScanContent = function() {
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
      var i,j,k;
      for (i = 0; i < this.nbinsx; ++i)
         for (j = 0; j < this.nbinsy; ++j)
            for (k = 0; k < this.nbinsz; ++k) {
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
          res = { entries: 0, integral: 0, meanx: 0, meany: 0, meanz: 0, rmsx: 0, rmsy: 0, rmsz: 0 };

      for (var xi = 0; xi < this.nbinsx+2; ++xi) {

         var xx = this.GetBinX(xi - 0.5);
         var xside = (xi < i1) ? 0 : (xi > i2 ? 2 : 1);

         for (var yi = 0; yi < this.nbinsy+2; ++yi) {

            var yy = this.GetBinY(yi - 0.5);
            var yside = (yi < j1) ? 0 : (yi > j2 ? 2 : 1);

            for (var zi = 0; zi < this.nbinsz+2; ++zi) {

               var zz = this.GetBinZ(zi - 0.5);
               var zside = (zi < k1) ? 0 : (zi > k2 ? 2 : 1);

               var cont = histo.getBinContent(xi, yi, zi);
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

      if (histo.fTsumw > 0) {
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
         res.rmsx = Math.sqrt(stat_sumx2 / stat_sum0 - res.meanx * res.meanx);
         res.rmsy = Math.sqrt(stat_sumy2 / stat_sum0 - res.meany * res.meany);
         res.rmsz = Math.sqrt(stat_sumz2 / stat_sum0 - res.meanz * res.meanz);
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
      var lines = [];
      lines.push(this.GetTipName());
      lines.push('x=' + JSROOT.FFormat(this.GetBinX(ix+0.5),"6.4g") + ' bin=' + (ix+1));
      lines.push('y=' + JSROOT.FFormat(this.GetBinY(iy+0.5),"6.4g") + ' bin=' + (iy+1));
      lines.push('z=' + JSROOT.FFormat(this.GetBinZ(iz+0.5),"6.4g") + ' bin=' + (iz+1));
      lines.push('entries=' + JSROOT.FFormat(this.GetObject().getBinContent(ix+1, iy+1, iz+1), "7.0g"));
      return lines;
   }

   JSROOT.TH3Painter.prototype.Draw3DBins = function() {

      if (!this.draw_content) return;

      var fillcolor = new THREE.Color(JSROOT.Painter.root_colors[this.GetObject().fFillColor]);

      var material = null, geom = null, helper = null;

      if (this.options.Box == 11) {
         material = new THREE.MeshPhongMaterial({ color : fillcolor, specular : 0x4f4f4f });
         // geom = new THREE.SphereGeometry(0.5, 18, 16);
         geom = JSROOT.Painter.TestWebGL() ? new THREE.SphereGeometry(0.5, 16, 12) : new THREE.SphereGeometry(0.5, 8, 6);
         geom.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
      } else {
         material = new THREE.MeshLambertMaterial({ color : fillcolor });
         geom = new THREE.BoxGeometry(1, 1, 1);
         helper = new THREE.BoxHelper(new THREE.Mesh(geom));
      }

      var histo = this.GetObject(),
          i1 = this.GetSelectIndex("x", "left", 0),
          i2 = this.GetSelectIndex("x", "right", 0),
          j1 = this.GetSelectIndex("y", "left", 0),
          j2 = this.GetSelectIndex("y", "right", 0),
          k1 = this.GetSelectIndex("z", "left", 0),
          k2 = this.GetSelectIndex("z", "right", 0),
          name = this.GetTipName("<br/>");

      var scalex = (this.tx(this.GetBinX(i2+0.5)) - this.tx(this.GetBinX(i1+0.5))) / (i2-i1),
          scaley = (this.ty(this.GetBinY(j2+0.5)) - this.ty(this.GetBinY(j1+0.5))) / (j2-j1),
          scalez = (this.tz(this.GetBinZ(k2+0.5)) - this.tz(this.GetBinZ(k1+0.5))) / (k2-k1);

      // Single Object3Ds that contain all bins and helpers
      var buffer_size = geom.faces.length*9;

      var single_bin_verts = new Float32Array(buffer_size);
      var single_bin_norms = new Float32Array(buffer_size);

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

      var nbins = 0, i, j, k, wei, bin_content;

      for (i = i1; i < i2; ++i) {
         for (j = j1; j < j2; ++j) {
            for (k = k1; k < k2; ++k) {
               bin_content = histo.getBinContent(i+1, j+1, k+1);
               if (bin_content <= this.gminbin) continue;
               wei = (this.options.Color > 0) ? 1. : bin_content / this.gmaxbin;
               if (wei < 1e-5) continue; // do not empty or very small bins

               nbins++;
            }
         }
      }

      // console.log("Create buffer for", nbins, 'bins fullsize', nbins * buffer_size);

      var bin_verts = new Float32Array(nbins * buffer_size);
      var bin_norms = new Float32Array(nbins * buffer_size);
      var bins = new Int32Array(nbins);


      var helper_indexes, helper_positions, helper_single_indexes, helper_single_position, helper_bins;

      if (helper) {
         helper_single_indexes = helper.geometry.index.array;
         helper_single_position = helper.geometry.getAttribute('position').array;
         helper_indexes = new Uint32Array(nbins * helper_single_indexes.length);
         helper_positions = new Float32Array(nbins * helper_single_position.length);
      }

      var binx, grx, biny, gry, binz, grz;

      nbins = 0;

      for (i = i1; i < i2; ++i) {
         binx = this.GetBinX(i+0.5); grx = this.tx(binx);
         for (j = j1; j < j2; ++j) {
            biny = this.GetBinY(j+0.5); gry = this.ty(biny);
            for (k = k1; k < k2; ++k) {
               bin_content = histo.getBinContent(i+1, j+1, k+1);
               if (bin_content <= this.gminbin) continue;

               wei = (this.options.Color > 0) ? 1. : bin_content / this.gmaxbin;
               if (wei < 1e-5) continue; // do not show empty bins

               binz = this.GetBinZ(k+0.5); grz = this.tz(binz);

               // remeber bin index for tooltip
               bins[nbins] = histo.getBin(i+1, j+1, k+1);

               var vvv = nbins * buffer_size;

               // Grab the coordinates and scale that are being assigned to each bin
               for (var vi = 0; vi < buffer_size; vi+=3, vvv+=3) {
                  bin_verts[vvv]   = grx + single_bin_verts[vi]*scalex*wei;
                  bin_verts[vvv+1] = gry + single_bin_verts[vi+1]*scaley*wei;
                  bin_verts[vvv+2] = grz + single_bin_verts[vi+2]*scalez*wei;

                  bin_norms[vvv]   = single_bin_norms[vi];
                  bin_norms[vvv+1] = single_bin_norms[vi+1];
                  bin_norms[vvv+2] = single_bin_norms[vi+2];
               }


               if (helper) {
                  var iii = nbins * helper_single_indexes.length,
                      vvv = nbins * helper_single_position.length;

                  for (var n=0;n<helper_single_indexes.length;++n)
                     helper_indexes[iii+n] = vvv/3 + helper_single_indexes[n];

                  for (var vi=0;vi < helper_single_position.length; vi+=3, vvv+=3) {
                     helper_positions[vvv]   = grx + helper_single_position[vi]*scalex*wei;
                     helper_positions[vvv+1] = gry + helper_single_position[vi+1]*scaley*wei;
                     helper_positions[vvv+2] = grz + helper_single_position[vi+2]*scalez*wei;
                  }
               }

               nbins++;
            }
         }
      }


      // BufferGeometries that store geometry of all bins
      var all_bins_buffgeom = new THREE.BufferGeometry();

      // Create mesh from bin buffergeometry
      all_bins_buffgeom.addAttribute('position', new THREE.BufferAttribute( bin_verts, 3 ) );
      all_bins_buffgeom.addAttribute('normal', new THREE.BufferAttribute( bin_norms, 3 ) );

      var combined_bins = new THREE.Mesh(all_bins_buffgeom, material);

      combined_bins.bins = bins;
      combined_bins.bins_faces = buffer_size/3;
      combined_bins.painter = this;

      combined_bins.tooltip = function(intersect) {
         var indx = Math.floor(intersect.index / this.bins_faces);
         if ((indx<0) || (indx >= this.bins.length)) return null;
         return this.painter.Get3DToolTip(this.bins[indx]);
      }

      this.toplevel.add(combined_bins);

      if (helper) {
         var helper_geom = new THREE.BufferGeometry();
         helper_geom.setIndex(  new THREE.BufferAttribute(helper_indexes, 1) );
         helper_geom.addAttribute( 'position', new THREE.BufferAttribute( helper_positions, 3 ) );

         var helper_material = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1.0 } );

         var lines = new THREE.LineSegments(helper_geom, helper_material );

         lines.bins = bins;
         lines.bins_faces = helper_single_indexes.length;
         lines.painter = this;

         lines.tooltip = combined_bins.tooltip;

         this.toplevel.add(lines);
      }
   }

   JSROOT.TH3Painter.prototype.Redraw = function(resize) {
      if (resize) {
         this.Resize3D();
      } else {
         this.Create3DScene();
         this.DrawXYZ();
         this.Draw3DBins();
         this.Render3D();
      }
   }

   JSROOT.TH3Painter.prototype.CheckResize = function(size) {
      var pad_painter = this.pad_painter();

      var changed = true;

      // firefox is the only browser which correctly supports resize of embedded canvas,
      // for others we should force canvas redrawing at every step
      if (pad_painter)
         changed = pad_painter.CheckCanvasResize(size, !JSROOT.browser.isFirefox);

      if (changed) this.Resize3D(size);
   }

   JSROOT.TH3Painter.prototype.FillToolbar = function() {
      var pp = this.pad_painter(true);
      if (pp===null) return;

      pp.AddButton(JSROOT.ToolbarIcons.undo, 'Unzoom all axes', 'UnzoomAllAxis');
      if (this.draw_content)
         pp.AddButton(JSROOT.ToolbarIcons.statbox, 'Toggle stat box', "ToggleStatBox");
   }

   JSROOT.TH3Painter.prototype.FillHistContextMenu = function(menu) {
      if (!this.draw_content) return;

      menu.addDrawMenu("Draw with", ["box", "box1"], function(arg) {
         this.options = this.DecodeOptions(arg);
         this.Redraw();
      });

      menu.addchk(this.options.FrontBox, 'Front box', function() {
         this.options.FrontBox = !this.options.FrontBox;
         if (this.Render3D) this.Render3D();
      });
      menu.addchk(this.options.BackBox, 'Back box', function() {
         this.options.BackBox = !this.options.BackBox;
         if (this.Render3D) this.Render3D();
      });

      if (this.control && typeof this.control.ResetCamera === 'function')
         menu.add('Reset camera', function() {
            this.control.ResetCamera();
         });
   }


   JSROOT.Painter.drawHistogram3D = function(divid, histo, opt) {
      // when called, *this* set to painter instance

      // create painter and add it to canvas
      JSROOT.extend(this, new JSROOT.TH3Painter(histo));

      this.SetDivId(divid, 4);

      this.options = this.DecodeOptions(opt);

      this.CheckPadRange();

      this.ScanContent();

      this.Redraw();

      this.DrawTitle();

      if (JSROOT.gStyle.AutoStat && this.create_canvas) {
         var stats = this.CreateStat();
         if (stats) JSROOT.draw(this.divid, stats, "");
      }

      this.FillToolbar();

      return this.DrawingReady();
   }

   // ===================================================================

   JSROOT.Painter.drawPolyMarker3D = function(divid, poly, opt) {
      // when called, *this* set to painter instance

      this.SetDivId(divid);

      var main = this.main_painter();

      if ((main == null) || !('renderer' in main)) return this.DrawingReady();

      var cnt = poly.fP.length;
      var step = 3;

      if ((JSROOT.gStyle.OptimizeDraw > 0) && (cnt > 1000*3)) {
         step = Math.floor(cnt / 1000 / 3) * 3;
         if (step <= 6) step = 6;
      }

      var fcolor = d3.rgb(JSROOT.Painter.root_colors[poly.fMarkerColor]);
      var fillcolor = new THREE.Color(0xDDDDDD);
      fillcolor.setRGB(fcolor.r / 255, fcolor.g / 255,  fcolor.b / 255);

      var material = new THREE.MeshPhongMaterial({ color : fillcolor.getHex(), specular : 0x4f4f4f});

      // var geom = new THREE.SphereBufferGeometry(1);
      var geom = new THREE.BoxGeometry(1, 1, 1);

      for (var n=0; n<cnt; n+=step) {
         var bin = new THREE.Mesh(geom, material.clone());
         bin.position.set( main.tx(poly.fP[n]), main.ty(poly.fP[n+1]), main.tz(poly.fP[n+2]) );
         bin.name = (poly.fName !== "TPolyMarker3D") ? (poly.fName + ": ") : ("bin " + n/3 + ": ");
         bin.name += main.x_handle.format(poly.fP[n]) + "," + main.y_handle.format(poly.fP[n+1]) + "," + main.z_handle.format(poly.fP[n+2]);
         main.toplevel.add(bin);
      }

      main.Render3D();

      return this.DrawingReady();
   }

   return JSROOT.Painter;

}));

