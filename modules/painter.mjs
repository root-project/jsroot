
import { select as d3_select } from './d3.mjs';

import { gStyle, loadScript, decodeUrl,
         browser, settings, constants, internals, isBatchMode, isNodeJs } from './core.mjs';

import { BasePainter } from './base/BasePainter.mjs';

import { ObjectPainter } from './base/ObjectPainter.mjs';


if (!isBatchMode())
   await loadScript('$$$style/JSRoot.painter');

function detectRightButton(event) {
   if ('buttons' in event) return event.buttons === 2;
   if ('which' in event) return event.which === 3;
   if ('button' in event) return event.button === 2;
   return false;
}

/** @summary Converts numeric value to string according to specified format.
  * @param {number} value - value to convert
  * @param {string} [fmt="6.4g"] - format can be like 5.4g or 4.2e or 6.4f
  * @param {boolean} [ret_fmt] - when true returns array with value and actual format like ["0.1","6.4f"]
  * @returns {string|Array} - converted value or array with value and actual format */
function floatToString(value, fmt, ret_fmt) {
   if (!fmt) fmt = "6.4g";

   fmt = fmt.trim();
   let len = fmt.length;
   if (len<2)
      return ret_fmt ? [value.toFixed(4), "6.4f"] : value.toFixed(4);
   let last = fmt[len-1];
   fmt = fmt.slice(0,len-1);
   let isexp, prec = fmt.indexOf(".");
   prec = (prec<0) ? 4 : parseInt(fmt.slice(prec+1));
   if (!Number.isInteger(prec) || (prec <=0)) prec = 4;

   let significance = false;
   if ((last=='e') || (last=='E')) { isexp = true; } else
   if (last=='Q') { isexp = true; significance = true; } else
   if ((last=='f') || (last=='F')) { isexp = false; } else
   if (last=='W') { isexp = false; significance = true; } else
   if ((last=='g') || (last=='G')) {
      let se = floatToString(value, fmt+'Q', true),
          sg = floatToString(value, fmt+'W', true);

      if (se[0].length < sg[0].length) sg = se;
      return ret_fmt ? sg : sg[0];
   } else {
      isexp = false;
      prec = 4;
   }

   if (isexp) {
      // for exponential representation only one significant digit befor point
      if (significance) prec--;
      if (prec < 0) prec = 0;

      let se = value.toExponential(prec);

      return ret_fmt ? [se, '5.'+prec+'e'] : se;
   }

   let sg = value.toFixed(prec);

   if (significance) {

      // when using fixed representation, one could get 0.0
      if ((value!=0) && (Number(sg)==0.) && (prec>0)) {
         prec = 20; sg = value.toFixed(prec);
      }

      let l = 0;
      while ((l<sg.length) && (sg[l] == '0' || sg[l] == '-' || sg[l] == '.')) l++;

      let diff = sg.length - l - prec;
      if (sg.indexOf(".")>l) diff--;

      if (diff != 0) {
         prec-=diff;
         if (prec<0) prec = 0; else if (prec>20) prec = 20;
         sg = value.toFixed(prec);
      }
   }

   return ret_fmt ? [sg, '5.'+prec+'f'] : sg;
}


/** @summary Draw options interpreter
  * @private */
class DrawOptions {

   constructor(opt) {
      this.opt = opt && (typeof opt == "string") ? opt.toUpperCase().trim() : "";
      this.part = "";
   }

   /** @summary Returns true if remaining options are empty or contain only seperators symbols. */
   empty() {
      if (this.opt.length === 0) return true;
      return this.opt.replace(/[ ;_,]/g,"").length == 0;
   }

   /** @summary Returns remaining part of the draw options. */
   remain() { return this.opt; }

