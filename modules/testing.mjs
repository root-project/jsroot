import { isNodeJs, isBatchMode, setBatchMode, postponePromise } from './core.mjs';
import { select as d3_select } from './d3.mjs';
import { _loadJSDOM } from './base/BasePainter.mjs';
import { cleanup, getElementCanvPainter } from './base/ObjectPainter.mjs';
import { draw } from './draw.mjs';
import { closeMenu } from './gui/menu.mjs';


async function _test_timeout(args, portion = 1) {
   if (!args?.timeout)
      return true;

   return postponePromise(true, Math.round(portion * args.timeout));
}

class EmulationMouseEvent {

   constructor(x = 0, y = 0) {
      this.$emul = true; // special flag mark emulated event
      this.button = 0;
      this.key = '';
      this.set(x, y);
   }

   set(x, y) {
      this.clientX = Math.round(x);
      this.clientY = Math.round(y);
   }

   setTouch(x1, y1, x2, y2) {
      this.$touch_arr = [[Math.round(x1), Math.round(y1)], [Math.round(x2), Math.round(y2)]];
   }

  preventDefault() {}
  stopPropagation() {}

} // class EmulationMouseEvent

function _getAllSubPads(cp) {
   const sub = [];
   cp?.forEachPainterInPad(p => {
      if ((p !== cp) && p.getFramePainter())
         sub.push(p);
   }, 'pads');
   return sub.length > 4 ? [] : sub; // do not test large canvas with many-many subpads
}

/** @summary test zooming features
  * @private */
async function testZooming(node, args, pp) {
   const cp = getElementCanvPainter(node),
         pad_painter = pp ?? cp;
   if (!pad_painter) return;
   const fp = pad_painter.getFramePainter();
   if (!fp && !pp) {
      const sub_pads = _getAllSubPads(cp);
      for (let k = 0; k < sub_pads.length; ++k)
         await testZooming(node, args, sub_pads[k]);
      return;
   }

   if ((typeof fp?.zoom !== 'function') || (typeof fp?.zoomSingle !== 'function')) return;
   if (typeof fp.scale_xmin === 'undefined' || typeof fp.scale_ymax === 'undefined') return;

   const xmin = fp.scale_xmin, xmax = fp.scale_xmax, ymin = fp.scale_ymin, ymax = fp.scale_ymax;

   if (args.debug) console.log(`test zooming in range: ${xmin} ${xmax} ${ymin} ${ymax}`);

   await fp.zoom(xmin + 0.2*(xmax - xmin), xmin + 0.8*(xmax - xmin), ymin + 0.2*(ymax - ymin), ymin + 0.8*(ymax - ymin));
   await _test_timeout(args);
   await fp.unzoom();
   await _test_timeout(args);
   await fp.zoomSingle('x', xmin + 0.22*(xmax - xmin), xmin + 0.25*(xmax - xmin));
   await _test_timeout(args);
   await fp.zoomSingle('y', ymin + 0.12*(ymax - ymin), ymin + 0.43*(ymax - ymin));
   await _test_timeout(args);
   await fp.unzoom();
}

/** @summary test mouse zooming features
  * @private */
async function testMouseZooming(node, args, pp) {
   const cp = getElementCanvPainter(node),
         pad_painter = pp ?? cp;
   if (!pad_painter) return;
   const fp = pad_painter.getFramePainter();

   if (!fp && !pp) {
      const sub_pads = _getAllSubPads(cp);
      for (let k = 0; k < sub_pads.length; ++k)
         await testMouseZooming(node, args, sub_pads[k]);
      return;
   }

   if (fp?.mode3d) return;
   if ((typeof fp?.startRectSel !== 'function') ||
       (typeof fp?.moveRectSel !== 'function') ||
       (typeof fp?.endRectSel !== 'function')) return;

   const fw = fp.getFrameWidth(), fh = fp.getFrameHeight(),
         evnt = new EmulationMouseEvent(),
         rect = fp.getFrameSvg().node().getBoundingClientRect();

   if (args.debug) console.log(`test mouse zooming in frame: ${fw} ${fh}`);

   // region zooming

   for (let side = -1; side <= 1; side++) {
      evnt.set(rect.x + (side > 0 ? -25 : fw*0.1), rect.y + (side < 0 ? fh + 25 : fh*0.1));

      fp.startRectSel(evnt);

      await _test_timeout(args);

      for (let i = 2; i < 10; ++i) {
         evnt.set(rect.x + (side > 0 ? -5 : fw*0.1*i), rect.y + (side < 0 ? fh + 25 : fh*0.1*i));
         fp.moveRectSel(evnt);
         await _test_timeout(args, 0.2);
      }

      await fp.endRectSel(evnt);

      await _test_timeout(args);

      await fp.unzoom();
   }
}

/** @summary test touch zooming features
  * @private */
