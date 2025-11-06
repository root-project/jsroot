import { makeTranslate, DrawOptions, floatToString } from '../base/BasePainter.mjs';
import { ObjectPainter } from '../base/ObjectPainter.mjs';
import { drawObjectTitle } from '../hist/TPavePainter.mjs';
import { ensureTCanvas } from '../gpad/TCanvasPainter.mjs';
import { addMoveHandler } from '../gui/utils.mjs';
import { assignContextMenu } from '../gui/menu.mjs';


/**
 * @summary Painter for TBox class
 * @private
 */

class TPiePainter extends ObjectPainter {

   #rx; // recent rx
   #ry; // recent ry
   #slices; // recent slices
   #movex; // moving X coordinate
   #movey; // moving Y coordinate
   #angle0; // initial angle
   #offset0; // initial offset
   #slice; // moving slice
   #mode; // moving mode
   #padh; // pad height

   /** @summary Decode options */
   decodeOptions(opt) {
      const d = new DrawOptions(opt),
            o = this.getOptions();
      o.is3d = d.check('3D');
      o.lblor = 0;
      o.sort = 0;
      o.samecolor = false;
      o.same = d.check('SAME');
      if (d.check('SC'))
         o.samecolor = true; // around
      if (d.check('T'))
         o.lblor = 2; // around
      if (d.check('R'))
         o.lblor = 1; // along the radius
      if (d.check('>'))
         o.sort = 1;
      if (d.check('<'))
         o.sort = -1;
   }