   /** @summary Checks if given option exists */
   check(name, postpart) {
      let pos = this.opt.indexOf(name);
      if (pos < 0) return false;
      this.opt = this.opt.substr(0, pos) + this.opt.substr(pos + name.length);
      this.part = "";
      if (!postpart) return true;

      let pos2 = pos;
      while ((pos2 < this.opt.length) && (this.opt[pos2] !== ' ') && (this.opt[pos2] !== ',') && (this.opt[pos2] !== ';')) pos2++;
      if (pos2 > pos) {
         this.part = this.opt.substr(pos, pos2 - pos);
         this.opt = this.opt.substr(0, pos) + this.opt.substr(pos2);
      }
      return true;
   }

   /** @summary Returns remaining part of found option as integer. */
   partAsInt(offset, dflt) {
      let val = this.part.replace(/^\D+/g, '');
      val = val ? parseInt(val, 10) : Number.NaN;
      return !Number.isInteger(val) ? (dflt || 0) : val + (offset || 0);
   }

   /** @summary Returns remaining part of found option as float. */
   partAsFloat(offset, dflt) {
      let val = this.part.replace(/^\D+/g, '');
      val = val ? parseFloat(val) : Number.NaN;
      return !Number.isFinite(val) ? (dflt || 0) : val + (offset || 0);
   }
}


/** @summary Simple random generator with controlled seed
  * @private */
class TRandom {
   constructor(i) {
      if (i!==undefined) this.seed(i);
   }
   /** @summary Seed simple random generator */
   seed(i) {
      i = Math.abs(i);
      if (i > 1e8)
         i = Math.abs(1e8 * Math.sin(i));
      else if (i < 1)
         i *= 1e8;
      this.m_w = Math.round(i);
      this.m_z = 987654321;
   }
   /** @summary Produce random value between 0 and 1 */
   random() {
      if (this.m_z === undefined) return Math.random();
      this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & 0xffffffff;
      this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & 0xffffffff;
      let result = ((this.m_z << 16) + this.m_w) & 0xffffffff;
      result /= 4294967296;
      return result + 0.5;
   }
}

// ============================================================================================


/** @summary Read style and settings from URL
  * @private */
