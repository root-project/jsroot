import { isNodeJs, isBatchMode, setBatchMode } from './core.mjs';

import { select as d3_select, pointer as d3_pointer } from './d3.mjs';

import { _loadJSDOM } from './base/BasePainter.mjs';

import { cleanup, getElementCanvPainter } from './base/ObjectPainter.mjs';

import { draw } from './draw.mjs';

class EmulationMouseEvent {

   constructor(x = 0, y = 0) {
      this.$emul = true; // special flag mark emulated event
      this.clientX = x;
      this.clientY = y;
      this.button = 0;
      this.key = '';
   }

   set(x, y) {
      this.clientX = Math.round(x);
      this.clientY = Math.round(y);
   }

  preventDefault() {}
  stopPropagation() {}

} // class EmulationMouseEvent


/** @summary test zooming features
  * @private */
async function testZooming(node) {
   const cp = getElementCanvPainter(node);
   if (!cp) return;

   const fp = cp.getFramePainter();

   if ((typeof fp?.zoom !== 'function') || (typeof fp?.zoomSingle !== 'function')) return;
   if (typeof fp.scale_xmin === 'undefined' || typeof fp.scale_ymax === 'undefined') return;

   const xmin = fp.scale_xmin, xmax = fp.scale_xmax, ymin = fp.scale_yxmin, ymax = fp.scale_ymax;

   return fp.zoom(xmin + 0.2*(xmax - xmin), xmin + 0.8*(xmax - xmin), ymin + 0.2*(ymax - ymin), ymin + 0.8*(ymax - ymin))
            .then(() => fp.unzoom())
            .then(() => fp.zoomSingle('x', xmin + 0.22*(xmax - xmin), xmin + 0.25*(xmax - xmin)))
            .then(() => fp.zoomSingle('y', ymin + 0.12*(ymax - ymin), ymin + 0.13*(ymax - ymin)))
            .then(() => fp.unzoom())
}

/** @summary test zooming features
  * @private */
async function testMouseZooming(node) {
   const cp = getElementCanvPainter(node),
         fp = cp?.getFramePainter();

   if (fp?.mode3d) return;
   if ((typeof fp?.startRectSel !== 'function') || (typeof fp?.moveRectSel !== 'function')) return;

   const fw = fp.getFrameWidth(), fh = fp.getFrameHeight(),
         evnt = new EmulationMouseEvent();

   evnt.set(fw*0.2, fh*0.2);

   fp.startRectSel(evnt);
   for (let i = 2; i < 10; ++i) {
      evnt.set(fw*0.1*i, fh*0.1*i);
      fp.moveRectSel(evnt);
   }
   fp.endRectSel(evnt);
}


/** @summary test interactive features of JSROOT drawings
  * @desc used in https://github.com/linev/jsroot-test
  * @private */
function testInteractivity(args) {
   async function build(main) {
      main.attr('width', args.width).attr('height', args.height)
          .style('width', args.width + 'px').style('height', args.height + 'px');

      const flag = isBatchMode();
      setBatchMode(false);

      return draw(main.node(), args.object, args.option || '').then(() => {
         return testZooming(main.node());
      }).then(() => {
         return testMouseZooming(main.node());
      }).then(() => {
         cleanup(main.node());
         main.remove();
         setBatchMode(flag);
         return true;
      });
   }

   return isNodeJs()
          ? _loadJSDOM().then(handle => build(handle.body.append('div')))
          : build(d3_select('body').append('div'));
}

export { testInteractivity };