   /** @summary start of drag handler
     * @private */
   moveStart(x, y) {
      if ((!x && !y) || !this.#slices || !this.#rx || !this.#ry)
         return;
      let angle = Math.atan2(y / this.#ry, x / this.#rx);

      while (angle < 0.5 * Math.PI)
         angle += 2 * Math.PI;

      const pie = this.getObject(),
            len = Math.sqrt((x / this.#rx) ** 2 + (y / this.#ry) ** 2),
            slice = this.#slices.find(elem => {
               return ((elem.a1 < angle) && (angle < elem.a2)) ||
                      ((elem.a1 < angle + 2 * Math.PI) && (angle + 2 * Math.PI < elem.a2));
            });

      // kind of cursor shown
      this.#mode = ((len > 0.95) && (x > this.#rx * 0.95) && this.options.is3d) ? 'n-resize' : ((slice && len < 0.7) ? 'grab' : 'w-resize');

      this.#movex = x;
      this.#movey = y;

      this.getG().style('cursor', this.#mode);

      if (this.#mode === 'grab') {
         this.#slice = slice.n;
         this.#angle0 = len;
         this.#offset0 = pie.fPieSlices[this.#slice].fRadiusOffset;
      } else if (this.#mode === 'n-resize') {
         this.#padh = this.getPadPainter().getPadHeight();
         this.#angle0 = pie.fAngle3D;
         this.#offset0 = y;
      } else {
         this.#angle0 = angle;
         this.#offset0 = pie.fAngularOffset;
      }
   }

   /** @summary drag handler
     * @private */
   moveDrag(dx, dy) {
      this.#movex += dx;
      this.#movey += dy;

      const pie = this.getObject();

      if (this.#mode === 'grab') {
         const len = Math.sqrt((this.#movex / this.#rx) ** 2 + (this.#movey / this.#ry) ** 2);
         pie.fPieSlices[this.#slice].fRadiusOffset = Math.max(0, this.#offset0 + 0.25 * (len - this.#angle0));
      } else if (this.#mode === 'n-resize')
         pie.fAngle3D = Math.max(5, Math.min(85, this.#angle0 + (this.#movey - this.#offset0) / this.#padh * 180));
      else {
         const angle = Math.atan2(this.#movey / this.#ry, this.#movex / this.#rx);
         pie.fAngularOffset = this.#offset0 - (angle - this.#angle0) / Math.PI * 180;
      }

      this.drawPie();
   }

   /** @summary end of drag handler
     * @private */
   moveEnd(not_changed) {
      if (not_changed)
         return;

      const pie = this.getObject();

      let exec;

      if (this.#mode === 'grab')
         exec = `SetEntryRadiusOffset(${this.#slice},${pie.fPieSlices[this.#slice].fRadiusOffset})`;
      else if (this.#mode === 'n-resize')
         exec = `SetAngle3D(${pie.fAngle3D})`;
      else
         exec = `SetAngularOffset(${pie.fAngularOffset})`;

      if (exec)
         this.submitCanvExec(exec + ';;Notify();;');

      this.#mode = null;

      this.getG().style('cursor', null);
   }

   /** @summary Update TPie object */
   updateObject(obj, opt) {
      if (!this.matchObjectType(obj))
         return false;

      this.decodeOptions(opt);

      Object.assign(this.getObject(), obj);

      return true;
   }

   /** @summary Redraw pie */
   async drawPie() {
      const maing = this.createG(),
            pie = this.getObject(),
            o = this.getOptions(),
            xc = this.axisToSvg('x', pie.fX),
            yc = this.axisToSvg('y', pie.fY),
            pp = this.getPadPainter(),
            radX = pie.fRadius;

      let radY = radX, pixelHeight = 1;

      if (o.is3d) {
         radY *= Math.sin(pie.fAngle3D / 180 * Math.PI);
         pixelHeight = this.axisToSvg('y', pie.fY - pie.fHeight) - yc;
      }

      maing.style('cursor', this.#mode || null);

      this.createAttText({ attr: pie });

      const rx = this.axisToSvg('x', pie.fX + radX) - xc,
            ry = this.axisToSvg('y', pie.fY - radY) - yc,
            dist_to_15pi = a => {
               while (a < 0.5 * Math.PI)
                  a += 2 * Math.PI;
               while (a >= 2.5 * Math.PI)
                  a -= 2 * Math.PI;
               return Math.abs(a - 1.5 * Math.PI);
            };

      makeTranslate(maing, xc, yc);

//      pie.fPieSlices[4].fValue = 100;

      const arr = [], promises = [];
      let total = 0, af = -pie.fAngularOffset / 180 * Math.PI;
      // ensure all angles are positive
      while (af <= 2 * Math.PI)
         af += 2 * Math.PI;

      for (let n = 0; n < pie.fPieSlices.length; n++) {
         const slice = pie.fPieSlices[n],
               value = slice.fValue;
         total += value;
         arr.push({ n, value, slice,
            offset: slice.fRadiusOffset,
            attline: this.createAttLine({ attr: slice, std: false }),
            attfill: this.createAttFill({ attr: slice, std: false }),
            g: maing // maing.append('svg:g')
         });
      }

      // sort in increase/decrease order
      if (o.sort !== 0)
         arr.sort((v1, v2) => { return o.sort * (v1.value - v2.value); });

      // now assign angles for each slice

      for (let n = 0; n < arr.length; n++) {
         const entry = arr[n];
         entry.seq = n;
         entry.a2 = af;
         af -= entry.value / total * 2 * Math.PI;
         entry.a1 = af;

         entry.x1 = Math.round(rx * Math.cos(entry.a1));
         entry.y1 = Math.round(ry * Math.sin(entry.a1));
         entry.x2 = Math.round(rx * Math.cos(entry.a2));
         entry.y2 = Math.round(ry * Math.sin(entry.a2));

         if (entry.offset) {
            const coef = radX > 0 ? entry.offset / radX : 0.1,
                  mid_angle = (entry.a1 + entry.a2) / 2;
            entry.dx = Math.round(rx * coef * Math.cos(mid_angle));
            entry.dy = Math.round(ry * coef * Math.sin(mid_angle));
            // makeTranslate(entry.g, dx, dy);
         }
      }

      function check_sector(a, sector) {
         while (a > 2 * Math.PI)
            a -= 2 * Math.PI;
         return (a >= sector*Math.PI/2) && (a < (sector+1) * Math.PI/2);
      }

      function get_sector(a) {
         for (let n = 0; n<4; ++n)
            if (check_sector(a,n))
               return n;
         return -1;
      }

      // sort for visualization in increasing order from Pi/2 angle
      // but two sectors which are near by has to be treated differently
      // arr.sort((v1, v2) => { return v1.a - v2.a; });

/*      arr.sort((v1, v2) => {
         if (v2.seq === (v1.seq + 1)  % arr.length)
            return check_sector(v1.a1, 0) || check_sector(v1.a1, 3) ? 1 : -1;
         if ((v2.seq + 1) % arr.length === v1.seq)
            return check_sector(v1.a2, 1) || check_sector(v1.a2, 2) ? 1 : -1;
         return 0;
      });
*/
/*
      console.log('after sort', pie.fAngularOffset);
      arr.forEach(v => console.log(`${v.n} a1:${v.a1.toFixed(2)} ${get_sector(v.a1)} a2:${v.a2.toFixed(2)} ${get_sector(v.a2)}`))

      for(let n = 0; n < arr.length - 1; ++n) {
         const v1 = arr[n], v2 = arr[n+1];
         let swap = false;
         if (v1.a1 === v2.a2) {
            swap = check_sector(v1.a1, 0) || check_sector(v1.a1, 3);
         } else if (v1.a2 === v2.a1) {
            swap = check_sector(v1.a2, 1) || check_sector(v1.a2, 2);
         }
         if (swap) {
            arr[n] = v2;
            arr[n+1] = v1;
            n++;
         }
      }
      console.log('after sort', pie.fAngularOffset);
      arr.forEach(v => console.log(`${v.n} seq: ${v.seq} a1:${v.a1.toFixed(2)} ${get_sector(v.a1)} a2:${v.a2.toFixed(2)} ${get_sector(v.a2)}`))
*/

      const add_path = (entry, path) => {
         const elem = maing.append('svg:path')
                           .attr('d', path)
                           .call(entry.attline.func)
                           .call(entry.attfill.func);
         if (entry.offset)
            makeTranslate(elem, entry.dx, entry.dy);
      }, build_pie = (entry, func) => {
         // use same segments for side and top/bottom curves
         let a = entry.a1, border = 0;
         while (border <= entry.a1)
            border += Math.PI;
         while (a < entry.a2) {
            if (border >= entry.a2) {
               func(a, entry.a2, entry);
               a = entry.a2;
            } else {
               func(a, border, entry);
               a = border;
               border += Math.PI;
            }
         }
      }, add_curved_side = (aa1, aa2, entry) => {
         if (dist_to_15pi((aa1 + aa2) / 2) < 0.5 * Math.PI)
            return;
         const xx1 = Math.round(rx * Math.cos(aa1)),
               yy1 = Math.round(ry * Math.sin(aa1)),
               xx2 = Math.round(rx * Math.cos(aa2)),
               yy2 = Math.round(ry * Math.sin(aa2));
         add_path(entry, `M${xx1},${yy1}a${rx},${ry},0,0,1,${xx2 - xx1},${yy2 - yy1}v${pixelHeight}a${rx},${ry},0,0,0,${xx1 - xx2},${yy1 - yy2}z`);
      }, add_planar_side = (x, y, entry) => {
         add_path(entry, `M0,0v${pixelHeight}l${x},${y}v${-pixelHeight}z`);
      };

      // build main paths for each slice

      for (let indx = 0; indx < arr.length; indx++) {
         const entry = arr[indx];
         if (o.is3d) {
            entry.pie_path = '';
            build_pie(entry, (aa1, aa2) => {
               const xx1 = Math.round(rx * Math.cos(aa1)),
                     yy1 = Math.round(ry * Math.sin(aa1)),
                     xx2 = Math.round(rx * Math.cos(aa2)),
                     yy2 = Math.round(ry * Math.sin(aa2));
               entry.pie_path += `a${rx},${ry},0,0,1,${xx2 - xx1},${yy2 - yy1}`;
            });
         } else
            entry.pie_path = `a${rx},${ry},0,0,1,${entry.x2 - entry.x1},${entry.y2 - entry.y1}`;
      }

      // code to create 3d effect

      if (o.is3d) {
         let start_indx = -1, border = Math.PI/2;
         for (let indx = 0; indx < arr.length; indx++) {
            const entry = arr[indx];

            // first add bottom
            add_path(entry, `M0,${pixelHeight}l${entry.x1},${entry.y1}${entry.pie_path}z`);

            if ((entry.a1 <= 1.5*Math.PI) && (entry.a2 >= 1.5*Math.PI))
               start_indx = indx;
            else if ((entry.a1 <= 3.5*Math.PI) && (entry.a2 >= 3.5*Math.PI)) {
               start_indx = indx;
               border = 2.5*Math.PI;
            }

            console.log(`entry ${indx}  slice: ${entry.n} a1:${(entry.a1/Math.PI).toFixed(3)} a2:${(entry.a2/Math.PI).toFixed(3)}`)
         }

         console.log('start_indx', start_indx, 'border', border / Math.PI)

         if (start_indx < 0) {
            console.error('fail to find start index, use default');
            start_indx = 0;
         }

         let indx = start_indx, cnt = arr.length;

         while ((arr[indx].a1 > border) && (cnt-- > 0)) {
            const entry1 = arr[indx];
            indx++;
            if (indx === arr.length) {
               indx = 0;
               border += 2*Math.PI;
            }
            const entry2 = arr[indx];

            if (entry1.offset || entry2.offset) {
               console.log(`add planar1 ${entry1.n} and planar2 ${entry2.n}`)
               add_planar_side(entry1.x1, entry1.y1, entry1);
               add_planar_side(entry2.x2, entry2.y2, entry2);
            }

            console.log(`add cureved side ${entry1.n}`)

            // curved
            build_pie(entry1, add_curved_side);
         }

         console.log('--- Made break on index', indx)

         indx = start_indx;

         while (cnt-- > 0) {
            const entry1 = arr[indx];
            indx = (indx === 0) ? arr.length - 1 : indx - 1;
            const entry2 = arr[indx];

            if (entry1.offset || entry2.offset) {
               console.log(`add planar2 ${entry1.n} and planar1 ${entry2.n}`)
               add_planar_side(entry1.x2, entry1.y2, entry1);
               add_planar_side(entry2.x1, entry2.y1, entry2);
            }

            console.log(`add cureved side ${entry2.n}`)

            build_pie(entry2, add_curved_side);
         }
      }

      // at the end add main slice with text

      for (let indx = 0; indx < arr.length; indx++) {
         const entry = arr[indx],
               slice = entry.slice,
               g = entry.g,
               mid_angle = (entry.a1 + entry.a2) / 2;

         // Draw the slices
         const x1 = Math.round(rx * Math.cos(entry.a1)),
               y1 = Math.round(ry * Math.sin(entry.a1)),
               x2 = Math.round(rx * Math.cos(entry.a2)),
               y2 = Math.round(ry * Math.sin(entry.a2));

         // upper
         add_path(entry, `M0,0l${x1},${y1}${entry.pie_path}z`);

         const frac = total ? slice.fValue / total : 0;
         let tmptxt = pie.fLabelFormat;
         tmptxt = tmptxt.replaceAll('%txt', slice.fTitle);
         tmptxt = tmptxt.replaceAll('%val', floatToString(slice.fValue, pie.fValueFormat));
         tmptxt = tmptxt.replaceAll('%frac', floatToString(frac, pie.fFractionFormat));
         tmptxt = tmptxt.replaceAll('%perc', floatToString(frac * 100, pie.fPercentFormat) + '%');

         const arg = {
            draw_g: g,
            x: rx * (1 + pie.fLabelsOffset) * Math.cos(mid_angle),
            y: ry * (1 + pie.fLabelsOffset) * Math.sin(mid_angle),
            latex: 1,
            align: 22,
            text: tmptxt
         };

         if (o.samecolor)
            arg.color = this.getColor(slice.fFillColor);

         if (o.lblor === 1) {
            // radial positioning of the labels
            arg.rotate = Math.atan2(arg.y, arg.x) / Math.PI * 180;
            if (arg.x > 0)
               arg.align = 12;
            else {
               arg.align = 32;
               arg.rotate += 180;
            }
         } else if (o.lblor === 2) {
            // in the slice
            arg.rotate = Math.atan2(y2 - y1, x2 - x1) / Math.PI * 180;
            if ((arg.rotate > 90) || (arg.rotate < -90)) {
               arg.rotate += 180;
               arg.align = 21;
            } else
               arg.align = 23;
         } else if ((arg.x >= 0) && (arg.y >= 0)) {
            arg.align = 13;
            if (o.is3d)
               arg.y += pixelHeight;
         } else if ((arg.x > 0) && (arg.y < 0))
            arg.align = 11;
         else if ((arg.x < 0) && (arg.y >= 0)) {
            arg.align = 33;
            if (o.is3d)
               arg.y += pixelHeight;
         } else if ((arg.x < 0) && (arg.y < 0))
            arg.align = 31;

         const pr = this.startTextDrawingAsync(this.textatt.font, this.textatt.getSize(pp), g)
                        .then(() => this.drawText(arg)).then(() => this.finishTextDrawing(g));

         promises.push(pr);
      }

      return Promise.all(promises).then(() => {
         this.#rx = rx;
         this.#ry = ry;
         this.#slices = arr;
         return this;
      });
   }

   /** @summary Draw TPie title */
   async drawTitle(first_time) {
      return drawObjectTitle(this, first_time, !this.options.same, true);
   }

   /** @summary Redraw TPie object */
   async redraw() {
      return this.drawPie().then(() => this.drawTitle()).then(() => {
         assignContextMenu(this);
         addMoveHandler(this);
         return this;
      });
   }

   /** @summary Fill specific items */
   fillContextMenuItems(menu) {
      const pie = this.getObject();
      menu.add('Change title', () => menu.input('Enter new title', pie.fTitle).then(t => {
         pie.fTitle = t;
         this.interactiveRedraw('pad', `exec:SetTitle("${t}")`);
      }));
   }


   /** @summary Draw TPie object */
   static async draw(dom, obj, opt) {
      const painter = new TPiePainter(dom, obj, opt);
      painter.decodeOptions(opt);
      return ensureTCanvas(painter, false)
         .then(() => painter.drawPie())
         .then(() => painter.drawTitle(true))
         .then(() => {
            assignContextMenu(painter);
            addMoveHandler(painter);
            return painter;
         });
   }

} // class TPiePainter


export { TPiePainter };