function readStyleFromURL(url) {
   let d = decodeUrl(url);

   if (d.has("optimize")) {
      settings.OptimizeDraw = 2;
      let optimize = d.get("optimize");
      if (optimize) {
         optimize = parseInt(optimize);
         if (Number.isInteger(optimize)) settings.OptimizeDraw = optimize;
      }
   }

   let inter = d.get("interactive");
   if (inter === "nomenu")
      settings.ContextMenu = false;
   else if (inter !== undefined) {
      if (!inter || (inter == "1"))
         inter = "111111";
      else if (inter == "0")
         inter = "000000";
      if (inter.length === 6) {
         switch(inter[0]) {
            case "0": gStyle.ToolBar = false; break;
            case "1": gStyle.ToolBar = 'popup'; break;
            case "2": gStyle.ToolBar = true; break;
         }
         inter = inter.substr(1);
      }
      if (inter.length == 5) {
         settings.Tooltip = parseInt(inter[0]);
         settings.ContextMenu = (inter[1] != '0');
         settings.Zooming = (inter[2] != '0');
         settings.MoveResize = (inter[3] != '0');
         settings.DragAndDrop = (inter[4] != '0');
      }
   }

   let tt = d.get("tooltip");
   if ((tt == "off") || (tt == "false") || (tt == "0"))
      settings.Tooltip = false;
   else if (d.has("tooltip"))
      settings.Tooltip = true;

   if (d.has("bootstrap") || d.has("bs"))
      settings.Bootstrap = true;

   let mathjax = d.get("mathjax", null), latex = d.get("latex", null);

   if ((mathjax !== null) && (mathjax != "0") && (latex === null)) latex = "math";
   if (latex !== null)
      settings.Latex = constants.Latex.fromString(latex);

   if (d.has("nomenu")) settings.ContextMenu = false;
   if (d.has("noprogress")) settings.ProgressBox = false;
   if (d.has("notouch")) browser.touches = false;
   if (d.has("adjframe")) settings.CanAdjustFrame = true;

   let optstat = d.get("optstat"), optfit = d.get("optfit");
   if (optstat) gStyle.fOptStat = parseInt(optstat);
   if (optfit) gStyle.fOptFit = parseInt(optfit);
   gStyle.fStatFormat = d.get("statfmt", gStyle.fStatFormat);
   gStyle.fFitFormat = d.get("fitfmt", gStyle.fFitFormat);

   if (d.has("toolbar")) {
      let toolbar = d.get("toolbar", ""), val = null;
      if (toolbar.indexOf('popup') >= 0) val = 'popup';
      if (toolbar.indexOf('left') >= 0) { settings.ToolBarSide = 'left'; val = 'popup'; }
      if (toolbar.indexOf('right') >= 0) { settings.ToolBarSide = 'right'; val = 'popup'; }
      if (toolbar.indexOf('vert') >= 0) { settings.ToolBarVert = true; val = 'popup'; }
      if (toolbar.indexOf('show') >= 0) val = true;
      settings.ToolBar = val || ((toolbar.indexOf("0") < 0) && (toolbar.indexOf("false") < 0) && (toolbar.indexOf("off") < 0));
   }

   if (d.has("skipsi") || d.has("skipstreamerinfos"))
      settings.SkipStreamerInfos = true;

   if (d.has("nodraggraphs"))
      settings.DragGraphs = false;

   if (d.has("palette")) {
      let palette = parseInt(d.get("palette"));
      if (Number.isInteger(palette) && (palette > 0) && (palette < 113)) settings.Palette = palette;
   }

   let render3d = d.get("render3d"), embed3d = d.get("embed3d"),
       geosegm = d.get("geosegm"), geocomp = d.get("geocomp");
   if (render3d) settings.Render3D = constants.Render3D.fromString(render3d);
   if (embed3d) settings.Embed3D = constants.Embed3D.fromString(embed3d);
   if (geosegm) settings.GeoGradPerSegm = Math.max(2, parseInt(geosegm));
   if (geocomp) settings.GeoCompressComp = (geocomp !== '0') && (geocomp !== 'false') && (geocomp !== 'off');

   if (d.has("hlimit")) settings.HierarchyLimit = parseInt(d.get("hlimit"));
}

/** @summary Function used to provide svg:path for the smoothed curves.
  * @desc reuse code from d3.js. Used in TH1, TF1 and TGraph painters
  * @param {string} kind  should contain "bezier" or "line".
  * If first symbol "L", then it used to continue drawing
  * @private */
