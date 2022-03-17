/// ROOT7 histogram 3D graphics

import { settings } from '../core.mjs';

import { REVISION, DoubleSide,
         Vector2, Color, ShapeUtils,
         Mesh, MeshBasicMaterial, MeshLambertMaterial, LineBasicMaterial, LineDashedMaterial,
         BufferAttribute, BufferGeometry } from '../three.mjs';

import { RH2Painter as RH2Painter2D } from '../hist2d/RH2Painter.mjs';

import { createLineSegments, create3DLineMaterial } from '../base/base3d.mjs';

import { assignFrame3DMethods, drawBinsLego } from './draw3dv7.mjs';


class RH2Painter extends RH2Painter2D {


   /** @summary Draw RH2 as 3D contour plot */
   drawContour3D(realz) {
      // for contour plots one requires handle with full range
      let main = this.getFramePainter(),
          handle = this.prepareDraw({rounding: false, use3d: true, extra: 100, middle: 0.0 }),
          palette = main.getHistPalette(),
          layerz = 2*main.size_z3d, pnts = [];

      this.createContour(main, palette, { full_z_range: true });

      let levels = palette.getContour();

      this.buildContour(handle, levels, palette,
         (colindx,xp,yp,iminus,iplus,ilevel) => {
             // ignore less than three points
             if (iplus - iminus < 3) return;

             if (realz) {
                layerz = main.grz(levels[ilevel]);
                if ((layerz < 0) || (layerz > 2*main.size_z3d)) return;
             }

             for (let i=iminus;i<iplus;++i) {
                pnts.push(xp[i], yp[i], layerz);
                pnts.push(xp[i+1], yp[i+1], layerz);
             }
         }
      )

      let lines = createLineSegments(pnts, create3DLineMaterial(this, "line_"));
      main.toplevel.add(lines);
   }