async function testTouchZooming(node, args, pp) {
   const cp = getElementCanvPainter(node),
         pad_painter = pp ?? cp;
   if (!pad_painter) return;
   const fp = pad_painter.getFramePainter();

   if (!fp && !pp) {
      const sub_pads = _getAllSubPads(cp);
      for (let k = 0; k < sub_pads.length; ++k)
         await testTouchZooming(node, args, sub_pads[k]);
      return;
   }

   if (fp?.mode3d) return;
   if ((typeof fp?.startTouchZoom !== 'function') ||
       (typeof fp?.moveTouchZoom !== 'function') ||
       (typeof fp?.endTouchZoom !== 'function')) return;

   const fw = fp.getFrameWidth(), fh = fp.getFrameHeight(),
         evnt = new EmulationMouseEvent();

   if (args.debug) console.log(`test touch zooming in frame: ${fw} ${fh}`);

   evnt.setTouch(fw*0.4, fh*0.4, fw*0.6, fh*0.6);

   fp.startTouchZoom(evnt);

   await _test_timeout(args);

   for (let i = 2; i < 9; ++i) {
      evnt.setTouch(fw*0.05*(10 - i), fh*0.05*(10 - i), fw*0.05*(10 + i), fh*0.05*(10 + i));
      fp.moveTouchZoom(evnt);
      await _test_timeout(args, 0.2);
   }

   await fp.endTouchZoom(evnt);

   await _test_timeout(args);

   await fp.unzoom();
}

/** @summary test mouse wheel zooming features
  * @private */
async function testMouseWheel(node, args, pp) {
   const cp = getElementCanvPainter(node),
         pad_painter = pp ?? cp;
   if (!pad_painter) return;
   const fp = pad_painter.getFramePainter();

   if (!fp && !pp) {
      const sub_pads = _getAllSubPads(cp);
      for (let k = 0; k < sub_pads.length; ++k)
         await testMouseWheel(node, args, sub_pads[k]);
      return;
   }

   if (fp?.mode3d) return;
   if (typeof fp?.mouseWheel !== 'function') return;

   const fw = fp.getFrameWidth(), fh = fp.getFrameHeight(),
         evnt = new EmulationMouseEvent(),
         rect = fp.getFrameSvg().node().getBoundingClientRect();

   evnt.set(rect.x + fw*0.4, rect.y + fh*0.4);

   // zoom inside
   for (let i = 0; i < 7; ++i) {
      evnt.wheelDelta = 1;
      await fp.mouseWheel(evnt);
      await _test_timeout(args, 0.2);
   }

   // zoom outside
   for (let i = 0; i < 7; ++i) {
      evnt.wheelDelta = -1;
      await fp.mouseWheel(evnt);
      await _test_timeout(args, 0.2);
   }

   await _test_timeout(args);

   await fp.unzoom();
}


async function testFrameClick(node, pp) {
   const cp = getElementCanvPainter(node),
         pad_painter = pp ?? cp;
   if (!pad_painter) return;
   const fp = pad_painter.getFramePainter();

   if (!fp && !pp) {
      const sub_pads = _getAllSubPads(cp);
      for (let k = 0; k < sub_pads.length; ++k)
         await testFrameClick(node, sub_pads[k]);
      return;
   }

   if (fp?.mode3d || typeof fp?.processFrameClick !== 'function') return;

   const fw = fp.getFrameWidth(), fh = fp.getFrameHeight();

   for (let i = 1; i < 15; i++) {
      for (let j = 1; j < 15; j++) {
         const pnt = { x: Math.round(i/15*fw), y: Math.round(j/15*fh) };
         fp.processFrameClick(pnt);
      }
   }
}

async function testFrameMouseDoubleClick(node, pp) {
   const cp = getElementCanvPainter(node),
         pad_painter = pp ?? cp;
   if (!pad_painter) return;
   const fp = pad_painter.getFramePainter();

   if (!fp && !pp) {
      const sub_pads = _getAllSubPads(cp);
      for (let k = 0; k < sub_pads.length; ++k)
         await testFrameMouseDoubleClick(node, sub_pads[k]);
      return;
   }

   if (fp?.mode3d || typeof fp?.mouseDoubleClick !== 'function') return;

   const fw = fp.getFrameWidth(), fh = fp.getFrameHeight(),
         evnt = new EmulationMouseEvent(),
         rect = fp.getFrameSvg().node().getBoundingClientRect();

   for (let i = -2; i < 14; i++) {
      for (let j = -2; j < 14; j++) {
         evnt.set(rect.x + i/10*fw, rect.y + j/10*fh);
         await fp.mouseDoubleClick(evnt);
      }
   }
}