function buildSvgPath(kind, bins, height, ndig) {

   const smooth = kind.indexOf("bezier") >= 0;

   if (ndig === undefined) ndig = smooth ? 2 : 0;
   if (height === undefined) height = 0;

   const jsroot_d3_svg_lineSlope = (p0, p1) => (p1.gry - p0.gry) / (p1.grx - p0.grx),
         jsroot_d3_svg_lineFiniteDifferences = points => {
      let i = 0, j = points.length - 1, m = [], p0 = points[0], p1 = points[1], d = m[0] = jsroot_d3_svg_lineSlope(p0, p1);
      while (++i < j) {
         p0 = p1; p1 = points[i + 1];
         m[i] = (d + (d = jsroot_d3_svg_lineSlope(p0, p1))) / 2;
      }
      m[i] = d;
      return m;
   }, jsroot_d3_svg_lineMonotoneTangents = points => {
      let d, a, b, s, m = jsroot_d3_svg_lineFiniteDifferences(points), i = -1, j = points.length - 1;
      while (++i < j) {
         d = jsroot_d3_svg_lineSlope(points[i], points[i + 1]);
         if (Math.abs(d) < 1e-6) {
            m[i] = m[i + 1] = 0;
         } else {
            a = m[i] / d;
            b = m[i + 1] / d;
            s = a * a + b * b;
            if (s > 9) {
               s = d * 3 / Math.sqrt(s);
               m[i] = s * a;
               m[i + 1] = s * b;
            }
         }
      }
      i = -1;
      while (++i <= j) {
         s = (points[Math.min(j, i + 1)].grx - points[Math.max(0, i - 1)].grx) / (6 * (1 + m[i] * m[i]));
         points[i].dgrx = s || 0;
         points[i].dgry = m[i] * s || 0;
      }
   };

   let res = { path: "", close: "" }, bin = bins[0], maxy = Math.max(bin.gry, height + 5),
      currx = Math.round(bin.grx), curry = Math.round(bin.gry), dx, dy, npnts = bins.length;

   const conv = val => {
      let vvv = Math.round(val);
      if ((ndig == 0) || (vvv === val)) return vvv.toString();
      let str = val.toFixed(ndig);
      while ((str[str.length - 1] == '0') && (str.lastIndexOf(".") < str.length - 1))
         str = str.substr(0, str.length - 1);
      if (str[str.length - 1] == '.')
         str = str.substr(0, str.length - 1);
      if (str == "-0") str = "0";
      return str;
   };

   res.path = ((kind[0] == "L") ? "L" : "M") + conv(bin.grx) + "," + conv(bin.gry);

   // just calculate all deltas, can be used to build exclusion
   if (smooth || kind.indexOf('calc') >= 0)
      jsroot_d3_svg_lineMonotoneTangents(bins);

   if (smooth) {
      // build smoothed curve
      res.path += `C${conv(bin.grx+bin.dgrx)},${conv(bin.gry+bin.dgry)},`;
      for (let n = 1; n < npnts; ++n) {
         let prev = bin;
         bin = bins[n];
         if (n > 1) res.path += "S";
         res.path += `${conv(bin.grx - bin.dgrx)},${conv(bin.gry - bin.dgry)},${conv(bin.grx)},${conv(bin.gry)}`;
         maxy = Math.max(maxy, prev.gry);
      }
   } else if (npnts < 10000) {
      // build simple curve

      let acc_x = 0, acc_y = 0;

      const flush = () => {
         if (acc_x) { res.path += "h" + acc_x; acc_x = 0; }
         if (acc_y) { res.path += "v" + acc_y; acc_y = 0; }
      };

      for (let n = 1; n < npnts; ++n) {
         bin = bins[n];
         dx = Math.round(bin.grx) - currx;
         dy = Math.round(bin.gry) - curry;
         if (dx && dy) {
            flush();
            res.path += `l${dx},${dy}`;
         } else if (!dx && dy) {
            if ((acc_y === 0) || ((dy < 0) !== (acc_y < 0))) flush();
            acc_y += dy;
         } else if (dx && !dy) {
            if ((acc_x === 0) || ((dx < 0) !== (acc_x < 0))) flush();
            acc_x += dx;
         }
         currx += dx; curry += dy;
         maxy = Math.max(maxy, curry);
      }

      flush();

   } else {
      // build line with trying optimize many vertical moves
      let lastx, lasty, cminy = curry, cmaxy = curry, prevy = curry;
      for (let n = 1; n < npnts; ++n) {
         bin = bins[n];
         lastx = Math.round(bin.grx);
         lasty = Math.round(bin.gry);
         maxy = Math.max(maxy, lasty);
         dx = lastx - currx;
         if (dx === 0) {
            // if X not change, just remember amplitude and
            cminy = Math.min(cminy, lasty);
            cmaxy = Math.max(cmaxy, lasty);
            prevy = lasty;
            continue;
         }

         if (cminy !== cmaxy) {
            if (cminy != curry) res.path += "v" + (cminy - curry);
            res.path += "v" + (cmaxy - cminy);
            if (cmaxy != prevy) res.path += "v" + (prevy - cmaxy);
            curry = prevy;
         }
         dy = lasty - curry;
         if (dy)
            res.path += `l${dx},${dy}`;
         else
            res.path += "h" + dx;
         currx = lastx; curry = lasty;
         prevy = cminy = cmaxy = lasty;
      }

      if (cminy != cmaxy) {
         if (cminy != curry) res.path += "v" + (cminy - curry);
         res.path += "v" + (cmaxy - cminy);
         if (cmaxy != prevy) res.path += "v" + (prevy - cmaxy);
      }
   }

   if (height > 0)
      res.close = `L${conv(bin.grx)},${conv(maxy)}h${conv(bins[0].grx - bin.grx)}Z`;

   return res;
}

