/// ROOT7 histogram 3D graphics

import { constants, isBatchMode, getDocument } from '../core.mjs';

import { rgb as d3_rgb } from '../d3.mjs';

import { REVISION, DoubleSide,
         Object3D, Vector3, Matrix4, Line3, Color, Plane,
         Scene, PointLight, PerspectiveCamera,
         Mesh, MeshBasicMaterial, TextGeometry,
         LineSegments, LineBasicMaterial, LineDashedMaterial,
         BufferAttribute, BufferGeometry } from '../three.mjs';

import { RAxisPainter } from '../gpad/RAxisPainter.mjs';

import { assign3DHandler, disposeThreejsObject, createOrbitControl,
         createLineSegments, Box3D, createRender3D, beforeRender3D, afterRender3D, getRender3DKind,
         cleanupRender3D, HelveticerRegularFont, createSVGRenderer } from '../base/base3d.mjs';

import { translateLaTeX } from '../base/latex.mjs';

/** @summary Text 3d axis visibility
  * @private */
function testAxisVisibility(camera, toplevel, fb, bb) {
   let top;
   if (toplevel && toplevel.children)
      for (let n=0;n<toplevel.children.length;++n) {
         top = toplevel.children[n];
         if (top.axis_draw) break;
         top = undefined;
      }

   if (!top) return;

   if (!camera) {
      // this is case when axis drawing want to be removed
      toplevel.remove(top);
      return;
   }

   fb = fb ? true : false;
   bb = bb ? true : false;

   let qudrant = 1, pos = camera.position;
   if ((pos.x < 0) && (pos.y >= 0)) qudrant = 2;
   if ((pos.x >= 0) && (pos.y >= 0)) qudrant = 3;
   if ((pos.x >= 0) && (pos.y < 0)) qudrant = 4;

   let testvisible = (id, range) => {
      if (id <= qudrant) id+=4;
      return (id > qudrant) && (id < qudrant+range);
   };

   for (let n=0;n<top.children.length;++n) {
      let chld = top.children[n];
      if (chld.grid) chld.visible = bb && testvisible(chld.grid, 3); else
      if (chld.zid) chld.visible = testvisible(chld.zid, 2); else
      if (chld.xyid) chld.visible = testvisible(chld.xyid, 3); else
      if (chld.xyboxid) {
         let range = 5, shift = 0;
         if (bb && !fb) { range = 3; shift = -2; } else
         if (fb && !bb) range = 3; else
         if (!fb && !bb) range = (chld.bottom ? 3 : 0);
         chld.visible = testvisible(chld.xyboxid + shift, range);
         if (!chld.visible && chld.bottom && bb)
            chld.visible = testvisible(chld.xyboxid, 3);
      } else if (chld.zboxid) {
         let range = 2, shift = 0;
         if (fb && bb) range = 5; else
         if (bb && !fb) range = 4; else
         if (!bb && fb) { shift = -2; range = 4; }
         chld.visible = testvisible(chld.zboxid + shift, range);
      }
   }
}

/** @summary Set default camera position
  * @private */
function setCameraPosition(fp) {
   let max3dx = Math.max(0.75*fp.size_x3d, fp.size_z3d),
       max3dy = Math.max(0.75*fp.size_y3d, fp.size_z3d);

   if (max3dx === max3dy)
      fp.camera.position.set(-1.6*max3dx, -3.5*max3dy, 1.4*fp.size_z3d);
   else if (max3dx > max3dy)
      fp.camera.position.set(-2*max3dx, -3.5*max3dy, 1.4*fp.size_z3d);
   else
      fp.camera.position.set(-3.5*max3dx, -2*max3dy, 1.4*fp.size_z3d);

   fp.camera.lookAt(fp.lookat);
}

/** @summary Create all necessary components for 3D drawings */
function create3DScene(render3d) {

   if (render3d === -1) {

      if (!this.mode3d) return;

      if (!this.clear3dCanvas) {
         console.error('Strange, why mode3d is configured!!!!', this.mode3d);
         return;
      }

      testAxisVisibility(null, this.toplevel);

      this.clear3dCanvas();

      disposeThreejsObject(this.scene);
      if (this.control) this.control.cleanup();

      cleanupRender3D(this.renderer);

      delete this.size_x3d;
      delete this.size_y3d;
      delete this.size_z3d;
      delete this.tooltip_mesh;
      delete this.scene;
      delete this.toplevel;
      delete this.camera;
      delete this.pointLight;
      delete this.renderer;
      delete this.control;
      if (this.render_tmout) {
         clearTimeout(this.render_tmout);
         delete this.render_tmout;
      }

      this.mode3d = false;

      return;
   }

   this.mode3d = true; // indicate 3d mode as hist painter does

   if ('toplevel' in this) {
      // it is indication that all 3D object created, just replace it with empty
      this.scene.remove(this.toplevel);
      disposeThreejsObject(this.toplevel);
      delete this.tooltip_mesh;
      delete this.toplevel;
      if (this.control) this.control.HideTooltip();

      let newtop = new Object3D();
      this.scene.add(newtop);
      this.toplevel = newtop;

      this.resize3D(); // set actual sizes
      return;
   }

   assign3DHandler(this);

   render3d = getRender3DKind(render3d);
   let sz = this.getSizeFor3d(undefined, render3d);

   this.size_z3d = 100;
   this.size_x3d = this.size_y3d = (sz.height > 10) && (sz.width > 10) ? Math.round(sz.width/sz.height*this.size_z3d) : this.size_z3d;

   // three.js 3D drawing
   this.scene = new Scene();
   //scene.fog = new Fog(0xffffff, 500, 3000);

   this.toplevel = new Object3D();
   this.scene.add(this.toplevel);
   this.scene_width = sz.width;
   this.scene_height = sz.height;

   this.camera = new PerspectiveCamera(45, this.scene_width / this.scene_height, 1, 40*this.size_z3d);

   this.camera_Phi = 30;
   this.camera_Theta = 30;

   this.pointLight = new PointLight(0xffffff,1);
   this.camera.add(this.pointLight);
   this.pointLight.position.set(this.size_x3d/2, this.size_y3d/2, this.size_z3d/2);
   this.lookat = new Vector3(0,0,0.8*this.size_z3d);
   this.camera.up = new Vector3(0,0,1);
   this.scene.add( this.camera );

   setCameraPosition(this);

   this.renderer = createRender3D(this.scene_width, this.scene_height, render3d);

   this.webgl = (render3d === constants.Render3D.WebGL);
   this.add3dCanvas(sz, this.renderer.jsroot_dom, this.webgl);

   this.first_render_tm = 0;
   this.enable_highlight = false;

   if (isBatchMode() || !this.webgl) return;

   this.control = createOrbitControl(this, this.camera, this.scene, this.renderer, this.lookat);

   let axis_painter = this, obj_painter = this.getMainPainter();

   this.control.processMouseMove = function(intersects) {
      let tip = null, mesh = null, zoom_mesh = null;

      for (let i = 0; i < intersects.length; ++i) {
         if (intersects[i].object.tooltip) {
            tip = intersects[i].object.tooltip(intersects[i]);
            if (tip) { mesh = intersects[i].object; break; }
         } else if (intersects[i].object.zoom && !zoom_mesh) {
            zoom_mesh = intersects[i].object;
         }
      }

      if (tip && !tip.use_itself) {
         let delta_x = 1e-4*axis_painter.size_x3d,
             delta_y = 1e-4*axis_painter.size_y3d,
             delta_z = 1e-4*axis_painter.size_z3d;
         if ((tip.x1 > tip.x2) || (tip.y1 > tip.y2) || (tip.z1 > tip.z2)) console.warn('check 3D hints coordinates');
         tip.x1 -= delta_x; tip.x2 += delta_x;
         tip.y1 -= delta_y; tip.y2 += delta_y;
         tip.z1 -= delta_z; tip.z2 += delta_z;
      }

      axis_painter.highlightBin3D(tip, mesh);

      if (!tip && zoom_mesh && axis_painter.get3dZoomCoord) {
         let pnt = zoom_mesh.globalIntersect(this.raycaster),
             axis_name = zoom_mesh.zoom,
             axis_value = axis_painter.get3dZoomCoord(pnt, axis_name);

         if ((axis_name==="z") && zoom_mesh.use_y_for_z) axis_name = "y";

         let hint = { name: axis_name,
                      title: "RAxis",
                      line: "any info",
                      only_status: true };

         hint.line = axis_name + " : " + axis_painter.axisAsText(axis_name, axis_value);

         return hint;
      }

      return (tip && tip.lines) ? tip : "";
   };

   this.control.processMouseLeave = function() {
      axis_painter.highlightBin3D(null);
   };

   this.control.contextMenu = function(pos, intersects) {
      let kind = "painter", p = obj_painter;
      if (intersects)
         for (let n=0;n<intersects.length;++n) {
            let mesh = intersects[n].object;
            if (mesh.zoom) { kind = mesh.zoom; p = null; break; }
            if (mesh.painter && typeof mesh.painter.fillContextMenu === 'function') {
               p = mesh.painter; break;
            }
         }

      let fp = obj_painter.getFramePainter();
      if (fp && fp.showContextMenu)
         fp.showContextMenu(kind, pos, p);
   };
}

