import { select as d3_select } from '../d3.mjs';
import { isNodeJs } from '../core.mjs';
import { detectPdfFont, kArial, kCourier, kSymbol, kWingdings } from './FontHandler.mjs';
import { approximateLabelWidth, replaceSymbolsInTextNode } from './latex.mjs';


/** @summary Create pdf for existing SVG element
  * @return {Promise} with produced PDF file as url string
  * @private */
async function svgToPDF(args, as_buffer) {
   const nodejs = isNodeJs();
   let jspdf, need_symbols = false;

   const restore_fonts = [], restore_symb = [], restore_wing = [], restore_dominant = [], restore_oblique = [], restore_text = [],
         node_transform = args.node.getAttribute('transform'), custom_fonts = {};

   if (args.reset_tranform)
      args.node.removeAttribute('transform');

   return import('../jspdf.mjs').then(h1 => { jspdf = h1; return import('../svg2pdf.mjs'); }).then(svg2pdf => {
      d3_select(args.node).selectAll('g').each(function() {
         if (this.hasAttribute('font-family')) {
            const name = this.getAttribute('font-family');
            if (name === kCourier) {
               this.setAttribute('font-family', 'courier');
               if (!args.can_modify) restore_fonts.push(this); // keep to restore it
            }
            if (name === kSymbol) {
               this.setAttribute('font-family', 'symbol');
               if (!args.can_modify) restore_symb.push(this); // keep to restore it
            }
            if (name === kWingdings) {
               this.setAttribute('font-family', 'zapfdingbats');
               if (!args.can_modify) restore_wing.push(this); // keep to restore it
            }

            if (((name === kArial) || (name === kCourier)) && (this.getAttribute('font-weight') === 'bold') && (this.getAttribute('font-style') === 'oblique')) {
               this.setAttribute('font-style', 'italic');
               if (!args.can_modify) restore_oblique.push(this); // keep to restore it
            } else if ((name === kCourier) && (this.getAttribute('font-style') === 'oblique')) {
               this.setAttribute('font-style', 'italic');
               if (!args.can_modify) restore_oblique.push(this); // keep to restore it
            }
         }
      });

      d3_select(args.node).selectAll('text').each(function() {
         if (this.hasAttribute('dominant-baseline')) {
            this.setAttribute('dy', '.2em'); // slightly different as in plain text
            this.removeAttribute('dominant-baseline');
            if (!args.can_modify) restore_dominant.push(this); // keep to restore it
         } else if (args.can_modify && nodejs && this.getAttribute('dy') === '.4em')
            this.setAttribute('dy', '.2em'); // better alignment in PDF

         if (replaceSymbolsInTextNode(this)) {
            need_symbols = true;
            if (!args.can_modify) restore_text.push(this); // keep to restore it
         }
      });

      if (nodejs) {
         const doc = internals.nodejs_document;
         doc.originalCreateElementNS = doc.createElementNS;
         globalThis.document = doc;
         globalThis.CSSStyleSheet = internals.nodejs_window.CSSStyleSheet;
         globalThis.CSSStyleRule = internals.nodejs_window.CSSStyleRule;
         doc.createElementNS = function(ns, kind) {
            const res = doc.originalCreateElementNS(ns, kind);
            res.getBBox = function() {
               let width = 50, height = 10;
               if (this.tagName === 'text') {
                  // TODO: use jsDOC fonts for label width estimation
                  const font = detectPdfFont(this);
                  width = approximateLabelWidth(this.textContent, font);
                  height = font.size * 1.2;
               }

               return { x: 0, y: 0, width, height };
            };
            return res;
         };
      }

      const doc = new jspdf.jsPDF({
         orientation: 'landscape',
         unit: 'px',
         format: [args.width + 10, args.height + 10]
      });

      // add custom fonts to PDF document, only TTF format supported
      d3_select(args.node).selectAll('style').each(function() {
         const fcfg = this.$fontcfg;
         if (!fcfg?.n || !fcfg?.base64) return;
         const name = fcfg.n;
         if ((name === kSymbol) || (name === kWingdings)) return;
         if (custom_fonts[name]) return;
         custom_fonts[name] = true;

         const filename = name.toLowerCase().replace(/\s/g, '') + '.ttf';
         doc.addFileToVFS(filename, fcfg.base64);
         doc.addFont(filename, fcfg.n, fcfg.s || 'normal');
      });

      const pr2 = Promise.resolve(true);

      /*
      if (need_symbols && !custom_fonts[kSymbol]) {
         const handler = new FontHandler(122, 10);
         pr2 = handler.load().then(() => {
            handler.addCustomFontToSvg(d3_select(args.node));
            doc.addFileToVFS(kSymbol + '.ttf', handler.base64);
            doc.addFont(kSymbol + '.ttf', kSymbol, 'normal');
         });
      }
      */

      return pr2.then(() => svg2pdf.svg2pdf(args.node, doc, { x: 5, y: 5, width: args.width, height: args.height }))
         .then(() => {
            if (args.reset_tranform && !args.can_modify && node_transform)
               args.node.setAttribute('transform', node_transform);

            restore_fonts.forEach(node => node.setAttribute('font-family', kCourier));
            restore_symb.forEach(node => node.setAttribute('font-family', kSymbol));
            restore_wing.forEach(node => node.setAttribute('font-family', kWingdings));
            restore_oblique.forEach(node => node.setAttribute('font-style', 'oblique'));
            restore_dominant.forEach(node => {
               node.setAttribute('dominant-baseline', 'middle');
               node.removeAttribute('dy');
            });

            restore_text.forEach(node => { node.innerHTML = node.$originalHTML; });

            const res = as_buffer ? doc.output('arraybuffer') : doc.output('dataurlstring');
            if (nodejs) {
               globalThis.document = undefined;
               globalThis.CSSStyleSheet = undefined;
               globalThis.CSSStyleRule = undefined;
               internals.nodejs_document.createElementNS = internals.nodejs_document.originalCreateElementNS;
               if (as_buffer) return Buffer.from(res);
            }

            return res;
         });
   });
}


export { svgToPDF };