/** @summary Calculate absolute position of provided element in canvas
  * @private */
function getAbsPosInCanvas(sel, pos) {
   while (!sel.empty() && !sel.classed('root_canvas') && pos) {
      let cl = sel.attr("class");
      if (cl && ((cl.indexOf("root_frame") >= 0) || (cl.indexOf("__root_pad_") >= 0))) {
         pos.x += sel.property("draw_x") || 0;
         pos.y += sel.property("draw_y") || 0;
      }
      sel = d3_select(sel.node().parentNode);
   }
   return pos;
}

// ===========================================================

let $active_pp = null;

/** @summary Set active pad painter
  * @desc Normally be used to handle key press events, which are global in the web browser
  * @param {object} args - functions arguments
  * @param {object} args.pp - pad painter
  * @param {boolean} [args.active] - is pad activated or not
  * @private */
function selectActivePad(args) {
   if (args.active) {
      let fp = $active_pp ? $active_pp.getFramePainter() : null;
      if (fp) fp.setFrameActive(false);

      $active_pp = args.pp;

      fp = $active_pp ? $active_pp.getFramePainter() : null;
      if (fp) fp.setFrameActive(true);
   } else if ($active_pp === args.pp) {
      $active_pp = null;
   }
}

/** @summary Returns current active pad
  * @desc Should be used only for keyboard handling
  * @private */
function getActivePad() {
   return $active_pp;
}


/** @summary Check resize of drawn element
  * @param {string|object} dom - id or DOM element
  * @param {boolean|object} arg - options on how to resize
  * @desc As first argument dom one should use same argument as for the drawing
  * As second argument, one could specify "true" value to force redrawing of
  * the element even after minimal resize
  * Or one just supply object with exact sizes like { width:300, height:200, force:true };
  * @example
  * resize("drawing", { width: 500, height: 200 } );
  * resize(document.querySelector("#drawing"), true); */
function resize(dom, arg) {
   if (arg === true)
      arg = { force: true };
   else if (typeof arg !== 'object')
      arg = null;
   let done = false;
   new ObjectPainter(dom).forEachPainter(painter => {
      if (!done && (typeof painter.checkResize == 'function'))
         done = painter.checkResize(arg);
   });
   return done;
}


/** @summary Register handle to react on window resize
  * @desc function used to react on browser window resize event
  * While many resize events could come in short time,
  * resize will be handled with delay after last resize event
  * @param {object|string} handle can be function or object with checkResize function or dom where painting was done
  * @param {number} [delay] - one could specify delay after which resize event will be handled
  * @protected */
function registerForResize(handle, delay) {

   if (!handle || isBatchMode() || (typeof window == 'undefined')) return;

   let myInterval = null, myDelay = delay ? delay : 300;

   if (myDelay < 20) myDelay = 20;

   function ResizeTimer() {
      myInterval = null;

      document.body.style.cursor = 'wait';
      if (typeof handle == 'function')
         handle();
      else if (handle && (typeof handle == 'object') && (typeof handle.checkResize == 'function')) {
         handle.checkResize();
      } else {
         let node = new BasePainter(handle).selectDom();
         if (!node.empty()) {
            let mdi = node.property('mdi');
            if (mdi && typeof mdi.checkMDIResize == 'function') {
               mdi.checkMDIResize();
            } else {
               resize(node.node());
            }
         }
      }
      document.body.style.cursor = 'auto';
   }

   window.addEventListener('resize', () => {
      if (myInterval !== null) clearTimeout(myInterval);
      myInterval = setTimeout(ResizeTimer, myDelay);
   });
}

