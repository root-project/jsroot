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

   JSROOT.Painter.add3DInteraction = function() {
      // add 3D mouse interactive functions

      var painter = this;
      var mouseX, mouseY, distXY = 0, mouseDowned = false;

      var tooltip = {
         tt: null, cont: null,
         pos : function(e) {
            if (this.tt === null) return;
            var u = JSROOT.browser.isIE ? (event.clientY + document.documentElement.scrollTop) : e.pageY;
            var l = JSROOT.browser.isIE ? (event.clientX + document.documentElement.scrollLeft) : e.pageX;

            this.tt.style.top = (u + 15) + 'px';
            this.tt.style.left = (l + 3) + 'px';
         },
         show : function(v) {
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
               document.body.appendChild(this.tt);
               this.tt.style.opacity = 1;
               this.tt.style.filter = 'alpha(opacity=1)';
               this.tt.style.position = 'absolute';
               this.tt.style.display = 'block';
            }
            this.cont.innerHTML = v;
            this.tt.style.width = 'auto'; // let it be automatically resizing...
            if (JSROOT.browser.isIE)
               this.tt.style.width = this.tt.offsetWidth;
         },
         hide : function() {
            if (this.tt !== null)
               document.body.removeChild(this.tt);
            this.tt = null;
         }
      };

      var raycaster = new THREE.Raycaster();
      var do_bins_highlight = painter.first_render_tm < 2000;

      function findIntersection(mouse) {
         // find intersections

         if (JSROOT.gStyle.Tooltip <= 0) return tooltip.hide();

         raycaster.setFromCamera( mouse, painter.camera );
         var intersects = raycaster.intersectObjects(painter.scene.children, true);
         for (var i = 0; i < intersects.length; ++i) {
            if (intersects[i].object.tooltip) {
               var res = intersects[i].object.tooltip(intersects[i]);
               if (res) return tooltip.show(res, 200);
            } else
            if (typeof intersects[i].object.name == 'string')
               return tooltip.show(intersects[i].object.name, 200);
         }

         tooltip.hide();
      };

      function coordinates(e) {
         if ('changedTouches' in e) return e.changedTouches;
         if ('touches' in e) return e.touches;
         return [e];
      }

      function mousedown(e) {
         tooltip.hide();
         e.preventDefault();

         var arr = coordinates(e);
         if (arr.length == 2) {
            distXY = Math.sqrt(Math.pow(arr[0].pageX - arr[1].pageX, 2) + Math.pow(arr[0].pageY - arr[1].pageY, 2));
         } else {
            mouseX = arr[0].pageX;
            mouseY = arr[0].pageY;
         }
         mouseDowned = true;

      }

      painter.renderer.domElement.addEventListener('touchstart', mousedown);
      painter.renderer.domElement.addEventListener('mousedown', mousedown);

      function mousemove(e) {
         var arr = coordinates(e);

         if (mouseDowned) {
            if (arr.length == 2) {
               var dist = Math.sqrt(Math.pow(arr[0].pageX - arr[1].pageX, 2) + Math.pow(arr[0].pageY - arr[1].pageY, 2));

               var delta = (dist-distXY)/(dist+distXY);
               distXY = dist;
               if (delta === 1.) return;

               painter.camera.position.x += delta * painter.size3d * 10;
               painter.camera.position.y += delta * painter.size3d * 10;
               painter.camera.position.z -= delta * painter.size3d * 10;
            } else {
               var moveX = arr[0].pageX - mouseX;
               var moveY = arr[0].pageY - mouseY;
               var length = painter.camera.position.length();
               var ddd = length > painter.size3d ? 0.001*length/painter.size3d : 0.01;
               // limited X rotate in -45 to 135 deg
               //if ((moveY > 0 && painter.toplevel.rotation.x < Math.PI * 3 / 4)
               //      || (moveY < 0 && painter.toplevel.rotation.x > -Math.PI / 4))
               //   painter.toplevel.rotation.x += moveX * 0.02;
               painter.toplevel.rotation.z += moveX * ddd;
               painter.toplevel.rotation.x += moveY * ddd;
               painter.toplevel.rotation.y -= moveY * ddd;
               mouseX = arr[0].pageX;
               mouseY = arr[0].pageY;
            }
            painter.Render3D(0);
         } else
         if (arr.length == 1) {
            var mouse_x = ('offsetX' in arr[0]) ? arr[0].offsetX : arr[0].layerX;
            var mouse_y = ('offsetY' in arr[0]) ? arr[0].offsetY : arr[0].layerY;
            mouse = { x: (mouse_x / painter.renderer.domElement.width) * 2 - 1,
                      y: -(mouse_y / painter.renderer.domElement.height) * 2 + 1 };
            findIntersection(mouse);
            tooltip.pos(arr[0]);
         } else {
            tooltip.hide();
         }

         e.stopPropagation();
         e.preventDefault();
      }

      painter.renderer.domElement.addEventListener('touchmove', mousemove);
      painter.renderer.domElement.addEventListener('mousemove', mousemove);

      function mouseup(e) {
         mouseDowned = false;
         tooltip.hide();
         distXY = 0;
      }

      painter.renderer.domElement.addEventListener('touchend', mouseup);
      painter.renderer.domElement.addEventListener('touchcancel', mouseup);
      painter.renderer.domElement.addEventListener('mouseup', mouseup);

      function mousewheel(event) {
         event.preventDefault();
         event.stopPropagation();

         var delta = 0;
         if ( event.wheelDelta ) {
            // WebKit / Opera / Explorer 9
            delta = event.wheelDelta / 400;
         } else if ( event.detail ) {
            // Firefox
            delta = - event.detail / 30;
         }
         painter.camera.position.x -= delta * painter.size3d;
         painter.camera.position.y -= delta * painter.size3d;
         painter.camera.position.z += delta * painter.size3d;
         painter.Render3D(0);
      }

      painter.renderer.domElement.addEventListener( 'mousewheel', mousewheel, false );
      painter.renderer.domElement.addEventListener( 'MozMousePixelScroll', mousewheel, false ); // firefox


      painter.renderer.domElement.addEventListener('mouseleave', function() {
         tooltip.hide();
      });


      painter.renderer.domElement.addEventListener('contextmenu', function(e) {
         e.preventDefault();
         tooltip.hide();

         painter.ShowContextMenu("hist", e);
      });

   }

   JSROOT.Painter.HPainter_Create3DScene = function(arg) {

      if ((arg!==null) && (arg<0)) {
         this.clear_3d_canvas();
         delete this.size3d;
         delete this.scene;
         delete this.toplevel;
         delete this.camera;
         delete this.renderer;
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

      this['DrawXYZ'] = JSROOT.Painter.HPainter_DrawXYZ;
      this['Render3D'] = JSROOT.Painter.Render3D;
      this['Resize3D'] = JSROOT.Painter.Resize3D;

      this.first_render_tm = 0;
   }

   JSROOT.Painter.HPainter_DrawXYZ = function() {

      var grminx = -this.size3d, grmaxx = this.size3d,
          grminy = -this.size3d, grmaxy = this.size3d,
          grminz = 0, grmaxz = 2*this.size3d,
          textsize = Math.round(this.size3d * 0.07),
          zsides = this.scale_z_sides,
          pad = this.root_pad(),
          xmin = this.xmin, xmax = this.xmax,
          ymin = this.ymin, ymax = this.ymax,
          zmin = this.zmin, zmax = this.zmax,
          histo = this.histo;

      if (this.size3d === 0) {
         grminx = this.xmin; grmaxx = this.xmax;
         grminy = this.ymin; grmaxy = this.ymax;
         grminz = this.zmin; grmaxz = this.zmax;
         textsize = (grmaxz - grminz) * 0.05;
         if (!zsides) zsides = [true, false, false, false];
      }

      if (!zsides) zsides = [true, true, true, true];

      var bothsides = zsides[1] || zsides[2] || zsides[3];

      if (('zoom_xmin' in this) && ('zoom_xmax' in this) && (this.zoom_xmin !== this.zoom_xmax)) {
         xmin = this.zoom_xmin; xmax = this.zoom_xmax;
      }

      if (('zoom_ymin' in this) && ('zoom_ymax' in this) && (this.zoom_ymin !== this.zoom_ymax)) {
         ymin = this.zoom_ymin; ymax = this.zoom_ymax;
      }

      if (('zoom_zmin' in this) && ('zoom_zmax' in this) && (this.zoom_zmin !== this.zoom_zmax)) {
         zmin = this.zoom_zmin; zmax = this.zoom_zmax;
      }

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
         if (histo && histo.fXaxis.fLabels) this.x_kind = 'labels';
                                       else this.x_kind = "lin";
      }

      this.tx.domain([ xmin, xmax ]).range([ grminx, grmaxx ]);
      this.x_handle = new JSROOT.TAxisPainter(histo ? histo.fXaxis : null);
      this.x_handle.SetAxisConfig("xaxis", this.x_kind, this.tx, this.xmin, this.xmax, xmin, xmax);
      this.x_handle.CreateFormatFuncs();

      if (pad && pad.fLogy) {
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
         if (histo && histo.fYaxis.fLabels) this.y_kind = 'labels';
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

      var textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      var lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

      var ticklen = textsize*0.5, text, tick, lbls = [], text_scale = 1;

      var xticks = this.x_handle.CreateTicks();

      // geometry used for the tick drawing
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(0, 0, 0));
      geometry.vertices.push(new THREE.Vector3(0, -1, -1));

      while (xticks.next()) {
         var grx = xticks.grpos;
         var is_major = (xticks.kind===1);
         var lbl = this.x_handle.format(xticks.tick, true, true);
         if (xticks.last_major()) lbl = "x"; else
            if (lbl === null) { is_major = false; lbl = ""; }
         var plen = (is_major ? ticklen : ticklen * 0.6) * Math.sin(Math.PI/4);

         if (is_major && lbl && (lbl.length>0)) {
            var text3d = new THREE.TextGeometry(lbl, { font: JSROOT.threejs_font_helvetiker_regular, size: textsize, height: 0, curveSegments: 10 });
            text3d.computeBoundingBox();
            var draw_width = text3d.boundingBox.max.x - text3d.boundingBox.min.x;
            text3d.translate(-draw_width/2, 0, 0);
            var text_pos = grx;

            if (!xticks.last_major()) {
               var space = (xticks.next_major_grpos() - grx);
               if (draw_width > 0)
                  text_scale = Math.min(text_scale, 0.95*space/draw_width)
               if (this.x_handle.IsCenterLabels()) text_pos += space/2;
            }

            if (bothsides) {
               text = new THREE.Mesh(text3d, textMaterial);
               text.position.set(text_pos, grmaxy + plen + textsize,  grminz - plen - textsize);
               text.rotation.x = Math.PI*3/4;
               text.rotation.y = Math.PI;
               text.name = "X axis";
               this.toplevel.add(text);
               lbls.push(text);
            }

            text = new THREE.Mesh(text3d, textMaterial);
            text.position.set(text_pos, grminy - plen - textsize, grminz - plen - textsize);
            text.rotation.x = Math.PI/4;
            text.name = "X axis";
            this.toplevel.add(text);
            lbls.push(text);
         }

         if (bothsides) {
            tick = new THREE.Line(geometry, lineMaterial);
            tick.position.set(grx,grmaxy, grminz);
            tick.scale.set(1,plen,plen);
            tick.rotation.z = Math.PI;
            tick.name = "X axis: " + this.x_handle.format(xticks.tick);
            this.toplevel.add(tick);
         }

         tick = new THREE.Line(geometry, lineMaterial);
         tick.position.set(grx,grminy,grminz);
         tick.scale.set(1,plen,plen);
         tick.name = "X axis: " + this.x_handle.format(xticks.tick);
         this.toplevel.add(tick);
      }

      var yticks = this.y_handle.CreateTicks();
      geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(0, 0, 0));
      geometry.vertices.push(new THREE.Vector3(-1, 0, -1));

      while (yticks.next()) {
         var gry = yticks.grpos;
         var is_major = (yticks.kind===1);
         var lbl = this.y_handle.format(yticks.tick, true, true);
         if (yticks.last_major()) lbl = "y"; else
            if (lbl === null) { is_major = false; lbl = ""; }
         var plen = (is_major ? ticklen : ticklen*0.6) * Math.sin(Math.PI/4);

         if (is_major) {
            var text3d = new THREE.TextGeometry(lbl, { font: JSROOT.threejs_font_helvetiker_regular, size: textsize, height: 0, curveSegments: 10 });
            text3d.computeBoundingBox();
            var draw_width = text3d.boundingBox.max.x - text3d.boundingBox.min.x;
            text3d.translate(-draw_width/2, 0, 0);
            var text_pos = gry;

            if (!yticks.last_major()) {
               var space = (yticks.next_major_grpos() - gry);
               if (draw_width > 0)
                  text_scale = Math.min(text_scale, 0.95*space/draw_width)
               if (this.y_handle.IsCenterLabels()) text_pos += space/2;
            }

            text3d.computeBoundingBox();
            var centerOffset = 0.5 * (text3d.boundingBox.max.x - text3d.boundingBox.min.x);

            if (bothsides) {
               text = new THREE.Mesh(text3d, textMaterial);
               text.position.set(grmaxx + plen + textsize, text_pos, grminz - plen - textsize);
               text.rotation.y = Math.PI / 4;
               text.rotation.z = Math.PI / 2;
               text.name = "Y axis";
               this.toplevel.add(text);
               lbls.push(text);
            }

            text = new THREE.Mesh(text3d, textMaterial);
            text.position.set(grminx - plen - textsize, text_pos, grminz - plen - textsize);
            text.rotation.y = -Math.PI / 4;
            text.rotation.z = -Math.PI / 2;
            text.name = "Y axis";
            this.toplevel.add(text);
            lbls.push(text);
         }
         if (bothsides) {
            tick = new THREE.Line(geometry, lineMaterial);
            tick.position.set(grmaxx,gry,grminz);
            tick.scale.set(plen,1,plen);
            tick.rotation.z = Math.PI;
            tick.name = "Y axis " + this.y_handle.format(yticks.tick);
            this.toplevel.add(tick);
         }
         tick = new THREE.Line(geometry, lineMaterial);
         tick.position.set(grminx,gry,grminz);
         tick.scale.set(plen,1, plen);
         tick.name = "Y axis " + this.y_handle.format(yticks.tick);
         this.toplevel.add(tick);
      }

      var zticks = this.z_handle.CreateTicks();
      geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(0, 0, 0));
      geometry.vertices.push(new THREE.Vector3(-1, 1, 0));
      var zgrid = null;
      if (this.scale_z_grid && zsides[1] && (this.size3d !== 0))
         zgrid = new THREE.Geometry(); // container for grid
      while (zticks.next()) {
         var grz = zticks.grpos;
         var is_major = zticks.kind == 1;

         var lbl = this.z_handle.format(zticks.tick, true, true);
         if (lbl === null) { is_major = false; lbl = ""; }
         var plen = (is_major ? ticklen : ticklen * 0.6) * Math.sin(Math.PI/4);

         if (is_major && lbl && (lbl.length>0)) {
            var text3d = new THREE.TextGeometry(lbl, { font: JSROOT.threejs_font_helvetiker_regular, size : textsize, height : 0, curveSegments : 10 });
            text3d.computeBoundingBox();
            var offset = 0.8 * (text3d.boundingBox.max.x - text3d.boundingBox.min.x) + 0.7 * textsize;

            var textz = grz - 0.4*textsize;

            if (zsides[0]) {
               text = new THREE.Mesh(text3d, textMaterial);
               text.position.set(grminx - offset, grmaxy + offset, textz);
               text.rotation.x = 0.5*Math.PI;
               text.rotation.y = -0.25*Math.PI;
               text.name = "Z axis";
               this.toplevel.add(text);
               lbls.push(text);
            }

            if (zsides[1]) {
               text = new THREE.Mesh(text3d, textMaterial);
               text.position.set(grmaxx + offset, grmaxy + offset, textz);
               text.rotation.x = 0.5*Math.PI;
               text.rotation.y = -0.75 * Math.PI;
               text.name = "Z axis";
               this.toplevel.add(text);
               lbls.push(text);
            }

            if (zsides[2]) {
               text = new THREE.Mesh(text3d, textMaterial);
               text.position.set(grmaxx + offset, grminy - offset, textz);
               text.rotation.x = 0.5*Math.PI;
               text.rotation.y = 0.75*Math.PI;
               text.name = "Z axis";
               this.toplevel.add(text);
               lbls.push(text);
            }

            if (zsides[3]) {
               text = new THREE.Mesh(text3d, textMaterial);
               text.position.set(grminx - offset, grminy - offset, textz);
               text.rotation.x = 0.5*Math.PI;
               text.rotation.y = 0.25*Math.PI;
               text.name = "Z axis";
               this.toplevel.add(text);
               lbls.push(text);
            }
         }

         // create grid
         if (zgrid && is_major) {
            zgrid.vertices.push(new THREE.Vector3(grmaxx, grmaxy, grz));
            zgrid.vertices.push(new THREE.Vector3(grminx, grmaxy, grz));

            zgrid.vertices.push(new THREE.Vector3(grmaxx, grmaxy, grz));
            zgrid.vertices.push(new THREE.Vector3(grmaxx, grminy, grz));
         }

         if (zsides[0]) {
            tick = new THREE.Line(geometry, lineMaterial);
            tick.position.set(grminx,grmaxy,grz);
            tick.scale.set(plen,plen,1);
            tick.name = "Z axis " + this.z_handle.format(zticks.tick);
            this.toplevel.add(tick);
         }


         if (zsides[1]) {
            tick = new THREE.Line(geometry, lineMaterial);
            tick.position.set(grmaxx,grmaxy,grz);
            tick.scale.set(plen,plen,1);
            tick.rotation.z = -Math.PI/2;
            tick.name = "Z axis " + this.z_handle.format(zticks.tick);
            this.toplevel.add(tick);
         }

         if (zsides[2]) {
            tick = new THREE.Line(geometry, lineMaterial);
            tick.position.set(grmaxx,grminy,grz);
            tick.scale.set(plen,plen,1);
            tick.rotation.z = Math.PI;
            tick.name = "Z axis " + this.z_handle.format(zticks.tick);
            this.toplevel.add(tick);
         }

         if (zsides[3]) {
            tick = new THREE.Line(geometry, lineMaterial);
            tick.position.set(grminx,grminy,grz);
            tick.scale.set(plen,plen,1);
            tick.rotation.z = Math.PI/2;
            tick.name = "Z axis " + this.z_handle.format(zticks.tick);
            this.toplevel.add(tick);
         }
      }

      if (zgrid && (zgrid.vertices.length > 0)) {
         // var material = new THREE.LineBasicMaterial({ color: 0x0, linewidth: 0.5 });
         var material = new THREE.LineDashedMaterial( { color: 0x0, dashSize: 10, gapSize: 2, linewidth: 0.5 } );
         var lines = new THREE.LineSegments(zgrid, material);
         this.toplevel.add(lines);
      }

      if (text_scale < 1)
         lbls.forEach(function(mesh) { mesh.scale.set(text_scale, text_scale, 1); });

      // for TAxis3D do not show final cube
      if (this.size3d === 0) return;


      if (zsides[0] && zsides[1] && zsides[2] && zsides[3]) {
         // draw complete box - use BoxGeometry

         var wireMaterial = new THREE.MeshBasicMaterial({
            color : 0x000000,
            wireframe : true,
            wireframeLinewidth : 0.5,
            side : THREE.DoubleSide
         });

         // create a new mesh with cube geometry
         var cube = new THREE.Mesh(new THREE.BoxGeometry(this.size3d * 2, this.size3d * 2, this.size3d * 2), wireMaterial);
         //cube.position.y = size;

         var helper = new THREE.BoxHelper(cube);
         helper.material.color.set(0x000000);

         var box = new THREE.Object3D();
         box.add(helper);
         box.position.z = this.size3d;

         // add the cube to the scene
         this.toplevel.add(box);
      } else {
         var geom = new THREE.Geometry();

         geom.vertices.push(new THREE.Vector3(grminx, grminy, grminz));
         geom.vertices.push(new THREE.Vector3(grminx, grmaxy, grminz));

         geom.vertices.push(new THREE.Vector3(grminx, grminy, grminz));
         geom.vertices.push(new THREE.Vector3(grmaxx, grminy, grminz));

         if (bothsides) {
            geom.vertices.push(new THREE.Vector3(grminx, grmaxy, grminz));
            geom.vertices.push(new THREE.Vector3(grmaxx, grmaxy, grminz));

            geom.vertices.push(new THREE.Vector3(grmaxx, grminy, grminz));
            geom.vertices.push(new THREE.Vector3(grmaxx, grmaxy, grminz));
         }

         if (zsides[0]) {
            geom.vertices.push(new THREE.Vector3(grminx, grmaxy, grminz));
            geom.vertices.push(new THREE.Vector3(grminx, grmaxy, grmaxz));
         }

         if (zsides[1]) {
            geom.vertices.push(new THREE.Vector3(grmaxx, grmaxy, grminz));
            geom.vertices.push(new THREE.Vector3(grmaxx, grmaxy, grmaxz));

            geom.vertices.push(new THREE.Vector3(grmaxx, grmaxy, grmaxz));
            geom.vertices.push(new THREE.Vector3(grminx, grmaxy, grmaxz));

            geom.vertices.push(new THREE.Vector3(grmaxx, grmaxy, grmaxz));
            geom.vertices.push(new THREE.Vector3(grmaxx, grminy, grmaxz));
         }

         if (zsides[2]) {
            geom.vertices.push(new THREE.Vector3(grmaxx, grminy, grminz));
            geom.vertices.push(new THREE.Vector3(grmaxx, grminy, grmaxz));
         }

         if (zsides[3]) {
            geom.vertices.push(new THREE.Vector3(grminx, grminy, grminz));
            geom.vertices.push(new THREE.Vector3(grminx, grminy, grmaxz));

            geom.vertices.push(new THREE.Vector3(grminx, grminy, grmaxz));
            geom.vertices.push(new THREE.Vector3(grminx, grmaxy, grmaxz));

            geom.vertices.push(new THREE.Vector3(grminx, grminy, grmaxz));
            geom.vertices.push(new THREE.Vector3(grmaxx, grminy, grmaxz));
         }

         var material = new THREE.LineBasicMaterial({ color: 0x0, linewidth: 1 });

         var lines = new THREE.LineSegments(geom, material);
         this.toplevel.add(lines);
      }
   }

   JSROOT.Painter.TH2Painter_Draw3DBins = function() {
      // Perform TH2 lego plot with BufferGeometry

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
      var showmin = (this.options.Zero === 0);

      var i1 = this.GetSelectIndex("x", "left", 0),
          i2 = this.GetSelectIndex("x", "right", 1),
          j1 = this.GetSelectIndex("y", "left", 0),
          j2 = this.GetSelectIndex("y", "right", 1),
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

      for (j=j1;j<=j2;++j) {
         y1 = this.GetBinY(j);
         if (main.logy && (y1 <= 0)) { j1 = j+1; continue; }
         yy[j] = this.ty(y1);
         if (yy[j] < -1.001*this.size3d) j1 = j+1;
         if (yy[j] > 1.001*this.size3d) j2 = j-1;
      }

      if ((i1 >= i2) || (j1>=j2)) return;

      // DRAW ALL CUBES

      var levels = [ axis_zmin, axis_zmax ], palette = null, totalvertices = 0;

      if (this.options.Lego == 12) {
         levels = this.CreateContour(20, axis_zmin, axis_zmax, this.minposbin);
         palette = this.GetPalette();
         // console.log('levels', levels, 'palette', palette);
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
               var notop = !reduced && (binz > zmax);

               numvertices += (reduced ? 12 : indicies.length);
               if (nobottom) numvertices -= 6;
               if (notop) numvertices -= 6;
            }

         totalvertices+=numvertices;

         var positions = new Float32Array( numvertices * 3 );
         var normals = new Float32Array( numvertices * 3 );
         var bins_index = new Uint32Array(numvertices);
         var v = 0, vert, bin, k, nn;

         for (i=i1;i<i2;++i) {
            x1 = xx[i];
            x2 = xx[i+1];
            for (j=j1;j<j2;++j) {
               var binz = this.histo.getBinContent(i+1, j+1);
               if (binz < zmin) continue;
               var reduced = (binz === zmin);
               if (reduced && ((nlevel>0) || !showmin)) continue;
               var nobottom = !reduced && (nlevel>0);
               var notop = !reduced && (binz > zmax);

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

      // console.log('Total number of vertices ',totalvertices);

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
      bins_index = new Uint32Array( numsegments );

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
               bins_index[ii] = bin_index;
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
      line.bins_index = bins_index;
      line.painter = this;

      line.tooltip = function(intersect) {
         if ((intersect.index<0) || (intersect.index >= this.bins_index.length)) return null;
         return this.painter.Get3DToolTip(this.bins_index[intersect.index]);
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

         // do rendering, most consuming time
         this.renderer.render(this.scene, this.camera);

         var tm2 = new Date();

         delete this.render_tmout;

         if (this.first_render_tm === 0) {
            this.first_render_tm = tm2.getTime() - tm1.getTime();
            console.log('First render tm = ' + this.first_render_tm);
            this['Add3DInteraction'] = JSROOT.Painter.add3DInteraction;
            this.Add3DInteraction();
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

   JSROOT.Painter.TH2Painter_Draw3D = function(call_back) {
      // function called with this as painter

      this.Create3DScene();

      var pad = this.root_pad();
      if (pad.fGridz === undefined) pad.fGridz = false;

      this.zmin = pad.fLogz ? this.gmin0bin * 0.3 : this.gminbin;
      this.zmax = this.gmaxbin;

      if (this.histo.fMinimum !== -1111) this.zmin = this.histo.fMinimum;
      if (this.histo.fMaximum !== -1111) this.zmax = this.histo.fMaximum;

      if (pad.fLogz && (this.zmin<=0)) this.zmin = this.zmax * 1e-5;

      this.zmax *= 1.1; // as it done in ROOT

      this.scale_z_sides = [true, true, true, true];
      if (!this.options.BackBox) this.scale_z_sides[1] = false;
      if (!this.options.FrontBox) this.scale_z_sides[3] = false;
      if (!this.options.BackBox && !this.options.FrontBox) this.scale_z_sides[2] = false;
      this.scale_z_grid = pad.fGridz && this.scale_z_sides[1];

      this.DrawXYZ();

      this.Draw3DBins();

      this.DrawTitle();

      this.Render3D();

      JSROOT.CallBack(call_back);
   }

   // ==============================================================================


   JSROOT.TH3Painter = function(histo) {
      JSROOT.THistPainter.call(this, histo);

      this['Create3DScene'] = JSROOT.Painter.HPainter_Create3DScene;
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

   JSROOT.TH3Painter.prototype.GetToolTip = function(bin) {
      var ix = bin % (this.nbinsx+2);
      var iy = ((bin - ix) / (this.nbinsx+2)) % (this.nbinsy+2);
      var iz = (bin - ix - iy * (this.nbinsx+2)) / (this.nbinsx+2) / (this.nbinsy+2);

      return this.GetTipName("<br/>")
                + 'x=' + JSROOT.FFormat(this.GetBinX(ix-0.5),"6.4g") + ' bin=' + ix + '<br/>'
                + 'y=' + JSROOT.FFormat(this.GetBinY(iy-0.5),"6.4g") + ' bin=' + iy + '<br/>'
                + 'z=' + JSROOT.FFormat(this.GetBinZ(iz-0.5),"6.4g") + ' bin=' + iz + '<br/>'
                + 'entries=' + JSROOT.FFormat(this.GetObject().getBinContent(ix, iy, iz), "7.0g");
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
         return this.painter.GetToolTip(this.bins[indx]);
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
         changed = pad_painter.CheckCanvasResize(size, JSROOT.browser.isFirefox ? false : true);

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