   /** @summary Draw RH2 histograms in surf mode
     * @private */
   drawSurf() {
      let histo = this.getHisto(),
          main = this.getFramePainter(),
          handle = this.prepareDraw({rounding: false, use3d: true, extra: 1, middle: 0.5 }),
          i, j, x1, y1, x2, y2, z11, z12, z21, z22,
          di = handle.stepi, dj = handle.stepj,
          numstepi = handle.i2 - handle.i1, numstepj = handle.j2 - handle.j1,
          axis_zmin = main.z_handle.getScaleMin();

      if (di > 1) {
         numstepi = Math.round(numstepi/di);
         if (numstepi * di < (handle.i2 - handle.i1)) numstepi++;
      }

      if (dj > 1) {
         numstepj = Math.round(numstepj/dj);
         if (numstepj * dj < (handle.j2 - handle.j1)) numstepj++;
      }

      // first adjust ranges

      let main_grz = !main.logz ? main.grz : value => (value < axis_zmin) ? -0.1 : main.grz(value);

      if ((handle.i2 - handle.i1 < 2) || (handle.j2 - handle.j1 < 2)) return;

      let ilevels = null, levels = null, dolines = true, dogrid = false,
          donormals = false, palette = null, need_palette = 0;

      switch(this.options.Surf) {
         case 11: need_palette = 2; break;
         case 12:
         case 15: // make surf5 same as surf2
         case 17: need_palette = 2; dolines = false; break;
         case 14: dolines = false; donormals = true; break;
         case 16: need_palette = 1; dogrid = true; dolines = false; break;
         default: ilevels = main.z_handle.createTicks(true); dogrid = true; break;
      }

      if (need_palette > 0) {
         palette = main.getHistPalette();
         if (need_palette == 2)
            this.createContour(main, palette, { full_z_range: true });
         ilevels = palette.getContour();
      }

      if (ilevels) {
         // recalculate levels into graphical coordinates
         levels = new Float32Array(ilevels.length);
         for (let ll=0;ll<ilevels.length;++ll)
            levels[ll] = main_grz(ilevels[ll]);
      } else {
         levels = [0, 2*main.size_z3d]; // just cut top/bottom parts
      }

      let loop, nfaces = [], pos = [], indx = [],    // buffers for faces
          nsegments = 0, lpos = null, lindx = 0,     // buffer for lines
          ngridsegments = 0, grid = null, gindx = 0, // buffer for grid lines segments
          normindx = [];                             // buffer to remember place of vertex for each bin

      function CheckSide(z,level1, level2) {
         if (z<level1) return -1;
         if (z>level2) return 1;
         return 0;
      }

      function AddLineSegment(x1,y1,z1, x2,y2,z2) {
         if (!dolines) return;
         let side1 = CheckSide(z1,0,2*main.size_z3d),
             side2 = CheckSide(z2,0,2*main.size_z3d);
         if ((side1===side2) && (side1!==0)) return;
         if (!loop) return ++nsegments;

         if (side1!==0) {
            let diff = z2-z1;
            z1 = (side1<0) ? 0 : 2*main.size_z3d;
            x1 = x2 - (x2-x1)/diff*(z2-z1);
            y1 = y2 - (y2-y1)/diff*(z2-z1);
         }
         if (side2!==0) {
            let diff = z1-z2;
            z2 = (side2<0) ? 0 : 2*main.size_z3d;
            x2 = x1 - (x1-x2)/diff*(z1-z2);
            y2 = y1 - (y1-y2)/diff*(z1-z2);
         }

         lpos[lindx] = x1; lpos[lindx+1] = y1; lpos[lindx+2] = z1; lindx+=3;
         lpos[lindx] = x2; lpos[lindx+1] = y2; lpos[lindx+2] = z2; lindx+=3;
      }

      let pntbuf = new Float32Array(6*3), k = 0, lastpart = 0; // maximal 6 points
      let gridpnts = new Float32Array(2*3), gridcnt = 0;

      function AddCrossingPoint(xx1,yy1,zz1, xx2,yy2,zz2, crossz, with_grid) {
         if (k>=pntbuf.length) console.log('more than 6 points???');

         let part = (crossz - zz1) / (zz2 - zz1), shift = 3;
         if ((lastpart!==0) && (Math.abs(part) < Math.abs(lastpart))) {
            // while second crossing point closer than first to original, move it in memory
            pntbuf[k] = pntbuf[k-3];
            pntbuf[k+1] = pntbuf[k-2];
            pntbuf[k+2] = pntbuf[k-1];
            k-=3; shift = 6;
         }

         pntbuf[k] = xx1 + part*(xx2-xx1);
         pntbuf[k+1] = yy1 + part*(yy2-yy1);
         pntbuf[k+2] = crossz;

         if (with_grid && grid) {
            gridpnts[gridcnt] = pntbuf[k];
            gridpnts[gridcnt+1] = pntbuf[k+1];
            gridpnts[gridcnt+2] = pntbuf[k+2];
            gridcnt+=3;
         }

         k += shift;
         lastpart = part;
      }

      function RememberVertex(indx, ii,jj) {
         let bin = ((ii-handle.i1)/di * numstepj + (jj-handle.j1)/dj)*8;

         if (normindx[bin]>=0)
            return console.error('More than 8 vertexes for the bin');

         let pos = bin+8+normindx[bin]; // position where write index
         normindx[bin]--;
         normindx[pos] = indx; // at this moment index can be overwritten, means all 8 position are there
      }

      function RecalculateNormals(arr) {
         for (let ii=handle.i1; ii<handle.i2; ii += di) {
            for (let jj=handle.j1; jj<handle.j2; jj += dj) {
               let bin = ((ii-handle.i1)/di * numstepj + (jj-handle.j1)/dj) * 8;

               if (normindx[bin] === -1) continue; // nothing there

               let beg = (normindx[bin] >=0) ? bin : bin+9+normindx[bin],
                   end = bin+8, sumx=0, sumy = 0, sumz = 0;

               for (let kk=beg;kk<end;++kk) {
                  let indx = normindx[kk];
                  if (indx<0) return console.error('FAILURE in NORMALS RECALCULATIONS');
                  sumx+=arr[indx];
                  sumy+=arr[indx+1];
                  sumz+=arr[indx+2];
               }

               sumx = sumx/(end-beg); sumy = sumy/(end-beg); sumz = sumz/(end-beg);

               for (let kk=beg;kk<end;++kk) {
                  let indx = normindx[kk];
                  arr[indx] = sumx;
                  arr[indx+1] = sumy;
                  arr[indx+2] = sumz;
               }
            }
         }
      }

      function AddMainTriangle(x1,y1,z1, x2,y2,z2, x3,y3,z3, is_first) {

         for (let lvl=1;lvl<levels.length;++lvl) {

            let side1 = CheckSide(z1, levels[lvl-1], levels[lvl]),
                side2 = CheckSide(z2, levels[lvl-1], levels[lvl]),
                side3 = CheckSide(z3, levels[lvl-1], levels[lvl]),
                side_sum = side1 + side2 + side3;

            if (side_sum === 3) continue;
            if (side_sum === -3) return;

            if (!loop) {
               let npnts = Math.abs(side2-side1) + Math.abs(side3-side2) + Math.abs(side1-side3);
               if (side1===0) ++npnts;
               if (side2===0) ++npnts;
               if (side3===0) ++npnts;

               if ((npnts===1) || (npnts===2)) console.error('FOND npnts', npnts);

               if (npnts>2) {
                  if (nfaces[lvl]===undefined) nfaces[lvl] = 0;
                  nfaces[lvl] += npnts-2;
               }

               // check if any(contours for given level exists
               if (((side1>0) || (side2>0) || (side3>0)) &&
                   ((side1!==side2) || (side2!==side3) || (side3!==side1))) ++ngridsegments;

               continue;
            }

            gridcnt = 0;

            k = 0;
            if (side1 === 0) { pntbuf[k] = x1; pntbuf[k+1] = y1; pntbuf[k+2] = z1; k+=3; }

            if (side1!==side2) {
               // order is important, should move from 1->2 point, checked via lastpart
               lastpart = 0;
               if ((side1<0) || (side2<0)) AddCrossingPoint(x1,y1,z1, x2,y2,z2, levels[lvl-1]);
               if ((side1>0) || (side2>0)) AddCrossingPoint(x1,y1,z1, x2,y2,z2, levels[lvl], true);
            }

            if (side2 === 0) { pntbuf[k] = x2; pntbuf[k+1] = y2; pntbuf[k+2] = z2; k+=3; }

            if (side2!==side3) {
               // order is important, should move from 2->3 point, checked via lastpart
               lastpart = 0;
               if ((side2<0) || (side3<0)) AddCrossingPoint(x2,y2,z2, x3,y3,z3, levels[lvl-1]);
               if ((side2>0) || (side3>0)) AddCrossingPoint(x2,y2,z2, x3,y3,z3, levels[lvl], true);
            }

            if (side3 === 0) { pntbuf[k] = x3; pntbuf[k+1] = y3; pntbuf[k+2] = z3; k+=3; }

            if (side3!==side1) {
               // order is important, should move from 3->1 point, checked via lastpart
               lastpart = 0;
               if ((side3<0) || (side1<0)) AddCrossingPoint(x3,y3,z3, x1,y1,z1, levels[lvl-1]);
               if ((side3>0) || (side1>0)) AddCrossingPoint(x3,y3,z3, x1,y1,z1, levels[lvl], true);
            }

            if (k===0) continue;
            if (k<9) { console.log('found less than 3 points', k/3); continue; }

            if (grid && (gridcnt === 6)) {
               for (let jj=0;jj < 6; ++jj)
                  grid[gindx+jj] = gridpnts[jj];
               gindx+=6;
            }


            // if three points and surf==14, remember vertex for each point

            let buf = pos[lvl], s = indx[lvl];
            if (donormals && (k===9)) {
               RememberVertex(s, i, j);
               RememberVertex(s+3, i+1, is_first ? j+dj : j);
               RememberVertex(s+6, is_first ? i : i+di, j+dj);
            }

            for (let k1=3;k1<k-3;k1+=3) {
               buf[s] = pntbuf[0]; buf[s+1] = pntbuf[1]; buf[s+2] = pntbuf[2]; s+=3;
               buf[s] = pntbuf[k1]; buf[s+1] = pntbuf[k1+1]; buf[s+2] = pntbuf[k1+2]; s+=3;
               buf[s] = pntbuf[k1+3]; buf[s+1] = pntbuf[k1+4]; buf[s+2] = pntbuf[k1+5]; s+=3;
            }
            indx[lvl] = s;

         }
      }

      // for each bin maximal 8 points reserved
      if (donormals)
         normindx = new Int32Array(numstepi * numstepj * 8).fill(-1);

      for (loop = 0; loop < 2; ++loop) {
         if (loop) {
            for (let lvl=1;lvl<levels.length;++lvl)
               if (nfaces[lvl]) {
                  pos[lvl] = new Float32Array(nfaces[lvl] * 9);
                  indx[lvl] = 0;
               }
            if (dolines && (nsegments > 0))
               lpos = new Float32Array(nsegments * 6);
            if (dogrid && (ngridsegments>0))
               grid = new Float32Array(ngridsegments * 6);
         }
         for (i = handle.i1;i < handle.i2-di; i += di) {
            x1 = handle.grx[i];
            x2 = handle.grx[i+di];
            for (j = handle.j1; j < handle.j2-dj; j += dj) {
               y1 = handle.gry[j];
               y2 = handle.gry[j+dj];
               z11 = main_grz(histo.getBinContent(i+1, j+1));
               z12 = main_grz(histo.getBinContent(i+1, j+1+dj));
               z21 = main_grz(histo.getBinContent(i+1+dj, j+1));
               z22 = main_grz(histo.getBinContent(i+1+dj, j+1+dj));

               AddMainTriangle(x1,y1,z11, x2,y2,z22, x1,y2,z12, true);

               AddMainTriangle(x1,y1,z11, x2,y1,z21, x2,y2,z22, false);

               AddLineSegment(x1,y2,z12, x1,y1,z11);
               AddLineSegment(x1,y1,z11, x2,y1,z21);

               if (i===handle.i2-2) AddLineSegment(x2,y1,z21, x2,y2,z22);
               if (j===handle.j2-2) AddLineSegment(x1,y2,z12, x2,y2,z22);
            }
         }
      }

      for (let lvl=1;lvl<levels.length;++lvl)
         if (pos[lvl]) {
            if (indx[lvl] !== nfaces[lvl]*9)
                 console.error('SURF faces missmatch lvl', lvl, 'faces', nfaces[lvl], 'index', indx[lvl], 'check', nfaces[lvl]*9 - indx[lvl]);
            let geometry = new BufferGeometry();
            geometry.setAttribute( 'position', new BufferAttribute( pos[lvl], 3 ) );
            geometry.computeVertexNormals();
            if (donormals && (lvl===1)) RecalculateNormals(geometry.getAttribute('normal').array);

            let fcolor, material;
            if (palette) {
               fcolor = palette.getColor(lvl-1);
            } else {
               fcolor = this.getColor(5);
               // if (this.options.Surf === 14) fcolor = this.getColor(48);
            }

            if (this.options.Surf === 14)
               material = new MeshLambertMaterial({ color: fcolor, side: DoubleSide, vertexColors: false });
            else
               material = new MeshBasicMaterial({ color: fcolor, side: DoubleSide, vertexColors: false });

            let mesh = new Mesh(geometry, material);

            main.toplevel.add(mesh);

            mesh.painter = this; // to let use it with context menu
         }


      if (lpos) {
         if (nsegments*6 !== lindx)
            console.error('SURF lines mismmatch nsegm', nsegments, ' lindx', lindx, 'difference', nsegments*6 - lindx);

         let lcolor = this.getColor(7),
             material = new LineBasicMaterial({ color: new Color(lcolor), linewidth: this.v7EvalAttr("line_width", 1) }),
             line = createLineSegments(lpos, material);
         line.painter = this;
         main.toplevel.add(line);
      }

      if (grid) {
         if (ngridsegments*6 !== gindx)
            console.error('SURF grid draw mismatch ngridsegm', ngridsegments, 'gindx', gindx, 'diff', ngridsegments*6 - gindx);

         let material;

         if (this.options.Surf === 1)
            material = new LineDashedMaterial( { color: 0x0, dashSize: 2, gapSize: 2 } );
         else
            material = new LineBasicMaterial({ color: new Color(this.v7EvalColor("line_color", "lightblue")) });

         let line = createLineSegments(grid, material);
         line.painter = this;
         main.toplevel.add(line);
      }

      if (this.options.Surf === 17)
         this.drawContour3D();

      if (this.options.Surf === 13) {

         handle = this.prepareDraw({rounding: false, use3d: true, extra: 100, middle: 0.0 });

         // get levels
         let levels = this.getContour(), // init contour
             palette = this.getHistPalette(),
             lastcolindx = -1, layerz = 2*main.size_z3d;

         this.buildContour(handle, levels, palette,
            (colindx,xp,yp,iminus,iplus) => {
                // no need for duplicated point
                if ((xp[iplus] === xp[iminus]) && (yp[iplus] === yp[iminus])) iplus--;

                // ignore less than three points
                if (iplus - iminus < 3) return;

                let pnts = [];

                for (let i = iminus; i <= iplus; ++i)
                   if ((i === iminus) || (xp[i] !== xp[i-1]) || (yp[i] !== yp[i-1]))
                      pnts.push(new Vector2(xp[i], yp[i]));

                if (pnts.length < 3) return;

                let faces = ShapeUtils.triangulateShape(pnts , []);

                if (!faces || (faces.length === 0)) return;

                if ((lastcolindx < 0) || (lastcolindx !== colindx)) {
                   lastcolindx = colindx;
                   layerz+=0.0001*main.size_z3d; // change layers Z
                }

                let pos = new Float32Array(faces.length*9),
                    norm = new Float32Array(faces.length*9),
                    indx = 0;

                for (let n=0;n<faces.length;++n) {
                   let face = faces[n];
                   for (let v=0;v<3;++v) {
                      let pnt = pnts[face[v]];
                      pos[indx] = pnt.x;
                      pos[indx+1] = pnt.y;
                      pos[indx+2] = layerz;
                      norm[indx] = 0;
                      norm[indx+1] = 0;
                      norm[indx+2] = 1;

                      indx+=3;
                   }
                }

                let geometry = new BufferGeometry();
                geometry.setAttribute( 'position', new BufferAttribute( pos, 3 ) );
                geometry.setAttribute( 'normal', new BufferAttribute( norm, 3 ) );

                let fcolor = palette.getColor(colindx);
                let material = new MeshBasicMaterial({ color: fcolor, side: DoubleSide, opacity: 0.5, vertexColors: false });
                let mesh = new Mesh(geometry, material);
                mesh.painter = this;
                main.toplevel.add(mesh);
            }
         );
      }

      this.updatePaletteDraw();
   }