/** @summary call 3D rendering of the histogram drawing
  * @desc tmout specified delay, after which actual rendering will be invoked
  * Timeout used to avoid multiple rendering of the picture when several 3D drawings
  * superimposed with each other.
  * If tmeout <= 0, rendering performed immediately
  * If (tmout == -1111), immediate rendering with SVG renderer is performed
  * @private */
function render3D(tmout) {

   if (tmout === -1111) {
      // special handling for direct SVG renderer
      // probably, here one can use canvas renderer - after modifications
      let doc = getDocument(),
          rrr = createSVGRenderer(false, 0, doc);
      rrr.setSize(this.scene_width, this.scene_height);
      rrr.render(this.scene, this.camera);
      if (rrr.makeOuterHTML) {
         // use text mode, it is faster
         let d = doc.createElement('div');
         d.innerHTML = rrr.makeOuterHTML();
         return d.childNodes[0];
      }
      return rrr.domElement;
   }

   if (tmout === undefined) tmout = 5; // by default, rendering happens with timeout

   if ((tmout > 0) && this.webgl && isBatchMode()) {
       if (!this.render_tmout)
          this.render_tmout = setTimeout(() => this.render3D(0), tmout);
       return;
    }

   if (this.render_tmout) {
      clearTimeout(this.render_tmout);
      delete this.render_tmout;
   }

   if (!this.renderer) return;

   beforeRender3D(this.renderer);

   let tm1 = new Date();

   if (!this.opt3d) this.opt3d = { FrontBox: true, BackBox: true };

   testAxisVisibility(this.camera, this.toplevel, this.opt3d.FrontBox, this.opt3d.BackBox);

   // do rendering, most consuming time
   this.renderer.render(this.scene, this.camera);

   afterRender3D(this.renderer);

   let tm2 = new Date();

   if (this.first_render_tm === 0) {
      this.first_render_tm = tm2.getTime() - tm1.getTime();
      this.enable_highlight = (this.first_render_tm < 1200) && this.isTooltipAllowed();
      console.log(`three.js r${REVISION}, first render tm = ${this.first_render_tm}`);
   }
}

/** @summary Check is 3D drawing need to be resized
  * @private */
function resize3D() {

   let sz = this.getSizeFor3d(this.access3dKind());

   this.apply3dSize(sz);

   if ((this.scene_width === sz.width) && (this.scene_height === sz.height)) return false;

   if ((sz.width < 10) || (sz.height < 10)) return false;

   this.scene_width = sz.width;
   this.scene_height = sz.height;

   this.camera.aspect = this.scene_width / this.scene_height;
   this.camera.updateProjectionMatrix();

   this.renderer.setSize( this.scene_width, this.scene_height );
   if (this.renderer.setJSROOTSize)
      this.renderer.setJSROOTSize(this.scene_width, this.scene_height);

   return true;
}

/** @summary Hilight bin in 3D drawing
  * @private */
