import { settings, isStr, clTH1D, createHistogram, clTF1, clTF2, kNoStats } from '../core.mjs';
import { getElementMainPainter } from '../base/ObjectPainter.mjs';
import { THistPainter } from '../hist2d/THistPainter.mjs';
import { TH1Painter } from '../hist2d/TH1Painter.mjs';
import * as jsroot_math from '../base/math.mjs';


function proivdeEvalPar(obj) {

   obj._math = jsroot_math;

   let _func = obj.fTitle, isformula = false, pprefix = '[';
   if (_func === 'gaus') _func = 'gaus(0)';
   if (isStr(obj.fFormula?.fFormula)) {
     if (obj.fFormula.fFormula.indexOf('[](double*x,double*p)') == 0) {
        isformula = true; pprefix = 'p[';
        _func = obj.fFormula.fFormula.slice(21);
     } else {
        _func = obj.fFormula.fFormula;
        pprefix = '[p';
     }

     if (obj.fFormula.fClingParameters && obj.fFormula.fParams)
        obj.fFormula.fParams.forEach(pair => {
           let regex = new RegExp(`(\\[${pair.first}\\])`, 'g'),
               parvalue = obj.fFormula.fClingParameters[pair.second];
           _func = _func.replace(regex, (parvalue < 0) ? `(${parvalue})` : parvalue);
        });
   }

   obj.formulas?.forEach(entry => {
      _func = _func.replaceAll(entry.fName, entry.fTitle);
   });

   _func = _func.replace(/\b(abs)\b/g, 'TMath::Abs')
                .replace(/\b(TMath::Exp)/g, 'Math.exp')
                .replace(/\b(TMath::Abs)/g, 'Math.abs')
                .replace(/xygaus\(/g, 'this._math.gausxy(this, x, y, ')
                .replace(/gaus\(/g, 'this._math.gaus(this, x, ')
                .replace(/gausn\(/g, 'this._math.gausn(this, x, ')
                .replace(/expo\(/g, 'this._math.expo(this, x, ')
                .replace(/landau\(/g, 'this._math.landau(this, x, ')
                .replace(/landaun\(/g, 'this._math.landaun(this, x, ')
                .replace(/TMath::/g, 'this._math.')
                .replace(/ROOT::Math::/g, 'this._math.');

   for (let i = 0; i < obj.fNpar; ++i)
      _func = _func.replaceAll(pprefix + i + ']', `(${obj.GetParValue(i)})`);

   _func = _func.replace(/\b(sin)\b/gi, 'Math.sin')
                .replace(/\b(cos)\b/gi, 'Math.cos')
                .replace(/\b(tan)\b/gi, 'Math.tan')
                .replace(/\b(exp)\b/gi, 'Math.exp')
                .replace(/\b(log10)\b/gi, 'Math.log10')
                .replace(/\b(pow)\b/gi, 'Math.pow')
                .replace(/pi/g, 'Math.PI');
   for (let n = 2; n < 10; ++n)
      _func = _func.replaceAll(`x^${n}`, `Math.pow(x,${n})`);

   if (isformula) {
      _func = _func.replace(/x\[0\]/g,'x');
      if (obj._typename === clTF2) {
         _func = _func.replace(/x\[1\]/g,'y');
         obj.evalPar = new Function('x', 'y', _func).bind(obj);
      } else {
         obj.evalPar = new Function('x', _func).bind(obj);
      }
   } else if (obj._typename === clTF2)
      obj.evalPar = new Function('x', 'y', 'return ' + _func).bind(obj);
   else
      obj.evalPar = new Function('x', 'return ' + _func).bind(obj);
}


/** @summary Create histogram for TF1 drawing
  * @private */
function createTF1Histogram(painter, tf1, hist, ignore_zoom) {

   let gxmin = 0, gxmax = 0;

   let main = painter?.getFramePainter();

   if (main && !ignore_zoom) {
      let gr = main.getGrFuncs(painter.second_x, painter.second_y);
      gxmin = gr.scale_xmin;
      gxmax = gr.scale_xmax;
   }

   let xmin = tf1.fXmin, xmax = tf1.fXmax, logx = false;

   console.log('func', tf1.fTitle, 'min/max', xmin, xmax, 'npx', tf1.fNpx);

   if (gxmin !== gxmax) {
      if (gxmin > xmin) xmin = gxmin;
      if (gxmax < xmax) xmax = gxmax;
   }

   if (main?.logx && (xmin > 0) && (xmax > 0)) {
      logx = true;
      xmin = Math.log(xmin);
      xmax = Math.log(xmax);
   }

   let np = Math.max(tf1.fNpx, 100),
       dx = (xmax - xmin) / np,
       res = [], iserror = false, plain_scale = false,
       has_saved_points = tf1.fSave.length > 3,
       force_use_save = has_saved_points && (ignore_zoom || settings.PreferSavedPoints);

   if (!force_use_save) {
      plain_scale = !logx;

      if (!tf1.evalPar)
         proivdeEvalPar(tf1);

      for (let n = 0; n < np; n++) {
         let x = xmin + (n+0.5)*dx, y = 0;
         if (logx) x = Math.exp(x);
         try {
            y = tf1.evalPar(x);
         } catch(err) {
            iserror = true;
         }

         if (iserror) break;

         if (!Number.isFinite(y))
            y = 0;

         res.push({ n, x, y });
      }
   }

   if (painter)
      painter._use_saved_points = has_saved_points && (settings.PreferSavedPoints || iserror);

   console.log('iserror', iserror, 'saved', tf1.fSave.length);

   // in the case there were points have saved and we cannot calculate function
   // if we don't have the user's function
   if ((iserror || ignore_zoom || !res.length) && has_saved_points) {

      np = tf1.fSave.length - 2;
      xmin = tf1.fSave[np];
      xmax = tf1.fSave[np + 1];
      res = [];
      dx = 0;
      let use_histo = tf1.$histo && (xmin === xmax), bin = 0;

      use_histo = false;

      plain_scale = !use_histo;

      if (use_histo) {
         xmin = tf1.fSave[--np];
         bin = tf1.$histo.fXaxis.FindBin(xmin, 0);
      } else {
         dx = (xmax - xmin) / (np - 1);
      }

      for (let n = 0; n < np; ++n) {
         let x = use_histo ? tf1.$histo.fXaxis.GetBinCenter(bin+n+1) : xmin + dx*n;
         // check if points need to be displayed at all, keep at least 4-5 points for Bezier curves
         if ((gxmin !== gxmax) && ((x + 2*dx < gxmin) || (x - 2*dx > gxmax))) continue;
         let y = tf1.fSave[n];

         if (!Number.isFinite(y))
            y = 0;

         res.push({ n, x, y });
      }

      // expected range for the histogram
      if (!use_histo) {
         xmin -= dx/2;
         xmax += dx/2;
      }

   }

   hist.fName = 'Func';
   hist.fNbins = np;
   hist.fXaxis.fXmin = xmin;
   hist.fXaxis.fXmax = xmax;
   hist.fXaxis.fXbins = [];

   if (!plain_scale) {
      for (let i = 0; i < res.length - 1; ++i) {
         let dd = res[i+1].x - res[i].x,
             midx = (res[i+1].x + res[i].x) / 2;
         if (i == 0)
            hist.fXaxis.fXbins.push(midx - dd);

         hist.fXaxis.fXbins.push(midx);

         if (i == res.length - 2)
            hist.fXaxis.fXbins.push(midx + dd);
      }
   }

   hist.fArray = new Array(np + 2);
   for (let i = 0; i < np + 2; ++i)
      hist.fArray[i] = 0;

   res.forEach(entry => {
      hist.fArray[entry.n + 1] = entry.y;
   });

   hist.fName = 'Func';
   hist.fTitle = tf1.fTitle;
   hist.fMinimum = tf1.fMinimum;
   hist.fMaximum = tf1.fMaximum;
   hist.fLineColor = tf1.fLineColor;
   hist.fLineStyle = tf1.fLineStyle;
   hist.fLineWidth = tf1.fLineWidth;
   hist.fFillColor = tf1.fFillColor;
   hist.fFillStyle = tf1.fFillStyle;
   hist.fMarkerColor = tf1.fMarkerColor;
   hist.fMarkerStyle = tf1.fMarkerStyle;
   hist.fMarkerSize = tf1.fMarkerSize;
   hist.fBits |= kNoStats;

   return hist;
}


/**
  * @summary Painter for TF1 object
  *
  * @private
  */

class TF1Painter extends TH1Painter {

   /** @summary Returns drawn object name */
   getObjectName() { return this.$func?.fName ?? 'func'; }

   /** @summary Returns drawn object class name */
   getClassName() { return this.$func?._typename ?? clTF1; }

   /** @summary Returns true while function is drawn */
   isFunc() { return true; }

   /** @summary Update histogram */
   updateObject(obj /*, opt*/) {
      if (!obj || (this.getClassName() != obj._typename)) return false;
      delete obj.evalPar;
      let histo = this.getHisto();

      if (this.webcanv_hist) {
         let h0 = this.getPadPainter()?.findInPrimitives('Func', clTH1D);
         if (h0) {
            histo.fXaxis.fTitle = h0.fXaxis.fTitle;
            histo.fYaxis.fTitle = h0.fYaxis.fTitle;
            histo.fZaxis.fTitle = h0.fZaxis.fTitle;
         }
      }

      createTF1Histogram(this, obj, histo);
      return true;
   }

/*

   processTooltipEvent(pnt) {
      let cleanup = false;

      if (!pnt || !this.bins || pnt.disabled) {
         cleanup = true;
      } else if (!this.bins.length || (pnt.x < this.bins[0].grx) || (pnt.x > this.bins[this.bins.length-1].grx)) {
         cleanup = true;
      }

      if (cleanup) {
         if (this.draw_g)
            this.draw_g.select('.tooltip_bin').remove();
         return null;
      }

      let min = 100000, best = -1, bin;

      for(let n = 0; n < this.bins.length; ++n) {
         bin = this.bins[n];
         let dist = Math.abs(bin.grx - pnt.x);
         if (dist < min) { min = dist; best = n; }
      }

      bin = this.bins[best];

      let gbin = this.draw_g.select('.tooltip_bin'),
          radius = this.lineatt.width + 3;

      if (gbin.empty())
         gbin = this.draw_g.append('svg:circle')
                           .attr('class', 'tooltip_bin')
                           .style('pointer-events', 'none')
                           .attr('r', radius)
                           .call(this.lineatt.func)
                           .call(this.fillatt.func);

      let res = { name: this.getObject().fName,
                  title: this.getObject().fTitle,
                  x: bin.grx,
                  y: bin.gry,
                  color1: this.lineatt.color,
                  color2: this.fillatt.getFillColor(),
                  lines: [],
                  exact: (Math.abs(bin.grx - pnt.x) < radius) && (Math.abs(bin.gry - pnt.y) < radius) };

      res.changed = gbin.property('current_bin') !== best;
      res.menu = res.exact;
      res.menu_dist = Math.sqrt((bin.grx - pnt.x)**2 + (bin.gry - pnt.y)**2);

      if (res.changed)
         gbin.attr('cx', bin.grx)
             .attr('cy', bin.gry)
             .property('current_bin', best);

      let name = this.getObjectHint();
      if (name) res.lines.push(name);

      let pmain = this.getFramePainter(),
          funcs = pmain?.getGrFuncs(this.second_x, this.second_y);
      if (funcs)
         res.lines.push(`x = ${funcs.axisAsText('x',bin.x)} y = ${funcs.axisAsText('y',bin.y)}`);

      return res;
   }
*/

   /** @summary Checks if it makes sense to zoom inside specified axis range */
   canZoomInside(axis, min, max) {
      if (axis !== 'x') return false;

      let tf1 = this.getObject();

      if ((tf1.fSave.length > 0) && this._use_saved_points) {
         // in the case where the points have been saved, useful for example
         // if we don't have the user's function
         let nb_points = tf1.fNpx,
             xmin = tf1.fSave[nb_points + 1],
             xmax = tf1.fSave[nb_points + 2];

         return Math.abs(xmax - xmin) / nb_points < Math.abs(max - min);
      }

      // if function calculated, one always could zoom inside
      return true;
   }

   /** @summary draw TF1 object */
   static async draw(dom, tf1, opt) {
     if (!isStr(opt)) opt = '';
      let p = opt.indexOf(';webcanv_hist'), webcanv_hist = false;
      if (p >= 0) {
         webcanv_hist = true;
         opt = opt.slice(0, p);
      }

      let hist;

      if (webcanv_hist) {
         let dummy = new ObjectPainter(dom);
         hist = dummy.getPadPainter()?.findInPrimitives('Func', clTH1D);
      }

      if (!hist) hist = createHistogram(clTH1D, 100);

      if (!opt && getElementMainPainter(dom))
         opt = "same";

      let painter = new TF1Painter(dom, hist);

      painter.$func = tf1;
      painter.webcanv_hist = webcanv_hist;

      createTF1Histogram(painter, tf1, hist)


      console.log('draw TF1 with options', opt);

      return THistPainter._drawHist(painter, opt);
   }

} // class TF1Painter

export { TF1Painter, proivdeEvalPar };