/** @summary Returns canvas painter (if any) for specified HTML element
  * @param {string|object} dom - id or DOM element
  * @private */
function getElementCanvPainter(dom) {
   return new ObjectPainter(dom).getCanvPainter();
}

/** @summary Returns main painter (if any) for specified HTML element - typically histogram painter
  * @param {string|object} dom - id or DOM element
  * @private */
function getElementMainPainter(dom) {
   return new ObjectPainter(dom).getMainPainter(true);
}

/** @summary Safely remove all drawings from specified element
  * @param {string|object} dom - id or DOM element
  * @requires painter
  * @example
  * cleanup("drawing");
  * cleanup(document.querySelector("#drawing")); */
function cleanup(dom) {
   let dummy = new ObjectPainter(dom), lst = [];
   dummy.forEachPainter(p => { if (lst.indexOf(p) < 0) lst.push(p); });
   lst.forEach(p => p.cleanup());
   dummy.selectDom().html("");
   return lst;
}

/** @summary Save object, drawn in specified element, as JSON.
  * @desc Normally it is TCanvas object with list of primitives
  * @param {string|object} dom - id of top div element or directly DOMElement
  * @returns {string} produced JSON string */
function drawingJSON(dom) {
   let canp = getElementCanvPainter(dom);
   return canp ? canp.produceJSON() : "";
}

/** @summary Compress SVG code, produced from drawing
  * @desc removes extra info or empty elements
  * @private */
function compressSVG(svg) {

   svg = svg.replace(/url\(\&quot\;\#(\w+)\&quot\;\)/g, "url(#$1)")        // decode all URL
            .replace(/ class=\"\w*\"/g, "")                                // remove all classes
            .replace(/ pad=\"\w*\"/g, "")                                  // remove all pad ids
            .replace(/ title=\"\"/g, "")                                   // remove all empty titles
            .replace(/<g objname=\"\w*\" objtype=\"\w*\"/g, "<g")          // remove object ids
            .replace(/<g transform=\"translate\(\d+\,\d+\)\"><\/g>/g, "")  // remove all empty groups with transform
            .replace(/<g><\/g>/g, "");                                     // remove all empty groups

   // remove all empty frame svgs, typically appears in 3D drawings, maybe should be improved in frame painter itself
   svg = svg.replace(/<svg x=\"0\" y=\"0\" overflow=\"hidden\" width=\"\d+\" height=\"\d+\" viewBox=\"0 0 \d+ \d+\"><\/svg>/g, "")

   if (svg.indexOf("xlink:href") < 0)
      svg = svg.replace(/ xmlns:xlink=\"http:\/\/www.w3.org\/1999\/xlink\"/g, "");

   return svg;
}

/** @summary Load and initialize JSDOM from nodes
  * @returns {Promise} with d3 selection for d3_body */
function loadJSDOM() {
   return import("jsdom").then(handle => {

      if (!internals.nodejs_window) {
         internals.nodejs_window = (new handle.JSDOM("<!DOCTYPE html>hello")).window;
         internals.nodejs_document = internals.nodejs_window.document; // used with three.js
         internals.nodejs_body = d3_select(internals.nodejs_document).select('body'); //get d3 handle for body
      }

      return { JSDOM: handle.JSDOM, doc: internals.nodejs_document, body: internals.nodejs_body };
   });
}

if (isNodeJs()) readStyleFromURL("?interactive=0&tooltip=0&nomenu&noprogress&notouch&toolbar=0&webgl=0");

export { detectRightButton, DrawOptions,
         TRandom, cleanup, resize, loadJSDOM, floatToString, buildSvgPath,
         getElementCanvPainter, getElementMainPainter, registerForResize,
         compressSVG, drawingJSON, readStyleFromURL,
         selectActivePad, getActivePad, getAbsPosInCanvas };