function highlightBin3D(tip, selfmesh) {

   let changed = false, tooltip_mesh = null, changed_self = true,
       want_remove = !tip || (tip.x1===undefined) || !this.enable_highlight,
       mainp = this.getMainPainter();

   if (mainp && (!mainp.provideUserTooltip || !mainp.hasUserTooltip())) mainp = null;

   if (this.tooltip_selfmesh) {
      changed_self = (this.tooltip_selfmesh !== selfmesh);
      this.tooltip_selfmesh.material.color = this.tooltip_selfmesh.save_color;
      delete this.tooltip_selfmesh;
      changed = true;
   }

   if (this.tooltip_mesh) {
      tooltip_mesh = this.tooltip_mesh;
      this.toplevel.remove(this.tooltip_mesh);
      delete this.tooltip_mesh;
      changed = true;
   }

   if (want_remove) {
      if (changed) this.render3D();
      if (changed && mainp) mainp.provideUserTooltip(null);
      return;
   }

   if (tip.use_itself) {
      selfmesh.save_color = selfmesh.material.color;
      selfmesh.material.color = new Color(tip.color);
      this.tooltip_selfmesh = selfmesh;
      changed = changed_self;
   } else {
      changed = true;

      let indicies = Box3D.Indexes,
          normals = Box3D.Normals,
          vertices = Box3D.Vertices,
          pos, norm,
          color = new Color(tip.color ? tip.color : 0xFF0000),
          opacity = tip.opacity || 1;

      if (!tooltip_mesh) {
         pos = new Float32Array(indicies.length*3);
         norm = new Float32Array(indicies.length*3);
         let geom = new BufferGeometry();
         geom.setAttribute( 'position', new BufferAttribute( pos, 3 ) );
         geom.setAttribute( 'normal', new BufferAttribute( norm, 3 ) );
         let mater = new MeshBasicMaterial({ color: color, opacity: opacity, vertexColors: false });
         tooltip_mesh = new Mesh(geom, mater);
      } else {
         pos = tooltip_mesh.geometry.attributes.position.array;
         tooltip_mesh.geometry.attributes.position.needsUpdate = true;
         tooltip_mesh.material.color = color;
         tooltip_mesh.material.opacity = opacity;
      }

      if (tip.x1 === tip.x2) console.warn('same tip X', tip.x1, tip.x2);
      if (tip.y1 === tip.y2) console.warn('same tip Y', tip.y1, tip.y2);
      if (tip.z1 === tip.z2) { tip.z2 = tip.z1 + 0.0001; } // avoid zero faces

      for (let k=0,nn=-3;k<indicies.length;++k) {
         let vert = vertices[indicies[k]];
         pos[k*3]   = tip.x1 + vert.x * (tip.x2 - tip.x1);
         pos[k*3+1] = tip.y1 + vert.y * (tip.y2 - tip.y1);
         pos[k*3+2] = tip.z1 + vert.z * (tip.z2 - tip.z1);

         if (norm) {
            if (k%6===0) nn+=3;
            norm[k*3] = normals[nn];
            norm[k*3+1] = normals[nn+1];
            norm[k*3+2] = normals[nn+2];
         }
      }
      this.tooltip_mesh = tooltip_mesh;
      this.toplevel.add(tooltip_mesh);
   }

   if (changed) this.render3D();

   if (changed && tip.$painter && (typeof tip.$painter.redrawProjection == 'function'))
      tip.$painter.redrawProjection(tip.ix-1, tip.ix, tip.iy-1, tip.iy);

   if (changed && mainp && mainp.getObject())
      mainp.provideUserTooltip({ obj: mainp.getObject(),  name: mainp.getObject().fName,
                                 bin: tip.bin, cont: tip.value,
                                 binx: tip.ix, biny: tip.iy, binz: tip.iz,
                                 grx: (tip.x1+tip.x2)/2, gry: (tip.y1+tip.y2)/2, grz: (tip.z1+tip.z2)/2 });
}

/** @summary Set options used for 3D drawings
  * @private */
function set3DOptions(hopt) {
   this.opt3d = hopt;
}

/** @summary Draw axes in 3D mode
  * @private */