   /** @summary Draw RH2 histogram in error mode */
   drawError() {
      let main = this.getFramePainter(),
          histo = this.getHisto(),
          handle = this.prepareDraw({ rounding: false, use3d: true, extra: 1 }),
          zmin = main.z_handle.getScaleMin(),
          zmax = main.z_handle.getScaleMax(),
          i, j, binz, binerr, x1, y1, x2, y2, z1, z2,
          nsegments = 0, lpos = null, binindx = null, lindx = 0,
          di = handle.stepi, dj = handle.stepj;

       let check_skip_min = () => {
          // return true if minimal histogram value should be skipped
          if (this.options.Zero || (zmin>0)) return false;
          return !this._show_empty_bins;
       };

       // loop over the points - first loop counts points, second fill arrays
       for (let loop=0;loop<2;++loop) {

          for (i = handle.i1; i < handle.i2; i += di) {
             x1 = handle.grx[i];
             x2 = handle.grx[i+di];
             for (j = handle.j1; j < handle.j2; j += dj) {
                binz = histo.getBinContent(i+1, j+1);
                if ((binz < zmin) || (binz > zmax)) continue;
                if ((binz===zmin) && check_skip_min()) continue;

                // just count number of segments
                if (loop===0) { nsegments+=3; continue; }

                binerr = histo.getBinError(i+1,j+1);
                binindx[lindx/18] = histo.getBin(i+1,j+1);

                y1 = handle.gry[j];
                y2 = handle.gry[j+dj];

                z1 = main.grz((binz - binerr < zmin) ? zmin : binz-binerr);
                z2 = main.grz((binz + binerr > zmax) ? zmax : binz+binerr);

                lpos[lindx] = x1; lpos[lindx+3] = x2;
                lpos[lindx+1] = lpos[lindx+4] = (y1+y2)/2;
                lpos[lindx+2] = lpos[lindx+5] = (z1+z2)/2;
                lindx+=6;

                lpos[lindx] = lpos[lindx+3] = (x1+x2)/2;
                lpos[lindx+1] = y1; lpos[lindx+4] = y2;
                lpos[lindx+2] = lpos[lindx+5] = (z1+z2)/2;
                lindx+=6;

                lpos[lindx] = lpos[lindx+3] = (x1+x2)/2;
                lpos[lindx+1] = lpos[lindx+4] = (y1+y2)/2;
                lpos[lindx+2] = z1; lpos[lindx+5] = z2;
                lindx+=6;
             }
          }

          if (loop===0) {
             if (nsegments===0) return;
             lpos = new Float32Array(nsegments*6);
             binindx = new Int32Array(nsegments/3);
          }
       }

       // create lines
       let lcolor = new Color(this.v7EvalColor("line_color", "lightblue")),
           material = new LineBasicMaterial({ color: lcolor, linewidth: this.v7EvalAttr("line_width", 1) }),
           line = createLineSegments(lpos, material);

       line.painter = this;
       line.intersect_index = binindx;
       line.zmin = zmin;
       line.zmax = zmax;
       line.tip_color = (lcolor.g < 0.5) ? 0x00FF00 : 0xFF0000;
       line.handle = handle;

       line.tooltip = function(intersect) {
          if (!Number.isInteger(intersect.index)) {
             console.error(`intersect.index not provided, three.js version ${REVISION}, expected 137`);
             return null;
          }

          let pos = Math.floor(intersect.index / 6);
          if ((pos<0) || (pos >= this.intersect_index.length)) return null;
          let p = this.painter,
              main = p.getFramePainter(),
              tip = p.get3DToolTip(this.intersect_index[pos]),
              handle = this.handle,
              i1 = tip.ix - 1, i2 = i1 + handle.stepi,
              j1 = tip.iy - 1, j2 = j1 + handle.stepj;


          tip.x1 = Math.max(-main.size_x3d, handle.grx[i1]);
          tip.x2 = Math.min(main.size_x3d, handle.grx[i2]);
          tip.y1 = Math.max(-main.size_y3d, handle.gry[j1]);
          tip.y2 = Math.min(main.size_y3d, handle.gry[j2]);

          tip.z1 = main.grz(tip.value-tip.error < this.zmin ? this.zmin : tip.value-tip.error);
          tip.z2 = main.grz(tip.value+tip.error > this.zmax ? this.zmax : tip.value+tip.error);

          tip.color = this.tip_color;

          return tip;
       };

       main.toplevel.add(line);
   }

