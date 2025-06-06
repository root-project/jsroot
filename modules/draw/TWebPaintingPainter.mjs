import { getColor } from '../base/colors.mjs';
import { ObjectPainter } from '../base/ObjectPainter.mjs';
import { pointer as d3_pointer } from '../d3.mjs';
import { urlClassPrefix } from '../core.mjs';
import { assignContextMenu } from '../gui/menu.mjs';


/**
 * @summary Painter for TWebPainting classes.
 *
 * @private
 */

class TWebPaintingPainter extends ObjectPainter {

   /** @summary Update TWebPainting object */
   updateObject(obj) {
      if (!this.matchObjectType(obj))
         return false;
      this.assignObject(obj);
      return true;
   }

   /** @summary Provides menu header */
   getMenuHeader() {
      return this.getObject()?.fClassName || 'TWebPainting';
   }

   /** @summary Fill context menu
    * @desc Create only header, items will be requested from server */
   fillContextMenu(menu) {
      const cl = this.getMenuHeader();
      menu.header(cl, `${urlClassPrefix}${cl}.html`);
      return true;
   }

   /** @summary Mouse click handler
    * @desc Redirect mouse click events to the ROOT application
    * @private */
   handleMouseClick(evnt) {
      const pp = this.getPadPainter(),
            rect = pp?.getPadRect();

      if (pp && rect && this.getSnapId()) {
         const pos = d3_pointer(evnt, this.getG().node());
         pp.selectObjectPainter(this, { x: pos[0] + rect.x, y: pos[1] + rect.y });
      }
   }

   /** @summary draw TWebPainting object */
   async redraw() {
      const obj = this.getObject(), func = this.getAxisToSvgFunc();

      if (!obj?.fOper || !func)
         return this;

      let indx = 0, attr = {}, lastpath = null, lastkind = 'none', d = '',
          oper, npoints, n;

      const g = this.createG(),
            arr = obj.fOper.split(';'),
      check_attributes = kind => {
         if (kind === lastkind)
            return;

         if (lastpath) {
            lastpath.attr('d', d); // flush previous
            d = '';
            lastpath = null;
            lastkind = 'none';
         }

         if (!kind)
            return;

         lastkind = kind;
         lastpath = g.append('svg:path').attr('d', ''); // placeholder for 'd' to have it always in front
         switch (kind) {
            case 'f': lastpath.call(this.fillatt.func); break;
            case 'l': lastpath.call(this.lineatt.func).style('fill', 'none'); break;
            case 'm': lastpath.call(this.markeratt.func); break;
         }
      }, read_attr = (str, names) => {
         let lastp = 0;
         const obj2 = { _typename: 'any' };
         for (let k = 0; k < names.length; ++k) {
            const p = str.indexOf(':', lastp+1);
            obj2[names[k]] = parseInt(str.slice(lastp+1, (p > lastp) ? p : undefined));
            lastp = p;
         }
         return obj2;
      }, process = k => {
         while (++k < arr.length) {
            oper = arr[k][0];
            switch (oper) {
               case 'z':
                  this.createAttLine({ attr: read_attr(arr[k], ['fLineColor', 'fLineStyle', 'fLineWidth']), force: true });
                  check_attributes();
                  continue;
               case 'y':
                  this.createAttFill({ attr: read_attr(arr[k], ['fFillColor', 'fFillStyle']), force: true });
                  check_attributes();
                  continue;
               case 'x':
                  this.createAttMarker({ attr: read_attr(arr[k], ['fMarkerColor', 'fMarkerStyle', 'fMarkerSize']), force: true });
                  check_attributes();
                  continue;
               case 'o':
                  attr = read_attr(arr[k], ['fTextColor', 'fTextFont', 'fTextSize', 'fTextAlign', 'fTextAngle']);
                  if (attr.fTextSize < 0) attr.fTextSize *= -0.001;
                  check_attributes();
                  continue;
               case 'r':
               case 'b': {
                  check_attributes((oper === 'b') ? 'f' : 'l');

                  const x1 = func.x(obj.fBuf[indx++]),
                        y1 = func.y(obj.fBuf[indx++]),
                        x2 = func.x(obj.fBuf[indx++]),
                        y2 = func.y(obj.fBuf[indx++]);

                  d += `M${x1},${y1}h${x2-x1}v${y2-y1}h${x1-x2}z`;
                  continue;
               }
               case 'l':
               case 'f': {
                  check_attributes(oper);

                  npoints = parseInt(arr[k].slice(1));

                  for (n = 0; n < npoints; ++n)
                     d += `${(n>0)?'L':'M'}${func.x(obj.fBuf[indx++])},${func.y(obj.fBuf[indx++])}`;

                  if (oper === 'f') d += 'Z';

                  continue;
               }

               case 'm': {
                  check_attributes(oper);

                  npoints = parseInt(arr[k].slice(1));

                  this.markeratt.resetPos();
                  for (n = 0; n < npoints; ++n)
                     d += this.markeratt.create(func.x(obj.fBuf[indx++]), func.y(obj.fBuf[indx++]));

                  continue;
               }

               case 'h':
               case 't': {
                  if (attr.fTextSize) {
                     check_attributes();

                     const height = (attr.fTextSize > 1) ? attr.fTextSize : this.getPadPainter().getPadHeight() * attr.fTextSize,
                           group = g.append('svg:g');

                     return this.startTextDrawingAsync(attr.fTextFont, height, group).then(() => {
                        let text = arr[k].slice(1),
                            angle = attr.fTextAngle;
                        if (angle >= 360)
                           angle -= Math.floor(angle/360) * 360;

                        if (oper === 'h') {
                           let res = '';
                           for (n = 0; n < text.length; n += 2)
                              res += String.fromCharCode(parseInt(text.slice(n, n+2), 16));
                           text = res;
                        }

                        // todo - correct support of angle
                        this.drawText({ align: attr.fTextAlign,
                                        x: func.x(obj.fBuf[indx++]),
                                        y: func.y(obj.fBuf[indx++]),
                                        rotate: -angle,
                                        text,
                                        color: getColor(attr.fTextColor),
                                        latex: 0, draw_g: group });

                        return this.finishTextDrawing(group);
                     }).then(() => process(k));
                  }
                  continue;
               }

               default:
                  console.log(`unsupported operation ${oper}`);
            }
         }

         return Promise.resolve(true);
      };


      return process(-1).then(() => {
         check_attributes();
         assignContextMenu(this);
         if (!this.isBatchMode())
            g.on('click', evnt => this.handleMouseClick(evnt));
         return this;
      });
   }

   static async draw(dom, obj) {
      const painter = new TWebPaintingPainter(dom, obj);
      painter.addToPadPrimitives();
      return painter.redraw();
   }

} // class TWebPaintingPainter


export { TWebPaintingPainter };
