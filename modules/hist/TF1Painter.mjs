import { settings, isStr, clTH1D, createHistogram, clTF1, clTF2, kNoStats } from '../core.mjs';
import { getElementMainPainter, ObjectPainter } from '../base/ObjectPainter.mjs';
import { THistPainter } from '../hist2d/THistPainter.mjs';
import { TH1Painter } from '../hist2d/TH1Painter.mjs';
import * as jsroot_math from '../base/math.mjs';


/** @summary Assign `evalPar` function for TF1 object
  * @private */

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

   if (!_func)
      return false;

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

   return true;
}


/** @summary Create log scale for axis bins
  * @private */
function produceTAxisLogScale(axis, num, min, max) {
   let lmin, lmax;

   if (max > 0) {
      lmax = Math.log(max);
      lmin = min > 0 ? Math.log(min) : lmax - 5;
   } else {
      lmax = -10;
      lmax = -15;
   }

   axis.fNbins = num;
   axis.fXbins = new Array(num + 1);
   for (let i = 0; i <= num; ++i)
      axis.fXbins[i] = Math.exp(lmin + i / num * (lmax - lmin));
   axis.fXmin = Math.exp(lmin);
   axis.fXmax = Math.exp(lmax);
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
   isTF1() { return true; }

   /** @summary Update histogram */
   updateObject(obj /*, opt*/) {
      if (!obj || (this.getClassName() != obj._typename)) return false;
      delete obj.evalPar;
      let histo = this.getHisto();

      if (this.webcanv_hist) {
         let h0 = this.getPadPainter()?.findInPrimitives('Func', clTH1D);
         if (h0) this.updateAxes(histo, h0, this.getFramePainter());
      }

      this.$func = obj;
      this.createTF1Histogram(obj, histo);
      this.scanContent();
      return true;
   }

   /** @summary Redraw TF1
     * @private */
   redraw(reason) {
      if (!this._use_saved_points && (reason == 'logx' || reason == 'zoom')) {
         this.createTF1Histogram(this.$func, this.getHisto());
         this.scanContent();
      }

      return super.redraw(reason);
   }

   /** @summary Create histogram for TF1 drawing
     * @private */
   createTF1Histogram(tf1, hist) {

      let fp = this.getFramePainter(),
          pad = this.getPadPainter()?.getRootPad(true),
          logx = pad?.fLogx,
          xmin = tf1.fXmin, xmax = tf1.fXmax;

      if (fp) {
         let gr = fp.getGrFuncs(this.second_x, this.second_y);
         if (gr.scale_xmin > xmin) xmin = gr.scale_xmin;
         if (gr.scale_xmax < xmax) xmax = gr.scale_xmax;
      }

      this._use_saved_points = (tf1.fSave.length > 3) && settings.PreferSavedPoints;

      const ensureBins = num => {
         if (hist.fNcells !== num + 2) {
            hist.fNcells = num + 2;
            hist.fArray = new Float32Array(hist.fNcells);
            hist.fArray.fill(0);
         }
         hist.fXaxis.fNbins = num;
         hist.fXaxis.fXbins = [];
      };

      if (!this._use_saved_points) {

         let np = Math.max(tf1.fNpx, 100), iserror = false;

         if (!tf1.evalPar && !proivdeEvalPar(tf1))
            iserror = true;

         ensureBins(np);

         if (logx) {
            produceTAxisLogScale(hist.fXaxis, np, xmin, xmax);
         } else {
            hist.fXaxis.fXmin = xmin;
            hist.fXaxis.fXmax = xmax;
         }

         for (let n = 0; (n < np) && !iserror; n++) {
            let x = hist.fXaxis.GetBinCenter(n + 1), y = 0;
            try {
               y = tf1.evalPar(x);
            } catch(err) {
               iserror = true;
            }

            if (!iserror)
               hist.setBinContent(n + 1, Number.isFinite(y) ? y : 0);
         }

         if (iserror && (tf1.fSave.length > 3))
            this._use_saved_points = true;
      }

      // in the case there were points have saved and we cannot calculate function
      // if we don't have the user's function
      if (this._use_saved_points) {

         let np = tf1.fSave.length - 2;
         ensureBins(np);
         xmin = tf1.fSave[np];
         xmax = tf1.fSave[np + 1];

         let dx = (xmax - xmin) / (np - 1);
         // extend range while saved values are for bin center
         hist.fXaxis.fXmin = xmin - dx/2;
         hist.fXaxis.fXmax = xmax + dx/2;

         for (let n = 0; n < np; ++n)
            hist.setBinContent(n + 1, tf1.fSave[n]);
      }

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
   }

   /** @summary Checks if it makes sense to zoom inside specified axis range */
   canZoomInside(axis, min, max) {
      if ((this.$func?.fSave.length > 0) && this._use_saved_points && (axis == 'x')) {
         // in the case where the points have been saved, useful for example
         // if we don't have the user's function
         let nb_points = this.$func.fNpx,
             xmin = this.$func.fSave[nb_points + 1],
             xmax = this.$func.fSave[nb_points + 2];

         return Math.abs(xmax - xmin) / nb_points < Math.abs(max - min);
      }

      // if function calculated, one always could zoom inside
      return (axis == 'x') || (axis == 'y');
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

      painter.createTF1Histogram(tf1, hist)

      return THistPainter._drawHist(painter, opt);
   }

} // class TF1Painter

export { TF1Painter, proivdeEvalPar, produceTAxisLogScale };