   /** @summary Draw RH2Poly histogram as lego */
   drawPolyLego() {
      let histo = this.getHisto(),
          palette = this.getHistPalette(),
          pmain = this.getFramePainter(),
          axis_zmin = pmain.z_handle.getScaleMin(),
          axis_zmax = pmain.z_handle.getScaleMax(),
          colindx, bin, i, len = histo.fBins.arr.length,
          z0 = pmain.grz(axis_zmin), z1;

      // use global coordinates
      this.maxbin = this.gmaxbin;
      this.minbin = this.gminbin;
      this.minposbin = this.gminposbin;

      for (i = 0; i < len; ++ i) {
         bin = histo.fBins.arr[i];
         if (bin.fContent < axis_zmin) continue;

         colindx = palette.getContourIndex(bin.fContent);
         if (colindx === null) continue;

         // check if bin outside visible range
         if ((bin.fXmin > pmain.scale_xmax) || (bin.fXmax < pmain.scale_xmin) ||
             (bin.fYmin > pmain.scale_ymax) || (bin.fYmax < pmain.scale_ymin)) continue;

         z1 = pmain.grz((bin.fContent > axis_zmax) ? axis_zmax : bin.fContent);

         let all_pnts = [], all_faces = [],
             ngraphs = 1, gr = bin.fPoly, nfaces = 0;

         if (gr._typename=='TMultiGraph') {
            ngraphs = bin.fPoly.fGraphs.arr.length;
            gr = null;
         }

         for (let ngr = 0; ngr < ngraphs; ++ngr) {
            if (!gr || (ngr>0)) gr = bin.fPoly.fGraphs.arr[ngr];

            let npnts = gr.fNpoints, x = gr.fX, y = gr.fY;
            while ((npnts>2) && (x[0]===x[npnts-1]) && (y[0]===y[npnts-1])) --npnts;

            let pnts, faces;

            for (let ntry=0;ntry<2;++ntry) {
               // run two loops - on the first try to compress data, on second - run as is (removing duplication)

               let lastx, lasty, currx, curry,
                   dist2 = pmain.size_x3d*pmain.size_z3d,
                   dist2limit = (ntry>0) ? 0 : dist2/1e6;

               pnts = []; faces = null;

               for (let vert = 0; vert < npnts; ++vert) {
                  currx = pmain.grx(x[vert]);
                  curry = pmain.gry(y[vert]);
                  if (vert>0)
                     dist2 = (currx-lastx)*(currx-lastx) + (curry-lasty)*(curry-lasty);
                  if (dist2 > dist2limit) {
                     pnts.push(new Vector2(currx, curry));
                     lastx = currx;
                     lasty = curry;
                  }
               }

               try {
                  if (pnts.length > 2)
                     faces = ShapeUtils.triangulateShape(pnts , []);
               } catch(e) {
                  faces = null;
               }

               if (faces && (faces.length>pnts.length-3)) break;
            }

            if (faces && faces.length && pnts) {
               all_pnts.push(pnts);
               all_faces.push(faces);

               nfaces += faces.length * 2;
               if (z1>z0) nfaces += pnts.length*2;
            }
         }

         let pos = new Float32Array(nfaces*9), indx = 0;

         for (let ngr=0;ngr<all_pnts.length;++ngr) {
            let pnts = all_pnts[ngr], faces = all_faces[ngr];

            for (let layer=0;layer<2;++layer) {
               for (let n=0;n<faces.length;++n) {
                  let face = faces[n],
                      pnt1 = pnts[face[0]],
                      pnt2 = pnts[face[(layer===0) ? 2 : 1]],
                      pnt3 = pnts[face[(layer===0) ? 1 : 2]];

                  pos[indx] = pnt1.x;
                  pos[indx+1] = pnt1.y;
                  pos[indx+2] = layer ? z1 : z0;
                  indx+=3;

                  pos[indx] = pnt2.x;
                  pos[indx+1] = pnt2.y;
                  pos[indx+2] = layer ? z1 : z0;
                  indx+=3;

                  pos[indx] = pnt3.x;
                  pos[indx+1] = pnt3.y;
                  pos[indx+2] = layer ? z1 : z0;
                  indx+=3;
               }
            }

            if (z1 > z0) {
               for (let n=0;n<pnts.length;++n) {
                  let pnt1 = pnts[n],
                      pnt2 = pnts[(n>0) ? n-1 : pnts.length-1];

                  pos[indx] = pnt1.x;
                  pos[indx+1] = pnt1.y;
                  pos[indx+2] = z0;
                  indx+=3;

                  pos[indx] = pnt2.x;
                  pos[indx+1] = pnt2.y;
                  pos[indx+2] = z0;
                  indx+=3;

                  pos[indx] = pnt2.x;
                  pos[indx+1] = pnt2.y;
                  pos[indx+2] = z1;
                  indx+=3;

                  pos[indx] = pnt1.x;
                  pos[indx+1] = pnt1.y;
                  pos[indx+2] = z0;
                  indx+=3;

                  pos[indx] = pnt2.x;
                  pos[indx+1] = pnt2.y;
                  pos[indx+2] = z1;
                  indx+=3;

                  pos[indx] = pnt1.x;
                  pos[indx+1] = pnt1.y;
                  pos[indx+2] = z1;
                  indx+=3;
               }
            }
         }

         let geometry = new BufferGeometry();
         geometry.setAttribute( 'position', new BufferAttribute( pos, 3 ) );
         geometry.computeVertexNormals();

         let fcolor = this.fPalette.getColor(colindx);
         let material = new MeshBasicMaterial({ color: fcolor, vertexColors: false });
         let mesh = new Mesh(geometry, material);

         pmain.toplevel.add(mesh);

         mesh.painter = this;
         mesh.bins_index = i;
         mesh.draw_z0 = z0;
         mesh.draw_z1 = z1;
         mesh.tip_color = 0x00FF00;

         mesh.tooltip = function(/*intersects*/) {

            let p = this.painter, main = p.getFramePainter(),
                bin = p.getObject().fBins.arr[this.bins_index];

            let tip = {
              use_itself: true, // indicate that use mesh itself for highlighting
              x1: main.grx(bin.fXmin),
              x2: main.grx(bin.fXmax),
              y1: main.gry(bin.fYmin),
              y2: main.gry(bin.fYmax),
              z1: this.draw_z0,
              z2: this.draw_z1,
              bin: this.bins_index,
              value: bin.fContent,
              color: this.tip_color,
              lines: p.getPolyBinTooltips(this.bins_index)
            };

            return tip;
         };
      }
   }

