import { isNodeJs, isBatchMode, setBatchMode } from './core.mjs';

import { select as d3_select } from './d3.mjs';

import { _loadJSDOM } from './base/BasePainter.mjs';

import { cleanup, getElementCanvPainter } from './base/ObjectPainter.mjs';

import { draw } from './draw.mjs';


/** @summary test zooming features
  * @private */
async function testZooming(node) {
   const cp = getElementCanvPainter(node);
   if (!cp) return;

   const fp = cp.getFramePainter();

   if (typeof fp?.zoom !== 'function') return;
   if (typeof fp.scale_xmin === 'undefined' || typeof fp.scale_ymax === 'undefined') return;

   const xmin = fp.scale_xmin, xmax = fp.scale_xmax, ymin = fp.scale_yxmin, ymax = fp.scale_ymax;

   return fp.zoom(xmin + 0.2*(xmax - xmin), xmin + 0.8*(xmax - xmin), ymin + 0.2*(ymax - ymin), ymin + 0.8*(ymax - ymin))
            .then(() => fp.unzoom())
            .then(() => fp.zoom('x', xmin + 0.22*(xmax - xmin), xmin + 0.25*(xmax - xmin)))
            .then(() => fp.zoom('y', ymin + 0.12*(ymax - ymin), ymin + 0.13*(ymax - ymin)))
            .then(() => fp.unzoom())
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