function drawXYZ(toplevel, opts) {
   if (!opts) opts = {};

   let grminx = -this.size_x3d, grmaxx = this.size_x3d,
       grminy = -this.size_y3d, grmaxy = this.size_y3d,
       grminz = 0, grmaxz = 2*this.size_z3d,
       textsize = Math.round(this.size_z3d * 0.05),
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

   this.x_handle = new RAxisPainter(this.getDom(), this, this.xaxis, "x_");
   this.x_handle.setPadName(this.getPadName());
   this.x_handle.snapid = this.snapid;
   this.x_handle.configureAxis("xaxis", this.xmin, this.xmax, xmin, xmax, false, [grminx, grmaxx]);
   this.x_handle.assignFrameMembers(this,"x");

   this.y_handle = new RAxisPainter(this.getDom(), this, this.yaxis, "y_");
   this.y_handle.setPadName(this.getPadName());
   this.y_handle.snapid = this.snapid;
   this.y_handle.configureAxis("yaxis", this.ymin, this.ymax, ymin, ymax, false, [grminy, grmaxy]);
   this.y_handle.assignFrameMembers(this,"y");

   // this.setRootPadRange(pad, true); // set some coordinates typical for 3D projections in ROOT

   this.z_handle = new RAxisPainter(this.getDom(), this, this.zaxis, "z_");
   this.z_handle.setPadName(this.getPadName());
   this.z_handle.snapid = this.snapid;
   this.z_handle.configureAxis("zaxis", this.zmin, this.zmax, zmin, zmax, false, [grminz, grmaxz]);
   this.z_handle.assignFrameMembers(this,"z");

   let textMaterial = new MeshBasicMaterial({ color: 0x000000, vertexColors: false }),
       lineMaterial = new LineBasicMaterial({ color: 0x000000, vertexColors: false }),
       ticklen = textsize*0.5, lbls = [], text_scale = 1,
       xticks = this.x_handle.createTicks(false, true),
       yticks = this.y_handle.createTicks(false, true),
       zticks = this.z_handle.createTicks(false, true);

   // main element, where all axis elements are placed
   let top = new Object3D();
   top.axis_draw = true; // mark element as axis drawing
   toplevel.add(top);

   let ticks = [], maxtextheight = 0, xaxis = this.xaxis;

   while (xticks.next()) {
      let grx = xticks.grpos,
         is_major = (xticks.kind===1),
         lbl = this.x_handle.format(xticks.tick, 2);

      if (xticks.last_major()) {
         if (!xaxis || !xaxis.fTitle) lbl = "x";
      } else if (lbl === null) {
         is_major = false; lbl = "";
      }

      if (is_major && lbl && (lbl.length>0)) {
         let text3d = new TextGeometry(lbl, { font: HelveticerRegularFont, size: textsize, height: 0, curveSegments: 5 });
         text3d.computeBoundingBox();
         let draw_width = text3d.boundingBox.max.x - text3d.boundingBox.min.x,
             draw_height = text3d.boundingBox.max.y - text3d.boundingBox.min.y;
         text3d.center = true; // place central

         // text3d.translate(-draw_width/2, 0, 0);

         maxtextheight = Math.max(maxtextheight, draw_height);

         text3d.grx = grx;
         lbls.push(text3d);

         if (!xticks.last_major()) {
            let space = (xticks.next_major_grpos() - grx);
            if (draw_width > 0)
               text_scale = Math.min(text_scale, 0.9*space/draw_width);
            if (this.x_handle.isCenteredLabels()) text3d.grx += space/2;
         }
      }

      ticks.push(grx, 0, 0, grx, (is_major ? -ticklen : -ticklen * 0.6), 0);
   }

   if (xaxis && xaxis.fTitle) {
      let text3d = new TextGeometry(translateLaTeX(xaxis.fTitle), { font: HelveticerRegularFont, size: textsize, height: 0, curveSegments: 5 });
      text3d.computeBoundingBox();
      text3d.center = false; // xaxis.TestBit(EAxisBits.kCenterTitle);
      text3d.gry = 2; // factor 2 shift
      text3d.grx = (grminx + grmaxx)/2; // default position for centered title
      lbls.push(text3d);
   }

   this.get3dZoomCoord = function(point, kind) {
      // return axis coordinate from intersection point with axis geometry
      let pos = point[kind], min = this['scale_'+kind+'min'], max = this['scale_'+kind+'max'];

      switch(kind) {
         case "x": pos = (pos+this.size_x3d)/2/this.size_x3d; break;
         case "y": pos = (pos+this.size_y3d)/2/this.size_y3d; break;
         case "z": pos = pos/2/this.size_z3d; break;
      }

      if (this["log"+kind]) {
         pos = Math.exp(Math.log(min) + pos*(Math.log(max)-Math.log(min)));
      } else {
         pos = min + pos*(max-min);
      }
      return pos;
   };

   let createZoomMesh = (kind, size_3d, use_y_for_z) => {

      let positions, geom = new BufferGeometry();
      if (kind === "z")
         positions = new Float32Array([0,0,0, ticklen*4,0,2*size_3d, ticklen*4,0,0, 0,0,0, 0,0,2*size_3d, ticklen*4,0,2*size_3d]);
      else
         positions = new Float32Array([-size_3d,0,0, size_3d,-ticklen*4,0, size_3d,0,0, -size_3d,0,0, -size_3d,-ticklen*4,0, size_3d,-ticklen*4,0]);

      geom.setAttribute( 'position', new BufferAttribute( positions, 3 ) );
      geom.computeVertexNormals();

      let material = new MeshBasicMaterial({ transparent: true,
                                vertexColors: false,
                                side: DoubleSide,
                                opacity: 0 });

      let mesh = new Mesh(geom, material);
      mesh.zoom = kind;
      mesh.size_3d = size_3d;
      mesh.use_y_for_z = use_y_for_z;
      if (kind=="y") mesh.rotateZ(Math.PI/2).rotateX(Math.PI);
      mesh.v1 = new Vector3(positions[0], positions[1], positions[2]);
      mesh.v2 = new Vector3(positions[6], positions[7], positions[8]);
      mesh.v3 = new Vector3(positions[3], positions[4], positions[5]);

      mesh.globalIntersect = function(raycaster) {
         if (!this.v1 || !this.v2 || !this.v3) return undefined;

         let plane = new Plane();
         plane.setFromCoplanarPoints(this.v1, this.v2, this.v3);
         plane.applyMatrix4(this.matrixWorld);

         let v1 = raycaster.ray.origin.clone(),
             v2 = v1.clone().addScaledVector(raycaster.ray.direction, 1e10),
             pnt = plane.intersectLine(new Line3(v1,v2), new Vector3());

         if (!pnt) return undefined;

         let min = -this.size_3d, max = this.size_3d;
         if (this.zoom==="z") { min = 0; max = 2*this.size_3d; }

         if (pnt[this.zoom] < min) pnt[this.zoom] = min; else
         if (pnt[this.zoom] > max) pnt[this.zoom] = max;

         return pnt;
      };

      mesh.showSelection = function(pnt1,pnt2) {
         // used to show selection

         let tgtmesh = this.children ? this.children[0] : null, gg, kind = this.zoom;
         if (!pnt1 || !pnt2) {
            if (tgtmesh) {
               this.remove(tgtmesh);
               disposeThreejsObject(tgtmesh);
            }
            return tgtmesh;
         }

         if (!this.geometry) return false;

         if (!tgtmesh) {
            gg = this.geometry.clone();
            let pos = gg.getAttribute('position').array;

            // original vertices [0, 2, 1, 0, 3, 2]
            // if (kind==="z") gg.vertices[1].x = gg.vertices[2].x = ticklen;
            //            else gg.vertices[2].y = gg.vertices[3].y = -ticklen;
            if (kind==="z") pos[6] = pos[3] = pos[15] = ticklen;
                       else pos[4] = pos[16] = pos[13] = -ticklen;
            tgtmesh = new Mesh(gg, new MeshBasicMaterial({ color: 0xFF00, side: DoubleSide, vertexColors: false }));
            this.add(tgtmesh);
         } else {
            gg = tgtmesh.geometry;
         }

         let pos = gg.getAttribute('position').array;

         if (kind == "z") {
            // gg.vertices[0].z = gg.vertices[1].z = pnt1[kind];
            // gg.vertices[2].z = gg.vertices[3].z = pnt2[kind];
            pos[2] = pos[11] = pos[8] = pnt1[kind];
            pos[5] = pos[17] = pos[14] = pnt2[kind];
         } else {
            // gg.vertices[0].x = gg.vertices[3].x = pnt1[kind];
            // gg.vertices[1].x = gg.vertices[2].x = pnt2[kind];
            pos[0] = pos[9] = pos[12] = pnt1[kind];
            pos[6] = pos[3] = pos[15] = pnt2[kind];
         }

         gg.getAttribute('position').needsUpdate = true;

         return true;
      };

      return mesh;
   };

   let xcont = new Object3D();
   xcont.position.set(0, grminy, grminz);
   xcont.rotation.x = 1/4*Math.PI;
   xcont.xyid = 2;
   let xtickslines = createLineSegments(ticks, lineMaterial);
   xcont.add(xtickslines);

   lbls.forEach(lbl => {
      let w = lbl.boundingBox.max.x - lbl.boundingBox.min.x,
          posx = lbl.center ? lbl.grx - w/2 : grmaxx - w,
          m = new Matrix4();
      // matrix to swap y and z scales and shift along z to its position
      m.set(text_scale, 0,           0,  posx,
            0,          text_scale,  0,  (-maxtextheight*text_scale - 1.5*ticklen) * (lbl.gry || 1),
            0,          0,           1,  0,
            0,          0,           0,  1);

      let mesh = new Mesh(lbl, textMaterial);
      mesh.applyMatrix4(m);
      xcont.add(mesh);
   });

   if (opts.zoom) xcont.add(createZoomMesh("x", this.size_x3d));
   top.add(xcont);

   xcont = new Object3D();
   xcont.position.set(0, grmaxy, grminz);
   xcont.rotation.x = 3/4*Math.PI;
   xcont.add(new LineSegments(xtickslines.geometry, lineMaterial));
   lbls.forEach(lbl => {

      let w = lbl.boundingBox.max.x - lbl.boundingBox.min.x,
          posx = lbl.center ? lbl.grx + w/2 : grmaxx,
          m = new Matrix4();
      // matrix to swap y and z scales and shift along z to its position
      m.set(-text_scale, 0,           0, posx,
            0,           text_scale,  0, (-maxtextheight*text_scale - 1.5*ticklen) * (lbl.gry || 1),
            0,           0,           -1, 0,
            0,            0,           0, 1);
      let mesh = new Mesh(lbl, textMaterial);
      mesh.applyMatrix4(m);
      xcont.add(mesh);
   });

   //xcont.add(new Mesh(ggg2, textMaterial));
   xcont.xyid = 4;
   if (opts.zoom) xcont.add(createZoomMesh("x", this.size_x3d));
   top.add(xcont);

   lbls = []; text_scale = 1; maxtextheight = 0; ticks = [];

   let yaxis = this.yaxis;

   while (yticks.next()) {
      let gry = yticks.grpos,
          is_major = (yticks.kind===1),
          lbl = this.y_handle.format(yticks.tick, 2);

      if (yticks.last_major()) {
         if (!yaxis || !yaxis.fTitle) lbl = "y";
      }  else if (lbl === null) {
         is_major = false; lbl = "";
      }

      if (is_major) {
         let text3d = new TextGeometry(lbl, { font: HelveticerRegularFont, size: textsize, height: 0, curveSegments: 5 });
         text3d.computeBoundingBox();
         let draw_width = text3d.boundingBox.max.x - text3d.boundingBox.min.x,
             draw_height = text3d.boundingBox.max.y - text3d.boundingBox.min.y;
         // text3d.translate(-draw_width/2, 0, 0);
         text3d.center = true;

         maxtextheight = Math.max(maxtextheight, draw_height);

         text3d.gry = gry;
         lbls.push(text3d);

         if (!yticks.last_major()) {
            let space = (yticks.next_major_grpos() - gry);
            if (draw_width > 0)
               text_scale = Math.min(text_scale, 0.9*space/draw_width);
            if (this.y_handle.isCenteredLabels()) text3d.gry += space/2;
         }
      }
      ticks.push(0,gry,0, (is_major ? -ticklen : -ticklen*0.6), gry, 0);
   }

   if (yaxis && yaxis.fTitle) {
      let text3d = new TextGeometry(translateLaTeX(yaxis.fTitle), { font: HelveticerRegularFont, size: textsize, height: 0, curveSegments: 5 });
      text3d.computeBoundingBox();
      text3d.center = false; // yaxis.TestBit(EAxisBits.kCenterTitle);
      text3d.grx = 2; // factor 2 shift
      text3d.gry = (grminy + grmaxy)/2; // default position for centered title
      lbls.push(text3d);
   }

   if (!opts.use_y_for_z) {
      let yticksline = createLineSegments(ticks, lineMaterial),
          ycont = new Object3D();
      ycont.position.set(grminx, 0, grminz);
      ycont.rotation.y = -1/4*Math.PI;
      ycont.add(yticksline);
      //ycont.add(new Mesh(ggg1, textMaterial));

      lbls.forEach(lbl => {

         let w = lbl.boundingBox.max.x - lbl.boundingBox.min.x,
             posy = lbl.center ? lbl.gry + w/2 : grmaxy,
             m = new Matrix4();
         // matrix to swap y and z scales and shift along z to its position
         m.set(0, text_scale,  0, (-maxtextheight*text_scale - 1.5*ticklen)*(lbl.grx || 1),
               -text_scale,  0, 0, posy,
               0, 0,  1, 0,
               0, 0,  0, 1);

         let mesh = new Mesh(lbl, textMaterial);
         mesh.applyMatrix4(m);
         ycont.add(mesh);
      });

      ycont.xyid = 3;
      if (opts.zoom) ycont.add(createZoomMesh("y", this.size_y3d));
      top.add(ycont);

      ycont = new Object3D();
      ycont.position.set(grmaxx, 0, grminz);
      ycont.rotation.y = -3/4*Math.PI;
      ycont.add(new LineSegments(yticksline.geometry, lineMaterial));
      //ycont.add(new Mesh(ggg2, textMaterial));
      lbls.forEach(lbl => {
         let w = lbl.boundingBox.max.x - lbl.boundingBox.min.x,
             posy = lbl.center ? lbl.gry - w/2 : grmaxy - w,
             m = new Matrix4();
         m.set(0, text_scale, 0,  (-maxtextheight*text_scale - 1.5*ticklen)*(lbl.grx || 1),
               text_scale, 0, 0,  posy,
               0,         0, -1,  0,
               0, 0, 0, 1);

         let mesh = new Mesh(lbl, textMaterial);
         mesh.applyMatrix4(m);
         ycont.add(mesh);
      });
      ycont.xyid = 1;
      if (opts.zoom) ycont.add(createZoomMesh("y", this.size_y3d));
      top.add(ycont);
   }


   lbls = []; text_scale = 1;

   ticks = []; // just array, will be used for the buffer geometry

   let zgridx = null, zgridy = null, lastmajorz = null,
       zaxis = this.zaxis, maxzlblwidth = 0;

   if (this.size_z3d) {
      zgridx = []; zgridy = [];
   }

   while (zticks.next()) {
      let grz = zticks.grpos,
         is_major = (zticks.kind == 1),
         lbl = this.z_handle.format(zticks.tick, 2);

      if (lbl === null) { is_major = false; lbl = ""; }

      if (is_major && lbl) {
         let text3d = new TextGeometry(lbl, { font: HelveticerRegularFont, size: textsize, height: 0, curveSegments: 5 });
         text3d.computeBoundingBox();
         let draw_width = text3d.boundingBox.max.x - text3d.boundingBox.min.x,
             draw_height = text3d.boundingBox.max.y - text3d.boundingBox.min.y;
         text3d.translate(-draw_width, -draw_height/2, 0);
         text3d.grz = grz;
         lbls.push(text3d);

         if ((lastmajorz !== null) && (draw_height>0))
            text_scale = Math.min(text_scale, 0.9*(grz - lastmajorz)/draw_height);

         maxzlblwidth = Math.max(maxzlblwidth, draw_width);

         lastmajorz = grz;
      }

      // create grid
      if (zgridx && is_major)
         zgridx.push(grminx,0,grz, grmaxx,0,grz);

      if (zgridy && is_major)
         zgridy.push(0,grminy,grz, 0,grmaxy,grz);

      ticks.push(0, 0, grz, (is_major ? ticklen : ticklen * 0.6), 0, grz);
   }

   if (zgridx && (zgridx.length > 0)) {

      let material = new LineDashedMaterial({ color: 0x0, dashSize: 2, gapSize: 2 });

      let lines1 = createLineSegments(zgridx, material);
      lines1.position.set(0,grmaxy,0);
      lines1.grid = 2; // mark as grid
      lines1.visible = false;
      top.add(lines1);

      let lines2 = new LineSegments(lines1.geometry, material);
      lines2.position.set(0,grminy,0);
      lines2.grid = 4; // mark as grid
      lines2.visible = false;
      top.add(lines2);
   }

   if (zgridy && (zgridy.length > 0)) {

      let material = new LineDashedMaterial({ color: 0x0, dashSize: 2, gapSize: 2 });

      let lines1 = createLineSegments(zgridy, material);
      lines1.position.set(grmaxx,0, 0);
      lines1.grid = 3; // mark as grid
      lines1.visible = false;
      top.add(lines1);

      let lines2 = new LineSegments(lines1.geometry, material);
      lines2.position.set(grminx, 0, 0);
      lines2.grid = 1; // mark as grid
      lines2.visible = false;
      top.add(lines2);
   }

   let zcont = [], zticksline = createLineSegments(ticks, lineMaterial);
   for (let n=0;n<4;++n) {
      zcont.push(new Object3D());

      lbls.forEach(lbl => {
         let m = new Matrix4();
         // matrix to swap y and z scales and shift along z to its position
         m.set(-text_scale,          0,  0, 2*ticklen,
                         0,          0,  1, 0,
                         0, text_scale,  0, lbl.grz);
         let mesh = new Mesh(lbl, textMaterial);
         mesh.applyMatrix4(m);
         zcont[n].add(mesh);
      });

      if (zaxis && zaxis.fTitle) {
         let text3d = new TextGeometry(translateLaTeX(zaxis.fTitle), { font: HelveticerRegularFont, size: textsize, height: 0, curveSegments: 5 });
         text3d.computeBoundingBox();
         let draw_width = text3d.boundingBox.max.x - text3d.boundingBox.min.x,
             // draw_height = text3d.boundingBox.max.y - text3d.boundingBox.min.y,
             center_title = false, // zaxis.TestBit(EAxisBits.kCenterTitle)
             posz = center_title ? (grmaxz + grminz - draw_width)/2 : grmaxz - draw_width;

         text3d.rotateZ(Math.PI/2);

         let m = new Matrix4();
         m.set(-text_scale,          0,  0, 3*ticklen + maxzlblwidth,
                         0,          0,  1, 0,
                         0, text_scale,  0, posz);
         let mesh = new Mesh(text3d, textMaterial);
         mesh.applyMatrix4(m);
         zcont[n].add(mesh);
      }

      zcont[n].add(n==0 ? zticksline : new LineSegments(zticksline.geometry, lineMaterial));
      if (opts.zoom) zcont[n].add(createZoomMesh("z", this.size_z3d, opts.use_y_for_z));

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

   let linex_geom = createLineSegments([grminx,0,0, grmaxx,0,0], lineMaterial, null, true);
   for(let n=0;n<2;++n) {
      let line = new LineSegments(linex_geom, lineMaterial);
      line.position.set(0, grminy, (n===0) ? grminz : grmaxz);
      line.xyboxid = 2; line.bottom = (n == 0);
      top.add(line);

      line = new LineSegments(linex_geom, lineMaterial);
      line.position.set(0, grmaxy, (n===0) ? grminz : grmaxz);
      line.xyboxid = 4; line.bottom = (n == 0);
      top.add(line);
   }

   let liney_geom = createLineSegments([0,grminy,0, 0,grmaxy,0], lineMaterial, null, true);
   for(let n=0;n<2;++n) {
      let line = new LineSegments(liney_geom, lineMaterial);
      line.position.set(grminx, 0, (n===0) ? grminz : grmaxz);
      line.xyboxid = 3; line.bottom = (n == 0);
      top.add(line);

      line = new LineSegments(liney_geom, lineMaterial);
      line.position.set(grmaxx, 0, (n===0) ? grminz : grmaxz);
      line.xyboxid = 1; line.bottom = (n == 0);
      top.add(line);
   }

   let linez_geom = createLineSegments([0,0,grminz, 0,0,grmaxz], lineMaterial, null, true);
   for(let n = 0; n < 4; ++n) {
      let line = new LineSegments(linez_geom, lineMaterial);
      line.zboxid = zcont[n].zid;
      line.position.copy(zcont[n].position);
      top.add(line);
   }
}


function assignFrame3DMethods(fpainter) {
   Object.assign(fpainter, { create3DScene, render3D, resize3D, highlightBin3D, set3DOptions, drawXYZ });
}



/** @summary Draw 1D/2D histograms in Lego mode */
function drawBinsLego(painter) {

   if (!painter.draw_content) return;

   // Perform RH1/RH2 lego plot with BufferGeometry

   let vertices = Box3D.Vertices,
       indicies = Box3D.Indexes,
       vnormals = Box3D.Normals,
       segments = Box3D.Segments,
       // reduced line segments
       rsegments = [0, 1, 1, 2, 2, 3, 3, 0],
       // reduced vertices
       rvertices = [ new Vector3(0, 0, 0), new Vector3(0, 1, 0), new Vector3(1, 1, 0), new Vector3(1, 0, 0) ],
       main = painter.getFramePainter(),
       axis_zmin = main.z_handle.getScaleMin(),
       axis_zmax = main.z_handle.getScaleMax(),
       zmin, zmax,
       handle = painter.prepareDraw({ rounding: false, use3d: true, extra: 1 }),
       i1 = handle.i1, i2 = handle.i2, j1 = handle.j1, j2 = handle.j2, di = handle.stepi, dj = handle.stepj,
       i, j, k, vert, x1, x2, y1, y2, binz1, binz2, reduced, nobottom, notop,
       histo = painter.getHisto(),
       basehisto = histo ? histo.$baseh : null,
       split_faces = (painter.options.Lego === 11) || (painter.options.Lego === 13); // split each layer on two parts

   if ((i1 >= i2) || (j1 >= j2)) return;

   let getBinContent = (ii,jj,level) => {
      // return bin content in binz1, binz2, reduced flags
      // return true if bin should be displayed

      binz2 = histo.getBinContent(ii+1, jj+1);
      if (basehisto)
         binz1 = basehisto.getBinContent(ii+1, jj+1);
      else if (painter.options.BaseLine !== false)
         binz1 = painter.options.BaseLine;
      else
         binz1 = painter.options.Zero ? axis_zmin : 0;
      if (binz2 < binz1) { let d = binz1; binz1 = binz2; binz2 = d; }

      if ((binz1 >= zmax) || (binz2 < zmin)) return false;

      reduced = (binz2 === zmin) || (binz1 >= binz2);

      if (!reduced || (level>0)) return true;

      if (histo['$baseh']) return false; // do not draw empty bins on top of other bins

      if (painter.options.Zero || (axis_zmin > 0)) return true;

      return painter._show_empty_bins;
   };

   // if bin ID fit into 16 bit, use smaller arrays for intersect indexes
   let use16indx = (histo.getBin(i2, j2) < 0xFFFF),
       levels = [ axis_zmin, axis_zmax ], palette = null;

   // DRAW ALL CUBES

   if ((painter.options.Lego === 12) || (painter.options.Lego === 14)) {
      // drawing colors levels, axis can not exceed palette

      palette = main.getHistPalette();
      painter.createContour(main, palette, { full_z_range: true });
      levels = palette.getContour();
      axis_zmin = levels[0];
      axis_zmax = levels[levels.length-1];
   }

   for (let nlevel=0; nlevel<levels.length-1;++nlevel) {

      zmin = levels[nlevel];
      zmax = levels[nlevel+1];

      // artificially extend last level of color palette to maximal visible value
      if (palette && (nlevel==levels.length-2) && (zmax < axis_zmax)) zmax = axis_zmax;

      let z1 = 0, z2 = 0, numvertices = 0, num2vertices = 0,
          grzmin = main.grz(zmin), grzmax = main.grz(zmax);

      // now calculate size of buffer geometry for boxes

      for (i = i1; i < i2; i += di)
         for (j = j1; j < j2; j += dj) {

            if (!getBinContent(i,j,nlevel)) continue;

            nobottom = !reduced && (nlevel>0);
            notop = !reduced && (binz2 > zmax) && (nlevel < levels.length-2);

            numvertices += (reduced ? 12 : indicies.length);
            if (nobottom) numvertices -= 6;
            if (notop) numvertices -= 6;

            if (split_faces && !reduced) {
               numvertices -= 12;
               num2vertices += 12;
            }
         }

      let positions = new Float32Array(numvertices*3),
          normals = new Float32Array(numvertices*3),
          face_to_bins_index = use16indx ? new Uint16Array(numvertices/3) : new Uint32Array(numvertices/3),
          pos2 = null, norm2 = null, face_to_bins_indx2 = null,
          v = 0, v2 = 0, vert, k, nn;

      if (num2vertices > 0) {
         pos2 = new Float32Array(num2vertices*3);
         norm2 = new Float32Array(num2vertices*3);
         face_to_bins_indx2 = use16indx ? new Uint16Array(num2vertices/3) : new Uint32Array(num2vertices/3);
      }

      for (i = i1; i < i2; i += di) {
         x1 = handle.grx[i] + handle.xbar1*(handle.grx[i+di]-handle.grx[i]);
         x2 = handle.grx[i] + handle.xbar2*(handle.grx[i+di]-handle.grx[i]);
         for (j = j1; j < j2; j += dj) {

            if (!getBinContent(i,j,nlevel)) continue;

            nobottom = !reduced && (nlevel>0);
            notop = !reduced && (binz2 > zmax) && (nlevel < levels.length-2);

            y1 = handle.gry[j] + handle.ybar1*(handle.gry[j+dj] - handle.gry[j]);
            y2 = handle.gry[j] + handle.ybar2*(handle.gry[j+dj] - handle.gry[j]);

            z1 = (binz1 <= zmin) ? grzmin : main.grz(binz1);
            z2 = (binz2 > zmax) ? grzmax : main.grz(binz2);

            nn = 0; // counter over the normals, each normals correspond to 6 vertices
            k = 0; // counter over vertices

            if (reduced) {
               // we skip all side faces, keep only top and bottom
               nn += 12;
               k += 24;
            }

            let size = indicies.length, bin_index = histo.getBin(i+1, j+1);
            if (nobottom) size -= 6;

            // array over all vertices of the single bin
            while(k < size) {

               vert = vertices[indicies[k]];

               if (split_faces && (k < 12)) {
                  pos2[v2]   = x1 + vert.x * (x2 - x1);
                  pos2[v2+1] = y1 + vert.y * (y2 - y1);
                  pos2[v2+2] = z1 + vert.z * (z2 - z1);

                  norm2[v2] = vnormals[nn];
                  norm2[v2+1] = vnormals[nn+1];
                  norm2[v2+2] = vnormals[nn+2];
                  if (v2%9===0) face_to_bins_indx2[v2/9] = bin_index; // remember which bin corresponds to the face
                  v2+=3;
               } else {
                  positions[v]   = x1 + vert.x * (x2 - x1);
                  positions[v+1] = y1 + vert.y * (y2 - y1);
                  positions[v+2] = z1 + vert.z * (z2 - z1);

                  normals[v] = vnormals[nn];
                  normals[v+1] = vnormals[nn+1];
                  normals[v+2] = vnormals[nn+2];
                  if (v%9===0) face_to_bins_index[v/9] = bin_index; // remember which bin corresponds to the face
                  v+=3;
               }

               ++k;

               if (k%6 === 0) {
                  nn+=3;
                  if (notop && (k === indicies.length - 12)) {
                     k+=6; nn+=3; // jump over notop indexes
                  }
               }
            }
         }
      }

      let geometry = new BufferGeometry();
      geometry.setAttribute( 'position', new BufferAttribute( positions, 3 ) );
      geometry.setAttribute( 'normal', new BufferAttribute( normals, 3 ) );
      // geometry.computeVertexNormals();

      let rootcolor = 3, fcolor = painter.getColor(rootcolor);

      if (palette) {
         fcolor = palette.getColor(nlevel); // calcColor in v6
      } else if ((painter.options.Lego === 1) || (rootcolor < 2)) {
         rootcolor = 1;
         fcolor = 'white';
      }

      let material = new MeshBasicMaterial({ color: fcolor, vertexColors: false });

      let mesh = new Mesh(geometry, material);

      mesh.face_to_bins_index = face_to_bins_index;
      mesh.painter = painter;
      mesh.zmin = axis_zmin;
      mesh.zmax = axis_zmax;
      mesh.baseline = (painter.options.BaseLine!==false) ? painter.options.BaseLine : (painter.options.Zero ? axis_zmin : 0);
      mesh.tip_color = (rootcolor===3) ? 0xFF0000 : 0x00FF00;
      mesh.handle = handle;

      mesh.tooltip = function(intersect) {
         if (!Number.isInteger(intersect.faceIndex)) {
            console.error(`intersect.faceIndex not provided, three.js version ${REVISION}, expected 137`);
            return null;
         }

         if ((intersect.faceIndex < 0) || (intersect.faceIndex >= this.face_to_bins_index.length)) return null;

         let p = this.painter,
             handle = this.handle,
             main = p.getFramePainter(),
             histo = p.getHisto(),
             tip = p.get3DToolTip( this.face_to_bins_index[intersect.faceIndex] ),
             i1 = tip.ix - 1, i2 = i1 + handle.stepi,
             j1 = tip.iy - 1, j2 = j1 + handle.stepj;

         tip.x1 = Math.max(-main.size_x3d, handle.grx[i1] + handle.xbar1*(handle.grx[i2]-handle.grx[i1]));
         tip.x2 = Math.min(main.size_x3d, handle.grx[i1] + handle.xbar2*(handle.grx[i2]-handle.grx[i1]));

         tip.y1 = Math.max(-main.size_y3d, handle.gry[j1] + handle.ybar1*(handle.gry[j2] - handle.gry[j1]));
         tip.y2 = Math.min(main.size_y3d, handle.gry[j1] + handle.ybar2*(handle.gry[j2] - handle.gry[j1]));

         let binz1 = this.baseline, binz2 = tip.value;
         if (histo['$baseh']) binz1 = histo['$baseh'].getBinContent(i1+1, j1+1);
         if (binz2<binz1) { let v = binz1; binz1 = binz2; binz2 = v; }

         tip.z1 = main.grz(Math.max(this.zmin,binz1));
         tip.z2 = main.grz(Math.min(this.zmax,binz2));

         tip.color = this.tip_color;

         if (p.is_projection && (p.getDimension()==2)) tip.$painter = p; // used only for projections

         return tip;
      };

      main.toplevel.add(mesh);

      if (num2vertices > 0) {
         let geom2 = new BufferGeometry();
         geom2.setAttribute( 'position', new BufferAttribute( pos2, 3 ) );
         geom2.setAttribute( 'normal', new BufferAttribute( norm2, 3 ) );
         //geom2.computeVertexNormals();

         //var material2 = new MeshLambertMaterial( { color: 0xFF0000 } );

         let color2 = (rootcolor<2) ? new Color(0xFF0000) :
                         new Color(d3_rgb(fcolor).darker(0.5).toString());

         let material2 = new MeshBasicMaterial({ color: color2, vertexColors: false });

         let mesh2 = new Mesh(geom2, material2);
         mesh2.face_to_bins_index = face_to_bins_indx2;
         mesh2.painter = painter;
         mesh2.handle = mesh.handle;
         mesh2.tooltip = mesh.tooltip;
         mesh2.zmin = mesh.zmin;
         mesh2.zmax = mesh.zmax;
         mesh2.baseline = mesh.baseline;
         mesh2.tip_color = mesh.tip_color;

         main.toplevel.add(mesh2);
      }
   }

   // lego3 or lego4 do not draw border lines
   if (painter.options.Lego > 12) return;

   // DRAW LINE BOXES

   let numlinevertices = 0, numsegments = 0, uselineindx = true;

   zmax = axis_zmax; zmin = axis_zmin;

   for (i = i1; i < i2; i += di)
      for (j = j1; j < j2; j += dj) {
         if (!getBinContent(i,j,0)) continue;

         // calculate required buffer size for line segments
         numlinevertices += (reduced ? rvertices.length : vertices.length);
         numsegments += (reduced ? rsegments.length : segments.length);
      }

   // On some platforms vertex index required to be Uint16 array
   // While we cannot use index for large vertex list
   // skip index usage at all. It happens for relatively large histograms (100x100 bins)
   if (numlinevertices > 0xFFF0) uselineindx = false;

   if (!uselineindx) numlinevertices = numsegments*3;

   let lpositions = new Float32Array( numlinevertices * 3 ),
       lindicies = uselineindx ? new Uint16Array( numsegments ) : null,
       grzmin = main.grz(axis_zmin),
       grzmax = main.grz(axis_zmax),
       z1 = 0, z2 = 0, ll = 0, ii = 0;

   for (i = i1; i < i2; i += di) {
      x1 = handle.grx[i] + handle.xbar1*(handle.grx[i+di]-handle.grx[i]);
      x2 = handle.grx[i] + handle.xbar2*(handle.grx[i+di]-handle.grx[i]);
      for (j = j1; j < j2; j += dj) {

         if (!getBinContent(i,j,0)) continue;

         y1 = handle.gry[j] + handle.ybar1*(handle.gry[j+dj] - handle.gry[j]);
         y2 = handle.gry[j] + handle.ybar2*(handle.gry[j+dj] - handle.gry[j]);

         z1 = (binz1 <= axis_zmin) ? grzmin : main.grz(binz1);
         z2 = (binz2 > axis_zmax) ? grzmax : main.grz(binz2);

         let seg = reduced ? rsegments : segments,
             vvv = reduced ? rvertices : vertices;

         if (uselineindx) {
            // array of indicies for the lines, to avoid duplication of points
            for (k = 0; k < seg.length; ++k)
               lindicies[ii++] = ll/3 + seg[k];

            for (k = 0; k < vvv.length; ++k) {
               vert = vvv[k];
               lpositions[ll]   = x1 + vert.x * (x2 - x1);
               lpositions[ll+1] = y1 + vert.y * (y2 - y1);
               lpositions[ll+2] = z1 + vert.z * (z2 - z1);
               ll+=3;
            }
         } else {
            // copy only vertex positions
            for (k = 0; k < seg.length; ++k) {
               vert = vvv[seg[k]];
               lpositions[ll]   = x1 + vert.x * (x2 - x1);
               lpositions[ll+1] = y1 + vert.y * (y2 - y1);
               lpositions[ll+2] = z1 + vert.z * (z2 - z1);
               ll+=3;
            }
         }
      }
   }

   // create boxes
   let lcolor = painter.v7EvalColor("line_color", "lightblue");
   let material = new LineBasicMaterial({ color: new Color(lcolor), linewidth: painter.v7EvalAttr("line_width", 1) });

   let line = createLineSegments(lpositions, material, uselineindx ? lindicies : null );

   /*
   line.painter = painter;
   line.intersect_index = intersect_index;
   line.tooltip = function(intersect) {
      if ((intersect.index<0) || (intersect.index >= this.intersect_index.length)) return null;
      return this.painter.get3DToolTip(this.intersect_index[intersect.index]);
   }
   */

   main.toplevel.add(line);
}


export { assignFrame3DMethods, drawBinsLego };
