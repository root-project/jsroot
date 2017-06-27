/// @file JSRoot3DPainter.js
/// JavaScript ROOT 3D graphics

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      // AMD. Register as an anonymous module.
      define( ['JSRootPainter', 'd3', 'threejs', 'threejs_all'], factory );
   } else
   if (typeof exports === 'object' && typeof module !== 'undefined') {
      var jsroot = require("./JSRootCore.js");
      factory(jsroot, require("./d3.min.js"), require("./three.min.js"), require("./three.extra.min.js"),
              jsroot.nodejs || (typeof document=='undefined') ? jsroot.nodejs_document : document);
   } else {

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'JSRoot3DPainter.js');

      if (typeof d3 != 'object')
         throw new Error('This extension requires d3.js', 'JSRoot3DPainter.js');

      if (typeof THREE == 'undefined')
         throw new Error('THREE is not defined', 'JSRoot3DPainter.js');

      factory(JSROOT, d3, THREE);
   }
} (function(JSROOT, d3, THREE, THREE_MORE, document) {

   JSROOT.sources.push("3d");

   if ((typeof document=='undefined') && (typeof window=='object')) document = window.document;

   if (typeof JSROOT.Painter != 'object')
      throw new Error('JSROOT.Painter is not defined', 'JSRoot3DPainter.js');

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

   JSROOT.Painter.TooltipFor3D = function(prnt, canvas) {
      this.tt = null;
      this.cont = null;
      this.lastlbl = '';
      this.parent = prnt ? prnt : document.body;
      this.canvas = canvas; // we need canvas to recalculate mouse events
      this.abspos = !prnt;

      this.check_parent = function(prnt) {
         if (prnt && (this.parent !== prnt)) {
            this.hide();
            this.parent = prnt;
         }
      }

      this.pos = function(e) {
         // method used to define position of next tooltip
         // event is delivered from canvas,
         // but position should be calculated relative to the element where tooltip is placed

         if (this.tt === null) return;
         var u,l;
         if (this.abspos) {
            l = JSROOT.browser.isIE ? (e.clientX + document.documentElement.scrollLeft) : e.pageX;
            u = JSROOT.browser.isIE ? (e.clientY + document.documentElement.scrollTop) : e.pageY;
         } else {

            l = e.offsetX;
            u = e.offsetY;

            var rect1 = this.parent.getBoundingClientRect(),
                rect2 = this.canvas.getBoundingClientRect();

            if ((rect1.left !== undefined) && (rect2.left!== undefined)) l += (rect2.left-rect1.left);

            if ((rect1.top !== undefined) && (rect2.top!== undefined)) u += rect2.top-rect1.top;

            if (l + this.tt.offsetWidth + 3 >= this.parent.offsetWidth)
               l = this.parent.offsetWidth - this.tt.offsetWidth - 3;

            if (u + this.tt.offsetHeight + 15 >= this.parent.offsetHeight)
               u = this.parent.offsetHeight - this.tt.offsetHeight - 15;

            // one should find parent with non-static position,
            // all absolute coordinates calculated relative to such node
            var abs_parent = this.parent;
            while (abs_parent) {
               var style = getComputedStyle(abs_parent);
               if (!style || (style.position !== 'static')) break;
               if (!abs_parent.parentNode || (abs_parent.parentNode.nodeType != 1)) break;
               abs_parent = abs_parent.parentNode;
            }

            if (abs_parent && (abs_parent !== this.parent)) {
               var rect0 = abs_parent.getBoundingClientRect();
               l+=(rect1.left - rect0.left);
               u+=(rect1.top - rect0.top);
            }

         }

         this.tt.style.top = (u + 15) + 'px';
         this.tt.style.left = (l + 3) + 'px';
      };

      this.show = function(v, mouse_pos, status_func) {
         // if (JSROOT.gStyle.Tooltip <= 0) return;
         if (!v || (v==="")) return this.hide();

         if (v && (typeof v =='object') && (v.lines || v.line)) {
            if (v.only_status) return this.hide();

            if (v.line) {
               v = v.line;
            } else {
               var res = v.lines[0];
               for (var n=1;n<v.lines.length;++n) res+= "<br/>" + v.lines[n];
               v = res;
            }
         }

         if (this.tt === null) {
            this.tt = document.createElement('div');
            this.tt.setAttribute('class', 'jsroot_tt3d_main');
            this.cont = document.createElement('div');
            this.cont.setAttribute('class', 'jsroot_tt3d_cont');
            this.tt.appendChild(this.cont);
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

      this.hide = function() {
         if (this.tt !== null)
            this.parent.removeChild(this.tt);

         this.tt = null;
         this.lastlbl = "";
      }

      return this;
   }


   JSROOT.Painter.CreateOrbitControl = function(painter, camera, scene, renderer, lookat) {

      if (JSROOT.gStyle.Zooming && JSROOT.gStyle.ZoomWheel)
         renderer.domElement.addEventListener( 'wheel', control_mousewheel);

      if (JSROOT.gStyle.Zooming && JSROOT.gStyle.ZoomMouse) {
         renderer.domElement.addEventListener( 'mousedown', control_mousedown);
         renderer.domElement.addEventListener( 'mouseup', control_mouseup);
      }

      var control = new THREE.OrbitControls(camera, renderer.domElement);

      control.enableDamping = false;
      control.dampingFactor = 1.0;
      control.enableZoom = true;
      if (lookat) {
         control.target.copy(lookat);
         control.target0.copy(lookat);
         control.update();
      }

      control.tooltip = new JSROOT.Painter.TooltipFor3D(painter.select_main().node(), renderer.domElement);

      control.painter = painter;
      control.camera = camera;
      control.scene = scene;
      control.renderer = renderer;
      control.raycaster = new THREE.Raycaster();
      control.raycaster.linePrecision = 10;
      control.mouse_zoom_mesh = null; // zoom mesh, currently used in the zooming
      control.block_ctxt = false; // require to block context menu command appearing after control ends, required in chrome which inject contextmenu when key released
      control.block_mousemove = false; // when true, tooltip or cursor will not react on mouse move
      control.cursor_changed = false;
      control.control_changed = false;
      control.control_active = false;
      control.mouse_ctxt = { x:0, y: 0, on: false };

      control.Cleanup = function() {
         if (JSROOT.gStyle.Zooming && JSROOT.gStyle.ZoomWheel)
            this.domElement.removeEventListener( 'wheel', control_mousewheel);
         if (JSROOT.gStyle.Zooming && JSROOT.gStyle.ZoomMouse) {
            this.domElement.removeEventListener( 'mousedown', control_mousedown);
            this.domElement.removeEventListener( 'mouseup', control_mouseup);
         }

         this.domElement.removeEventListener('dblclick', this.lstn_dblclick);
         this.domElement.removeEventListener('contextmenu', this.lstn_contextmenu);
         this.domElement.removeEventListener('mousemove', this.lstn_mousemove);
         this.domElement.removeEventListener('mouseleave', this.lstn_mouseleave);

         this.dispose(); // this is from OrbitControl itself

         this.tooltip.hide();
         delete this.tooltip;
         delete this.painter;
         delete this.camera;
         delete this.scene;
         delete this.renderer;
         delete this.raycaster;
         delete this.mouse_zoom_mesh;
      }

      control.HideTooltip = function() {
         this.tooltip.hide();
      }

      control.GetMousePos = function(evnt, mouse) {
         mouse.x = ('offsetX' in evnt) ? evnt.offsetX : evnt.layerX;
         mouse.y = ('offsetY' in evnt) ? evnt.offsetY : evnt.layerY;
         mouse.clientX = evnt.clientX;
         mouse.clientY = evnt.clientY;
         return mouse;
      }

      control.GetIntersects = function(mouse) {
         // domElement gives correct coordinate with canvas render, but isn't always right for webgl renderer
         var sz = (this.renderer instanceof THREE.WebGLRenderer) ? this.renderer.getSize() : this.renderer.domElement;
         var pnt = { x: mouse.x / sz.width * 2 - 1, y: -mouse.y / sz.height * 2 + 1 };

         this.camera.updateMatrix();
         this.camera.updateMatrixWorld();
         this.raycaster.setFromCamera( pnt, this.camera );
         var intersects = this.raycaster.intersectObjects(this.scene.children, true);

         // painter may want to filter intersects
         if (typeof this.painter.FilterIntersects == 'function')
            intersects = this.painter.FilterIntersects(intersects);

         return intersects;
      }

      control.DetectZoomMesh = function(evnt) {
         var mouse = this.GetMousePos(evnt, {});
         var intersects = this.GetIntersects(mouse);
         if (intersects)
            for (var n=0;n<intersects.length;++n)
               if (intersects[n].object.zoom)
                  return intersects[n];

         return null;
      }

      control.ProcessDblClick = function(evnt) {
         var intersect = this.DetectZoomMesh(evnt);
         if (intersect && this.painter) {
            this.painter.Unzoom(intersect.object.use_y_for_z ? "y" : intersect.object.zoom);
         } else {
            this.reset();
         }
         // this.painter.Render3D();
      }


      control.ChangeEvent = function() {
         this.mouse_ctxt.on = false; // disable context menu if any changes where done by orbit control
         this.painter.Render3D(0);
         this.control_changed = true;
      }

      control.StartEvent = function() {
         this.control_active = true;
         this.block_ctxt = false;
         this.mouse_ctxt.on = false;

         this.tooltip.hide();

         // do not reset here, problem of events sequence in orbitcontrol
         // it issue change/start/stop event when do zooming
         // control.control_changed = false;
      }

      control.EndEvent = function() {
         this.control_active = false;
         if (this.mouse_ctxt.on) {
            this.mouse_ctxt.on = false;
            this.ContextMenu(this.mouse_ctxt, this.GetIntersects(this.mouse_ctxt));
         } else
         if (this.control_changed) {
            // react on camera change when required
         }
         this.control_changed = false;
      }

      control.MainProcessContextMenu = function(evnt) {
         evnt.preventDefault();
         this.GetMousePos(evnt, this.mouse_ctxt);
         if (this.control_active)
            this.mouse_ctxt.on = true;
         else
         if (this.block_ctxt)
            this.block_ctxt = false;
         else
            this.ContextMenu(this.mouse_ctxt, this.GetIntersects(this.mouse_ctxt));
      }

      control.ContextMenu = function(pos, intersects) {
         // do nothing, function called when context menu want to be activated
      }

      control.SwitchTooltip = function(on) {
         this.block_mousemove = !on;
         if (on===false) {
            this.tooltip.hide();
            this.RemoveZoomMesh();
         }
      }

      control.RemoveZoomMesh = function() {
         if (this.mouse_zoom_mesh && this.mouse_zoom_mesh.object.ShowSelection())
            this.painter.Render3D();
         this.mouse_zoom_mesh = null; // in any case clear mesh, enable orbit control again
      }

      control.MainProcessMouseMove = function(evnt) {
         if (this.control_active && evnt.buttons && (evnt.buttons & 2))
            this.block_ctxt = true; // if right button in control was active, block next context menu

         if (this.control_active || this.block_mousemove || !this.ProcessMouseMove) return;

         if (this.mouse_zoom_mesh) {
            // when working with zoom mesh, need special handling

            var zoom2 = this.DetectZoomMesh(evnt), pnt2 = null;

            if (zoom2 && (zoom2.object === this.mouse_zoom_mesh.object)) {
               pnt2 = zoom2.point;
            } else {
               pnt2 = this.mouse_zoom_mesh.object.GlobalIntersect(this.raycaster);
            }

            if (pnt2) this.mouse_zoom_mesh.point2 = pnt2;

            if (pnt2 && this.painter.enable_hightlight)
               if (this.mouse_zoom_mesh.object.ShowSelection(this.mouse_zoom_mesh.point, pnt2))
                  this.painter.Render3D(0);

            this.tooltip.hide();
            return;
         }

         evnt.preventDefault();

         var mouse = this.GetMousePos(evnt, {}),
             intersects = this.GetIntersects(mouse),
             tip = this.ProcessMouseMove(intersects),
             status_func = this.painter.GetShowStatusFunc();

         if (tip && status_func) {
            var name = "", title = "", coord = "", info = "";
            if (mouse) coord = mouse.x.toFixed(0)+ "," + mouse.y.toFixed(0);
            if (typeof tip == "string") {
               info = tip;
            } else {
               name = tip.name; title = tip.title;
               if (tip.line) info = tip.line; else
               if (tip.lines) { info = tip.lines.slice(1).join(' '); name = tip.lines[0]; }
            }
            status_func(name, title, info, coord);
         }

         this.cursor_changed = false;
         if (tip && this.painter.tooltip_allowed) {
            this.tooltip.check_parent(this.painter.select_main().node());

            this.tooltip.show(tip, mouse);
            this.tooltip.pos(evnt)
         } else {
            this.tooltip.hide();
            if (intersects)
               for (var n=0;n<intersects.length;++n)
                  if (intersects[n].object.zoom) this.cursor_changed = true;
         }

         document.body.style.cursor = this.cursor_changed ? 'pointer' : 'auto';
      };

      control.MainProcessMouseLeave = function() {
         this.tooltip.hide();
         if (typeof this.ProcessMouseLeave === 'function') this.ProcessMouseLeave();
         if (this.cursor_changed) {
            document.body.style.cursor = 'auto';
            this.cursor_changed = false;
         }
      };

      function control_mousewheel(evnt) {
         // try to handle zoom extra

         if (JSROOT.Painter.IsRender3DFired(control.painter) || control.mouse_zoom_mesh) {
            evnt.preventDefault();
            evnt.stopPropagation();
            evnt.stopImmediatePropagation();
            return; // already fired redraw, do not react on the mouse wheel
         }

         var intersect = control.DetectZoomMesh(evnt);
         if (!intersect) return;

         evnt.preventDefault();
         evnt.stopPropagation();
         evnt.stopImmediatePropagation();

         if (control.painter && (control.painter.AnalyzeMouseWheelEvent!==undefined)) {
            var kind = intersect.object.zoom,
                position = intersect.point[kind],
                item = { name: kind, ignore: false };

            // z changes from 0..2*size_z3d, others -size_xy3d..+size_xy3d
            if (kind!=="z") position = (position + control.painter.size_xy3d)/2/control.painter.size_xy3d;
                       else position = position/2/control.painter.size_z3d;

            control.painter.AnalyzeMouseWheelEvent(evnt, item, position, false);

            if ((kind==="z") && intersect.object.use_y_for_z) kind="y";

            control.painter.Zoom(kind, item.min, item.max);
         }
      }

      function control_mousedown(evnt) {
         // function used to hide some events from orbit control and redirect them to zooming rect

         if (control.mouse_zoom_mesh) {
            evnt.stopImmediatePropagation();
            evnt.stopPropagation();
            return;
         }

         // only left-button is considered
         if ((evnt.button!==undefined) && (evnt.button !==0)) return;
         if ((evnt.buttons!==undefined) && (evnt.buttons !== 1)) return;

         control.mouse_zoom_mesh = control.DetectZoomMesh(evnt);
         if (!control.mouse_zoom_mesh) return;

         // just block orbit control
         evnt.stopImmediatePropagation();
         evnt.stopPropagation();
      }

      function control_mouseup(evnt) {
         if (control.mouse_zoom_mesh && control.mouse_zoom_mesh.point2 && control.painter.Get3DZoomCoord) {

            var kind = control.mouse_zoom_mesh.object.zoom,
                pos1 = control.painter.Get3DZoomCoord(control.mouse_zoom_mesh.point, kind),
                pos2 = control.painter.Get3DZoomCoord(control.mouse_zoom_mesh.point2, kind);

            if (pos1>pos2) { var v = pos1; pos1 = pos2; pos2 = v; }

            if ((kind==="z") && control.mouse_zoom_mesh.object.use_y_for_z) kind="y";

            if ((kind==="z") && control.mouse_zoom_mesh.object.use_y_for_z) kind="y";

            // try to zoom
            if (pos1 < pos2)
              if (control.painter.Zoom(kind, pos1, pos2))
                 control.mouse_zoom_mesh = null;
         }

         // if selection was drawn, it should be removed and picture rendered again
         control.RemoveZoomMesh();
      }

      control.MainProcessDblClick = function(evnt) {
         this.ProcessDblClick(evnt);
      }

      control.addEventListener( 'change', control.ChangeEvent.bind(control));
      control.addEventListener( 'start', control.StartEvent.bind(control));
      control.addEventListener( 'end', control.EndEvent.bind(control));

      control.lstn_contextmenu = control.MainProcessContextMenu.bind(control);
      control.lstn_dblclick = control.MainProcessDblClick.bind(control);
      control.lstn_mousemove = control.MainProcessMouseMove.bind(control);
      control.lstn_mouseleave = control.MainProcessMouseLeave.bind(control);

      renderer.domElement.addEventListener('dblclick', control.lstn_dblclick);
      renderer.domElement.addEventListener('contextmenu', control.lstn_contextmenu);
      renderer.domElement.addEventListener('mousemove', control.lstn_mousemove);
      renderer.domElement.addEventListener('mouseleave', control.lstn_mouseleave);

      return control;
   }

   JSROOT.Painter.DisposeThreejsObject = function(obj, only_childs) {
      if (!obj) return;

      if (obj.children) {
         for (var i = 0; i < obj.children.length; i++)
            JSROOT.Painter.DisposeThreejsObject(obj.children[i]);
      }

      if (only_childs) {
         obj.children = [];
         return;
      }

      obj.children = undefined;

      if (obj.geometry) {
         obj.geometry.dispose();
         obj.geometry = undefined;
      }
      if (obj.material) {
         if (obj.material.map) {
            obj.material.map.dispose();
            obj.material.map = undefined;
         }
         obj.material.dispose();
         obj.material = undefined;
      }

      // cleanup jsroot fields to simplify browser cleanup job
      delete obj.painter;
      delete obj.bins_index;
      delete obj.tooltip;
      delete obj.stack; // used in geom painter

      obj = undefined;
   }

   JSROOT.Painter.HPainter_TestAxisVisibility = function(camera, toplevel, fb, bb) {
      var top;
      for (var n=0;n<toplevel.children.length;++n) {
         top = toplevel.children[n];
         if (top.axis_draw) break;
         top = undefined;
      }

      if (!top) return;

      if (!camera) {
         // this is case when axis drawing want to be removed
         toplevel.remove(top);
         delete this.TestAxisVisibility;
         return;
      }

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

   JSROOT.Painter.createLineSegments = function(arr, material, index, only_geometry) {
      // prepare geometry for THREE.LineSegments
      // If required, calculate lineDistance attribute for dashed geometries

      var geom = new THREE.BufferGeometry();

      geom.addAttribute( 'position', arr instanceof Float32Array ? new THREE.BufferAttribute( arr, 3 ) : new THREE.Float32BufferAttribute( arr, 3 ) );
      if (index) geom.setIndex(  new THREE.BufferAttribute(index, 1) );

      if (material.isLineDashedMaterial) {

         var v1 = new THREE.Vector3(),
             v2 = new THREE.Vector3(),
             d = 0, distances = null;

         if (index) {
            distances = new Float32Array(index.length);
            for (var n=0; n<index.length; n+=2) {
               var i1 = index[n], i2 = index[n+1];
               v1.set(arr[i1],arr[i1+1],arr[i1+2]);
               v2.set(arr[i2],arr[i2+1],arr[i2+2]);
               distances[n] = d;
               d += v2.distanceTo( v1 );
               distances[n+1] = d;
            }
         } else {
            distances = new Float32Array(arr.length/3);
            for (var n=0; n<arr.length; n+=6) {
               v1.set(arr[n],arr[n+1],arr[n+2]);
               v2.set(arr[n+3],arr[n+4],arr[n+5]);
               distances[n/3] = d;
               d += v2.distanceTo( v1 );
               distances[n/3+1] = d;
            }
         }
         geom.addAttribute( 'lineDistance', new THREE.BufferAttribute(distances, 1) );
      }

      return only_geometry ? geom : new THREE.LineSegments(geom, material);
   }


   JSROOT.Painter.Box_Vertices = [
       new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 0),
       new THREE.Vector3(1, 0, 1), new THREE.Vector3(1, 0, 0),
       new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 1, 1),
       new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1)
   ];

   JSROOT.Painter.Box_Indexes = [ 0,2,1, 2,3,1, 4,6,5, 6,7,5, 4,5,1, 5,0,1, 7,6,2, 6,3,2, 5,7,0, 7,2,0, 1,3,4, 3,6,4 ];

   JSROOT.Painter.Box_Normals = [ 1,0,0, -1,0,0, 0,1,0, 0,-1,0, 0,0,1, 0,0,-1 ];

   // segments addresses Box_Vertices
   JSROOT.Painter.Box_Segments = [0, 2, 2, 7, 7, 5, 5, 0, 1, 3, 3, 6, 6, 4, 4, 1, 1, 0, 3, 2, 6, 7, 4, 5];

   // these segments address vertices from the mesh, we can use positions from box mesh
   JSROOT.Painter.Box_MeshSegments = (function() {
      var arr = new Int32Array(JSROOT.Painter.Box_Segments.length);
      for (var n=0;n<arr.length;++n) {
         for (var k=0;k<JSROOT.Painter.Box_Indexes.length;++k)
            if (JSROOT.Painter.Box_Segments[n] === JSROOT.Painter.Box_Indexes[k]) {
               arr[n] = k; break;
            }
      }
      return arr;
   })();

   JSROOT.Painter.IsRender3DFired = function(painter) {
      if (!painter || painter.renderer === undefined) return false;

      return painter.render_tmout !== undefined; // when timeout configured, object is prepared for rendering
   }

   // ==============================================================================

   JSROOT.Painter.PointsCreator = function(size, iswebgl, scale) {
      if (iswebgl === undefined) iswebgl = true;
      this.realwebgl = iswebgl;
      this.webgl = iswebgl;
      this.scale = scale || 1.;

      if (this.webgl) {
         this.pos = new Float32Array(size*3);
         this.geom = new THREE.BufferGeometry();
         this.geom.addAttribute( 'position', new THREE.BufferAttribute( this.pos, 3 ) );
         this.indx = 0;
      } else {
         // only plain geometry supported by canvasrenderer
         this.geom = new THREE.Geometry();
      }
   }

   JSROOT.Painter.PointsCreator.prototype.AddPoint = function(x,y,z) {
      if (this.webgl) {
         this.pos[this.indx]   = x;
         this.pos[this.indx+1] = y;
         this.pos[this.indx+2] = z;
         this.indx+=3;
      } else {
         this.geom.vertices.push(new THREE.Vector3( x, y, z ));
      }
   }

   JSROOT.Painter.PointsCreator.prototype.CreatePoints = function(mcolor) {
      // only plain geometry and sprite material is supported by CanvasRenderer, but it cannot be scaled

      var material = new THREE.PointsMaterial( { size: (this.webgl ? 3 : 1)*this.scale, color: mcolor || 'black' } );

      var pnts = new THREE.Points(this.geom, material);
      pnts.nvertex = 1;
      return pnts;
   }

   // ===========================================================================================

   JSROOT.TGraph2DPainter = function(graph) {
      JSROOT.TObjectPainter.call(this, graph);
   }

   JSROOT.TGraph2DPainter.prototype = Object.create(JSROOT.TObjectPainter.prototype);

   JSROOT.TGraph2DPainter.prototype.DecodeOptions = function(opt) {
      var d = new JSROOT.DrawOptions(opt);

      var res = { Color: d.check("COL"),
                  Error: d.check("ERR") && this.MatchObjectType("TGraph2DErrors"),
                  Markers: d.check("P") };

      if (!res.Markers && !res.Error) res.Markers = true;
      if (!res.Markers) res.Color = false;

      return res;
   }

   JSROOT.TGraph2DPainter.prototype.CreateHistogram = function() {
      var gr = this.GetObject();

      var xmin = gr.fX[0], xmax = xmin,
          ymin = gr.fY[0], ymax = ymin,
          zmin = gr.fZ[0], zmax = zmin;

      for (var p = 0; p < gr.fNpoints;++p) {

         var x = gr.fX[p], y = gr.fY[p], z = gr.fZ[p],
             errx = this.options.Error ? gr.fEX[p] : 0,
             erry = this.options.Error ? gr.fEY[p] : 0,
             errz = this.options.Error ? gr.fEZ[p] : 0;

         xmin = Math.min(xmin, x-errx);
         xmax = Math.max(xmax, x+errx);
         ymin = Math.min(ymin, y-erry);
         ymax = Math.max(ymax, y+erry);
         zmin = Math.min(zmin, z-errz);
         zmax = Math.max(zmax, z+errz);
      }

      if (xmin >= xmax) xmax = xmin+1;
      if (ymin >= ymax) ymax = ymin+1;
      if (zmin >= zmax) zmax = zmin+1;
      var dx = (xmax-xmin)*0.02, dy = (ymax-ymin)*0.02, dz = (zmax-zmin)*0.02,
          uxmin = xmin - dx, uxmax = xmax + dx,
          uymin = ymin - dy, uymax = ymax + dy,
          uzmin = zmin - dz, uzmax = zmax + dz;

      if ((uxmin<0) && (xmin>=0)) uxmin = xmin*0.98;
      if ((uxmax>0) && (xmax<=0)) uxmax = 0;

      if ((uymin<0) && (ymin>=0)) uymin = ymin*0.98;
      if ((uymax>0) && (ymax<=0)) uymax = 0;

      if ((uzmin<0) && (zmin>=0)) uzmin = zmin*0.98;
      if ((uzmax>0) && (zmax<=0)) uzmax = 0;

      var graph = this.GetObject();

      if (graph.fMinimum != -1111) uzmin = graph.fMinimum;
      if (graph.fMaximum != -1111) uzmax = graph.fMaximum;

      var histo = JSROOT.CreateHistogram("TH2I", 10, 10);
      histo.fName = graph.fName + "_h";
      histo.fTitle = graph.fTitle;
      histo.fXaxis.fXmin = uxmin;
      histo.fXaxis.fXmax = uxmax;
      histo.fYaxis.fXmin = uymin;
      histo.fYaxis.fXmax = uymax;
      histo.fZaxis.fXmin = uzmin;
      histo.fZaxis.fXmax = uzmax;
      histo.fMinimum = uzmin;
      histo.fMaximum = uzmax;
      histo.fBits = histo.fBits | JSROOT.TH1StatusBits.kNoStats;
      return histo;
   }

   JSROOT.TGraph2DPainter.prototype.Graph2DTooltip = function(intersect) {
      var indx = Math.floor(intersect.index / this.nvertex);
      if ((indx<0) || (indx >= this.index.length)) return null;

      indx = this.index[indx];

      var p = this.painter,
          grx = p.grx(this.graph.fX[indx]),
          gry = p.gry(this.graph.fY[indx]),
          grz = p.grz(this.graph.fZ[indx]),
          tip = { info: this.tip_name + "<br/>" +
                "pnt: " + indx + "<br/>" +
                "x: " + p.x_handle.format(this.graph.fX[indx]) + "<br/>" +
                "y: " + p.y_handle.format(this.graph.fY[indx]) + "<br/>" +
                "z: " + p.z_handle.format(this.graph.fZ[indx]) };

      tip.x1 = grx - this.scale0; tip.x2 = grx + this.scale0;
      tip.y1 = gry - this.scale0; tip.y2 = gry + this.scale0;
      tip.z1 = grz - this.scale0; tip.z2 = grz + this.scale0;

      tip.color = this.tip_color;

      return tip;
   }

   JSROOT.TGraph2DPainter.prototype.Redraw = function() {

      var main = this.main_painter(),
          graph = this.GetObject(),
          step = 1;

      if (!graph || !main  || !('renderer' in main)) return;

      function CountSelected(zmin, zmax) {
         var cnt = 0;
         for (var i=0; i < graph.fNpoints; ++i) {
            if ((graph.fX[i] < main.scale_xmin) || (graph.fX[i] > main.scale_xmax) ||
                  (graph.fY[i] < main.scale_ymin) || (graph.fY[i] > main.scale_ymax) ||
                  (graph.fZ[i] < zmin) || (graph.fZ[i] >= zmax)) continue;

            ++cnt;
         }
         return cnt;
      }

      // try to define scale-down factor
      if ((JSROOT.gStyle.OptimizeDraw > 0) && !main.webgl) {
         var numselected = CountSelected(main.scale_zmin, main.scale_zmax),
             sizelimit = 50000;

         if (numselected > sizelimit) {
            step = Math.floor(numselected / sizelimit);
            if (step <= 2) step = 2;
         }
      }

      var markeratt = JSROOT.Painter.createAttMarker(graph),
         palette = null,
         levels = [main.scale_zmin, main.scale_zmax],
         scale = main.size_xy3d / 100 * markeratt.size * markeratt.scale;

      if (main.usesvg) scale*=0.3;

      if (this.options.Color) {
         levels = main.GetContour();
         palette = main.GetPalette();
      }

      for (var lvl=0;lvl<levels.length-1;++lvl) {

         var lvl_zmin = Math.max(levels[lvl], main.scale_zmin),
             lvl_zmax = Math.min(levels[lvl+1], main.scale_zmax);

         if (lvl_zmin >= lvl_zmax) continue;

         var size = Math.floor(CountSelected(lvl_zmin, lvl_zmax) / step),
             pnts = null, select = 0,
             index = new Int32Array(size), icnt = 0,
             err = null, ierr = 0;

         if (this.options.Markers)
            pnts = new JSROOT.Painter.PointsCreator(size, main.webgl, scale/3);

         if (this.options.Error)
            err = new Float32Array(size*6*3);

         for (var i=0; i < graph.fNpoints; ++i) {
            if ((graph.fX[i] < main.scale_xmin) || (graph.fX[i] > main.scale_xmax) ||
                (graph.fY[i] < main.scale_ymin) || (graph.fY[i] > main.scale_ymax) ||
                (graph.fZ[i] < lvl_zmin) || (graph.fZ[i] >= lvl_zmax)) continue;

            if (step > 1) {
               select = (select+1) % step;
               if (select!==0) continue;
            }

            index[icnt++] = i; // remember point index for tooltip

            var x = main.grx(graph.fX[i]),
                y = main.gry(graph.fY[i]),
                z = main.grz(graph.fZ[i]);

            if (pnts) pnts.AddPoint(x,y,z);

            if (err) {
               err[ierr]   = main.grx(graph.fX[i] - graph.fEX[i]);
               err[ierr+1] = y;
               err[ierr+2] = z;
               err[ierr+3] = main.grx(graph.fX[i] + graph.fEX[i]);
               err[ierr+4] = y;
               err[ierr+5] = z;
               ierr+=6;
               err[ierr]   = x;
               err[ierr+1] = main.gry(graph.fY[i] - graph.fEY[i]);
               err[ierr+2] = z;
               err[ierr+3] = x;
               err[ierr+4] = main.gry(graph.fY[i] + graph.fEY[i]);
               err[ierr+5] = z;
               ierr+=6;
               err[ierr]   = x;
               err[ierr+1] = y;
               err[ierr+2] = main.grz(graph.fZ[i] - graph.fEZ[i]);
               err[ierr+3] = x;
               err[ierr+4] = y;
               err[ierr+5] = main.grz(graph.fZ[i] + graph.fEZ[i]);;
               ierr+=6;
            }

         }

         if (err) {
            var lcolor = JSROOT.Painter.root_colors[this.GetObject().fLineColor],
                material = new THREE.LineBasicMaterial({ color: new THREE.Color(lcolor) });
            if (!JSROOT.browser.isIE) material.linewidth = this.GetObject().fLineWidth;
            var errmesh = JSROOT.Painter.createLineSegments(err, material);
            main.toplevel.add(errmesh);

            errmesh.graph = graph;
            errmesh.index = index;
            errmesh.painter = main;
            errmesh.scale0 = 0.7*scale;
            errmesh.tip_name = this.GetTipName();
            errmesh.tip_color = (graph.fMarkerColor === 3) ? 0xFF0000 : 0x00FF00;
            errmesh.nvertex = 6;

            errmesh.tooltip = this.Graph2DTooltip;
         }

         if (pnts) {

            var fcolor = JSROOT.Painter.root_colors[graph.fMarkerColor];

            if (palette) {
               var indx = Math.floor((lvl+0.99)*palette.length/(levels.length-1));
               if (indx >= palette.length) indx = palette.length-1;
               fcolor = palette[indx];
            }

            var mesh = pnts.CreatePoints(fcolor);

            main.toplevel.add(mesh);

            mesh.graph = graph;
            mesh.index = index;
            mesh.painter = main;
            mesh.scale0 = 0.3*scale;
            mesh.tip_name = this.GetTipName();
            mesh.tip_color = (graph.fMarkerColor === 3) ? 0xFF0000 : 0x00FF00;

            mesh.tooltip = this.Graph2DTooltip;
         }
      }

      main.Render3D(100); // set large timeout to be able draw other points
   }

   JSROOT.Painter.drawGraph2D = function(divid, gr, opt) {

      var painter = new JSROOT.TGraph2DPainter(gr);

      painter.SetDivId(divid, -1); // just to get access to existing elements

      painter.options = painter.DecodeOptions(opt);

      if (painter.main_painter()) {
         painter.SetDivId(divid);
         painter.Redraw();
         return painter.DrawingReady();
      }

      if (!gr.fHistogram)
         gr.fHistogram = painter.CreateHistogram();

      JSROOT.draw(divid, gr.fHistogram, "lego;axis", function(hpainter) {
         painter.ownhisto = true;
         painter.SetDivId(divid);
         painter.Redraw();
         return painter.DrawingReady();
      });

      return painter;
   }

   // ===================================================================

   JSROOT.Painter.drawPolyMarker3D = function(divid, poly, opt) {

      var painter = new JSROOT.TObjectPainter(poly);

      painter.SetDivId(divid);

      painter.Redraw = function() {

         var main = this.main_painter();

         if (!main  || !('renderer' in main)) return;

         var step = 1, sizelimit = 50000, numselect = 0;

         for (var i=0;i<poly.fP.length;i+=3) {
            if ((poly.fP[i] < main.scale_xmin) || (poly.fP[i] > main.scale_xmax) ||
                (poly.fP[i+1] < main.scale_ymin) || (poly.fP[i+1] > main.scale_ymax) ||
                (poly.fP[i+2] < main.scale_zmin) || (poly.fP[i+2] > main.scale_zmax)) continue;
            ++numselect;
         }

         if ((JSROOT.gStyle.OptimizeDraw > 0) && (numselect > sizelimit)) {
            step = Math.floor(numselect/sizelimit);
            if (step <= 2) step = 2;
         }

         var size = Math.floor(numselect/step),
             pnts = new JSROOT.Painter.PointsCreator(size, main.webgl, main.size_xy3d/100),
             index = new Int32Array(size),
             select = 0, icnt = 0;

         for (var i=0; i < poly.fP.length;i+=3) {

            if ((poly.fP[i] < main.scale_xmin) || (poly.fP[i] > main.scale_xmax) ||
                (poly.fP[i+1] < main.scale_ymin) || (poly.fP[i+1] > main.scale_ymax) ||
                (poly.fP[i+2] < main.scale_zmin) || (poly.fP[i+2] > main.scale_zmax)) continue;

            if (step > 1) {
               select = (select+1) % step;
               if (select!==0) continue;
            }

            index[icnt++] = i;

            pnts.AddPoint(main.grx(poly.fP[i]), main.gry(poly.fP[i+1]), main.grz(poly.fP[i+2]));
         }

         var mesh = pnts.CreatePoints(JSROOT.Painter.root_colors[poly.fMarkerColor]);

         main.toplevel.add(mesh);

         mesh.tip_color = (poly.fMarkerColor === 3) ? 0xFF0000 : 0x00FF00;
         mesh.poly = poly;
         mesh.painter = main;
         mesh.scale0 = 0.7*pnts.scale;
         mesh.index = index;

         mesh.tooltip = function(intersect) {
            var indx = Math.floor(intersect.index / this.nvertex);
            if ((indx<0) || (indx >= this.index.length)) return null;

            indx = this.index[indx];

            var p = this.painter;

            var tip = { info: "bin: " + indx/3 + "<br/>" +
                  "x: " + p.x_handle.format(this.poly.fP[indx]) + "<br/>" +
                  "y: " + p.y_handle.format(this.poly.fP[indx+1]) + "<br/>" +
                  "z: " + p.z_handle.format(this.poly.fP[indx+2]) };

            var grx = p.grx(this.poly.fP[indx]),
                gry = p.gry(this.poly.fP[indx+1]),
                grz = p.grz(this.poly.fP[indx+2]);

            tip.x1 = grx - this.scale0; tip.x2 = grx + this.scale0;
            tip.y1 = gry - this.scale0; tip.y2 = gry + this.scale0;
            tip.z1 = grz - this.scale0; tip.z2 = grz + this.scale0;

            tip.color = this.tip_color;

            return tip;
         }

         main.Render3D(100); // set large timeout to be able draw other points
      }

      painter.Redraw();

      return painter.DrawingReady();
   }

   return JSROOT.Painter;

}));