   /** Draw histogram bins in 3D, using provided draw options */
   draw3DBins() {

      if (!this.draw_content) return;

      if (this.isRH2Poly())
         return this.drawPolyLego();

      if (this.options.Surf)
         return this.drawSurf();

      if (this.options.Error)
         return this.drawError();

      if (this.options.Contour)
         return this.drawContour3D(true);

      drawBinsLego(this);
      this.updatePaletteDraw();
   }

   draw3D(reason) {

      this.mode3d = true;

      let main = this.getFramePainter(), // who makes axis drawing
          is_main = this.isMainPainter(); // is main histogram

      if (reason == "resize") {
         if (is_main && main.resize3D()) main.render3D();

         return Promise.resolve(this);
      }

      let zmult = 1.1;

      this.zmin = main.logz ? this.gminposbin * 0.3 : this.gminbin;
      this.zmax = this.gmaxbin;
      if (this.options.minimum !== -1111) this.zmin = this.options.minimum;
      if (this.options.maximum !== -1111) { this.zmax = this.options.maximum; zmult = 1; }
      if (main.logz && (this.zmin<=0)) this.zmin = this.zmax * 1e-5;

      this.deleteAttr();

      if (is_main) {
         assignFrame3DMethods(main);
         main.create3DScene(this.options.Render3D);
         main.setAxesRanges(this.getAxis("x"), this.xmin, this.xmax, this.getAxis("y"), this.ymin, this.ymax, null, this.zmin, this.zmax);
         main.set3DOptions(this.options);
         main.drawXYZ(main.toplevel, { zmult: zmult, zoom: settings.Zooming, ndim: 2 });
      }

      if (!main.mode3d)
         return Promise.resolve(this);

      return this.drawingBins(reason).then(() => {
         // called when bins received from server, must be reentrant
         let main = this.getFramePainter();

         this.draw3DBins();
         main.render3D();
         main.addKeysHandler();

         return this;
      });
   }

      /** @summary draw RH2 object */
   static draw(dom, obj, opt) {
      // create painter and add it to canvas
      return RH2Painter._draw(new RH2Painter(dom, obj), opt);
   }

} // class RH2Painter

export { RH2Painter };