async function testFrameContextMenu(node, args, pp) {
   const cp = getElementCanvPainter(node),
         pad_painter = pp ?? cp;
   if (!pad_painter) return;
   const fp = pad_painter.getFramePainter();

   if (!fp && !pp) {
      const sub_pads = _getAllSubPads(cp);
      for (let k = 0; k < sub_pads.length; ++k)
         await testFrameContextMenu(node, args, sub_pads[k]);
      return;
   }

   if (fp?.mode3d || typeof fp?.showContextMenu !== 'function') return;

   const fw = fp.getFrameWidth(), fh = fp.getFrameHeight(),
         evnt = new EmulationMouseEvent(),
         rect = fp.getFrameSvg().node().getBoundingClientRect();

   for (let i = 1; i < 10; i++) {
      for (let j = 1; j < 10; j++) {
         evnt.set(rect.x + i/10*fw, rect.y + j/10*fh);
         await fp.showContextMenu('', evnt);
         await _test_timeout(args, 0.03);
         closeMenu();
      }
   }

   evnt.set(rect.x + 20, rect.y + fh + 20);
   await fp.showContextMenu('x', evnt);
   await _test_timeout(args, 0.1);
   closeMenu();

   evnt.set(rect.x - 20, rect.y + 20);
   await fp.showContextMenu('y', evnt);
   await _test_timeout(args, 0.1);
   closeMenu();
}

async function testPadContextMenu(node, args, pp) {
   const cp = pp ?? getElementCanvPainter(node);

   if (!pp && cp) {
      const sub_pads = _getAllSubPads(cp);
      for (let k = 0; k < sub_pads.length; ++k)
         await testPadContextMenu(node, args, sub_pads[k]);
   }

   if (typeof cp?.padContextMenu !== 'function') return;

   const pw = cp.getPadWidth(), ph = cp.getPadHeight(),
         evnt = new EmulationMouseEvent(),
         rect = cp.svg_this_pad().node().getBoundingClientRect();

   for (let i = 1; i < 10; i++) {
      for (let j = 1; j < 10; j++) {
         evnt.set(rect.x + i/10*pw, rect.y + j/10*ph);
         await cp.padContextMenu(evnt);
         await _test_timeout(args, 0.03);
         closeMenu();
      }
   }
}

async function testPadItemContextMenu(node, args, pp) {
   const cp = pp ?? getElementCanvPainter(node);

   if (!pp && cp) {
      const sub_pads = _getAllSubPads(cp);
      for (let k = 0; k < sub_pads.length; ++k)
         await testPadItemContextMenu(node, args, sub_pads[k]);
   }

   if (typeof cp?.itemContextMenu !== 'function') return;

   const nprimitives = cp.painters?.length ?? 0,
         names = ['xaxis', 'yaxis', 'zaxis', 'pad', 'frame'];

   for (let i = -names.length; i < nprimitives; ++i) {
      const name = (i < 0) ? names[i+names.length] : i.toString();
      await cp.itemContextMenu(name);
      await _test_timeout(args, 0.1);
      closeMenu();
   }
}

async function testPadButtons(node, args) {
   const cp = getElementCanvPainter(node);
   if (typeof cp?.clickPadButton !== 'function') return;

   const evnt = new EmulationMouseEvent(50, 50),
         toggles = ['ToggleZoom', 'ToggleLogX', 'ToggleLogY', 'ToggleLogZ', 'Toggle3D', 'ToggleColorZ', 'ToggleStatBox'];

   await cp.clickPadButton('PadContextMenus', evnt);
   await _test_timeout(args, 0.1);
   closeMenu();

   if (!args.no_enlarge)
      toggles.unshift('enlargePad');

   for (let i = 0; i < toggles.length; ++i) {
      await cp.clickPadButton(toggles[i], evnt);
      await _test_timeout(args, 0.1);
      await cp.clickPadButton(toggles[i], evnt);
      await _test_timeout(args, 0.1);
   }
}


async function _testing(dom, args) {
   await testFrameClick(dom);
   await testFrameMouseDoubleClick(dom);

   await testZooming(dom, args);
   await testMouseZooming(dom, args);
   await testMouseWheel(dom, args);
   await testFrameContextMenu(dom, args);
   await testTouchZooming(dom, args);

   await testFrameClick(dom);
   await testFrameMouseDoubleClick(dom);

   await testPadContextMenu(dom, args);
   await testPadItemContextMenu(dom, args);
   await testPadButtons(dom, args);
}


/** @summary test interactive features of JSROOT drawings
  * @desc used in https://github.com/linev/jsroot-test
  * @private */
async function testInteractivity(args) {
   if (args.dom)
      return _testing(args.dom, args);

   async function build(main) {
      main.attr('width', args.width).attr('height', args.height)
          .style('width', args.width + 'px').style('height', args.height + 'px');

      setBatchMode(false);

      return main;
   }

   const flag = isBatchMode(),
         pr = isNodeJs()
          ? _loadJSDOM().then(handle => build(handle.body.append('div')))
          : build(d3_select('body').append('div'));
   return pr.then(main => {
      main.attr('width', args.width).attr('height', args.height)
          .style('width', args.width + 'px').style('height', args.height + 'px');

      setBatchMode(false);

      return draw(main.node(), args.object, args.option || '')
             .then(() => _testing(main.node(), args))
             .then(() => {
                cleanup(main.node());
                main.remove();
                setBatchMode(flag);
                return true;
              });
   });
}

export { testInteractivity };
