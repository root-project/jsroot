/// @file JSRootPainter.js
/// Baisc JavaScript ROOT painter classes

JSROOT.require(['d3'], function(d3) {

   "use strict";

   JSROOT.loadScript('$$$style/JSRootPainter.css');

   if (!JSROOT._test_d3_) {
      if ((typeof d3 == 'object') && d3.version && (d3.version[0] === "6")) {
         if (d3.version !== '6.1.1')
            console.log('Reuse existing d3.js ' + d3.version + ", expected 6.1.1");
         JSROOT._test_d3_ = 5;
      } else {
         console.error('Unsupported ' + (d3 ? d3.version : "???") + ", expected 6.1.1");
         JSROOT._test_d3_ = "old";
      }
   }

   // icons taken from http://uxrepo.com/

   JSROOT.ToolbarIcons = {
      camera: { path: 'M 152.00,304.00c0.00,57.438, 46.562,104.00, 104.00,104.00s 104.00-46.562, 104.00-104.00s-46.562-104.00-104.00-104.00S 152.00,246.562, 152.00,304.00z M 480.00,128.00L 368.00,128.00 c-8.00-32.00-16.00-64.00-48.00-64.00L 192.00,64.00 c-32.00,0.00-40.00,32.00-48.00,64.00L 32.00,128.00 c-17.60,0.00-32.00,14.40-32.00,32.00l0.00,288.00 c0.00,17.60, 14.40,32.00, 32.00,32.00l 448.00,0.00 c 17.60,0.00, 32.00-14.40, 32.00-32.00L 512.00,160.00 C 512.00,142.40, 497.60,128.00, 480.00,128.00z M 256.00,446.00c-78.425,0.00-142.00-63.574-142.00-142.00c0.00-78.425, 63.575-142.00, 142.00-142.00c 78.426,0.00, 142.00,63.575, 142.00,142.00 C 398.00,382.426, 334.427,446.00, 256.00,446.00z M 480.00,224.00l-64.00,0.00 l0.00-32.00 l 64.00,0.00 L 480.00,224.00 z' },
      disk: { path: 'M384,0H128H32C14.336,0,0,14.336,0,32v448c0,17.656,14.336,32,32,32h448c17.656,0,32-14.344,32-32V96L416,0H384z M352,160   V32h32v128c0,17.664-14.344,32-32,32H160c-17.664,0-32-14.336-32-32V32h128v128H352z M96,288c0-17.656,14.336-32,32-32h256   c17.656,0,32,14.344,32,32v192H96V288z' },
      question: { path: 'M256,512c141.375,0,256-114.625,256-256S397.375,0,256,0S0,114.625,0,256S114.625,512,256,512z M256,64   c63.719,0,128,36.484,128,118.016c0,47.453-23.531,84.516-69.891,110.016C300.672,299.422,288,314.047,288,320   c0,17.656-14.344,32-32,32c-17.664,0-32-14.344-32-32c0-40.609,37.25-71.938,59.266-84.031   C315.625,218.109,320,198.656,320,182.016C320,135.008,279.906,128,256,128c-30.812,0-64,20.227-64,64.672   c0,17.664-14.336,32-32,32s-32-14.336-32-32C128,109.086,193.953,64,256,64z M256,449.406c-18.211,0-32.961-14.75-32.961-32.969   c0-18.188,14.75-32.953,32.961-32.953c18.219,0,32.969,14.766,32.969,32.953C288.969,434.656,274.219,449.406,256,449.406z' },
      undo: { path: 'M450.159,48.042c8.791,9.032,16.983,18.898,24.59,29.604c7.594,10.706,14.146,22.207,19.668,34.489  c5.509,12.296,9.82,25.269,12.92,38.938c3.113,13.669,4.663,27.834,4.663,42.499c0,14.256-1.511,28.863-4.532,43.822  c-3.009,14.952-7.997,30.217-14.953,45.795c-6.955,15.577-16.202,31.52-27.755,47.826s-25.88,32.9-42.942,49.807  c-5.51,5.444-11.787,11.67-18.834,18.651c-7.033,6.98-14.496,14.366-22.39,22.168c-7.88,7.802-15.955,15.825-24.187,24.069  c-8.258,8.231-16.333,16.203-24.252,23.888c-18.3,18.13-37.354,37.016-57.191,56.65l-56.84-57.445  c19.596-19.472,38.54-38.279,56.84-56.41c7.75-7.685,15.772-15.604,24.108-23.757s16.438-16.163,24.33-24.057  c7.894-7.893,15.356-15.33,22.402-22.312c7.034-6.98,13.312-13.193,18.821-18.651c22.351-22.402,39.165-44.648,50.471-66.738  c11.279-22.09,16.932-43.567,16.932-64.446c0-15.785-3.217-31.005-9.638-45.671c-6.422-14.665-16.229-28.504-29.437-41.529  c-3.282-3.282-7.358-6.395-12.217-9.325c-4.871-2.938-10.381-5.503-16.516-7.697c-6.121-2.201-12.815-3.992-20.058-5.373  c-7.242-1.374-14.9-2.064-23.002-2.064c-8.218,0-16.802,0.834-25.788,2.507c-8.961,1.674-18.053,4.429-27.222,8.271  c-9.189,3.842-18.456,8.869-27.808,15.089c-9.358,6.219-18.521,13.819-27.502,22.793l-59.92,60.271l93.797,94.058H0V40.91  l93.27,91.597l60.181-60.532c13.376-15.018,27.222-27.248,41.536-36.697c14.308-9.443,28.608-16.776,42.89-21.992  c14.288-5.223,28.505-8.74,42.623-10.557C294.645,0.905,308.189,0,321.162,0c13.429,0,26.389,1.185,38.84,3.562  c12.478,2.377,24.2,5.718,35.192,10.029c11.006,4.311,21.126,9.404,30.374,15.265C434.79,34.724,442.995,41.119,450.159,48.042z' },
      arrow_right: { path: 'M30.796,226.318h377.533L294.938,339.682c-11.899,11.906-11.899,31.184,0,43.084c11.887,11.899,31.19,11.893,43.077,0  l165.393-165.386c5.725-5.712,8.924-13.453,8.924-21.539c0-8.092-3.213-15.84-8.924-21.551L338.016,8.925  C332.065,2.975,324.278,0,316.478,0c-7.802,0-15.603,2.968-21.539,8.918c-11.899,11.906-11.899,31.184,0,43.084l113.391,113.384  H30.796c-16.822,0-30.463,13.645-30.463,30.463C0.333,212.674,13.974,226.318,30.796,226.318z' },
      arrow_up: { path: 'M295.505,629.446V135.957l148.193,148.206c15.555,15.559,40.753,15.559,56.308,0c15.555-15.538,15.546-40.767,0-56.304  L283.83,11.662C276.372,4.204,266.236,0,255.68,0c-10.568,0-20.705,4.204-28.172,11.662L11.333,227.859  c-7.777,7.777-11.666,17.965-11.666,28.158c0,10.192,3.88,20.385,11.657,28.158c15.563,15.555,40.762,15.555,56.317,0  l148.201-148.219v493.489c0,21.993,17.837,39.82,39.82,39.82C277.669,669.267,295.505,651.439,295.505,629.446z' },
      arrow_diag: { path: 'M279.875,511.994c-1.292,0-2.607-0.102-3.924-0.312c-10.944-1.771-19.333-10.676-20.457-21.71L233.97,278.348  L22.345,256.823c-11.029-1.119-19.928-9.51-21.698-20.461c-1.776-10.944,4.031-21.716,14.145-26.262L477.792,2.149  c9.282-4.163,20.167-2.165,27.355,5.024c7.201,7.189,9.199,18.086,5.024,27.356L302.22,497.527  C298.224,506.426,289.397,511.994,279.875,511.994z M118.277,217.332l140.534,14.294c11.567,1.178,20.718,10.335,21.878,21.896  l14.294,140.519l144.09-320.792L118.277,217.332z' },
      auto_zoom: { path: 'M505.441,242.47l-78.303-78.291c-9.18-9.177-24.048-9.171-33.216,0c-9.169,9.172-9.169,24.045,0.006,33.217l38.193,38.188  H280.088V80.194l38.188,38.199c4.587,4.584,10.596,6.881,16.605,6.881c6.003,0,12.018-2.297,16.605-6.875  c9.174-9.172,9.174-24.039,0.011-33.217L273.219,6.881C268.803,2.471,262.834,0,256.596,0c-6.229,0-12.202,2.471-16.605,6.881  l-78.296,78.302c-9.178,9.172-9.178,24.045,0,33.217c9.177,9.171,24.051,9.171,33.21,0l38.205-38.205v155.4H80.521l38.2-38.188  c9.177-9.171,9.177-24.039,0.005-33.216c-9.171-9.172-24.039-9.178-33.216,0L7.208,242.464c-4.404,4.403-6.881,10.381-6.881,16.611  c0,6.227,2.477,12.207,6.881,16.61l78.302,78.291c4.587,4.581,10.599,6.875,16.605,6.875c6.006,0,12.023-2.294,16.61-6.881  c9.172-9.174,9.172-24.036-0.005-33.211l-38.205-38.199h152.593v152.063l-38.199-38.211c-9.171-9.18-24.039-9.18-33.216-0.022  c-9.178,9.18-9.178,24.059-0.006,33.222l78.284,78.302c4.41,4.404,10.382,6.881,16.611,6.881c6.233,0,12.208-2.477,16.611-6.881  l78.302-78.296c9.181-9.18,9.181-24.048,0-33.205c-9.174-9.174-24.054-9.174-33.21,0l-38.199,38.188v-152.04h152.051l-38.205,38.199  c-9.18,9.175-9.18,24.037-0.005,33.211c4.587,4.587,10.596,6.881,16.604,6.881c6.01,0,12.024-2.294,16.605-6.875l78.303-78.285  c4.403-4.403,6.887-10.378,6.887-16.611C512.328,252.851,509.845,246.873,505.441,242.47z' },
      statbox: {
         path: 'M28.782,56.902H483.88c15.707,0,28.451-12.74,28.451-28.451C512.331,12.741,499.599,0,483.885,0H28.782   C13.074,0,0.331,12.741,0.331,28.451C0.331,44.162,13.074,56.902,28.782,56.902z' +
            'M483.885,136.845H28.782c-15.708,0-28.451,12.741-28.451,28.451c0,15.711,12.744,28.451,28.451,28.451H483.88   c15.707,0,28.451-12.74,28.451-28.451C512.331,149.586,499.599,136.845,483.885,136.845z' +
            'M483.885,273.275H28.782c-15.708,0-28.451,12.731-28.451,28.452c0,15.707,12.744,28.451,28.451,28.451H483.88   c15.707,0,28.451-12.744,28.451-28.451C512.337,286.007,499.599,273.275,483.885,273.275z' +
            'M256.065,409.704H30.492c-15.708,0-28.451,12.731-28.451,28.451c0,15.707,12.744,28.451,28.451,28.451h225.585   c15.707,0,28.451-12.744,28.451-28.451C284.516,422.436,271.785,409.704,256.065,409.704z'
      },
      circle: { path: "M256,256 m-150,0 a150,150 0 1,0 300,0 a150,150 0 1,0 -300,0" },
      three_circles: { path: "M256,85 m-70,0 a70,70 0 1,0 140,0 a70,70 0 1,0 -140,0  M256,255 m-70,0 a70,70 0 1,0 140,0 a70,70 0 1,0 -140,0  M256,425 m-70,0 a70,70 0 1,0 140,0 a70,70 0 1,0 -140,0 " },
      diamand: { path: "M256,0L384,256L256,511L128,256z" },
      rect: { path: "M80,80h352v352h-352z" },
      cross: { path: "M80,40l176,176l176,-176l40,40l-176,176l176,176l-40,40l-176,-176l-176,176l-40,-40l176,-176l-176,-176z" },
      vrgoggles: { size: "245.82 141.73", path: 'M175.56,111.37c-22.52,0-40.77-18.84-40.77-42.07S153,27.24,175.56,27.24s40.77,18.84,40.77,42.07S198.08,111.37,175.56,111.37ZM26.84,69.31c0-23.23,18.25-42.07,40.77-42.07s40.77,18.84,40.77,42.07-18.26,42.07-40.77,42.07S26.84,92.54,26.84,69.31ZM27.27,0C11.54,0,0,12.34,0,28.58V110.9c0,16.24,11.54,30.83,27.27,30.83H99.57c2.17,0,4.19-1.83,5.4-3.7L116.47,118a8,8,0,0,1,12.52-.18l11.51,20.34c1.2,1.86,3.22,3.61,5.39,3.61h72.29c15.74,0,27.63-14.6,27.63-30.83V28.58C245.82,12.34,233.93,0,218.19,0H27.27Z' },
      th2colorz: { recs: [{ x: 128, y: 486, w: 256, h: 26, f: 'rgb(38,62,168)' }, { y: 461, f: 'rgb(22,82,205)' }, { y: 435, f: 'rgb(16,100,220)' }, { y: 410, f: 'rgb(18,114,217)' }, { y: 384, f: 'rgb(20,129,214)' }, { y: 358, f: 'rgb(14,143,209)' }, { y: 333, f: 'rgb(9,157,204)' }, { y: 307, f: 'rgb(13,167,195)' }, { y: 282, f: 'rgb(30,175,179)' }, { y: 256, f: 'rgb(46,183,164)' }, { y: 230, f: 'rgb(82,186,146)' }, { y: 205, f: 'rgb(116,189,129)' }, { y: 179, f: 'rgb(149,190,113)' }, { y: 154, f: 'rgb(179,189,101)' }, { y: 128, f: 'rgb(209,187,89)' }, { y: 102, f: 'rgb(226,192,75)' }, { y: 77, f: 'rgb(244,198,59)' }, { y: 51, f: 'rgb(253,210,43)' }, { y: 26, f: 'rgb(251,230,29)' }, { y: 0, f: 'rgb(249,249,15)' }] },
      CreateSVG: function(group, btn, size, title) {
         let svg = group.append("svg:svg")
            .attr("class", "svg_toolbar_btn")
            .attr("width", size + "px")
            .attr("height", size + "px")
            .attr("viewBox", "0 0 512 512")
            .style("overflow", "hidden");

         if ('recs' in btn) {
            let rec = {};
            for (let n = 0; n < btn.recs.length; ++n) {
               JSROOT.extend(rec, btn.recs[n]);
               svg.append('rect').attr("x", rec.x).attr("y", rec.y)
                  .attr("width", rec.w).attr("height", rec.h)
                  .attr("fill", rec.f);
            }
         } else {
            svg.append('svg:path').attr('d', btn.path);
         }

         //  special rect to correctly get mouse events for whole button area
         svg.append("svg:rect").attr("x", 0).attr("y", 0).attr("width", 512).attr("height", 512)
            .style('opacity', 0).style('fill', "none").style("pointer-events", "visibleFill")
            .append("svg:title").text(title);

         return svg;
      }
   };

   // ==========================================================================================

   /** @summary Draw options interpreter */
   class DrawOptions {
      constructor(opt) {
         this.opt = opt && (typeof opt == "string") ? opt.toUpperCase().trim() : "";
         this.part = "";
      }

      /** @summary Returns true if remaining options are empty. */
      empty() { return this.opt.length === 0; }

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
         return isNaN(val) ? (dflt || 0) : val + (offset || 0);
      }

      /** @summary Returns remaining part of found option as float. */
      partAsFloat(offset, dflt) {
         let val = this.part.replace(/^\D+/g, '');
         val = val ? parseFloat(val) : Number.NaN;
         return isNaN(val) ? (dflt || 0) : val + (offset || 0);
      }
   } // class DrawOptions

   // ============================================================================================

   let Painter = {
      Coord: {
         kCARTESIAN: 1,
         kPOLAR: 2,
         kCYLINDRICAL: 3,
         kSPHERICAL: 4,
         kRAPIDITY: 5
      },
      root_colors: [],
      root_line_styles: ["", "", "3,3", "1,2",
         "3,4,1,4", "5,3,1,3", "5,3,1,3,1,3,1,3", "5,5",
         "5,3,1,3,1,3", "20,5", "20,10,1,10", "1,3"],
      root_markers: [0, 100, 8, 7, 0,  //  0..4
         9, 100, 100, 100, 100,  //  5..9
         100, 100, 100, 100, 100,  // 10..14
         100, 100, 100, 100, 100,  // 15..19
         100, 103, 105, 104, 0,  // 20..24
         3, 4, 2, 1, 106,  // 25..29
         6, 7, 5, 102, 101], // 30..34
      root_fonts: ['Arial', 'iTimes New Roman',
         'bTimes New Roman', 'biTimes New Roman', 'Arial',
         'oArial', 'bArial', 'boArial', 'Courier New',
         'oCourier New', 'bCourier New', 'boCourier New',
         'Symbol', 'Times New Roman', 'Wingdings', 'iSymbol', 'Verdana'],
      // taken from https://www.math.utah.edu/~beebe/fonts/afm-widths.html
      root_fonts_aver_width: [0.537, 0.510,
         0.535, 0.520, 0.537,
         0.54, 0.556, 0.56, 0.6,
         0.6, 0.6, 0.6,
         0.587, 0.514, 0.896, 0.587, 0.55]
   };

   JSROOT.Painter = Painter; // export here to avoid ambiguity

   Painter.createMenu = function(painter, maincallback, evt) {
      // dummy functions, forward call to the jquery function
      document.body.style.cursor = 'wait';
      let show_evnt;
      // copy event values, otherwise they will gone after scripts loading
      if (evt && (typeof evt == "object"))
         if ((evt.clientX !== undefined) && (evt.clientY !== undefined))
            show_evnt = { clientX: evt.clientX, clientY: evt.clientY };
      JSROOT.require(['JSRootPainter.jquery']).then(() => {
         document.body.style.cursor = 'auto';
         Painter.createMenu(painter, maincallback, show_evnt);
      });
   }

   Painter.closeMenu = function(menuname) {
      let x = document.getElementById(menuname || 'root_ctx_menu');
      if (x) { x.parentNode.removeChild(x); return true; }
      return false;
   }

   Painter.readStyleFromURL = function(url) {
      let optimize = JSROOT.GetUrlOption("optimize", url);
      if (optimize == "") JSROOT.gStyle.OptimizeDraw = 2; else
         if (optimize !== null) {
            JSROOT.gStyle.OptimizeDraw = parseInt(optimize);
            if (isNaN(JSROOT.gStyle.OptimizeDraw)) JSROOT.gStyle.OptimizeDraw = 2;
         }

      let inter = JSROOT.GetUrlOption("interactive", url);
      if (inter === "nomenu") JSROOT.gStyle.ContextMenu = false;
      else if (inter !== null) {
         if (!inter || (inter == "1")) inter = "111111"; else
            if (inter == "0") inter = "000000";
         if (inter.length === 6) {
            if (inter[0] == "0") JSROOT.gStyle.ToolBar = false; else
               if (inter[0] == "1") JSROOT.gStyle.ToolBar = 'popup'; else
                  if (inter[0] == "2") JSROOT.gStyle.ToolBar = true;
            inter = inter.substr(1);
         }
         if (inter.length == 5) {
            JSROOT.gStyle.Tooltip = parseInt(inter[0]);
            JSROOT.gStyle.ContextMenu = (inter[1] != '0');
            JSROOT.gStyle.Zooming = (inter[2] != '0');
            JSROOT.gStyle.MoveResize = (inter[3] != '0');
            JSROOT.gStyle.DragAndDrop = (inter[4] != '0');
         }
      }

      let tt = JSROOT.GetUrlOption("tooltip", url);
      if (tt !== null) JSROOT.gStyle.Tooltip = parseInt(tt);

      let mathjax = JSROOT.GetUrlOption("mathjax", url),
         latex = JSROOT.GetUrlOption("latex", url);

      if ((mathjax !== null) && (mathjax != "0") && (latex === null)) latex = "math";
      if (latex !== null) JSROOT.gStyle.Latex = latex; // decoding will be performed with the first text drawing

      if (JSROOT.GetUrlOption("nomenu", url) !== null) JSROOT.gStyle.ContextMenu = false;
      if (JSROOT.GetUrlOption("noprogress", url) !== null) JSROOT.gStyle.ProgressBox = false;
      if (JSROOT.GetUrlOption("notouch", url) !== null) JSROOT.touches = false;
      if (JSROOT.GetUrlOption("adjframe", url) !== null) JSROOT.gStyle.CanAdjustFrame = true;

      let optstat = JSROOT.GetUrlOption("optstat", url);
      if (optstat !== null) JSROOT.gStyle.fOptStat = parseInt(optstat);
      let optfit = JSROOT.GetUrlOption("optfit", url);
      if (optfit !== null) JSROOT.gStyle.fOptFit = parseInt(optfit);
      JSROOT.gStyle.fStatFormat = JSROOT.GetUrlOption("statfmt", url, JSROOT.gStyle.fStatFormat);
      JSROOT.gStyle.fFitFormat = JSROOT.GetUrlOption("fitfmt", url, JSROOT.gStyle.fFitFormat);

      let toolbar = JSROOT.GetUrlOption("toolbar", url);
      if (toolbar !== null) {
         let val = null;
         if (toolbar.indexOf('popup') >= 0) val = 'popup';
         if (toolbar.indexOf('left') >= 0) { JSROOT.gStyle.ToolBarSide = 'left'; val = 'popup'; }
         if (toolbar.indexOf('right') >= 0) { JSROOT.gStyle.ToolBarSide = 'right'; val = 'popup'; }
         if (toolbar.indexOf('vert') >= 0) { JSROOT.gStyle.ToolBarVert = true; val = 'popup'; }
         if (toolbar.indexOf('show') >= 0) val = true;
         JSROOT.gStyle.ToolBar = val || ((toolbar.indexOf("0") < 0) && (toolbar.indexOf("false") < 0) && (toolbar.indexOf("off") < 0));
      }

      let palette = JSROOT.GetUrlOption("palette", url);
      if (palette !== null) {
         palette = parseInt(palette);
         if (!isNaN(palette) && (palette > 0) && (palette < 113)) JSROOT.gStyle.Palette = palette;
      }

      let render3d = JSROOT.GetUrlOption("render3d", url);
      if (render3d !== null)
         JSROOT.settings.Render3D = JSROOT.constants.Render3D.fromString(render3d);

      let embed3d = JSROOT.GetUrlOption("embed3d", url);
      if (embed3d !== null)
         JSROOT.settings.Embed3D = JSROOT.constants.Embed3D.fromString(embed3d);

      let geosegm = JSROOT.GetUrlOption("geosegm", url);
      if (geosegm !== null) JSROOT.gStyle.GeoGradPerSegm = Math.max(2, parseInt(geosegm));
      let geocomp = JSROOT.GetUrlOption("geocomp", url);
      if (geocomp !== null) JSROOT.gStyle.GeoCompressComp = (geocomp !== '0') && (geocomp !== 'false');
   }

   /** Function that generates all root colors */
   Painter.createRootColors = function() {
      let colorMap = ['white', 'black', 'red', 'green', 'blue', 'yellow', 'magenta', 'cyan', 'rgb(89,212,84)', 'rgb(89,84,217)', 'white'];
      colorMap[110] = 'white';

      let moreCol = [
         { col: 11, str: 'c1b7ad4d4d4d6666668080809a9a9ab3b3b3cdcdcde6e6e6f3f3f3cdc8accdc8acc3c0a9bbb6a4b3a697b8a49cae9a8d9c8f83886657b1cfc885c3a48aa9a1839f8daebdc87b8f9a768a926983976e7b857d9ad280809caca6c0d4cf88dfbb88bd9f83c89a7dc08378cf5f61ac8f94a6787b946971d45a549300ff7b00ff6300ff4b00ff3300ff1b00ff0300ff0014ff002cff0044ff005cff0074ff008cff00a4ff00bcff00d4ff00ecff00fffd00ffe500ffcd00ffb500ff9d00ff8500ff6d00ff5500ff3d00ff2600ff0e0aff0022ff003aff0052ff006aff0082ff009aff00b1ff00c9ff00e1ff00f9ff00ffef00ffd700ffbf00ffa700ff8f00ff7700ff6000ff4800ff3000ff1800ff0000' },
         { col: 201, str: '5c5c5c7b7b7bb8b8b8d7d7d78a0f0fb81414ec4848f176760f8a0f14b81448ec4876f1760f0f8a1414b84848ec7676f18a8a0fb8b814ecec48f1f1768a0f8ab814b8ec48ecf176f10f8a8a14b8b848ecec76f1f1' },
         { col: 390, str: 'ffffcdffff9acdcd9affff66cdcd669a9a66ffff33cdcd339a9a33666633ffff00cdcd009a9a00666600333300' },
         { col: 406, str: 'cdffcd9aff9a9acd9a66ff6666cd66669a6633ff3333cd33339a3333663300ff0000cd00009a00006600003300' },
         { col: 422, str: 'cdffff9affff9acdcd66ffff66cdcd669a9a33ffff33cdcd339a9a33666600ffff00cdcd009a9a006666003333' },
         { col: 590, str: 'cdcdff9a9aff9a9acd6666ff6666cd66669a3333ff3333cd33339a3333660000ff0000cd00009a000066000033' },
         { col: 606, str: 'ffcdffff9affcd9acdff66ffcd66cd9a669aff33ffcd33cd9a339a663366ff00ffcd00cd9a009a660066330033' },
         { col: 622, str: 'ffcdcdff9a9acd9a9aff6666cd66669a6666ff3333cd33339a3333663333ff0000cd00009a0000660000330000' },
         { col: 791, str: 'ffcd9acd9a669a66339a6600cd9a33ffcd66ff9a00ffcd33cd9a00ffcd00ff9a33cd66006633009a3300cd6633ff9a66ff6600ff6633cd3300ff33009aff3366cd00336600339a0066cd339aff6666ff0066ff3333cd0033ff00cdff9a9acd66669a33669a009acd33cdff669aff00cdff339acd00cdff009affcd66cd9a339a66009a6633cd9a66ffcd00ff6633ffcd00cd9a00ffcd33ff9a00cd66006633009a3333cd6666ff9a00ff9a33ff6600cd3300ff339acdff669acd33669a00339a3366cd669aff0066ff3366ff0033cd0033ff339aff0066cd00336600669a339acd66cdff009aff33cdff009acd00cdffcd9aff9a66cd66339a66009a9a33cdcd66ff9a00ffcd33ff9a00cdcd00ff9a33ff6600cd33006633009a6633cd9a66ff6600ff6633ff3300cd3300ffff339acd00666600339a0033cd3366ff669aff0066ff3366cd0033ff0033ff9acdcd669a9a33669a0066cd339aff66cdff009acd009aff33cdff009a' },
         { col: 920, str: 'cdcdcd9a9a9a666666333333' }];

      for (let indx = 0; indx < moreCol.length; ++indx) {
         let entry = moreCol[indx];
         for (let n = 0; n < entry.str.length; n += 6) {
            let num = parseInt(entry.col) + parseInt(n / 6);
            colorMap[num] = 'rgb(' + parseInt("0x" + entry.str.slice(n, n + 2)) + "," + parseInt("0x" + entry.str.slice(n + 2, n + 4)) + "," + parseInt("0x" + entry.str.slice(n + 4, n + 6)) + ")";
         }
      }

      Painter.root_colors = colorMap;
   }

   Painter.MakeColorRGB = function(col) {
      if ((col == null) || (col._typename != 'TColor')) return null;
      let rgb = Math.round(col.fRed * 255) + "," + Math.round(col.fGreen * 255) + "," + Math.round(col.fBlue * 255);
      if ((col.fAlpha === undefined) || (col.fAlpha == 1.))
         rgb = "rgb(" + rgb + ")";
      else
         rgb = "rgba(" + rgb + "," + col.fAlpha.toFixed(3) + ")";

      switch (rgb) {
         case 'rgb(255,255,255)': rgb = 'white'; break;
         case 'rgb(0,0,0)': rgb = 'black'; break;
         case 'rgb(255,0,0)': rgb = 'red'; break;
         case 'rgb(0,255,0)': rgb = 'green'; break;
         case 'rgb(0,0,255)': rgb = 'blue'; break;
         case 'rgb(255,255,0)': rgb = 'yellow'; break;
         case 'rgb(255,0,255)': rgb = 'magenta'; break;
         case 'rgb(0,255,255)': rgb = 'cyan'; break;
      }
      return rgb;
   }

   /** Add new colors from object array. */
   Painter.extendRootColors = function(jsarr, objarr) {
      if (!jsarr) {
         jsarr = [];
         for (let n = 0; n < this.root_colors.length; ++n)
            jsarr[n] = this.root_colors[n];
      }

      if (!objarr) return jsarr;

      let rgb_array = objarr;
      if (objarr._typename && objarr.arr) {
         rgb_array = [];
         for (let n = 0; n < objarr.arr.length; ++n) {
            let col = objarr.arr[n];
            if (!col || (col._typename != 'TColor')) continue;

            if ((col.fNumber >= 0) && (col.fNumber <= 10000))
               rgb_array[col.fNumber] = Painter.MakeColorRGB(col);
         }
      }


      for (let n = 0; n < rgb_array.length; ++n)
         if (rgb_array[n] && (jsarr[n] != rgb_array[n]))
            jsarr[n] = rgb_array[n];

      return jsarr;
   }

   /** Set global list of colors.
    * Either TObjArray of TColor instances or just plain array with rgb() code.
    * List of colors typically stored together with TCanvas primitives
    * @private */
   Painter.adoptRootColors = function(objarr) {
      this.extendRootColors(this.root_colors, objarr);
   }

   /** Define rendering kind which will be used for rendering of 3D elements
    *
    * @param {value} [render3d] - preconfigured value, will be used if applicable
    * @returns {value} - rendering kind, see JSROOT.constants.Render3D
    * @private
    */
   Painter.GetRender3DKind = function(render3d) {
      if (!render3d) render3d = JSROOT.BatchMode ? JSROOT.settings.Render3DBatch : JSROOT.settings.Render3D;
      let rc = JSROOT.constants.Render3D;

      if (render3d == rc.Default) render3d = JSROOT.BatchMode ? rc.WebGLImage : rc.WebGL;
      if (JSROOT.BatchMode && (render3d == rc.WebGL)) render3d = rc.WebGLImage;

      return render3d;
   }

   // =====================================================================

   /** Color palette handle  */

   class ColorPalette {
      constructor(arr) { this.palette = arr; }

      /** @summary Returns color index which correspond to contour index of provided length */
      calcColorIndex(i, len) {
         let theColor = Math.floor((i + 0.99) * this.palette.length / (len - 1));
         if (theColor > this.palette.length - 1) theColor = this.palette.length - 1;
         return theColor;
       }

      /** @summary Returns color with provided index */
      getColor(indx) { return this.palette[indx]; }

      /** @summary Returns number of colors in the palette */
      getLength() { return this.palette.length; }

      /** @summary Calculate color for given i and len */
      calcColor(i, len) { return this.getColor(this.calcColorIndex(i, len)); }
   } // class ColorPalette

   // =============================================================================

   /** @summary Handle for marker attributes */

   class TAttMarkerHandler {
      constructor(args) {
         this.x0 = this.y0 = 0;
         this.color = 'black';
         this.style = 1;
         this.size = 8;
         this.scale = 1;
         this.stroke = true;
         this.fill = true;
         this.marker = "";
         this.ndig = 0;
         this.used = true;
         this.changed = false;

         this.func = this.Apply.bind(this);

         this.SetArgs(args);

         this.changed = false;
      }

      /** @summary Set marker attributes.
       *
       * @param {object} args - arguments can be
       * @param {object} args.attr - instance of TAttrMarker (or derived class) or
       * @param {string} args.color - color in HTML form like grb(1,4,5) or 'green'
       * @param {number} args.style - marker style
       * @param {number} args.size - marker size
       */
      SetArgs(args) {
         if ((typeof args == 'object') && (typeof args.fMarkerStyle == 'number')) args = { attr: args };

         if (args.attr) {
            if (args.color === undefined) args.color = Painter.root_colors[args.attr.fMarkerColor];
            if (!args.style || (args.style < 0)) args.style = args.attr.fMarkerStyle;
            if (!args.size) args.size = args.attr.fMarkerSize;
         }

         this.Change(args.color, args.style, args.size);
      }

      /** @summary Reset position, used for optimization of drawing of multiple markers
       * @private */
      reset_pos() { this.lastx = this.lasty = null; }

      /** @summary Create marker path for given position.
       *
       * @desc When drawing many elementary points, created path may depend from previously produced markers.
       *
       * @param {number} x - first coordinate
       * @param {number} y - second coordinate
       * @returns {string} path string
       */
      create(x, y) {
         if (!this.optimized)
            return "M" + (x + this.x0).toFixed(this.ndig) + "," + (y + this.y0).toFixed(this.ndig) + this.marker;

         // use optimized handling with relative position
         let xx = Math.round(x), yy = Math.round(y), m1 = "M" + xx + "," + yy + "h1",
            m2 = (this.lastx === null) ? m1 : ("m" + (xx - this.lastx) + "," + (yy - this.lasty) + "h1");
         this.lastx = xx + 1; this.lasty = yy;
         return (m2.length < m1.length) ? m2 : m1;
      }

      /** @summary Returns full size of marker */
      GetFullSize() { return this.scale * this.size; }

      /** @summary Returns approximate length of produced marker string */
      MarkerLength() { return this.marker ? this.marker.length : 10; }

      /** @summary Change marker attributes.
       *
       *  @param {string} color - marker color
       *  @param {number} style - marker style
       *  @param {number} size - marker size
       */
      Change(color, style, size) {
         this.changed = true;

         if (color !== undefined) this.color = color;
         if ((style !== undefined) && (style >= 0)) this.style = style;
         if (size !== undefined) this.size = size; else size = this.size;

         this.x0 = this.y0 = 0;

         if ((this.style === 1) || (this.style === 777)) {
            this.fill = false;
            this.marker = "h1";
            this.size = 1;
            this.optimized = true;
            this.reset_pos();
            return true;
         }

         this.optimized = false;

         let marker_kind = Painter.root_markers[this.style];
         if (marker_kind === undefined) marker_kind = 100;
         let shape = marker_kind % 100;

         this.fill = (marker_kind >= 100);

         switch (this.style) {
            case 1: this.size = 1; this.scale = 1; break;
            case 6: this.size = 2; this.scale = 1; break;
            case 7: this.size = 3; this.scale = 1; break;
            default: this.size = size; this.scale = 8;
         }

         size = this.GetFullSize();

         this.ndig = (size > 7) ? 0 : ((size > 2) ? 1 : 2);
         if (shape == 6) this.ndig++;
         let half = (size / 2).toFixed(this.ndig), full = size.toFixed(this.ndig);

         switch (shape) {
            case 0: // circle
               this.x0 = -parseFloat(half);
               full = (parseFloat(half) * 2).toFixed(this.ndig);
               this.marker = "a" + half + "," + half + ",0,1,0," + full + ",0a" + half + "," + half + ",0,1,0,-" + full + ",0z";
               break;
            case 1: // cross
               let d = (size / 3).toFixed(this.ndig);
               this.x0 = this.y0 = size / 6;
               this.marker = "h" + d + "v-" + d + "h-" + d + "v-" + d + "h-" + d + "v" + d + "h-" + d + "v" + d + "h" + d + "v" + d + "h" + d + "z";
               break;
            case 2: // diamond
               this.x0 = -size / 2;
               this.marker = "l" + half + ",-" + half + "l" + half + "," + half + "l-" + half + "," + half + "z";
               break;
            case 3: // square
               this.x0 = this.y0 = -size / 2;
               this.marker = "v" + full + "h" + full + "v-" + full + "z";
               break;
            case 4: // triangle-up
               this.y0 = size / 2;
               this.marker = "l-" + half + ",-" + full + "h" + full + "z";
               break;
            case 5: // triangle-down
               this.y0 = -size / 2;
               this.marker = "l-" + half + "," + full + "h" + full + "z";
               break;
            case 6: // star
               this.y0 = -size / 2;
               this.marker = "l" + (size / 3).toFixed(this.ndig) + "," + full +
                  "l-" + (5 / 6 * size).toFixed(this.ndig) + ",-" + (5 / 8 * size).toFixed(this.ndig) +
                  "h" + full +
                  "l-" + (5 / 6 * size).toFixed(this.ndig) + "," + (5 / 8 * size).toFixed(this.ndig) + "z";
               break;
            case 7: // asterisk
               this.x0 = this.y0 = -size / 2;
               this.marker = "l" + full + "," + full +
                  "m0,-" + full + "l-" + full + "," + full +
                  "m0,-" + half + "h" + full + "m-" + half + ",-" + half + "v" + full;
               break;
            case 8: // plus
               this.y0 = -size / 2;
               this.marker = "v" + full + "m-" + half + ",-" + half + "h" + full;
               break;
            case 9: // mult
               this.x0 = this.y0 = -size / 2;
               this.marker = "l" + full + "," + full + "m0,-" + full + "l-" + full + "," + full;
               break;
            default: // diamand
               this.x0 = -size / 2;
               this.marker = "l" + half + ",-" + half + "l" + half + "," + half + "l-" + half + "," + half + "z";
               break;
         }

         return true;
      }

      getStrokeColor() { return this.stroke ? this.color : "none"; }

      getFillColor() { return this.fill ? this.color : "none"; }

      /** @summary Apply marker styles to created element */
      Apply(selection) {
         selection.style('stroke', this.stroke ? this.color : "none");
         selection.style('fill', this.fill ? this.color : "none");
      }

      /** @summary Method used when color or pattern were changed with OpenUi5 widgets.
       * @private */
      verifyDirectChange(/* painter */) {
         this.Change(this.color, parseInt(this.style), parseFloat(this.size));
      }

      /** @summary Create sample with marker in given SVG element
       *
       * @param {selection} svg - SVG element
       * @param {number} width - width of sample SVG
       * @param {number} height - height of sample SVG
       * @private
       */
      CreateSample(svg, width, height) {
         this.reset_pos();

         svg.append("path")
            .attr("d", this.create(width / 2, height / 2))
            .call(this.func);
      }
   } // class TAttMarkerHandler

   // =======================================================================

   /** Handle for line attributes */

   class TAttLineHandler {

      constructor(args) {
         this.func = this.Apply.bind(this);
         this.used = true;
         if (args._typename && (args.fLineStyle !== undefined)) args = { attr: args };

         this.SetArgs(args);
      }

      /**
       * @summary Set line attributes.
       *
       * @param {object} args - specify attributes by different ways
       * @param {object} args.attr - TAttLine object with appropriate data members or
       * @param {string} args.color - color in html like rgb(10,0,0) or "red"
       * @param {number} args.style - line style number
       * @param {number} args.width - line width
       */
      SetArgs(args) {
         if (args.attr) {
            args.color = args.color0 || Painter.root_colors[args.attr.fLineColor];
            if (args.width === undefined) args.width = args.attr.fLineWidth;
            args.style = args.attr.fLineStyle;
         } else if (typeof args.color == 'string') {
            if ((args.color !== 'none') && !args.width) args.width = 1;
         } else if (typeof args.color == 'number') {
            args.color = Painter.root_colors[args.color];
         }

         if (args.width === undefined)
            args.width = (args.color && args.color != 'none') ? 1 : 0;

         this.color = (args.width === 0) ? 'none' : args.color;
         this.width = args.width;
         this.style = args.style;

         if (args.can_excl) {
            this.excl_side = this.excl_width = 0;
            if (Math.abs(this.width) > 99) {
               // exclusion graph
               this.excl_side = (this.width < 0) ? -1 : 1;
               this.excl_width = Math.floor(this.width / 100) * 5;
               this.width = Math.abs(this.width % 100); // line width
            }
         }

         // if custom color number used, use lightgrey color to show lines
         if (!this.color && (this.width > 0))
            this.color = 'lightgrey';
      }

      /**
       * @summary Change exclusion attributes.
       * @private
       */

      ChangeExcl(side, width) {
         if (width !== undefined) this.excl_width = width;
         if (side !== undefined) {
            this.excl_side = side;
            if ((this.excl_width === 0) && (this.excl_side !== 0)) this.excl_width = 20;
         }
         this.changed = true;
      }

      /** @returns true if line attribute is empty and will not be applied. */
      empty() { return this.color == 'none'; }

      /**
       * @summary Applies line attribute to selection.
       *
       * @param {object} selection - d3.js selection
       */

      Apply(selection) {
         this.used = true;
         if (this.empty())
            selection.style('stroke', null)
               .style('stroke-width', null)
               .style('stroke-dasharray', null);
         else
            selection.style('stroke', this.color)
               .style('stroke-width', this.width)
               .style('stroke-dasharray', Painter.root_line_styles[this.style] || null);
      }

      /**
       * @summary Change line attributes
       * @private
       */
      Change(color, width, style) {
         if (color !== undefined) this.color = color;
         if (width !== undefined) this.width = width;
         if (style !== undefined) this.style = style;
         this.changed = true;
      }

      /**
       * @summary Create sample element inside primitive SVG - used in context menu
       * @private
       */
      CreateSample(svg, width, height) {
         svg.append("path")
            .attr("d", "M0," + height / 2 + "h" + width)
            .call(this.func);
      }
   } // class TAttLineHandler

   // =======================================================================


   /** Handle for fill attributes. */

   class TAttFillHandler {

      /** @param {object} args - different arguments to set fill attributes
       * @param {number} [args.kind = 2] - 1 means object drawing where combination fillcolor==0 and fillstyle==1001 means no filling,  2 means all other objects where such combination is white-color filling
       */
      constructor(args) {
         this.color = "none";
         this.colorindx = 0;
         this.pattern = 0;
         this.used = true;
         this.kind = args.kind || 2;
         this.changed = false;
         this.func = this.Apply.bind(this);
         this.SetArgs(args);
         this.changed = false; // unset change property that
      }

      /** @summary Set fill style as arguments */
      SetArgs(args) {
         if (args.attr && (typeof args.attr == 'object')) {
            if ((args.pattern === undefined) && (args.attr.fFillStyle !== undefined)) args.pattern = args.attr.fFillStyle;
            if ((args.color === undefined) && (args.attr.fFillColor !== undefined)) args.color = args.attr.fFillColor;
         }
         this.Change(args.color, args.pattern, args.svg, args.color_as_svg);
      }

      /** @summary Apply fill style to selection */
      Apply(selection) {
         this.used = true;

         selection.style('fill', this.fillcolor());

         if ('opacity' in this)
            selection.style('opacity', this.opacity);

         if ('antialias' in this)
            selection.style('antialias', this.antialias);
      }

      /** @summary Returns fill color (or pattern url) */
      fillcolor() { return this.pattern_url || this.color; }

      /** @summary Returns fill color without pattern url.
       *
       * @desc If empty, alternative color will be provided
       * @param {string} [altern=undefined] - alternative color which returned when fill color not exists
       * @private */
      fillcoloralt(altern) { return this.color && (this.color != "none") ? this.color : altern; }

      /** @summary Returns true if color not specified or fill style not specified */
      empty() {
         let fill = this.fillcolor();
         return !fill || (fill == 'none');
      }

      /** @summary Set solid fill color as fill pattern
       * @param {string} col - solid color */
      SetSolidColor(col) {
         delete this.pattern_url;
         this.color = col;
         this.pattern = 1001;
      }

      /** @summary Check if solid fill is used, also color can be checked
       * @param {string} [solid_color = undefined] - when specified, checks if fill color matches */
      isSolid(solid_color) {
         if (this.pattern !== 1001) return false;
         return !solid_color || solid_color == this.color;
      }

      /** @summary Method used when color or pattern were changed with OpenUi5 widgets
       * @private */
      verifyDirectChange(painter) {
         if (typeof this.pattern == 'string') this.pattern = parseInt(this.pattern);
         if (isNaN(this.pattern)) this.pattern = 0;

         this.Change(this.color, this.pattern, painter ? painter.svg_canvas() : null, true);
      }

      /** @summary Method to change fill attributes.
       *
       * @param {number} color - color index
       * @param {number} pattern - pattern index
       * @param {selection} svg - top canvas element for pattern storages
       * @param {string} [color_as_svg = undefined] - color as HTML string index
       */
      Change(color, pattern, svg, color_as_svg) {
         delete this.pattern_url;
         this.changed = true;

         if ((color !== undefined) && !isNaN(color) && !color_as_svg)
            this.colorindx = parseInt(color);

         if ((pattern !== undefined) && !isNaN(pattern)) {
            this.pattern = parseInt(pattern);
            delete this.opacity;
            delete this.antialias;
         }

         if ((this.pattern == 1000) && (this.colorindx === 0)) {
            this.pattern_url = 'white';
            return true;
         }

         if (this.pattern == 1000) this.pattern = 1001;

         if (this.pattern < 1001) {
            this.pattern_url = 'none';
            return true;
         }

         if (this.isSolid() && (this.colorindx === 0) && (this.kind === 1) && !color_as_svg) {
            this.pattern_url = 'none';
            return true;
         }

         let indx = this.colorindx;

         if (color_as_svg) {
            this.color = color;
            indx = 10000 + JSROOT.id_counter++; // use fictional unique index far away from existing color indexes
         } else {
            this.color = JSROOT.Painter.root_colors[indx];
         }

         if (typeof this.color != 'string') this.color = "none";

         if (this.isSolid()) return true;

         if ((this.pattern >= 4000) && (this.pattern <= 4100)) {
            // special transparent colors (use for subpads)
            this.opacity = (this.pattern - 4000) / 100;
            return true;
         }

         if (!svg || svg.empty() || (this.pattern < 3000)) return false;

         let id = "pat_" + this.pattern + "_" + indx,
            defs = svg.select('.canvas_defs');

         if (defs.empty())
            defs = svg.insert("svg:defs", ":first-child").attr("class", "canvas_defs");

         this.pattern_url = "url(#" + id + ")";
         this.antialias = false;

         if (!defs.select("." + id).empty()) {
            if (color_as_svg) console.log('find id in def', id);
            return true;
         }

         let lines = "", lfill = null, fills = "", fills2 = "", w = 2, h = 2;

         switch (this.pattern) {
            case 3001: w = h = 2; fills = "M0,0h1v1h-1zM1,1h1v1h-1z"; break;
            case 3002: w = 4; h = 2; fills = "M1,0h1v1h-1zM3,1h1v1h-1z"; break;
            case 3003: w = h = 4; fills = "M2,1h1v1h-1zM0,3h1v1h-1z"; break;
            case 3004: w = h = 8; lines = "M8,0L0,8"; break;
            case 3005: w = h = 8; lines = "M0,0L8,8"; break;
            case 3006: w = h = 4; lines = "M1,0v4"; break;
            case 3007: w = h = 4; lines = "M0,1h4"; break;
            case 3008:
               w = h = 10;
               fills = "M0,3v-3h3ZM7,0h3v3ZM0,7v3h3ZM7,10h3v-3ZM5,2l3,3l-3,3l-3,-3Z";
               lines = "M0,3l5,5M3,10l5,-5M10,7l-5,-5M7,0l-5,5";
               break;
            case 3009: w = 12; h = 12; lines = "M0,0A6,6,0,0,0,12,0M6,6A6,6,0,0,0,12,12M6,6A6,6,0,0,1,0,12"; lfill = "none"; break;
            case 3010: w = h = 10; lines = "M0,2h10M0,7h10M2,0v2M7,2v5M2,7v3"; break; // bricks
            case 3011: w = 9; h = 18; lines = "M5,0v8M2,1l6,6M8,1l-6,6M9,9v8M6,10l3,3l-3,3M0,9v8M3,10l-3,3l3,3"; lfill = "none"; break;
            case 3012: w = 10; h = 20; lines = "M5,1A4,4,0,0,0,5,9A4,4,0,0,0,5,1M0,11A4,4,0,0,1,0,19M10,11A4,4,0,0,0,10,19"; lfill = "none"; break;
            case 3013: w = h = 7; lines = "M0,0L7,7M7,0L0,7"; lfill = "none"; break;
            case 3014: w = h = 16; lines = "M0,0h16v16h-16v-16M0,12h16M12,0v16M4,0v8M4,4h8M0,8h8M8,4v8"; lfill = "none"; break;
            case 3015: w = 6; h = 12; lines = "M2,1A2,2,0,0,0,2,5A2,2,0,0,0,2,1M0,7A2,2,0,0,1,0,11M6,7A2,2,0,0,0,6,11"; lfill = "none"; break;
            case 3016: w = 12; h = 7; lines = "M0,1A3,2,0,0,1,3,3A3,2,0,0,0,9,3A3,2,0,0,1,12,1"; lfill = "none"; break;
            case 3017: w = h = 4; lines = "M3,1l-2,2"; break;
            case 3018: w = h = 4; lines = "M1,1l2,2"; break;
            case 3019:
               w = h = 12;
               lines = "M1,6A5,5,0,0,0,11,6A5,5,0,0,0,1,6h-1h1A5,5,0,0,1,6,11v1v-1" +
                  "A5,5,0,0,1,11,6h1h-1A5,5,0,0,1,6,1v-1v1A5,5,0,0,1,1,6";
               lfill = "none";
               break;
            case 3020: w = 7; h = 12; lines = "M1,0A2,3,0,0,0,3,3A2,3,0,0,1,3,9A2,3,0,0,0,1,12"; lfill = "none"; break;
            case 3021: w = h = 8; lines = "M8,2h-2v4h-4v2M2,0v2h-2"; lfill = "none"; break; // left stairs
            case 3022: w = h = 8; lines = "M0,2h2v4h4v2M6,0v2h2"; lfill = "none"; break; // right stairs
            case 3023: w = h = 8; fills = "M4,0h4v4zM8,4v4h-4z"; fills2 = "M4,0L0,4L4,8L8,4Z"; break;
            case 3024: w = h = 16; fills = "M0,8v8h2v-8zM8,0v8h2v-8M4,14v2h12v-2z"; fills2 = "M0,2h8v6h4v-6h4v12h-12v-6h-4z"; break;
            case 3025: w = h = 18; fills = "M5,13v-8h8ZM18,0v18h-18l5,-5h8v-8Z"; break;
            default:
               if ((this.pattern > 3025) && (this.pattern < 3100)) {
                  // same as 3002, see TGX11.cxx, line 2234
                  w = 4; h = 2; fills = "M1,0h1v1h-1zM3,1h1v1h-1z"; break;
               }

               let code = this.pattern % 1000,
                  k = code % 10, j = ((code - k) % 100) / 10, i = (code - j * 10 - k) / 100;
               if (!i) break;

               let sz = i * 12;  // axis distance between lines

               w = h = 6 * sz; // we use at least 6 steps

               function produce(dy, swap) {
                  let pos = [], step = sz, y1 = 0, y2, max = h;

                  // reduce step for smaller angles to keep normal distance approx same
                  if (Math.abs(dy) < 3) step = Math.round(sz / 12 * 9);
                  if (dy == 0) { step = Math.round(sz / 12 * 8); y1 = step / 2; }
                  else if (dy > 0) max -= step; else y1 = step;

                  while (y1 <= max) {
                     y2 = y1 + dy * step;
                     if (y2 < 0) {
                        let x2 = Math.round(y1 / (y1 - y2) * w);
                        pos.push(0, y1, x2, 0);
                        pos.push(w, h - y1, w - x2, h);
                     } else if (y2 > h) {
                        let x2 = Math.round((h - y1) / (y2 - y1) * w);
                        pos.push(0, y1, x2, h);
                        pos.push(w, h - y1, w - x2, 0);
                     } else {
                        pos.push(0, y1, w, y2);
                     }
                     y1 += step;
                  }
                  for (let k = 0; k < pos.length; k += 4)
                     if (swap) lines += "M" + pos[k + 1] + "," + pos[k] + "L" + pos[k + 3] + "," + pos[k + 2];
                     else lines += "M" + pos[k] + "," + pos[k + 1] + "L" + pos[k + 2] + "," + pos[k + 3];
               }

               switch (j) {
                  case 0: produce(0); break;
                  case 1: produce(1); break;
                  case 2: produce(2); break;
                  case 3: produce(3); break;
                  case 4: produce(6); break;
                  case 6: produce(3, true); break;
                  case 7: produce(2, true); break;
                  case 8: produce(1, true); break;
                  case 9: produce(0, true); break;
               }

               switch (k) {
                  case 0: if (j) produce(0); break;
                  case 1: produce(-1); break;
                  case 2: produce(-2); break;
                  case 3: produce(-3); break;
                  case 4: produce(-6); break;
                  case 6: produce(-3, true); break;
                  case 7: produce(-2, true); break;
                  case 8: produce(-1, true); break;
                  case 9: if (j != 9) produce(0, true); break;
               }

               break;
         }

         if (!fills && !lines) return false;

         let patt = defs.append('svg:pattern').attr("id", id).attr("class", id).attr("patternUnits", "userSpaceOnUse")
            .attr("width", w).attr("height", h);

         if (fills2) {
            let col = d3.rgb(this.color);
            col.r = Math.round((col.r + 255) / 2); col.g = Math.round((col.g + 255) / 2); col.b = Math.round((col.b + 255) / 2);
            patt.append("svg:path").attr("d", fills2).style("fill", col);
         }
         if (fills) patt.append("svg:path").attr("d", fills).style("fill", this.color);
         if (lines) patt.append("svg:path").attr("d", lines).style('stroke', this.color).style("stroke-width", 1).style("fill", lfill);

         return true;
      }

      /** @summary Create sample of fill pattern inside SVG
       * @private */
      CreateSample(sample_svg, width, height) {

         // we need to create extra handle to change
         let sample = new TAttFillHandler({ svg: sample_svg, pattern: this.pattern, color: this.color, color_as_svg: true });

         sample_svg.append("path")
            .attr("d", "M0,0h" + width + "v" + height + "h-" + width + "z")
            .call(sample.func);
      }
   } // class TAttFillHandler

   // ===========================================================================

   Painter.getFontDetails = function(fontIndex, size) {

      let res = { name: "Arial", size: Math.round(size || 11), weight: null, style: null },
         indx = Math.floor(fontIndex / 10),
         fontName = Painter.root_fonts[indx] || "";

      while (fontName.length > 0) {
         if (fontName[0] === 'b') res.weight = "bold"; else
            if (fontName[0] === 'i') res.style = "italic"; else
               if (fontName[0] === 'o') res.style = "oblique"; else break;
         fontName = fontName.substr(1);
      }

      if (fontName == 'Symbol')
         res.weight = res.style = null;

      res.name = fontName;
      res.aver_width = Painter.root_fonts_aver_width[indx] || 0.55;

      res.setFont = function(selection, arg) {
         selection.attr("font-family", this.name);
         if (arg != 'without-size')
            selection.attr("font-size", this.size)
               .attr("xml:space", "preserve");
         if (this.weight)
            selection.attr("font-weight", this.weight);
         if (this.style)
            selection.attr("font-style", this.style);
      }

      res.func = res.setFont.bind(res);

      return res;
   }

   Painter.chooseTimeFormat = function(awidth, ticks) {
      if (awidth < .5) return ticks ? "%S.%L" : "%H:%M:%S.%L";
      if (awidth < 30) return ticks ? "%Mm%S" : "%H:%M:%S";
      awidth /= 60; if (awidth < 30) return ticks ? "%Hh%M" : "%d/%m %H:%M";
      awidth /= 60; if (awidth < 12) return ticks ? "%d-%Hh" : "%d/%m/%y %Hh";
      awidth /= 24; if (awidth < 15.218425) return ticks ? "%d/%m" : "%d/%m/%y";
      awidth /= 30.43685; if (awidth < 6) return "%d/%m/%y";
      awidth /= 12; if (awidth < 2) return ticks ? "%m/%y" : "%d/%m/%y";
      return "%Y";
   }

   /** @summary Returns time format @private */
   Painter.getTimeFormat = function(axis) {
      let idF = axis.fTimeFormat.indexOf('%F');
      return (idF >= 0) ? axis.fTimeFormat.substr(0, idF) : axis.fTimeFormat;
   }

   /** @summary Return time offset value for given TAxis object @private */
   Painter.getTimeOffset = function(axis) {
      let dflt_time_offset = 788918400000;
      if (!axis) return dflt_time_offset;
      let idF = axis.fTimeFormat.indexOf('%F');
      if (idF < 0) return JSROOT.gStyle.fTimeOffset * 1000;
      let sof = axis.fTimeFormat.substr(idF + 2);
      // default string in axis offset
      if (sof.indexOf('1995-01-01 00:00:00s0') == 0) return dflt_time_offset;
      // special case, used from DABC painters
      if ((sof == "0") || (sof == "")) return 0;

      // decode time from ROOT string
      function next(separ, min, max) {
         let pos = sof.indexOf(separ);
         if (pos < 0) { pos = ""; return min; }
         let val = parseInt(sof.substr(0, pos));
         sof = sof.substr(pos + 1);
         if (isNaN(val) || (val < min) || (val > max)) { pos = ""; return min; }
         return val;
      }

      let year = next("-", 1970, 2300),
         month = next("-", 1, 12) - 1,
         day = next(" ", 1, 31),
         hour = next(":", 0, 23),
         min = next(":", 0, 59),
         sec = next("s", 0, 59),
         msec = next(" ", 0, 999);

      let dt = new Date(Date.UTC(year, month, day, hour, min, sec, msec));

      let offset = dt.getTime();

      // now also handle suffix like GMT or GMT -0600
      sof = sof.toUpperCase();

      if (sof.indexOf('GMT') == 0) {
         offset += dt.getTimezoneOffset() * 60000;
         sof = sof.substr(4).trim();
         if (sof.length > 3) {
            let p = 0, sign = 1000;
            if (sof[0] == '-') { p = 1; sign = -1000; }
            offset -= sign * (parseInt(sof.substr(p, 2)) * 3600 + parseInt(sof.substr(p + 2, 2)) * 60);
         }
      }

      return offset;
   }

   Painter.approxTextWidth = function(font, label) {
      // returns approximate width of given label, required for reasonable scaling of text in node.js

      return label.length * font.size * font.aver_width;
   }

   Painter.isAnyLatex = function(str) {
      return (str.indexOf("#") >= 0) || (str.indexOf("\\") >= 0) || (str.indexOf("{") >= 0);
   }

   /** Function used to provide svg:path for the smoothed curves.
    *
    * reuse code from d3.js. Used in TH1, TF1 and TGraph painters
    * kind should contain "bezier" or "line".
    * If first symbol "L", then it used to continue drawing
    * @private
    */
   Painter.BuildSvgPath = function(kind, bins, height, ndig) {

      let smooth = kind.indexOf("bezier") >= 0;

      if (ndig === undefined) ndig = smooth ? 2 : 0;
      if (height === undefined) height = 0;

      function jsroot_d3_svg_lineSlope(p0, p1) {
         return (p1.gry - p0.gry) / (p1.grx - p0.grx);
      }
      function jsroot_d3_svg_lineFiniteDifferences(points) {
         let i = 0, j = points.length - 1, m = [], p0 = points[0], p1 = points[1], d = m[0] = jsroot_d3_svg_lineSlope(p0, p1);
         while (++i < j) {
            m[i] = (d + (d = jsroot_d3_svg_lineSlope(p0 = p1, p1 = points[i + 1]))) / 2;
         }
         m[i] = d;
         return m;
      }
      function jsroot_d3_svg_lineMonotoneTangents(points) {
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
      }

      let res = { path: "", close: "" }, bin = bins[0], maxy = Math.max(bin.gry, height + 5),
         currx = Math.round(bin.grx), curry = Math.round(bin.gry), dx, dy, npnts = bins.length;

      function conv(val) {
         let vvv = Math.round(val);
         if ((ndig == 0) || (vvv === val)) return vvv.toString();
         let str = val.toFixed(ndig);
         while ((str[str.length - 1] == '0') && (str.lastIndexOf(".") < str.length - 1))
            str = str.substr(0, str.length - 1);
         if (str[str.length - 1] == '.')
            str = str.substr(0, str.length - 1);
         if (str == "-0") str = "0";
         return str;
      }

      res.path = ((kind[0] == "L") ? "L" : "M") + conv(bin.grx) + "," + conv(bin.gry);

      // just calculate all deltas, can be used to build exclusion
      if (smooth || kind.indexOf('calc') >= 0)
         jsroot_d3_svg_lineMonotoneTangents(bins);

      if (smooth) {
         // build smoothed curve
         res.path += "c" + conv(bin.dgrx) + "," + conv(bin.dgry) + ",";
         for (let n = 1; n < npnts; ++n) {
            let prev = bin;
            bin = bins[n];
            if (n > 1) res.path += "s";
            res.path += conv(bin.grx - bin.dgrx - prev.grx) + "," + conv(bin.gry - bin.dgry - prev.gry) + "," + conv(bin.grx - prev.grx) + "," + conv(bin.gry - prev.gry);
            maxy = Math.max(maxy, prev.gry);
         }
      } else if (npnts < 10000) {
         // build simple curve
         for (let n = 1; n < npnts; ++n) {
            bin = bins[n];
            dx = Math.round(bin.grx) - currx;
            dy = Math.round(bin.gry) - curry;
            if (dx && dy) res.path += "l" + dx + "," + dy;
            else if (!dx && dy) res.path += "v" + dy;
            else if (dx && !dy) res.path += "h" + dx;
            currx += dx; curry += dy;
            maxy = Math.max(maxy, curry);
         }
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
            if (dy) res.path += "l" + dx + "," + dy;
            else res.path += "h" + dx;
            currx = lastx; curry = lasty;
            prevy = cminy = cmaxy = lasty;
         }

         if (cminy != cmaxy) {
            if (cminy != curry) res.path += "v" + (cminy - curry);
            res.path += "v" + (cmaxy - cminy);
            if (cmaxy != prevy) res.path += "v" + (prevy - cmaxy);
            curry = prevy;
         }

      }

      if (height > 0)
         res.close = "L" + conv(bin.grx) + "," + conv(maxy) +
            "h" + conv(bins[0].grx - bin.grx) + "Z";

      return res;
   }

   // ========================================================================================

   /** @class Basic painter class. */

   class BasePainter {
      constructor() {
         this.divid = null; // either id of element (preferable) or element itself
      }

      /** @summary Access painter reference, stored in first child element.
       *
       *    - on === true - set *this* as painter
       *    - on === false - delete painter reference
       *    - on === undefined - return painter
       *
       * @param {boolean} on - that to perfrom
       * @private
       */
      AccessTopPainter(on) {
         let main = this.select_main().node(),
            chld = main ? main.firstChild : null;
         if (!chld) return null;
         if (on === true) chld.painter = this; else
            if (on === false) delete chld.painter;
         return chld.painter;
      }

      /** @summary Generic method to cleanup painter */
      Cleanup(keep_origin) {

         let origin = this.select_main('origin');
         if (!origin.empty() && !keep_origin) origin.html("");
         if (this._changed_layout)
            this.set_layout_kind('simple');
         this.AccessTopPainter(false);
         this.divid = null;
         delete this._selected_main;

         if (this._hpainter && typeof this._hpainter.ClearPainter === 'function') this._hpainter.ClearPainter(this);

         delete this._changed_layout;
         delete this._hitemname;
         delete this._hdrawopt;
         delete this._hpainter;
      }

      /** @summary Function should be called by the painter when first drawing is completed
       * @private */

      DrawingReady(res_painter, res_value) {
         let res = (res_value === undefined) ? true : !!res_value;
         this._ready_called_ = res;
         if (this._ready_callbacks_ !== undefined) {
            let callbacks = (res ? this._ready_callbacks_ : this._reject_callbacks_) || [];
            if (!this._return_res_painter) res_painter = this;

            delete this._return_res_painter;
            delete this._ready_callbacks_;
            delete this._reject_callbacks_;

            while (callbacks.length)
               JSROOT.CallBack(callbacks.shift(), res_painter);
         }
         return this;
      }

      /** @summary Function should be called when first drawing fails
       * @private */

      DrawingFail(res_painter) { return this.DrawingReady(res_painter, false); }

      /** @summary Call back will be called when painter ready with the drawing
       * @private
       */
      WhenReady(resolveFunc, rejectFunc) {
         if (typeof resolveFunc !== 'function') return;
         if ('_ready_called_' in this)
            return JSROOT.CallBack(resolveFunc, this);
         if (!this._ready_callbacks_)
            this._ready_callbacks_ = [resolveFunc];
         else
            this._ready_callbacks_.push(resolveFunc);
         if (rejectFunc) {
            if (!this._reject_callbacks_)
               this._reject_callbacks_ = [rejectFunc];
            else
               this._reject_callbacks_.push(rejectFunc);
         }
      }

      /** @summary Create Promise object which will be completed when drawing is ready
       * @private
       */
      Promise(is_ready) {
         if (is_ready)
            this.DrawingReady(this);

         if (this._ready_called_)
            return Promise.resolve(this); // painting is done, we could return promise

         let pthis = this;
         return new Promise(function(resolve, reject) {
            pthis.WhenReady(resolve, reject);
         });
      }

      /** @summary Reset ready state - painter should again call DrawingReady to signal readyness
      * @private
      */
      ResetReady() {
         delete this._ready_called_;
         delete this._ready_callbacks_;
      }

      /** @summary Returns drawn object
       * @abstract */
      GetObject() { }

      /** @summary Returns true if type match with drawn object type
       * @param {string} typename - type name to check with
       * @returns {boolean} true if draw objects matches with provided type name
       * @abstract
       * @private */
      MatchObjectType(/* typename */) {}

      /** @summary Called to update drawn object content
       * @returns {boolean} true if update was performed
       * @abstract
       * @private */
      UpdateObject(/* obj */) {}

      /** @summary Redraw all objects in current pad
       * @param {string} reason - why redraw performed, can be "zoom" or empty ]
       * @abstract
       * @private */
      RedrawPad(/* reason */) {}

      /** @summary Updates object and readraw it
       * @param {object} obj - new version of object, values will be updated in original object
       * @returns {boolean} true if object updated and redrawn */
      RedrawObject(obj) {
         if (!this.UpdateObject(obj)) return false;
         let current = document.body.style.cursor;
         document.body.style.cursor = 'wait';
         this.RedrawPad();
         document.body.style.cursor = current;
         return true;
      }

      /** @summary Checks if draw elements were resized and drawing should be updated
       * @returns {boolean} true if resize was detected
       * @abstract
       * @private */
      CheckResize(/* arg */) {}

      /** @summary access to main HTML element used for drawing - typically <div> element
        * @desc if main element was layouted, returns main element inside layout
       * @param {string} is_direct - if 'origin' specified, returns original element even if actual drawing moved to some other place
       * @returns {object} d3.select for main element for drawing, defined with this.divid. */
      select_main(is_direct) {

         if (!this.divid) return d3.select(null);

         let res = this._selected_main;
         if (!res) {
            if (typeof this.divid == "string") {
               let id = this.divid;
               if (id[0] != '#') id = "#" + id;
               res = d3.select(id);
               if (!res.empty()) this.divid = res.node();
            } else {
               res = d3.select(this.divid);
            }
            this._selected_main = res;
         }

         if (!res || res.empty() || (is_direct === 'origin')) return res;

         let use_enlarge = res.property('use_enlarge'),
            layout = res.property('layout') || 'simple',
            layout_selector = (layout == 'simple') ? "" : res.property('layout_selector');

         if (layout_selector) res = res.select(layout_selector);

         // one could redirect here
         if (!is_direct && !res.empty() && use_enlarge) res = d3.select("#jsroot_enlarge_div");

         return res;
      }

      /** @summary Returns string with value of main element id attribute
      * @desc if main element does not have id, it will be generated */
      get_main_id() {
         let elem = this.select_main();
         if (elem.empty()) return "";
         let id = elem.attr("id");
         if (!id) {
            id = "jsroot_element_" + JSROOT.id_counter++;
            elem.attr("id", id);
         }
         return id;
      }

      /** @summary Returns layout kind
       * @private
       */
      get_layout_kind() {
         let origin = this.select_main('origin'),
            layout = origin.empty() ? "" : origin.property('layout');

         return layout || 'simple';
      }

      /** @summary Set layout kind
       * @private
       */
      set_layout_kind(kind, main_selector) {
         // change layout settings
         let origin = this.select_main('origin');
         if (!origin.empty()) {
            if (!kind) kind = 'simple';
            origin.property('layout', kind);
            origin.property('layout_selector', (kind != 'simple') && main_selector ? main_selector : null);
            this._changed_layout = (kind !== 'simple'); // use in cleanup
         }
      }

      /** @summary Function checks if geometry of main div was changed.
       *
       * @desc returns size of area when main div is drawn
       * take into account enlarge state
       *
       * @private
       */
      check_main_resize(check_level, new_size, height_factor) {

         let enlarge = this.enlarge_main('state'),
            main_origin = this.select_main('origin'),
            main = this.select_main(),
            lmt = 5; // minimal size

         if (enlarge !== 'on') {
            if (new_size && new_size.width && new_size.height)
               main_origin.style('width', new_size.width + "px")
                  .style('height', new_size.height + "px");
         }

         let rect_origin = this.get_visible_rect(main_origin, true),
            can_resize = main_origin.attr('can_resize'),
            do_resize = false;

         if (can_resize == "height")
            if (height_factor && Math.abs(rect_origin.width * height_factor - rect_origin.height) > 0.1 * rect_origin.width) do_resize = true;

         if (((rect_origin.height <= lmt) || (rect_origin.width <= lmt)) &&
            can_resize && can_resize !== 'false') do_resize = true;

         if (do_resize && (enlarge !== 'on')) {
            // if zero size and can_resize attribute set, change container size

            if (rect_origin.width > lmt) {
               height_factor = height_factor || 0.66;
               main_origin.style('height', Math.round(rect_origin.width * height_factor) + 'px');
            } else if (can_resize !== 'height') {
               main_origin.style('width', '200px').style('height', '100px');
            }
         }

         let rect = this.get_visible_rect(main),
            old_h = main.property('draw_height'), old_w = main.property('draw_width');

         rect.changed = false;

         if (old_h && old_w && (old_h > 0) && (old_w > 0)) {
            if ((old_h !== rect.height) || (old_w !== rect.width))
               if ((check_level > 1) || (rect.width / old_w < 0.66) || (rect.width / old_w > 1.5) ||
                  (rect.height / old_h < 0.66) && (rect.height / old_h > 1.5)) rect.changed = true;
         } else {
            rect.changed = true;
         }

         return rect;
      }

      /** @summary Try enlarge main drawing element to full HTML page.
       *
       * @desc Possible values for parameter:
       *
       *    - true - try to enlarge
       *    - false - cancel enlarge state
       *    - 'toggle' - toggle enlarge state
       *    - 'state' - return current state
       *    - 'verify' - check if element can be enlarged
       *
       * if action not specified, just return possibility to enlarge main div
       *
       * @private
       */
      enlarge_main(action, skip_warning) {

         let main = this.select_main(true),
            origin = this.select_main('origin');

         if (main.empty() || !JSROOT.gStyle.CanEnlarge || (origin.property('can_enlarge') === false)) return false;

         if (action === undefined) return true;

         if (action === 'verify') return true;

         let state = origin.property('use_enlarge') ? "on" : "off";

         if (action === 'state') return state;

         if (action === 'toggle') action = (state === "off");

         let enlarge = d3.select("#jsroot_enlarge_div");

         if ((action === true) && (state !== "on")) {
            if (!enlarge.empty()) return false;

            enlarge = d3.select(document.body)
               .append("div")
               .attr("id", "jsroot_enlarge_div");

            let rect1 = this.get_visible_rect(main),
               rect2 = this.get_visible_rect(enlarge);

            // if new enlarge area not big enough, do not do it
            if ((rect2.width <= rect1.width) || (rect2.height <= rect1.height))
               if (rect2.width * rect2.height < rect1.width * rect1.height) {
                  if (!skip_warning)
                     console.log('Enlarged area ' + rect2.width + "x" + rect2.height + ' smaller then original drawing ' + rect1.width + "x" + rect1.height);
                  enlarge.remove();
                  return false;
               }

            while (main.node().childNodes.length > 0)
               enlarge.node().appendChild(main.node().firstChild);

            origin.property('use_enlarge', true);

            return true;
         }
         if ((action === false) && (state !== "off")) {

            while (enlarge.node() && enlarge.node().childNodes.length > 0)
               main.node().appendChild(enlarge.node().firstChild);

            enlarge.remove();
            origin.property('use_enlarge', false);
            return true;
         }

         return false;
      }

      /** @summary Return CSS value in given HTML element
       * @private */
      GetStyleValue(elem, name) {
         if (!elem || elem.empty()) return 0;
         let value = elem.style(name);
         if (!value || (typeof value !== 'string')) return 0;
         value = parseFloat(value.replace("px", ""));
         return isNaN(value) ? 0 : Math.round(value);
      }

      /** @summary Returns rect with width/height which correspond to the visible area of drawing region of element.
       * @private */
      get_visible_rect(elem, fullsize) {

         if (JSROOT.nodejs)
            return { width: parseInt(elem.attr("width")), height: parseInt(elem.attr("height")) };

         let rect = elem.node().getBoundingClientRect(),
            res = { width: Math.round(rect.width), height: Math.round(rect.height) };

         if (!fullsize) {
            // this is size exclude padding area
            res.width -= this.GetStyleValue(elem, 'padding-left') + this.GetStyleValue(elem, 'padding-right');
            res.height -= this.GetStyleValue(elem, 'padding-top') - this.GetStyleValue(elem, 'padding-bottom');
         }

         return res;
      }

      /** @summary Assign painter to specified element
       *
       * @desc base painter does not creates canvas or frames
       * it registered in the first child element
       *
       * @param {string|object} divid - element ID or DOM Element
       */
      SetDivId(divid) {
         if (divid !== undefined) {
            this.divid = divid;
            delete this._selected_main;
         }

         this.AccessTopPainter(true);
      }

      /** @summary Set item name, associated with the painter
       *
       * @desc Used by {@link JSROOT.HiearchyPainter}
       * @private
       */
      SetItemName(name, opt, hpainter) {
         if (typeof name === 'string') this._hitemname = name;
         else delete this._hitemname;
         // only upate draw option, never delete. null specified when update drawing
         if (typeof opt === 'string') this._hdrawopt = opt;

         this._hpainter = hpainter;
      }

      /** @summary Returns assigned item name */
      GetItemName() { return ('_hitemname' in this) ? this._hitemname : null; }

      /** @summary Returns assigned item draw option
       * @private */
      GetItemDrawOpt() { return ('_hdrawopt' in this) ? this._hdrawopt : ""; }

      /** @summary Check if it makes sense to zoom inside specified axis range
       * @param {string} axis - name of axis like 'x', 'y', 'z'
       * @param {number} left - left axis range
       * @param {number} right - right axis range
       * @returns true is zooming makes sense
       * @abstract
       * @private
       */
      CanZoomIn(/* axis, left, right */) {}

   } // class BasePainter

   // ==============================================================================

   /** Basic painter for objects inside TCanvas/TPad */

   class ObjectPainter extends BasePainter {

      /* Constructor of ObjectPainter
       * @param {object} obj - object to draw
       * @param {string} [opt] - object draw options */
       constructor(obj, opt) {
         super();
         this.draw_g = null; // container for all drawn objects
         this.pad_name = ""; // name of pad where object is drawn
         this.main = null;  // main painter, received from pad
         if (typeof opt == "string") this.options = { original: opt };
         this.AssignObject(obj);
      }

      /** @summary Assign object to the painter */
      AssignObject(obj) { this.draw_object = ((obj !== undefined) && (typeof obj == 'object')) ? obj : null; }

      /** @summary Assign snapid to the painter
      *
      * @desc Identifier used to communicate with server side and identifies object on the server
      * @private */
      AssignSnapId(id) { this.snapid = id; }

      /** @summary Generic method to cleanup painter.
       *
       * @desc Remove object drawing and in case of main painter - also main HTML components
       */
      Cleanup() {

         this.RemoveDrawG();

         let keep_origin = true;

         if (this.is_main_painter()) {
            let pp = this.pad_painter();
            if (!pp || pp.normal_canvas === false) keep_origin = false;
         }

         // cleanup all existing references
         this.pad_name = "";
         this.main = null;
         this.draw_object = null;
         delete this.snapid;

         // remove attributes objects (if any)
         delete this.fillatt;
         delete this.lineatt;
         delete this.markeratt;
         delete this.bins;
         delete this.root_colors;
         delete this.options;
         delete this.options_store;

         // remove extra fields from v7 painters
         delete this.rstyle;
         delete this.csstype;

         super.Cleanup(keep_origin);
      }

      /** @summary Returns drawn object */
      GetObject() { return this.draw_object; }

      /** @summary Returns drawn object class name */
      GetClassName() { return (this.draw_object ? this.draw_object._typename : "") || ""; }

      /** @summary Checks if drawn object matches with provided typename
       *
       * @param {string} arg - typename
       * @param {string} arg._typename - if arg is object, use its typename
       */
      MatchObjectType(arg) {
         if (!arg || !this.draw_object) return false;
         if (typeof arg === 'string') return (this.draw_object._typename === arg);
         if (arg._typename) return (this.draw_object._typename === arg._typename);
         return this.draw_object._typename.match(arg);
      }

      /** @summary Changes item name.
       *
       * @desc When available, used for svg:title proprty
       * @private */
      SetItemName(name, opt, hpainter) {
         super.SetItemName(name, opt, hpainter);
         if (this.no_default_title || (name == "")) return;
         let can = this.svg_canvas();
         if (!can.empty()) can.select("title").text(name);
                      else this.select_main().attr("title", name);
      }

      /** @summary Store actual options together with original string
       * @private */
      OptionsStore(original) {
         if (!this.options) return;
         if (!original) original = "";
         let pp = original.indexOf(";;");
         if (pp >= 0) original = original.substr(0, pp);
         this.options.original = original;
         this.options_store = JSROOT.extend({}, this.options);
      }

      /** @summary Checks if any draw options were changed
       *
       * @private
       */
      OptionesChanged() {
         if (!this.options) return false;
         if (!this.options_store) return true;

         for (let k in this.options)
            if (this.options[k] !== this.options_store[k]) return true;

         return false;
      }

      /** @summary Return actual draw options as string
       * @private
       */
      OptionsAsString() {
         if (!this.options) return "";

         if (!this.OptionesChanged())
            return this.options.original || "";

         if (typeof this.options.asString == "function")
            return this.options.asString();

         return this.options.original || ""; // nothing better, return original draw option
      }

      /** @summary Generic method to update object content.
       *
       * @desc Just copy all members from source object
       * @param {object} obj - object with new data
       */
      UpdateObject(obj) {
         if (!this.MatchObjectType(obj)) return false;
         JSROOT.extend(this.GetObject(), obj);
         return true;
      }

      /** @summary Returns string which either item or object name.
       *
       * @desc Such string can be used as tooltip. If result string larger than 20 symbols, it will be cutted.
       * @private
       */
      GetTipName(append) {
         let res = this.GetItemName(), obj = this.GetObject();
         if (!res) res = obj && obj.fName ? obj.fName : "";
         if (res.lenght > 20) res = res.substr(0, 17) + "...";
         if (res && append) res += append;
         return res;
      }

      /** @summary returns pad painter for specified pad
       * @private */
      pad_painter(pad_name) {
         let elem = this.svg_pad(typeof pad_name == "string" ? pad_name : undefined);
         return elem.empty() ? null : elem.property('pad_painter');
      }

      /** @summary returns canvas painter
       * @private */
      canv_painter() {
         let elem = this.svg_canvas();
         return elem.empty() ? null : elem.property('pad_painter');
      }

      /** @summary returns color from current list of colors
       * @private */
      get_color(indx) {
         let jsarr = this.root_colors;

         if (!jsarr) {
            let pp = this.canv_painter();
            jsarr = this.root_colors = (pp && pp.root_colors) ? pp.root_colors : JSROOT.Painter.root_colors;
         }

         return jsarr[indx];
      }

      /** @summary add color to list of colors
       * @private */
      add_color(color) {
         let jsarr = this.root_colors;
         if (!jsarr) {
            let pp = this.canv_painter();
            jsarr = this.root_colors = (pp && pp.root_colors) ? pp.root_colors : JSROOT.Painter.root_colors;
         }
         let indx = jsarr.indexOf(color);
         if (indx >= 0) return indx;
         jsarr.push(color);
         return jsarr.length - 1;
      }

      /** @summary returns tooltip allowed flag. Check canvas painter
       * @private */
      IsTooltipAllowed() {
         let src = this.canv_painter() || this;
         return src.tooltip_allowed ? true : false;
      }

      /** @summary returns tooltip allowed flag
       * @private */
      SetTooltipAllowed(on) {
         let src = this.canv_painter() || this;
         src.tooltip_allowed = (on == "toggle") ? !src.tooltip_allowed : on;
      }

      /** @summary returns custom palette for the object. If forced, will be created
       * @private */
      get_palette(force, palettedid) {
         if (!palettedid) {
            let pp = this.pad_painter();
            if (!pp) return null;
            if (pp.custom_palette) return pp.custom_palette;
         }

         let cp = this.canv_painter();
         if (!cp) return null;
         if (cp.custom_palette && !palettedid) return cp.custom_palette;

         if (force && JSROOT.Painter.GetColorPalette)
            cp.custom_palette = JSROOT.Painter.GetColorPalette(palettedid);

         return cp.custom_palette;
      }

      /** @summary Method called when interactively changes attribute in given class
       * @abstract
       * @private */
      AttributeChange(/* class_name, member_name, new_value */) {
         // only for objects in web canvas make sense to handle attributes changes from GED
         // console.log("Changed attribute class = " + class_name + " member = " + member_name + " value = " + new_value);
      }

      /** @summary Checks if draw elements were resized and drawing should be updated.
       *
       * @desc Redirects to {@link TPadPainter.CheckCanvasResize}
       * @private */
      CheckResize(arg) {
         let p = this.canv_painter();
         if (!p) return false;

         // only canvas should be checked
         p.CheckCanvasResize(arg);
         return true;
      }

      /** @summary removes <g> element with object drawing
       * @desc generic method to delete all graphical elements, associated with painter */
      RemoveDrawG() {
         if (this.draw_g) {
            this.draw_g.remove();
            this.draw_g = null;
         }
      }

      /** @summary (re)creates svg:g element for object drawings
       *
       * @desc either one attach svg:g to pad list of primitives (default)
       * or svg:g element created in specified frame layer (default main_layer)
       * @param {string} [frame_layer=undefined] - when specified, <g> element will be created inside frame layer, otherwise in pad primitives list
       */
      CreateG(frame_layer) {
         if (this.draw_g) {
            // one should keep svg:g element on its place
            // d3.selectAll(this.draw_g.node().childNodes).remove();
            this.draw_g.selectAll('*').remove();
         } else if (frame_layer) {
            let frame = this.svg_frame();
            if (frame.empty()) return frame;
            if (typeof frame_layer != 'string') frame_layer = "main_layer";
            let layer = frame.select("." + frame_layer);
            if (layer.empty()) layer = frame.select(".main_layer");
            this.draw_g = layer.append("svg:g");
         } else {
            let layer = this.svg_layer("primitives_layer");
            this.draw_g = layer.append("svg:g");

            // layer.selectAll(".most_upper_primitives").raise();
            let up = [], chlds = layer.node().childNodes;
            for (let n = 0; n < chlds.length; ++n)
               if (d3.select(chlds[n]).classed("most_upper_primitives")) up.push(chlds[n]);

            up.forEach(function(top) { d3.select(top).raise(); });
         }

         // set attributes for debugging
         if (this.draw_object) {
            this.draw_g.attr('objname', encodeURI(this.draw_object.fName || "name"));
            this.draw_g.attr('objtype', encodeURI(this.draw_object._typename || "type"));
         }

         this.draw_g.property('in_frame', !!frame_layer); // indicates coordinate system

         return this.draw_g;
      }

      /** @summary This is main graphical SVG element, where all drawings are performed
       * @private */
      svg_canvas() { return this.select_main().select(".root_canvas"); }

      /** @summary This is SVG element, correspondent to current pad
       * @private */
      svg_pad(pad_name) {
         if (pad_name === undefined) pad_name = this.pad_name;

         let c = this.svg_canvas();
         if (!pad_name || c.empty()) return c;

         let cp = c.property('pad_painter');
         if (cp && cp.pads_cache && cp.pads_cache[pad_name])
            return d3.select(cp.pads_cache[pad_name]);

         c = c.select(".primitives_layer .__root_pad_" + pad_name);
         if (cp) {
            if (!cp.pads_cache) cp.pads_cache = {};
            cp.pads_cache[pad_name] = c.node();
         }
         return c;
      }

      /** @summary Method selects immediate layer under canvas/pad main element
       * @private */
      svg_layer(name, pad_name) {
         let svg = this.svg_pad(pad_name);
         if (svg.empty()) return svg;

         if (name.indexOf("prim#") == 0) {
            svg = svg.select(".primitives_layer");
            name = name.substr(5);
         }

         let node = svg.node().firstChild;
         while (node !== null) {
            let elem = d3.select(node);
            if (elem.classed(name)) return elem;
            node = node.nextSibling;
         }

         return d3.select(null);
      }

      /** @summary Method returns current pad name
       * @param {string} [new_name = undefined] - when specified, new current pad name will be configured
       * @private */
      CurrentPadName(new_name) {
         let svg = this.svg_canvas();
         if (svg.empty()) return "";
         let curr = svg.property('current_pad');
         if (new_name !== undefined) svg.property('current_pad', new_name);
         return curr;
      }

      /** @summary Returns ROOT TPad object
       * @private */
      root_pad() {
         let pad_painter = this.pad_painter();
         return pad_painter ? pad_painter.pad : null;
      }

      /** @summary Converts x or y coordinate into SVG pad coordinates.
       *
       *  @param {string} axis - name like "x" or "y"
       *  @param {number} value - axis value to convert.
       *  @param {boolean} ndc - is value in NDC coordinates
       *  @param {boolean} noround - skip rounding
       *  @returns {number} value of requested coordiantes, rounded if kind.noround not specified
       *  @private
       */
      AxisToSvg(axis, value, ndc, noround) {
         let use_frame = this.draw_g && this.draw_g.property('in_frame'),
            main = use_frame ? this.frame_painter() : null;

         if (use_frame && main && main["gr" + axis]) {
            value = (axis == "y") ? main.gry(value) + (use_frame ? 0 : main.frame_y())
               : main.grx(value) + (use_frame ? 0 : main.frame_x());
         } else if (use_frame) {
            value = 0; // in principal error, while frame calculation requested
         } else {
            let pad = ndc ? null : this.root_pad();
            if (pad) {
               if (axis == "y") {
                  if (pad.fLogy)
                     value = (value > 0) ? JSROOT.log10(value) : pad.fUymin;
                  value = (value - pad.fY1) / (pad.fY2 - pad.fY1);
               } else {
                  if (pad.fLogx)
                     value = (value > 0) ? JSROOT.log10(value) : pad.fUxmin;
                  value = (value - pad.fX1) / (pad.fX2 - pad.fX1);
               }
            }
            value = (axis == "y") ? (1 - value) * this.pad_height() : value * this.pad_width();
         }

         return noround ? value : Math.round(value);
      }

      /** @summary Converts pad SVG x or y coordinates into axis values.
      *
      *  @param {string} axis - name like "x" or "y"
      *  @param {number} coord - graphics coordiante.
      *  @param {boolean} ndc - kind of return value
      *  @returns {number} value of requested coordiantes
      *  @private
      */

      SvgToAxis(axis, coord, ndc) {
         let use_frame = this.draw_g && this.draw_g.property('in_frame'),
            main = use_frame ? this.frame_painter() : null;

         if (use_frame) main = this.frame_painter();

         if (use_frame && main) {
            return (axis == "y") ? main.RevertY(coord - (use_frame ? 0 : main.frame_y()))
               : main.RevertX(coord - (use_frame ? 0 : main.frame_x()));
         } else if (use_frame) {
            return 0; // in principal error, while frame calculation requested
         }

         let value = (axis == "y") ? (1 - coord / this.pad_height()) : coord / this.pad_width();
         let pad = ndc ? null : this.root_pad();

         if (pad) {
            if (axis == "y") {
               value = pad.fY1 + value * (pad.fY2 - pad.fY1);
               if (pad.fLogy) value = Math.pow(10, value);
            } else {
               value = pad.fX1 + value * (pad.fX2 - pad.fX1);
               if (pad.fLogx) value = Math.pow(10, value);
            }
         }

         return value;
      }

      /** @summary Return functor, which can convert x and y coordinates into pixels, used for drawing
       *
       * Produce functor can convert x and y value by calling func.x(x) and func.y(y)
       *  @param {boolean} isndc - if NDC coordinates will be used
       *  @private
       */
      AxisToSvgFunc(isndc) {
         let func = { isndc: isndc }, use_frame = this.draw_g && this.draw_g.property('in_frame');
         if (use_frame) func.main = this.frame_painter();
         if (func.main && !isndc && func.main.grx && func.main.gry) {
            func.offx = func.main.frame_x();
            func.offy = func.main.frame_y();
            func.x = function(x) { return Math.round(this.main.grx(x) + this.offx); }
            func.y = function(y) { return Math.round(this.main.gry(y) + this.offy); }
         } else {
            if (!isndc) func.pad = this.root_pad(); // need for NDC conversion
            func.padh = this.pad_height();
            func.padw = this.pad_width();
            func.x = function(value) {
               if (this.pad) {
                  if (this.pad.fLogx)
                     value = (value > 0) ? JSROOT.log10(value) : this.pad.fUxmin;
                  value = (value - this.pad.fX1) / (this.pad.fX2 - this.pad.fX1);
               }
               return Math.round(value * this.padw);
            }
            func.y = function(value) {
               if (this.pad) {
                  if (this.pad.fLogy)
                     value = (value > 0) ? JSROOT.log10(value) : this.pad.fUymin;
                  value = (value - this.pad.fY1) / (this.pad.fY2 - this.pad.fY1);
               }
               return Math.round((1 - value) * this.padh);
            }
         }
         return func;
      }

      /** @summary Returns svg element for the frame.
       *
       * @param {string} [pad_name = undefined] - optional pad name, otherwise where object painter is drawn
       * @private */
      svg_frame(pad_name) { return this.svg_layer("primitives_layer", pad_name).select(".root_frame"); }

      /** @summary Returns pad width.
       *
       * @param {string} [pad_name = undefined] - optional pad name, otherwise where object painter is drawn
       * @private
       */
      pad_width(pad_name) {
         let res = this.svg_pad(pad_name);
         res = res.empty() ? 0 : res.property("draw_width");
         return isNaN(res) ? 0 : res;
      }

      /** @summary Returns pad height
       *
       * @param {string} [pad_name = undefined] - optional pad name, otherwise where object painter is drawn
       * @private
       */
      pad_height(pad_name) {
         let res = this.svg_pad(pad_name);
         res = res.empty() ? 0 : res.property("draw_height");
         return isNaN(res) ? 0 : res;
      }

      /** @summary Returns frame painter in current pad
       * @private */
      frame_painter() {
         let pp = this.pad_painter();
         return pp ? pp.frame_painter_ref : null;
      }

      /** @summary Returns property of the frame painter
       * @private */
      frame_property(name) {
         let pp = this.frame_painter();
         return pp && pp[name] ? pp[name] : 0;
      }

      /** @summary Returns frame X coordinate relative to current pad */
      frame_x() { return this.frame_property("_frame_x"); }

      /** @summary Returns frame Y coordinate relative to current pad */
      frame_y() { return this.frame_property("_frame_y"); }

      /** @summary Returns frame width */
      frame_width() { return this.frame_property("_frame_width"); }

      /** @summary Returns frame height */
      frame_height() { return this.frame_property("_frame_height"); }

      /** @summary Returns embed mode for 3D drawings (three.js) inside SVG.
       *
       *    0  -  no embedding, 3D drawing take full size of canvas
       *    1  -  no embedding, canvas placed over svg with proper size (resize problem may appear)
       *    2  -  embedding via ForeginObject, works only with Firefox
       *    3  -  embedding as SVG element (image or svg)
       *
       *  @private
       */
      embed_3d(render3d) {
         render3d = JSROOT.Painter.GetRender3DKind(render3d);

         // all non-webgl elements can be embedded into SVG as is
         if (render3d !== JSROOT.constants.Render3D.WebGL)
            return JSROOT.constants.Embed3D.EmbedSVG;

         if (JSROOT.settings.Embed3D != JSROOT.constants.Embed3D.Default)
            return JSROOT.settings.Embed3D;

         if (JSROOT.browser.isFirefox)
            return JSROOT.constants.Embed3D.Embed;

         return JSROOT.constants.Embed3D.Overlay;
      }

      /** @summary Access current 3d mode
       *
       * @param {string} [new_value = undefined] - when specified, set new 3d mode
       * @private
       */
      access_3d_kind(new_value) {
         let svg = this.svg_pad(this.this_pad_name);
         if (svg.empty()) return -1;

         // returns kind of currently created 3d canvas
         let kind = svg.property('can3d');
         if (new_value !== undefined) svg.property('can3d', new_value);
         return ((kind === null) || (kind === undefined)) ? -1 : kind;
      }

      /** @summary Returns size which availble for 3D drawing.
       *
       * @desc One uses frame sizes for the 3D drawing - like TH2/TH3 objects
       * @private
       */
      size_for_3d(can3d, render3d) {

         if (can3d === undefined) can3d = this.embed_3d(render3d);

         let pad = this.svg_pad(this.this_pad_name),
            clname = "draw3d_" + (this.this_pad_name || this.pad_name || 'canvas');

         if (pad.empty()) {
            // this is a case when object drawn without canvas

            let rect = this.get_visible_rect(this.select_main());

            if ((rect.height < 10) && (rect.width > 10)) {
               rect.height = Math.round(0.66 * rect.width);
               this.select_main().style('height', rect.height + "px");
            }
            rect.x = 0; rect.y = 0; rect.clname = clname; rect.can3d = -1;
            return rect;
         }

         let elem = pad, fp = this.frame_painter();
         if (can3d === 0) elem = this.svg_canvas();

         let size = { x: 0, y: 0, width: 100, height: 100, clname: clname, can3d: can3d };

         if (fp && !fp.mode3d) {
            elem = this.svg_frame();
            size.x = elem.property("draw_x");
            size.y = elem.property("draw_y");
         }

         size.width = elem.property("draw_width");
         size.height = elem.property("draw_height");

         if ((!fp || fp.mode3d) && (can3d > 0)) {
            size.x = Math.round(size.x + size.width * JSROOT.gStyle.fPadLeftMargin);
            size.y = Math.round(size.y + size.height * JSROOT.gStyle.fPadTopMargin);
            size.width = Math.round(size.width * (1 - JSROOT.gStyle.fPadLeftMargin - JSROOT.gStyle.fPadRightMargin));
            size.height = Math.round(size.height * (1 - JSROOT.gStyle.fPadTopMargin - JSROOT.gStyle.fPadBottomMargin));
         }

         let pw = this.pad_width(this.this_pad_name), x2 = pw - size.x - size.width,
            ph = this.pad_height(this.this_pad_name), y2 = ph - size.y - size.height;

         if ((x2 >= 0) && (y2 >= 0)) {
            // while 3D canvas uses area also for the axis labels, extend area relative to normal frame
            size.x = Math.round(size.x * 0.3);
            size.y = Math.round(size.y * 0.9);
            size.width = pw - size.x - Math.round(x2 * 0.3);
            size.height = ph - size.y - Math.round(y2 * 0.5);
         }

         if (can3d === 1)
            this.CalcAbsolutePosition(this.svg_pad(this.this_pad_name), size);

         return size;
      }

      /** @summary Clear all 3D drawings
       * @returns can3d value - how webgl canvas was placed
       * @private */
      clear_3d_canvas() {
         let can3d = this.access_3d_kind(null);
         if (can3d < 0) {
            // remove first child from main element - if it is canvas
            let main = this.select_main().node();
            if (main && main.firstChild && main.firstChild.$jsroot) {
               delete main.firstChild.painter;
               main.removeChild(main.firstChild);
            }
            return can3d;
         }

         let size = this.size_for_3d(can3d);

         if (size.can3d === 0) {
            d3.select(this.svg_canvas().node().nextSibling).remove(); // remove html5 canvas
            this.svg_canvas().style('display', null); // show SVG canvas
         } else {
            if (this.svg_pad(this.this_pad_name).empty()) return;

            this.apply_3d_size(size).remove();

            this.svg_frame().style('display', null);  // clear display property
         }
         return can3d;
      }

      /** @summary Add 3D canvas
       * @private */
      add_3d_canvas(size, canv, webgl) {

         if (!canv || (size.can3d < -1)) return;

         if (size.can3d === -1) {
            // case when 3D object drawn without canvas

            let main = this.select_main().node();
            if (main !== null) {
               main.appendChild(canv);
               canv.painter = this;
               canv.$jsroot = true; // mark canvas as added by jsroot
            }

            return;
         }

         if ((size.can3d > 0) && !webgl)
            size.can3d = JSROOT.constants.Embed3D.EmbedSVG;

         this.access_3d_kind(size.can3d);

         if (size.can3d === 0) {
            this.svg_canvas().style('display', 'none'); // hide SVG canvas

            this.svg_canvas().node().parentNode.appendChild(canv); // add directly
         } else {
            if (this.svg_pad(this.this_pad_name).empty()) return;

            // first hide normal frame
            this.svg_frame().style('display', 'none');

            let elem = this.apply_3d_size(size);

            elem.attr('title', '').node().appendChild(canv);
         }
      }

      /** @summary Apply size to 3D elements
       * @private */
      apply_3d_size(size, onlyget) {

         if (size.can3d < 0) return d3.select(null);

         let elem;

         if (size.can3d > 1) {

            elem = this.svg_layer(size.clname);

            // elem = layer.select("." + size.clname);
            if (onlyget) return elem;

            let svg = this.svg_pad();

            if (size.can3d === JSROOT.constants.Embed3D.EmbedSVG) {
               // this is SVG mode or image mode - just create group to hold element

               if (elem.empty())
                  elem = svg.insert("g", ".primitives_layer").attr("class", size.clname);

               elem.attr("transform", "translate(" + size.x + "," + size.y + ")");

            } else {

               if (elem.empty())
                  elem = svg.insert("foreignObject", ".primitives_layer").attr("class", size.clname);

               elem.attr('x', size.x)
                  .attr('y', size.y)
                  .attr('width', size.width)
                  .attr('height', size.height)
                  .attr('viewBox', "0 0 " + size.width + " " + size.height)
                  .attr('preserveAspectRatio', 'xMidYMid');
            }

         } else {
            let prnt = this.svg_canvas().node().parentNode;

            elem = d3.select(prnt).select("." + size.clname);
            if (onlyget) return elem;

            // force redraw by resize
            this.svg_canvas().property('redraw_by_resize', true);

            if (elem.empty())
               elem = d3.select(prnt).append('div').attr("class", size.clname + " jsroot_noselect");

            // our position inside canvas, but to set 'absolute' position we should use
            // canvas element offset relative to first parent with non-static position
            // now try to use getBoundingClientRect - it should be more precise

            let pos0 = prnt.getBoundingClientRect();

            while (prnt) {
               if (prnt === document) { prnt = null; break; }
               try {
                  if (getComputedStyle(prnt).position !== 'static') break;
               } catch (err) {
                  break;
               }
               prnt = prnt.parentNode;
            }

            let pos1 = prnt ? prnt.getBoundingClientRect() : { top: 0, left: 0 };

            let offx = Math.round(pos0.left - pos1.left),
               offy = Math.round(pos0.top - pos1.top);

            elem.style('position', 'absolute').style('left', (size.x + offx) + 'px').style('top', (size.y + offy) + 'px').style('width', size.width + 'px').style('height', size.height + 'px');
         }

         return elem;
      }

      /** @summary Returns main object painter on the pad.
       *
       * @desc Normally this is first histogram drawn on the pad, which also draws all axes
       * @param {boolean} [not_store = undefined] - if true, prevent temporary store of main painter reference
       * @param {string} [pad_name = undefined] - when specified, returns main painter from specified pad */
      main_painter(not_store, pad_name) {
         let res = this.main;
         if (!res) {
            let svg_p = this.svg_pad(pad_name);
            if (svg_p.empty()) {
               res = this.AccessTopPainter();
            } else {
               res = svg_p.property('mainpainter');
            }
            if (!res) res = null;
            if (!not_store) this.main = res;
         }
         return res;
      }

      /** @summary Returns true if this is main painter */
      is_main_painter() { return this === this.main_painter(); }

      /** @summary Assigns id of top element (normally div where drawing is done).
       *
       * @desc In some situations canvas may not exists - for instance object drawn as html, not as svg.
       * In such case the only painter will be assigned to the first element
       *
       * Following value of is_main parameter is allowed:
       *    -1 - only assign id, this painter not add to painters list,
       *     0 - normal painter (default),
       *     1 - major objects like TH1/TH2 (required canvas with frame)
       *     2 - if canvas missing, create it, but not set as main object
       *     3 - if canvas and (or) frame missing, create them, but not set as main object
       *     4 - major objects like TH3 (required canvas and frame in 3d mode)
       *     5 - major objects like TGeoVolume (do not require canvas)
       *
       *  @param {string|object} divid - id of div element or directly DOMElement
       *  @param {number} [kind = 0] - kind of object drawn with painter
       *  @param {string} [pad_name = undefined] - when specified, subpad name used for object drawin
       */
      SetDivId(divid, is_main, pad_name) {

         if (divid !== undefined) {
            this.divid = divid;
            delete this._selected_main;
         }

         if (!is_main || isNaN(is_main)) is_main = 0;

         // check if element really exists
         if ((is_main >= 0) && this.select_main(true).empty()) {
            if (typeof divid == 'string') console.error('not found HTML element with id: ' + divid);
            else console.error('specified HTML element can not be selected with d3.select()');
            return false;
         }

         this.create_canvas = false;

         // SVG element where canvas is drawn
         let svg_c = this.svg_canvas();

         if (svg_c.empty() && (is_main > 0) && (is_main !== 5)) {
            if (typeof JSROOT.Painter.drawCanvas == 'function')
                JSROOT.Painter.drawCanvas(divid, null, ((is_main == 2) || (is_main == 4)) ? "noframe" : "");
            else
                return alert("Fail to draw TCanvas - please contact JSROOT developers");
            svg_c = this.svg_canvas();
            this.create_canvas = true;
         }

         if (svg_c.empty()) {
            if ((is_main < 0) || (is_main === 5) || this.iscan) return true;
            this.AccessTopPainter(true);
            return true;
         }

         // SVG element where current pad is drawn (can be canvas itself)
         this.pad_name = pad_name;
         if (this.pad_name === undefined)
            this.pad_name = this.CurrentPadName();

         if (is_main < 0) return true;

         // create TFrame element if not exists
         if (this.svg_frame().select(".main_layer").empty() && ((is_main == 1) || (is_main == 3) || (is_main == 4))) {
            if (typeof JSROOT.Painter.drawFrame == 'function')
               JSROOT.Painter.drawFrame(divid, null, (is_main == 4) ? "3d" : "");
            if ((is_main != 4) && this.svg_frame().empty()) return alert("Fail to draw dummy TFrame");
         }

         let svg_p = this.svg_pad();
         if (svg_p.empty()) return true;

         let pp = svg_p.property('pad_painter');
         if (pp && (pp !== this)) {
            pp.painters.push(this);
            // workround to provide style for next object draing
            if (!this.rstyle && pp.next_rstyle)
               this.rstyle = pp.next_rstyle;
         }

         if (((is_main === 1) || (is_main === 4) || (is_main === 5)) && !svg_p.property('mainpainter'))
            // when this is first main painter in the pad
            svg_p.property('mainpainter', this);

         return true;
      }

      /** @summary Calculate absolute position of provided selection.
       * @private */
      CalcAbsolutePosition(sel, pos) {
         while (!sel.empty() && !sel.classed('root_canvas') && pos) {
            let cl = sel.attr("class");
            if (cl && ((cl.indexOf("root_frame") >= 0) || (cl.indexOf("__root_pad_") >= 0))) {
               pos.x += sel.property("draw_x") || 0;
               pos.y += sel.property("draw_y") || 0;
            }
            sel = d3.select(sel.node().parentNode);
         }
         return pos;
      }

      /** @summary Creates marker attributes object.
       *
       * @desc Can be used to produce markers in painter.
       * See {@link JSROOT.TAttMarkerHandler} for more info.
       * Instance assigned as this.markeratt data member, recognized by GED editor
       * @param {object} args - either TAttMarker or see arguments of {@link JSROOT.TAttMarkerHandler}
       * @returns created handler
       */
      createAttMarker(args) {
         if (!args || (typeof args !== 'object')) args = { std: true }; else
            if (args.fMarkerColor !== undefined && args.fMarkerStyle !== undefined && args.fMarkerSize !== undefined) args = { attr: args, std: false };

         if (args.std === undefined) args.std = true;

         let handler = args.std ? this.markeratt : null;

         if (!handler) handler = new TAttMarkerHandler(args);
         else if (!handler.changed || args.force) handler.SetArgs(args);

         if (args.std) this.markeratt = handler;

         // handler.used = false; // mark that line handler is not yet used
         return handler;
      }


      /** @summary Creates line attributes object.
      *
      * @desc Can be used to produce lines in painter.
      * See {@link JSROOT.TAttLineHandler} for more info.
      * Instance assigned as this.lineatt data member, recognized by GED editor
      * @param {object} args - either TAttLine or see constructor arguments of {@link JSROOT.TAttLineHandler}
      */
      createAttLine(args) {
         if (!args || (typeof args !== 'object')) args = { std: true }; else
            if (args.fLineColor !== undefined && args.fLineStyle !== undefined && args.fLineWidth !== undefined) args = { attr: args, std: false };

         if (args.std === undefined) args.std = true;

         let handler = args.std ? this.lineatt : null;

         if (!handler) handler = new TAttLineHandler(args);
         else if (!handler.changed || args.force) handler.SetArgs(args);

         if (args.std) this.lineatt = handler;

         // handler.used = false; // mark that line handler is not yet used
         return handler;
      }

      /** @summary Creates fill attributes object.
       *
       * @desc Method dedicated to create fill attributes, bound to canvas SVG
       * otherwise newly created patters will not be usable in the canvas
       * See {@link JSROOT.TAttFillHandler} for more info.
       * Instance assigned as this.fillatt data member, recognized by GED editor

       * @param {object} args - for special cases one can specify TAttFill as args or number of parameters
       * @param {boolean} [args.std = true] - this is standard fill attribute for object and should be used as this.fillatt
       * @param {object} [args.attr = null] - object, derived from TAttFill
       * @param {number} [args.pattern = undefined] - integer index of fill pattern
       * @param {number} [args.color = undefined] - integer index of fill color
       * @param {string} [args.color_as_svg = undefined] - color will be specified as SVG string, not as index from color palette
       * @param {number} [args.kind = undefined] - some special kind which is handled differently from normal patterns
       * @returns created handle
      */
      createAttFill(args) {
         if (!args || (typeof args !== 'object')) args = { std: true }; else
            if (args._typename && args.fFillColor !== undefined && args.fFillStyle !== undefined) args = { attr: args, std: false };

         if (args.std === undefined) args.std = true;

         let handler = args.std ? this.fillatt : null;

         if (!args.svg) args.svg = this.svg_canvas();

         if (!handler) handler = new TAttFillHandler(args);
         else if (!handler.changed || args.force) handler.SetArgs(args);

         if (args.std) this.fillatt = handler;

         // handler.used = false; // mark that fill handler is not yet used

         return handler;
      }

      /** @summary call function for each painter in the pad
       * @private */
      ForEachPainter(userfunc, kind) {
         // Iterate over all known painters

         // special case of the painter set as pointer of first child of main element
         let painter = this.AccessTopPainter();
         if (painter) {
            if (kind !== "pads") userfunc(painter);
            return;
         }

         // iterate over all painters from pad list
         let pp = this.pad_painter();
         if (pp) pp.ForEachPainterInPad(userfunc, kind);
      }

      /** @summary indicate that redraw was invoked via interactive action (like context menu or zooming)
       * @desc Use to catch such action by GED and by server-side
       * @private */
      InteractiveRedraw(arg, info, subelem) {

         let reason;
         if ((typeof info == "string") && (info.indexOf("exec:") != 0)) reason = info;

         if (arg == "pad") {
            this.RedrawPad(reason);
         } else if (arg == "axes") {
            let main = this.main_painter(true, this.this_pad_name); // works for pad and any object drawn in the pad
            if (main && (typeof main.DrawAxes == 'function'))
               main.DrawAxes();
            else
               this.RedrawPad(reason);
         } else if (arg !== false) {
            this.Redraw(reason);
         }

         // inform GED that something changes
         let pp = this.pad_painter();
         if (pp && (typeof pp.InteractiveObjectRedraw == 'function'))
            pp.InteractiveObjectRedraw(this);

         // inform server that drawopt changes
         let canp = this.canv_painter();
         if (canp && (typeof canp.ProcessChanges == 'function'))
            canp.ProcessChanges(info, this, subelem);
      }

      /** @summary Redraw all objects in correspondent pad */
      RedrawPad(reason) {
         let pad_painter = this.pad_painter();
         if (pad_painter) pad_painter.Redraw(reason);
      }

      /** @summary Switch tooltip mode in frame painter
       * @private */
      SwitchTooltip(on) {
         let fp = this.frame_painter();
         if (fp) {
            fp.SetTooltipEnabled(on);
            fp.ProcessTooltipEvent(null);
         }
         // this is 3D control object
         if (this.control && (typeof this.control.SwitchTooltip == 'function'))
            this.control.SwitchTooltip(on);
      }

      /** @summary Add move handlers for drawn element @private */
      AddMove() {

         if (!JSROOT.gStyle.MoveResize || JSROOT.BatchMode ||
            !this.draw_g || this.draw_g.property("assigned_move")) return;

         function detectRightButton(event) {
            if ('buttons' in event) return event.buttons === 2;
            else if ('which' in event) return event.which === 3;
            else if ('button' in event) return event.button === 2;
            return false;
         }

         let drag_move = d3.drag().subject(Object),
            not_changed = true;

         drag_move
            .on("start", function(evnt) {
               if (detectRightButton(evnt.sourceEvent)) return;
               evnt.sourceEvent.preventDefault();
               evnt.sourceEvent.stopPropagation();
               let pos = d3.pointer(evnt, this.draw_g.node());
               not_changed = true;
               if (this.moveStart)
                  this.moveStart(pos[0], pos[1]);
            }.bind(this)).on("drag", function(evnt) {
               evnt.sourceEvent.preventDefault();
               evnt.sourceEvent.stopPropagation();
               not_changed = false;
               if (this.moveDrag)
                  this.moveDrag(evnt.dx, evnt.dy);
            }.bind(this)).on("end", function(evnt) {
               evnt.sourceEvent.preventDefault();
               evnt.sourceEvent.stopPropagation();
               if (this.moveEnd)
                  this.moveEnd(not_changed);
               let cp = this.canv_painter();
               if (cp) cp.SelectObjectPainter(this);
            }.bind(this));

         this.draw_g
            .style("cursor", "move")
            .property("assigned_move", true)
            .call(drag_move);
      }

      /** @summary Add drag for interactive rectangular elements
       * @private */
      AddDrag(callback) {
         if (!JSROOT.gStyle.MoveResize || JSROOT.BatchMode) return;

         let pthis = this, drag_rect = null, pp = this.pad_painter();
         if (pp && pp._fast_drawing) return;

         function detectRightButton(event) {
            if ('buttons' in event) return event.buttons === 2;
            else if ('which' in event) return event.which === 3;
            else if ('button' in event) return event.button === 2;
            return false;
         }

         function rect_width() { return Number(pthis.draw_g.attr("width")); }
         function rect_height() { return Number(pthis.draw_g.attr("height")); }

         function MakeResizeElements(group, width, height, handler) {
            function make(cursor, d) {
               let clname = "js_" + cursor.replace('-', '_'),
                  elem = group.select('.' + clname);
               if (elem.empty()) elem = group.append('path').classed(clname, true);
               elem.style('opacity', 0).style('cursor', cursor).attr('d', d);
               if (handler) elem.call(handler);
            }

            make("nw-resize", "M2,2h15v-5h-20v20h5Z");
            make("ne-resize", "M" + (width - 2) + ",2h-15v-5h20v20h-5 Z");
            make("sw-resize", "M2," + (height - 2) + "h15v5h-20v-20h5Z");
            make("se-resize", "M" + (width - 2) + "," + (height - 2) + "h-15v5h20v-20h-5Z");

            if (!callback.no_change_x) {
               make("w-resize", "M-3,18h5v" + Math.max(0, height - 2 * 18) + "h-5Z");
               make("e-resize", "M" + (width + 3) + ",18h-5v" + Math.max(0, height - 2 * 18) + "h5Z");
            }
            if (!callback.no_change_y) {
               make("n-resize", "M18,-3v5h" + Math.max(0, width - 2 * 18) + "v-5Z");
               make("s-resize", "M18," + (height + 3) + "v-5h" + Math.max(0, width - 2 * 18) + "v5Z");
            }
         }

         function complete_drag() {
            drag_rect.style("cursor", "auto");

            if (!pthis.draw_g) {
               drag_rect.remove();
               drag_rect = null;
               return false;
            }

            let oldx = Number(pthis.draw_g.attr("x")),
               oldy = Number(pthis.draw_g.attr("y")),
               newx = Number(drag_rect.attr("x")),
               newy = Number(drag_rect.attr("y")),
               newwidth = Number(drag_rect.attr("width")),
               newheight = Number(drag_rect.attr("height"));

            if (callback.minwidth && newwidth < callback.minwidth) newwidth = callback.minwidth;
            if (callback.minheight && newheight < callback.minheight) newheight = callback.minheight;

            let change_size = (newwidth !== rect_width()) || (newheight !== rect_height()),
               change_pos = (newx !== oldx) || (newy !== oldy);

            pthis.draw_g.attr('x', newx).attr('y', newy)
               .attr("transform", "translate(" + newx + "," + newy + ")")
               .attr('width', newwidth).attr('height', newheight);

            drag_rect.remove();
            drag_rect = null;

            pthis.SwitchTooltip(true);

            MakeResizeElements(pthis.draw_g, newwidth, newheight);

            if (change_size || change_pos) {
               if (change_size && ('resize' in callback)) callback.resize(newwidth, newheight);
               if (change_pos && ('move' in callback)) callback.move(newx, newy, newx - oldxx, newy - oldy);

               if (change_size || change_pos) {
                  if ('obj' in callback) {
                     callback.obj.fX1NDC = newx / pthis.pad_width();
                     callback.obj.fX2NDC = (newx + newwidth) / pthis.pad_width();
                     callback.obj.fY1NDC = 1 - (newy + newheight) / pthis.pad_height();
                     callback.obj.fY2NDC = 1 - newy / pthis.pad_height();
                     callback.obj.modified_NDC = true; // indicate that NDC was interactively changed, block in updated
                  }
                  if ('redraw' in callback) callback.redraw();
               }
            }

            return change_size || change_pos;
         }

         let drag_move = d3.drag().subject(Object),
            drag_resize = d3.drag().subject(Object);

         drag_move
            .on("start", function(evnt) {
               if (detectRightButton(evnt.sourceEvent)) return;

               JSROOT.Painter.closeMenu(); // close menu

               pthis.SwitchTooltip(false); // disable tooltip

               evnt.sourceEvent.preventDefault();
               evnt.sourceEvent.stopPropagation();

               let handle = {
                  acc_x1: Number(pthis.draw_g.attr("x")),
                  acc_y1: Number(pthis.draw_g.attr("y")),
                  pad_w: pthis.pad_width() - rect_width(),
                  pad_h: pthis.pad_height() - rect_height(),
                  drag_tm: new Date()
               };

               drag_rect = d3.select(pthis.draw_g.node().parentNode).append("rect")
                  .classed("zoom", true)
                  .attr("x", handle.acc_x1)
                  .attr("y", handle.acc_y1)
                  .attr("width", rect_width())
                  .attr("height", rect_height())
                  .style("cursor", "move")
                  .style("pointer-events", "none") // let forward double click to underlying elements
                  .property('drag_handle', handle);


            }).on("drag", function(evnt) {
               if (!drag_rect) return;

               evnt.sourceEvent.preventDefault();
               evnt.sourceEvent.stopPropagation();

               let handle = drag_rect.property('drag_handle');

               if (!callback.no_change_x)
                  handle.acc_x1 += evnt.dx;
               if (!callback.no_change_y)
                  handle.acc_y1 += evnt.dy;

               drag_rect.attr("x", Math.min(Math.max(handle.acc_x1, 0), handle.pad_w))
                  .attr("y", Math.min(Math.max(handle.acc_y1, 0), handle.pad_h));

            }).on("end", function(evnt) {
               if (!drag_rect) return;

               evnt.sourceEvent.preventDefault();

               let handle = drag_rect.property('drag_handle');

               if (complete_drag() === false) {
                  let spent = (new Date()).getTime() - handle.drag_tm.getTime();
                  if (callback.ctxmenu && (spent > 600) && pthis.ShowContextMenu) {
                     let rrr = resize_se.node().getBoundingClientRect();
                     pthis.ShowContextMenu('main', { clientX: rrr.left, clientY: rrr.top });
                  } else if (callback.canselect && (spent <= 600)) {
                     pthis.canv_painter().SelectObjectPainter(pthis);
                  }
               }
            });

         drag_resize
            .on("start", function(evnt) {
               if (detectRightButton(evnt.sourceEvent)) return;

               evnt.sourceEvent.stopPropagation();
               evnt.sourceEvent.preventDefault();

               pthis.SwitchTooltip(false); // disable tooltip

               let handle = {
                  acc_x1: Number(pthis.draw_g.attr("x")),
                  acc_y1: Number(pthis.draw_g.attr("y")),
                  pad_w: pthis.pad_width(),
                  pad_h: pthis.pad_height()
               };

               handle.acc_x2 = handle.acc_x1 + rect_width();
               handle.acc_y2 = handle.acc_y1 + rect_height();

               drag_rect = d3.select(pthis.draw_g.node().parentNode)
                  .append("rect")
                  .classed("zoom", true)
                  .style("cursor", d3.select(this).style("cursor"))
                  .attr("x", handle.acc_x1)
                  .attr("y", handle.acc_y1)
                  .attr("width", handle.acc_x2 - handle.acc_x1)
                  .attr("height", handle.acc_y2 - handle.acc_y1)
                  .property('drag_handle', handle);

            }).on("drag", function(evnt) {
               if (!drag_rect) return;

               evnt.sourceEvent.preventDefault();
               evnt.sourceEvent.stopPropagation();

               let handle = drag_rect.property('drag_handle'),
                  dx = evnt.dx, dy = evnt.dy, elem = d3.select(this);

               if (callback.no_change_x) dx = 0;
               if (callback.no_change_y) dy = 0;

               if (elem.classed('js_nw_resize')) { handle.acc_x1 += dx; handle.acc_y1 += dy; }
               else if (elem.classed('js_ne_resize')) { handle.acc_x2 += dx; handle.acc_y1 += dy; }
               else if (elem.classed('js_sw_resize')) { handle.acc_x1 += dx; handle.acc_y2 += dy; }
               else if (elem.classed('js_se_resize')) { handle.acc_x2 += dx; handle.acc_y2 += dy; }
               else if (elem.classed('js_w_resize')) { handle.acc_x1 += dx; }
               else if (elem.classed('js_n_resize')) { handle.acc_y1 += dy; }
               else if (elem.classed('js_e_resize')) { handle.acc_x2 += dx; }
               else if (elem.classed('js_s_resize')) { handle.acc_y2 += dy; }

               let x1 = Math.max(0, handle.acc_x1), x2 = Math.min(handle.acc_x2, handle.pad_w),
                  y1 = Math.max(0, handle.acc_y1), y2 = Math.min(handle.acc_y2, handle.pad_h);

               drag_rect.attr("x", x1).attr("y", y1).attr("width", Math.max(0, x2 - x1)).attr("height", Math.max(0, y2 - y1));

            }).on("end", function(evnt) {
               if (!drag_rect) return;

               evnt.sourceEvent.preventDefault();

               complete_drag();
            });

         if (!callback.only_resize)
            this.draw_g.style("cursor", "move").call(drag_move);

         MakeResizeElements(this.draw_g, rect_width(), rect_height(), drag_resize);
      }

      /** @summary Add color selection menu entries
       * @private */
      AddColorMenuEntry(menu, name, value, set_func, fill_kind) {
         if (value === undefined) return;
         menu.add("sub:" + name, function() {
            // todo - use jqury dialog here
            let useid = (typeof value !== 'string');
            let col = prompt("Enter color " + (useid ? "(only id number)" : "(name or id)"), value);
            if (col == null) return;
            let id = parseInt(col);
            if (!isNaN(id) && (JSROOT.Painter.root_colors[id] !== undefined)) {
               col = JSROOT.Painter.root_colors[id];
            } else {
               if (useid) return;
            }
            set_func.bind(this)(useid ? id : col);
         });
         let useid = (typeof value !== 'string');
         for (let n = -1; n < 11; ++n) {
            if ((n < 0) && useid) continue;
            if ((n == 10) && (fill_kind !== 1)) continue;
            let col = (n < 0) ? 'none' : JSROOT.Painter.root_colors[n];
            if ((n == 0) && (fill_kind == 1)) col = 'none';
            let svg = "<svg width='100' height='18' style='margin:0px;background-color:" + col + "'><text x='4' y='12' style='font-size:12px' fill='" + (n == 1 ? "white" : "black") + "'>" + col + "</text></svg>";
            menu.addchk((value == (useid ? n : col)), svg, (useid ? n : col), set_func);
         }
         menu.add("endsub:");
      }

      /** @summary Add size selection menu entries
       * @private */
      AddSizeMenuEntry(menu, name, min, max, step, value, set_func) {
         if (value === undefined) return;

         menu.add("sub:" + name, function() {
            // todo - use jqury dialog here
            let entry = value.toFixed(4);
            if (step >= 0.1) entry = value.toFixed(2);
            if (step >= 1) entry = value.toFixed(0);
            let val = prompt("Enter value of " + name, entry);
            if (val == null) return;
            val = parseFloat(val);
            if (!isNaN(val)) set_func.bind(this)((step >= 1) ? Math.round(val) : val);
         });
         for (let val = min; val <= max; val += step) {
            let entry = val.toFixed(2);
            if (step >= 0.1) entry = val.toFixed(1);
            if (step >= 1) entry = val.toFixed(0);
            menu.addchk((Math.abs(value - val) < step / 2), entry, val, set_func);
         }
         menu.add("endsub:");
      }

      /** @summary execute selected menu command, either locally or remotely
       * @private */
      ExecuteMenuCommand(method) {

         if (method.fName == "Inspect") {
            // primitve inspector, keep it here
            this.ShowInspector();
            return true;
         }

         let canvp = this.canv_painter();
         if (!canvp) return false;

         return false;
      }

      /** @brief Invoke method for object via WebCanvas functionality
       * @desc Requires that painter marked with object identifier (this.snapid) or identifier provided as second argument
       * Canvas painter should exists and in non-readonly mode
       * Execution string can look like "Print()".
       * Many methods call can be chained with "Print();;Update();;Clear()"
       * @private */

      WebCanvasExec(exec, snapid) {
         if (!exec || (typeof exec != 'string')) return;

         let canp = this.canv_painter();
         if (canp && (typeof canp.SubmitExec == "function"))
            canp.SubmitExec(this, exec, snapid);
      }

      /** @summary Fill object menu in web canvas
       * @private */
      FillObjectExecMenu(menu, kind, call_back) {

         if (this.UserContextMenuFunc)
            return this.UserContextMenuFunc(menu, kind, call_back);

         let canvp = this.canv_painter();

         if (!this.snapid || !canvp || canvp._readonly || !canvp._websocket)
            return JSROOT.CallBack(call_back);

         function DoExecMenu(arg) {
            let execp = this.exec_painter || this,
               cp = execp.canv_painter(),
               item = execp.args_menu_items[parseInt(arg)];

            if (!item || !item.fName) return;

            // this is special entry, produced by TWebMenuItem, which recognizes editor entries itself
            if (item.fExec == "Show:Editor") {
               if (cp && (typeof cp.ActivateGed == 'function'))
                  cp.ActivateGed(execp);
               return;
            }

            if (cp && (typeof cp.executeObjectMethod == 'function'))
               if (cp.executeObjectMethod(execp, item, execp.args_menu_id)) return;

            if (execp.ExecuteMenuCommand(item)) return;

            if (execp.args_menu_id)
               execp.WebCanvasExec(item.fExec, execp.args_menu_id);
         }

         function DoFillMenu(_menu, _reqid, _call_back, reply) {

            // avoid multiple call of the callback after timeout
            if (this._got_menu) return;
            this._got_menu = true;

            if (reply && (_reqid !== reply.fId))
               console.error('missmatch between request ' + _reqid + ' and reply ' + reply.fId + ' identifiers');

            let items = reply ? reply.fItems : null;

            if (items && items.length) {
               if (_menu.size() > 0)
                  _menu.add("separator");

               this.args_menu_items = items;
               this.args_menu_id = reply.fId;

               let lastclname;

               for (let n = 0; n < items.length; ++n) {
                  let item = items[n];

                  if (item.fClassName && lastclname && (lastclname != item.fClassName)) {
                     _menu.add("endsub:");
                     lastclname = "";
                  }
                  if (lastclname != item.fClassName) {
                     lastclname = item.fClassName;
                     _menu.add("sub:" + lastclname);
                  }

                  if ((item.fChecked === undefined) || (item.fChecked < 0))
                     _menu.add(item.fName, n, DoExecMenu);
                  else
                     _menu.addchk(item.fChecked, item.fName, n, DoExecMenu);
               }

               if (lastclname) _menu.add("endsub:");
            }

            JSROOT.CallBack(_call_back);
         }

         let reqid = this.snapid;
         if (kind) reqid += "#" + kind; // use # to separate object id from member specifier like 'x' or 'z'

         let menu_callback = DoFillMenu.bind(this, menu, reqid, call_back);

         this._got_menu = false;

         // if menu painter differs from this, remember it for further usage
         if (menu.painter)
            menu.painter.exec_painter = (menu.painter !== this) ? this : undefined;

         canvp.SubmitMenuRequest(this, kind, reqid, menu_callback);

         // set timeout to avoid menu hanging
         setTimeout(menu_callback, 2000);
      }

      /** @summary remove all created draw attributes
       * @private */
      DeleteAtt() {
         delete this.lineatt;
         delete this.fillatt;
         delete this.markeratt;
      }

      /** @summary Produce exec string for WebCanas to set color value
       * @desc Color can be id or string, but should belong to list of known colors
       * For higher color numbers TColor::GetColor(r,g,b) will be invoked to ensure color is exists
       * @private */
      GetColorExec(col, method) {
         let id = -1, arr = JSROOT.Painter.root_colors;
         if (typeof col == "string") {
            if (!col || (col == "none")) id = 0; else
               for (let k = 1; k < arr.length; ++k)
                  if (arr[k] == col) { id = k; break; }
            if ((id < 0) && (col.indexOf("rgb") == 0)) id = 9999;
         } else if (!isNaN(col) && arr[col]) {
            id = col;
            col = arr[id];
         }

         if (id < 0) return "";

         if (id >= 50) {
            // for higher color numbers ensure that such color exists
            let c = d3.color(col);
            id = "TColor::GetColor(" + c.r + "," + c.g + "," + c.b + ")";
         }

         return "exec:" + method + "(" + id + ")";
      }

      /** @summary Fill context menu for graphical attributes
       * @private */
      FillAttContextMenu(menu, preffix) {
         // this method used to fill entries for different attributes of the object
         // like TAttFill, TAttLine, ....
         // all menu call-backs need to be rebind, while menu can be used from other painter

         if (!preffix) preffix = "";

         if (this.lineatt && this.lineatt.used) {
            menu.add("sub:" + preffix + "Line att");
            this.AddSizeMenuEntry(menu, "width", 1, 10, 1, this.lineatt.width,
               function(arg) { this.lineatt.Change(undefined, parseInt(arg)); this.InteractiveRedraw(true, "exec:SetLineWidth(" + arg + ")"); }.bind(this));
            this.AddColorMenuEntry(menu, "color", this.lineatt.color,
               function(arg) { this.lineatt.Change(arg); this.InteractiveRedraw(true, this.GetColorExec(arg, "SetLineColor")); }.bind(this));
            menu.add("sub:style", function() {
               let id = prompt("Enter line style id (1-solid)", 1);
               if (id == null) return;
               id = parseInt(id);
               if (isNaN(id) || !JSROOT.Painter.root_line_styles[id]) return;
               this.lineatt.Change(undefined, undefined, id);
               this.InteractiveRedraw(true, "exec:SetLineStyle(" + id + ")");
            }.bind(this));
            for (let n = 1; n < 11; ++n) {

               let dash = JSROOT.Painter.root_line_styles[n];

               let svg = "<svg width='100' height='18'><text x='1' y='12' style='font-size:12px'>" + n + "</text><line x1='30' y1='8' x2='100' y2='8' stroke='black' stroke-width='3' stroke-dasharray='" + dash + "'></line></svg>";

               menu.addchk((this.lineatt.style == n), svg, n, function(arg) { this.lineatt.Change(undefined, undefined, parseInt(arg)); this.InteractiveRedraw(true, "exec:SetLineStyle(" + arg + ")"); }.bind(this));
            }
            menu.add("endsub:");
            menu.add("endsub:");

            if (('excl_side' in this.lineatt) && (this.lineatt.excl_side !== 0)) {
               menu.add("sub:Exclusion");
               menu.add("sub:side");
               for (let side = -1; side <= 1; ++side)
                  menu.addchk((this.lineatt.excl_side == side), side, side, function(arg) {
                     this.lineatt.ChangeExcl(parseInt(arg));
                     this.InteractiveRedraw();
                  }.bind(this));
               menu.add("endsub:");

               this.AddSizeMenuEntry(menu, "width", 10, 100, 10, this.lineatt.excl_width,
                  function(arg) { this.lineatt.ChangeExcl(undefined, parseInt(arg)); this.InteractiveRedraw(); }.bind(this));

               menu.add("endsub:");
            }
         }

         if (this.fillatt && this.fillatt.used) {
            menu.add("sub:" + preffix + "Fill att");
            this.AddColorMenuEntry(menu, "color", this.fillatt.colorindx,
               function(arg) { this.fillatt.Change(parseInt(arg), undefined, this.svg_canvas()); this.InteractiveRedraw(true, this.GetColorExec(parseInt(arg), "SetFillColor")); }.bind(this), this.fillatt.kind);
            menu.add("sub:style", function() {
               let id = prompt("Enter fill style id (1001-solid, 3000..3010)", this.fillatt.pattern);
               if (id == null) return;
               id = parseInt(id);
               if (isNaN(id)) return;
               this.fillatt.Change(undefined, id, this.svg_canvas());
               this.InteractiveRedraw(true, "exec:SetFillStyle(" + id + ")");
            }.bind(this));

            let supported = [1, 1001, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3010, 3021, 3022];

            for (let n = 0; n < supported.length; ++n) {

               let sample = this.createAttFill({ std: false, pattern: supported[n], color: this.fillatt.colorindx || 1 }),
                  svg = "<svg width='100' height='18'><text x='1' y='12' style='font-size:12px'>" + supported[n].toString() + "</text><rect x='40' y='0' width='60' height='18' stroke='none' fill='" + sample.fillcolor() + "'></rect></svg>";

               menu.addchk(this.fillatt.pattern == supported[n], svg, supported[n], function(arg) {
                  this.fillatt.Change(undefined, parseInt(arg), this.svg_canvas());
                  this.InteractiveRedraw(true, "exec:SetFillStyle(" + arg + ")");
               }.bind(this));
            }
            menu.add("endsub:");
            menu.add("endsub:");
         }

         if (this.markeratt && this.markeratt.used) {
            menu.add("sub:" + preffix + "Marker att");
            this.AddColorMenuEntry(menu, "color", this.markeratt.color,
               function(arg) { this.markeratt.Change(arg); this.InteractiveRedraw(true, this.GetColorExec(arg, "SetMarkerColor")); }.bind(this));
            this.AddSizeMenuEntry(menu, "size", 0.5, 6, 0.5, this.markeratt.size,
               function(arg) { this.markeratt.Change(undefined, undefined, parseFloat(arg)); this.InteractiveRedraw(true, "exec:SetMarkerSize(" + parseInt(arg) + ")"); }.bind(this));

            menu.add("sub:style");
            let supported = [1, 2, 3, 4, 5, 6, 7, 8, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34];

            for (let n = 0; n < supported.length; ++n) {

               let clone = new TAttMarkerHandler({ style: supported[n], color: this.markeratt.color, size: 1.7 }),
                  svg = "<svg width='60' height='18'><text x='1' y='12' style='font-size:12px'>" + supported[n].toString() + "</text><path stroke='black' fill='" + (clone.fill ? "black" : "none") + "' d='" + clone.create(40, 8) + "'></path></svg>";

               menu.addchk(this.markeratt.style == supported[n], svg, supported[n],
                  function(arg) { this.markeratt.Change(undefined, parseInt(arg)); this.InteractiveRedraw(true, "exec:SetMarkerStyle(" + arg + ")"); }.bind(this));
            }
            menu.add("endsub:");
            menu.add("endsub:");
         }
      }

      /** @summary Fill context menu for text attributes
       * @private */
      TextAttContextMenu(menu, prefix) {
         // for the moment, text attributes accessed directly from objects

         let obj = this.GetObject();
         if (!obj || !('fTextColor' in obj)) return;

         menu.add("sub:" + (prefix ? prefix : "Text"));
         this.AddColorMenuEntry(menu, "color", obj.fTextColor,
            function(arg) { this.GetObject().fTextColor = parseInt(arg); this.InteractiveRedraw(true, this.GetColorExec(parseInt(arg), "SetTextColor")); }.bind(this));

         let align = [11, 12, 13, 21, 22, 23, 31, 32, 33];

         menu.add("sub:align");
         for (let n = 0; n < align.length; ++n) {
            menu.addchk(align[n] == obj.fTextAlign,
               align[n], align[n],
               // align[n].toString() + "_h:" + hnames[Math.floor(align[n]/10) - 1] + "_v:" + vnames[align[n]%10-1], align[n],
               function(arg) { this.GetObject().fTextAlign = parseInt(arg); this.InteractiveRedraw(true, "exec:SetTextAlign(" + arg + ")"); }.bind(this));
         }
         menu.add("endsub:");

         menu.add("sub:font");
         for (let n = 1; n < 16; ++n) {
            menu.addchk(n == Math.floor(obj.fTextFont / 10), n, n,
               function(arg) { this.GetObject().fTextFont = parseInt(arg) * 10 + 2; this.InteractiveRedraw(true, "exec:SetTextFont(" + this.GetObject().fTextFont + ")"); }.bind(this));
         }
         menu.add("endsub:");

         menu.add("endsub:");
      }

      /** @summary Show object in inspector */
      ShowInspector(obj) {
         let main = this.select_main(),
            rect = this.get_visible_rect(main),
            w = Math.round(rect.width * 0.05) + "px",
            h = Math.round(rect.height * 0.05) + "px",
            id = "root_inspector_" + JSROOT.id_counter++;

         main.append("div")
            .attr("id", id)
            .attr("class", "jsroot_inspector")
            .style('position', 'absolute')
            .style('top', h)
            .style('bottom', h)
            .style('left', w)
            .style('right', w);

         if (!obj || (typeof obj !== 'object') || !obj._typename)
            obj = this.GetObject();

         JSROOT.draw(id, obj, 'inspect');
      }

      /** @summary Fill context menu for the object
       * @private */
      FillContextMenu(menu) {
         let title = this.GetTipName();
         if (this.GetObject() && ('_typename' in this.GetObject()))
            title = this.GetObject()._typename + "::" + title;

         menu.add("header:" + title);

         this.FillAttContextMenu(menu);

         if (menu.size() > 0)
            menu.add('Inspect', this.ShowInspector);

         return menu.size() > 0;
      }

      /** @summary returns function used to display object status
       * @private */
      GetShowStatusFunc() {
         // return function used to display object status
         // automatically disabled when drawing is enlarged - status line will be invisible

         let pp = this.canv_painter(), res = JSROOT.Painter.ShowStatus;

         if (pp && (typeof pp.ShowCanvasStatus === 'function')) res = pp.ShowCanvasStatus.bind(pp);

         if (res && (this.enlarge_main('state') === 'on')) res = null;

         return res;
      }

      /** @summary shows objects status
       * @private */
      ShowObjectStatus() {
         // method called normally when mouse enter main object element

         let obj = this.GetObject(),
            status_func = this.GetShowStatusFunc();

         if (obj && status_func) status_func(this.GetItemName() || obj.fName, obj.fTitle || obj._typename, obj._typename);
      }


      /** @summary try to find object by name in list of pad primitives
       * @desc used to find title drawing
       * @private */
      FindInPrimitives(objname) {
         let painter = this.pad_painter();

         let arr = painter && painter.pad && painter.pad.fPrimitives ? painter.pad.fPrimitives.arr : null;

         if (arr && arr.length)
            for (let n = 0; n < arr.length; ++n) {
               let prim = arr[n];
               if (('fName' in prim) && (prim.fName === objname)) return prim;
            }

         return null;
      }

      /** @summary Try to find painter for specified object
       * @desc can be used to find painter for some special objects, registered as
       * histogram functions
       * @private */
      FindPainterFor(selobj, selname, seltype) {

         let painter = this.pad_painter();
         let painters = painter ? painter.painters : null;
         if (!painters) return null;

         for (let n = 0; n < painters.length; ++n) {
            let pobj = painters[n].GetObject();
            if (!pobj) continue;

            if (selobj && (pobj === selobj)) return painters[n];
            if (!selname && !seltype) continue;
            if (selname && (pobj.fName !== selname)) continue;
            if (seltype && (pobj._typename !== seltype)) continue;
            return painters[n];
         }

         return null;
      }

      /** @summary Remove painter from list of painters and cleanup all drawings */
      DeleteThis() {
         let pp = this.pad_painter();
         if (pp) {
            let k = pp.painters.indexOf(this);
            if (k >= 0) pp.painters.splice(k, 1);
         }

         this.Cleanup();
      }

      /** @summary Configure user-defined tooltip callback
       *
       * @desc Hook for the users to get tooltip information when mouse cursor moves over frame area
       * call_back function will be called every time when new data is selected
       * when mouse leave frame area, call_back(null) will be called
       */

      ConfigureUserTooltipCallback(call_back, user_timeout) {

         if (!call_back || (typeof call_back !== 'function')) {
            delete this.UserTooltipCallback;
            delete this.UserTooltipTimeout;
            return;
         }

         if (user_timeout === undefined) user_timeout = 500;

         this.UserTooltipCallback = call_back;
         this.UserTooltipTimeout = user_timeout;
      }

      /** @summary Configure user-defined context menu for the object
      *
      * @desc fillmenu_func will be called when context menu is actiavted
      * Arguments fillmenu_func are (menu,kind,call_back)
      * First is JSROOT menu object, second is object subelement like axis "x" or "y"
      * Third is call_back which must be called when menu items are filled
      */

      ConfigureUserContextMenu(fillmenu_func) {

         if (!fillmenu_func || (typeof fillmenu_func !== 'function'))
            delete this.UserContextMenuFunc;
         else
            this.UserContextMenuFunc = fillmenu_func;
      }

      /** @summary Configure user-defined click handler
      *
      * @desc Function will be called every time when frame click was perfromed
      * As argument, tooltip object with selected bins will be provided
      * If handler function returns true, default handling of click will be disabled
      */

      ConfigureUserClickHandler(handler) {
         let fp = this.frame_painter();
         if (fp && typeof fp.ConfigureUserClickHandler == 'function')
            fp.ConfigureUserClickHandler(handler);
      }

      /** @summary Configure user-defined dblclick handler
      *
      * @desc Function will be called every time when double click was called
      * As argument, tooltip object with selected bins will be provided
      * If handler function returns true, default handling of dblclick (unzoom) will be disabled
      */

      ConfigureUserDblclickHandler(handler) {
         let fp = this.frame_painter();
         if (fp && typeof fp.ConfigureUserDblclickHandler == 'function')
            fp.ConfigureUserDblclickHandler(handler);
      }

      /** @summary Check if user-defined tooltip callback is configured
       * @returns {boolean}
       * @private */
      IsUserTooltipCallback() {
         return typeof this.UserTooltipCallback == 'function';
      }

      /** @summary Provide tooltips data to user-defained function
       * @param {object} data - tooltip data
       * @private */
      ProvideUserTooltip(data) {

         if (!this.IsUserTooltipCallback()) return;

         if (this.UserTooltipTimeout <= 0)
            return this.UserTooltipCallback(data);

         if (typeof this.UserTooltipTHandle != 'undefined') {
            clearTimeout(this.UserTooltipTHandle);
            delete this.UserTooltipTHandle;
         }

         if (data == null)
            return this.UserTooltipCallback(data);

         this.UserTooltipTHandle = setTimeout(function(d) {
            // only after timeout user function will be called
            delete this.UserTooltipTHandle;
            this.UserTooltipCallback(d);
         }.bind(this, data), this.UserTooltipTimeout);
      }

      /** @summary Redraw object
       * @desc Basic method, should be reimplemented in all derived objects
       * for the case when drawing should be repeated
       * @abstract */
      Redraw() {}

      /** @summary Start text drawing
        * @desc required before any text can be drawn
        * @private */
      StartTextDrawing(font_face, font_size, draw_g, max_font_size) {

         if (!draw_g) draw_g = this.draw_g;

         let font = (font_size === 'font') ? font_face : JSROOT.Painter.getFontDetails(font_face, font_size);

         let pp = this.pad_painter();

         draw_g.call(font.func);

         draw_g.property('draw_text_completed', false) // indicate that draw operations submitted
               .property('all_args',[]) // array of all submitted args, makes easier to analyze them
               .property('text_font', font)
               .property('text_factor', 0.)
               .property('max_text_width', 0) // keep maximal text width, use it later
               .property('max_font_size', max_font_size)
               .property("_fast_drawing", pp && pp._fast_drawing);

         if (draw_g.property("_fast_drawing"))
            draw_g.property("_font_too_small", (max_font_size && (max_font_size < 5)) || (font.size < 4));
      }

      /** @summary function used to remember maximal text scaling factor
       * @private */
      TextScaleFactor(value, draw_g) {
         if (!draw_g) draw_g = this.draw_g;
         if (value && (value > draw_g.property('text_factor'))) draw_g.property('text_factor', value);
      }

      /** @summary getBBox does not work in mozilla when object is not displayed or not visible :(
       * getBoundingClientRect() returns wrong sizes for MathJax
       * are there good solution?
       * @private */
      GetBoundarySizes(elem) {
         if (elem === null) { console.warn('empty node in GetBoundarySizes'); return { width: 0, height: 0 }; }
         let box = elem.getBoundingClientRect(); // works always, but returns sometimes results in ex values, which is difficult to use
         if (parseFloat(box.width) > 0) box = elem.getBBox(); // check that elements visible, request precise value
         let res = { width: parseInt(box.width), height: parseInt(box.height) };
         if ('left' in box) { res.x = parseInt(box.left); res.y = parseInt(box.right); } else
            if ('x' in box) { res.x = parseInt(box.x); res.y = parseInt(box.y); }
         return res;
      }

      /** @summary Finish text drawing
       *
       * @desc Should be called to complete all text drawing operations
       */
      FinishTextDrawing(draw_g, call_ready, checking_mathjax) {
         if (!draw_g) draw_g = this.draw_g;

         if (checking_mathjax) {
            if (!draw_g.property('draw_text_completed')) return;
         } else {
            draw_g.property('draw_text_completed', true); // mark that text drawing is completed
         }

         let all_args = draw_g.property('all_args'), missing = 0;
         if (!all_args) {
            console.log('Text drawing is finished - why?????');
            return 0;
         }

         all_args.forEach(arg => { if (!arg.ready) missing++; });

         if (missing > 0) {
            if (call_ready) draw_g.node().text_callback = call_ready;
            return 0;
         }

         draw_g.property('all_args', null); // clear all_args property

         // adjust font size (if there are normal text)
         let painter = this,
            svg_factor = 0,
            f = draw_g.property('text_factor'),
            font = draw_g.property('text_font'),
            max_sz = draw_g.property('max_font_size'),
            font_size = font.size;

         if ((f > 0) && ((f < 0.9) || (f > 1)))
            font.size = Math.floor(font.size / f);

         if (max_sz && (font.size > max_sz))
            font.size = max_sz;

         if (font.size != font_size) {
            draw_g.call(font.func);
            font_size = font.size;
         }

         all_args.forEach(arg => {
            if (arg.fo_g && arg.repairMathJaxSvgSize) {
               let svg = arg.fo_g.select("svg"); // MathJax svg
               svg_factor = Math.max(svg_factor, arg.repairMathJaxSvgSize(painter, arg.fo_g, svg, arg, font_size));
            }
         });

         all_args.forEach(arg => {
            if (arg.fo_g && arg.applyAttributesToMathJax) {
               let svg = arg.fo_g.select("svg"); // MathJax svg
               arg.applyAttributesToMathJax(painter, arg.fo_g, svg, arg, font_size, svg_factor);
               delete arg.fo_g; // remove reference
            }
         });

         // now hidden text after rescaling can be shown
         all_args.forEach(arg => {
            if (!arg.txt) return; // only normal text is processed
            let txt = arg.txt;
            txt.attr('visibility', null);

            if (JSROOT.nodejs) {
               if (arg.scale && (f > 0)) { arg.box.width = arg.box.width / f; arg.box.height = arg.box.height / f; }
            } else if (!arg.plain && !arg.fast) {
               // exact box dimension only required when complex text was build
               arg.box = painter.GetBoundarySizes(txt.node());
            }

            // if (arg.text.length>20) console.log(arg.box, arg.align, arg.x, arg.y, 'plain', arg.plain, 'inside', arg.width, arg.height);

            if (arg.width) {
               // adjust x position when scale into specified rectangle
               if (arg.align[0] == "middle") arg.x += arg.width / 2; else
                  if (arg.align[0] == "end") arg.x += arg.width;
            }

            arg.dx = arg.dy = 0;

            if (arg.plain) {
               txt.attr("text-anchor", arg.align[0]);
            } else {
               txt.attr("text-anchor", "start");
               arg.dx = ((arg.align[0] == "middle") ? -0.5 : ((arg.align[0] == "end") ? -1 : 0)) * arg.box.width;
            }

            if (arg.height) {
               if (arg.align[1].indexOf('bottom') === 0) arg.y += arg.height; else
                  if (arg.align[1] == 'middle') arg.y += arg.height / 2;
            }

            if (arg.plain) {
               if (arg.align[1] == 'top') txt.attr("dy", ".8em"); else
                  if (arg.align[1] == 'middle') {
                     if (JSROOT.nodejs) txt.attr("dy", ".4em"); else txt.attr("dominant-baseline", "middle");
                  }
            } else {
               arg.dy = ((arg.align[1] == 'top') ? (arg.top_shift || 1) : (arg.align[1] == 'middle') ? (arg.mid_shift || 0.5) : 0) * arg.box.height;
            }

            if (!arg.rotate) { arg.x += arg.dx; arg.y += arg.dy; arg.dx = arg.dy = 0; }

            // use translate and then rotate to avoid complex sign calculations
            let trans = (arg.x || arg.y) ? "translate(" + Math.round(arg.x) + "," + Math.round(arg.y) + ")" : "";
            if (arg.rotate) trans += " rotate(" + Math.round(arg.rotate) + ")";
            if (arg.dx || arg.dy) trans += " translate(" + Math.round(arg.dx) + "," + Math.round(arg.dy) + ")";
            if (trans) txt.attr("transform", trans);
         });

         if (!call_ready) call_ready = draw_g.node().text_callback;
         draw_g.node().text_callback = null;

         // if specified, call ready function
         JSROOT.CallBack(call_ready);
         return 0;
      }

      /** @summary draw text
       *
       *  @param {object} arg - different text draw options
       *  @param {string} arg.text - text to draw
       *  @param {number} [arg.align = 12] - int value like 12 or 31
       *  @param {string} [arg.align = undefined] - end;bottom
       *  @param {number} [arg.x = 0] - x position
       *  @param {number} [arg.y = 0] - y position
       *  @param {number} [arg.width = undefined] - when specified, adjust font size in the specified box
       *  @param {number} [arg.height = undefined] - when specified, adjust font size in the specified box
       *  @param {number} arg.latex - 0 - plain text, 1 - normal TLatex, 2 - math
       *  @param {string} [arg.color=black] - text color
       *  @param {number} [arg.rotate = undefined] - rotaion angle
       *  @param {number} [arg.font_size = undefined] - fixed font size
       *  @param {object} [arg.draw_g = this.draw_g] - element where to place text, if not specified central painter container is used
       */
      DrawText(arg) {

         if (!arg.text) arg.text = "";

         let align = ['start', 'middle'];

         if (typeof arg.align == 'string') {
            align = arg.align.split(";");
            if (align.length == 1) align.push('middle');
         } else if (typeof arg.align == 'number') {
            if ((arg.align / 10) >= 3) align[0] = 'end'; else
               if ((arg.align / 10) >= 2) align[0] = 'middle';
            if ((arg.align % 10) == 0) align[1] = 'bottom'; else
               if ((arg.align % 10) == 1) align[1] = 'bottom-base'; else
                  if ((arg.align % 10) == 3) align[1] = 'top';
         }

         arg.draw_g = arg.draw_g || this.draw_g;
         if (arg.latex === undefined) arg.latex = 1; //  latex 0-text, 1-latex, 2-math
         arg.align = align;
         arg.x = arg.x || 0;
         arg.y = arg.y || 0;
         arg.scale = arg.width && arg.height && !arg.font_size;
         arg.width = arg.width || 0;
         arg.height = arg.height || 0;

         if (arg.draw_g.property("_fast_drawing")) {
            if (arg.scale) {
               // area too small - ignore such drawing
               if (arg.height < 4) return 0;
            } else if (arg.font_size) {
               // font size too small
               if (arg.font_size < 4) return 0;
            } else if (arg.draw_g.property("_font_too_small")) {
               // configure font is too small - ignore drawing
               return 0;
            }
         }

         if (typeof JSROOT.gStyle.Latex == 'string') {
            switch (JSROOT.gStyle.Latex) {
               case "off": JSROOT.gStyle.Latex = 0; break;
               case "symbols": JSROOT.gStyle.Latex = 1; break;
               case "MathJax":
               case "mathjax":
               case "math": JSROOT.gStyle.Latex = 3; break;
               case "AlwaysMathJax":
               case "alwaysmath":
               case "alwaysmathjax": JSROOT.gStyle.Latex = 4; break;
               default:
                  let code = parseInt(JSROOT.gStyle.Latex);
                  JSROOT.gStyle.Latex = (!isNaN(code) && (code >= 0) && (code <= 4)) ? code : 2;
            }
         }

         // include drawing into list of all args
         arg.draw_g.property('all_args').push(arg);
         arg.ready = false; // indicates if drawing is ready for post-processing

         let font = arg.draw_g.property('text_font'),
             use_mathjax = (arg.latex == 2),
             painter = this;

         if (arg.latex === 1)
            use_mathjax = (JSROOT.gStyle.Latex > 3) || ((JSROOT.gStyle.Latex == 3) && JSROOT.Painter.isAnyLatex(arg.text));

         if (!use_mathjax || arg.nomathjax) {

            let txt = arg.draw_g.append("svg:text");

            if (arg.color) txt.attr("fill", arg.color);

            if (arg.font_size) txt.attr("font-size", arg.font_size);
            else arg.font_size = font.size;

            arg.font = font; // use in latex conversion

            arg.plain = !arg.latex || (JSROOT.gStyle.Latex < 2);

            arg.simple_latex = arg.latex && (JSROOT.gStyle.Latex == 1);

            arg.txt = txt; // keep refernce on element

            if (!arg.plain || arg.simple_latex) {
               JSROOT.require(['JSRoot.latex'])
                     .then(() => { return arg.simple_latex ? painter.producePlainText(arg.txt, arg) : painter.produceLatex(arg.txt, arg); })
                     .then(() => {
                        painter.postprocessText(arg.txt, arg);

                        painter.FinishTextDrawing(arg.draw_g, null, true); // check if all other elements are completed
                    });
               return 0;
            }

            arg.plain = true;
            txt.text(arg.text);

            return this.postprocessText(txt, arg);
         }

         let fo_g = arg.draw_g.append("svg:g")
                              .attr('visibility', 'hidden'); // hide text until drawing is finished

         arg.font = font;
         arg.fo_g = fo_g; // keep element

         JSROOT.require(['JSRoot.latex'])
               .then(() => painter.produceMathjax(fo_g, arg))
               .then(() => painter.FinishTextDrawing(arg.draw_g, null, true));

         return 0;
      }

      /** After normal SVG generated, check and recalculate some properties */
      postprocessText(txt, arg) {
         // complete rectangle with very rougth size estimations

         arg.box = !JSROOT.nodejs && !JSROOT.gStyle.ApproxTextSize && !arg.fast ? this.GetBoundarySizes(txt.node()) :
                  (arg.text_rect || { height: arg.font_size * 1.2, width: JSROOT.Painter.approxTextWidth(arg.font, arg.text) });

         txt.attr('visibility', 'hidden'); // hide elements until text drawing is finished

         if (arg.box.width > arg.draw_g.property('max_text_width')) arg.draw_g.property('max_text_width', arg.box.width);
         if (arg.scale) this.TextScaleFactor(1.05 * arg.box.width / arg.width, arg.draw_g);
         if (arg.scale) this.TextScaleFactor(1. * arg.box.height / arg.height, arg.draw_g);

         arg.result_width = arg.box.width;

         arg.ready = true;

         // in some cases
         if (typeof arg.post_process == 'function')
            arg.post_process(this);

         return arg.box.width;
      }

   } // class ObjectPainter

   // ===========================================================

   /** @summary Set active pad painter
    *
    * @desc Should be used to handle key press events, which are global in the web browser
    *  @param {object} args - functions arguments
    *  @param {object} args.pp - pad painter
    *  @param {boolean} [args.active = false] - is pad activated or not
    * @private */
   Painter.SelectActivePad = function(args) {
      if (args.active) {
         if (this.$active_pp && (typeof this.$active_pp.SetActive == 'function'))
            this.$active_pp.SetActive(false);

         this.$active_pp = args.pp;

         if (this.$active_pp && (typeof this.$active_pp.SetActive == 'function'))
            this.$active_pp.SetActive(true);
      } else if (this.$active_pp === args.pp) {
         delete this.$active_pp;
      }
   }

   /** @summary Returns current active pad
    * @desc Should be used only for keyboard handling
    * @private */

   Painter.GetActivePad = function() {
      return this.$active_pp;
   }

   // =====================================================================

   let TooltipHandler = {
      assign: function(painter) {
         painter.tooltip_enabled = true;
         painter.hints_layer = this.hints_layer;
         painter.IsTooltipShown = this.IsTooltipShown;
         painter.SetTooltipEnabled = this.SetTooltipEnabled;
         painter.ProcessTooltipEvent = this.ProcessTooltipEvent;
      },

      /** @desc only canvas info_layer can be used while other pads can overlay
        * @returns layer where frame tooltips are shown */
      hints_layer: function() {
         let pp = this.canv_painter();
         return pp ? pp.svg_layer("info_layer") : d3.select(null);
      },

      /** @returns true if tooltip is shown, use to prevent some other action */
      IsTooltipShown: function() {
         if (!this.tooltip_enabled || !this.IsTooltipAllowed()) return false;
         let hintsg = this.hints_layer().select(".objects_hints");
         return hintsg.empty() ? false : hintsg.property("hints_pad") == this.pad_name;
      },

      SetTooltipEnabled: function(enabled) {
         if (enabled !== undefined) this.tooltip_enabled = enabled;
      },

      ProcessTooltipEvent: function(pnt, evnt) {
         // make central function which let show selected hints for the object

         if (pnt && pnt.handler) {
            // special use of interactive handler in the frame painter
            let rect = this.draw_g ? this.draw_g.select(".main_layer") : null;
            if (!rect || rect.empty()) {
               pnt = null; // disable
            } else if (pnt.touch && evnt) {
               let pos = d3.pointers(evnt, rect.node());
               pnt = (pos && pos.length == 1) ? { touch: true, x: pos[0][0], y: pos[0][1] } : null;
            } else if (evnt) {
               let pos = d3.pointer(evnt, rect.node());
               pnt = { touch: false, x: pos[0], y: pos[1] };
            }
         }

         let hints = [], nhints = 0, maxlen = 0, lastcolor1 = 0, usecolor1 = false,
            textheight = 11, hmargin = 3, wmargin = 3, hstep = 1.2,
            frame_rect = this.GetFrameRect(),
            pad_width = this.pad_width(),
            pp = this.pad_painter(),
            font = JSROOT.Painter.getFontDetails(160, textheight),
            status_func = this.GetShowStatusFunc(),
            disable_tootlips = !this.IsTooltipAllowed() || !this.tooltip_enabled;

         if ((pnt === undefined) || (disable_tootlips && !status_func)) pnt = null;
         if (pnt && disable_tootlips) pnt.disabled = true; // indicate that highlighting is not required
         if (pnt) pnt.painters = true; // get also painter

         // collect tooltips from pad painter - it has list of all drawn objects
         if (pp) hints = pp.GetTooltips(pnt);

         if (pnt && pnt.touch) textheight = 15;

         for (let n = 0; n < hints.length; ++n) {
            let hint = hints[n];
            if (!hint) continue;

            if (hint.painter && (hint.user_info !== undefined))
               if (hint.painter.ProvideUserTooltip(hint.user_info)) { };

            if (!hint.lines || (hint.lines.length === 0)) {
               hints[n] = null; continue;
            }

            // check if fully duplicated hint already exists
            for (let k = 0; k < n; ++k) {
               let hprev = hints[k], diff = false;
               if (!hprev || (hprev.lines.length !== hint.lines.length)) continue;
               for (let l = 0; l < hint.lines.length && !diff; ++l)
                  if (hprev.lines[l] !== hint.lines[l]) diff = true;
               if (!diff) { hints[n] = null; break; }
            }
            if (!hints[n]) continue;

            nhints++;

            for (let l = 0; l < hint.lines.length; ++l)
               maxlen = Math.max(maxlen, hint.lines[l].length);

            hint.height = Math.round(hint.lines.length * textheight * hstep + 2 * hmargin - textheight * (hstep - 1));

            if ((hint.color1 !== undefined) && (hint.color1 !== 'none')) {
               if ((lastcolor1 !== 0) && (lastcolor1 !== hint.color1)) usecolor1 = true;
               lastcolor1 = hint.color1;
            }
         }

         let layer = this.hints_layer(),
            hintsg = layer.select(".objects_hints"); // group with all tooltips

         if (status_func) {
            let title = "", name = "", info = "",
               hint = null, best_dist2 = 1e10, best_hint = null,
               coordinates = pnt ? Math.round(pnt.x) + "," + Math.round(pnt.y) : "";
            // try to select hint with exact match of the position when several hints available
            for (let k = 0; k < (hints ? hints.length : 0); ++k) {
               if (!hints[k]) continue;
               if (!hint) hint = hints[k];
               if (hints[k].exact && (!hint || !hint.exact)) { hint = hints[k]; break; }

               if (!pnt || (hints[k].x === undefined) || (hints[k].y === undefined)) continue;

               let dist2 = (pnt.x - hints[k].x) * (pnt.x - hints[k].x) + (pnt.y - hints[k].y) * (pnt.y - hints[k].y);
               if (dist2 < best_dist2) { best_dist2 = dist2; best_hint = hints[k]; }
            }

            if ((!hint || !hint.exact) && (best_dist2 < 400)) hint = best_hint;

            if (hint) {
               name = (hint.lines && hint.lines.length > 1) ? hint.lines[0] : hint.name;
               title = hint.title || "";
               info = hint.line;
               if (!info && hint.lines) info = hint.lines.slice(1).join(' ');
            }

            status_func(name, title, info, coordinates);
         }

         // end of closing tooltips
         if (!pnt || disable_tootlips || (hints.length === 0) || (maxlen === 0) || (nhints > 15)) {
            hintsg.remove();
            return;
         }

         // we need to set pointer-events=none for all elements while hints
         // placed in front of so-called interactive rect in frame, used to catch mouse events

         if (hintsg.empty())
            hintsg = layer.append("svg:g")
               .attr("class", "objects_hints")
               .style("pointer-events", "none");

         let frame_shift = { x: 0, y: 0 }, trans = frame_rect.transform || "";
         if (!pp.iscan) {
            pp.CalcAbsolutePosition(this.svg_pad(), frame_shift);
            trans = "translate(" + frame_shift.x + "," + frame_shift.y + ") " + trans;
         }

         // copy transform attributes from frame itself
         hintsg.attr("transform", trans)
            .property("last_point", pnt)
            .property("hints_pad", this.pad_name);

         let viewmode = hintsg.property('viewmode') || "",
            actualw = 0, posx = pnt.x + frame_rect.hint_delta_x;

         if (nhints > 1) {
            // if there are many hints, place them left or right

            let bleft = 0.5, bright = 0.5;

            if (viewmode == "left") bright = 0.7; else
               if (viewmode == "right") bleft = 0.3;

            if (posx <= bleft * frame_rect.width) {
               viewmode = "left";
               posx = 20;
            } else if (posx >= bright * frame_rect.width) {
               viewmode = "right";
               posx = frame_rect.width - 60;
            } else {
               posx = hintsg.property('startx');
            }
         } else {
            viewmode = "single";
            posx += 15;
         }

         if (viewmode !== hintsg.property('viewmode')) {
            hintsg.property('viewmode', viewmode);
            hintsg.selectAll("*").remove();
         }

         let curry = 10, // normal y coordinate
            gapy = 10,  // y coordinate, taking into account all gaps
            gapminx = -1111, gapmaxx = -1111,
            minhinty = -frame_shift.y,
            maxhinty = this.pad_height("") - frame_rect.y - frame_shift.y;

         function FindPosInGap(y) {
            for (let n = 0; (n < hints.length) && (y < maxhinty); ++n) {
               let hint = hints[n];
               if (!hint) continue;
               if ((hint.y >= y - 5) && (hint.y <= y + hint.height + 5)) {
                  y = hint.y + 10;
                  n = -1;
               }
            }
            return y;
         }

         for (let n = 0; n < hints.length; ++n) {
            let hint = hints[n],
               group = hintsg.select(".painter_hint_" + n);
            if (hint === null) {
               group.remove();
               continue;
            }

            let was_empty = group.empty();

            if (was_empty)
               group = hintsg.append("svg:svg")
                  .attr("class", "painter_hint_" + n)
                  .attr('opacity', 0) // use attribute, not style to make animation with d3.transition()
                  .style('overflow', 'hidden')
                  .style("pointer-events", "none");

            if (viewmode == "single") {
               curry = pnt.touch ? (pnt.y - hint.height - 5) : Math.min(pnt.y + 15, maxhinty - hint.height - 3) + frame_rect.hint_delta_y;
            } else {
               gapy = FindPosInGap(gapy);
               if ((gapminx === -1111) && (gapmaxx === -1111)) gapminx = gapmaxx = hint.x;
               gapminx = Math.min(gapminx, hint.x);
               gapmaxx = Math.min(gapmaxx, hint.x);
            }

            group.attr("x", posx)
               .attr("y", curry)
               .property("curry", curry)
               .property("gapy", gapy);

            curry += hint.height + 5;
            gapy += hint.height + 5;

            if (!was_empty)
               group.selectAll("*").remove();

            group.attr("width", 60)
               .attr("height", hint.height);

            let r = group.append("rect")
               .attr("x", 0)
               .attr("y", 0)
               .attr("width", 60)
               .attr("height", hint.height)
               .attr("fill", "lightgrey")
               .style("pointer-events", "none");

            if (nhints > 1) {
               let col = usecolor1 ? hint.color1 : hint.color2;
               if ((col !== undefined) && (col !== 'none'))
                  r.attr("stroke", col).attr("stroke-width", hint.exact ? 3 : 1);
            }

            for (let l = 0; l < (hint.lines ? hint.lines.length : 0); l++)
               if (hint.lines[l] !== null) {
                  let txt = group.append("svg:text")
                     .attr("text-anchor", "start")
                     .attr("x", wmargin)
                     .attr("y", hmargin + l * textheight * hstep)
                     .attr("dy", ".8em")
                     .attr("fill", "black")
                     .style("pointer-events", "none")
                     .call(font.func)
                     .text(hint.lines[l]);

                  let box = this.GetBoundarySizes(txt.node());

                  actualw = Math.max(actualw, box.width);
               }

            function translateFn() {
               // We only use 'd', but list d,i,a as params just to show can have them as params.
               // Code only really uses d and t.
               return function(/*d, i, a*/) {
                  return function(t) {
                     return t < 0.8 ? "0" : (t - 0.8) * 5;
                  };
               };
            }

            if (was_empty)
               if (JSROOT.gStyle.TooltipAnimation > 0)
                  group.transition().duration(JSROOT.gStyle.TooltipAnimation).attrTween("opacity", translateFn());
               else
                  group.attr('opacity', 1);
         }

         actualw += 2 * wmargin;

         let svgs = hintsg.selectAll("svg");

         if ((viewmode == "right") && (posx + actualw > frame_rect.width - 20)) {
            posx = frame_rect.width - actualw - 20;
            svgs.attr("x", posx);
         }

         if ((viewmode == "single") && (posx + actualw > pad_width - frame_rect.x) && (posx > actualw + 20)) {
            posx -= (actualw + 20);
            svgs.attr("x", posx);
         }

         // if gap not very big, apply gapy coordinate to open view on the histogram
         if ((viewmode !== "single") && (gapy < maxhinty) && (gapy !== curry)) {
            if ((gapminx <= posx + actualw + 5) && (gapmaxx >= posx - 5))
               svgs.attr("y", function() { return d3.select(this).property('gapy'); });
         } else if ((viewmode !== 'single') && (curry > maxhinty)) {
            let shift = Math.max((maxhinty - curry - 10), minhinty);
            if (shift < 0)
               svgs.attr("y", function() { return d3.select(this).property('curry') + shift; });
         }

         if (actualw > 10)
            svgs.attr("width", actualw)
               .select('rect').attr("width", actualw);

         hintsg.property('startx', posx);
      }
   } // TooltipHandler

   JSROOT.TCanvasStatusBits = {
      kShowEventStatus: JSROOT.BIT(15),
      kAutoExec: JSROOT.BIT(16),
      kMenuBar: JSROOT.BIT(17),
      kShowToolBar: JSROOT.BIT(18),
      kShowEditor: JSROOT.BIT(19),
      kMoveOpaque: JSROOT.BIT(20),
      kResizeOpaque: JSROOT.BIT(21),
      kIsGrayscale: JSROOT.BIT(22),
      kShowToolTips: JSROOT.BIT(23)
   };

   JSROOT.EAxisBits = {
      kTickPlus: JSROOT.BIT(9),
      kTickMinus: JSROOT.BIT(10),
      kAxisRange: JSROOT.BIT(11),
      kCenterTitle: JSROOT.BIT(12),
      kCenterLabels: JSROOT.BIT(14),
      kRotateTitle: JSROOT.BIT(15),
      kPalette: JSROOT.BIT(16),
      kNoExponent: JSROOT.BIT(17),
      kLabelsHori: JSROOT.BIT(18),
      kLabelsVert: JSROOT.BIT(19),
      kLabelsDown: JSROOT.BIT(20),
      kLabelsUp: JSROOT.BIT(21),
      kIsInteger: JSROOT.BIT(22),
      kMoreLogLabels: JSROOT.BIT(23),
      kDecimals: JSROOT.BIT(11)
   };

   // ================= painter of raw text ========================================


   Painter.drawRawText = function(divid, txt /*, opt*/) {

      let painter = new BasePainter();
      painter.txt = txt;
      painter.SetDivId(divid);

      painter.RedrawObject = function(obj) {
         this.txt = obj;
         this.Draw();
         return true;
      }

      painter.Draw = function() {
         let txt = (this.txt._typename && (this.txt._typename == "TObjString")) ? this.txt.fString : this.txt.value;
         if (typeof txt != 'string') txt = "<undefined>";

         let mathjax = this.txt.mathjax || (JSROOT.gStyle.Latex == 4);

         if (!mathjax && !('as_is' in this.txt)) {
            let arr = txt.split("\n"); txt = "";
            for (let i = 0; i < arr.length; ++i)
               txt += "<pre style='margin:0'>" + arr[i] + "</pre>";
         }

         let frame = this.select_main(),
            main = frame.select("div");
         if (main.empty())
            main = frame.append("div").style('max-width', '100%').style('max-height', '100%').style('overflow', 'auto');
         main.html(txt);

         // (re) set painter to first child element
         this.SetDivId(this.divid);

         if (mathjax)
            JSROOT.require('mathjax').then(() => MathJax.Hub.Typeset(frame.node()));
      }

      painter.Draw();
      return painter.Promise(true);
   }

   /** @summary Register handle to react on window resize
    *
    * @desc function used to react on browser window resize event
    * While many resize events could come in short time,
    * resize will be handled with delay after last resize event
    * handle can be function or object with CheckResize function
    * one could specify delay after which resize event will be handled
    * @private
    */
   JSROOT.RegisterForResize = function(handle, delay) {

      if (!handle) return;

      let myInterval = null, myDelay = delay ? delay : 300;

      if (myDelay < 20) myDelay = 20;

      function ResizeTimer() {
         myInterval = null;

         document.body.style.cursor = 'wait';
         if (typeof handle == 'function') handle(); else
            if ((typeof handle == 'object') && (typeof handle.CheckResize == 'function')) handle.CheckResize(); else
               if (typeof handle == 'string') {
                  let node = d3.select('#' + handle);
                  if (!node.empty()) {
                     let mdi = node.property('mdi');
                     if (mdi) {
                        mdi.CheckMDIResize();
                     } else {
                        JSROOT.resize(node.node());
                     }
                  }
               }
         document.body.style.cursor = 'auto';
      }

      function ProcessResize() {
         if (myInterval !== null) clearTimeout(myInterval);
         myInterval = setTimeout(ResizeTimer, myDelay);
      }

      window.addEventListener('resize', ProcessResize);
   }

   // list of user painters, called with arguments func(vis, obj, opt)
   JSROOT.DrawFuncs = { lst:[
      { name: "TCanvas", icon: "img_canvas", prereq: "v6", func: "JSROOT.Painter.drawCanvas", opt: ";grid;gridx;gridy;tick;tickx;ticky;log;logx;logy;logz", expand_item: "fPrimitives" },
      { name: "TPad", icon: "img_canvas", prereq: "v6", func: "JSROOT.Painter.drawPad", opt: ";grid;gridx;gridy;tick;tickx;ticky;log;logx;logy;logz", expand_item: "fPrimitives" },
      { name: "TSlider", icon: "img_canvas", prereq: "v6", func: "JSROOT.Painter.drawPad" },
      { name: "TFrame", icon: "img_frame", prereq: "v6", func: "JSROOT.Painter.drawFrame" },
      { name: "TPave", icon: "img_pavetext", prereq: "v6;hist", func: "JSROOT.Painter.drawPave" },
      { name: "TPaveText", icon: "img_pavetext", prereq: "v6;hist", func: "JSROOT.Painter.drawPave" },
      { name: "TPavesText", icon: "img_pavetext", prereq: "v6;hist", func: "JSROOT.Painter.drawPave" },
      { name: "TPaveStats", icon: "img_pavetext", prereq: "v6;hist", func: "JSROOT.Painter.drawPave" },
      { name: "TPaveLabel", icon: "img_pavelabel", prereq: "v6;hist", func: "JSROOT.Painter.drawPave" },
      { name: "TDiamond", icon: "img_pavelabel", prereq: "v6;hist", func: "JSROOT.Painter.drawPave" },
      { name: "TLatex", icon: "img_text", prereq: "more2d", func: "JSROOT.Painter.drawText", direct: true },
      { name: "TMathText", icon: "img_text", prereq: "more2d", func: "JSROOT.Painter.drawText", direct: true },
      { name: "TText", icon: "img_text", prereq: "more2d", func: "JSROOT.Painter.drawText", direct: true },
      { name: /^TH1/, icon: "img_histo1d", prereq: "v6;hist", func: "JSROOT.Painter.drawHistogram1D", opt:";hist;P;P0;E;E1;E2;E3;E4;E1X0;L;LF2;B;B1;A;TEXT;LEGO;same", ctrl: "l" },
      { name: "TProfile", icon: "img_profile", prereq: "v6;hist", func: "JSROOT.Painter.drawHistogram1D", opt:";E0;E1;E2;p;AH;hist"},
      { name: "TH2Poly", icon: "img_histo2d", prereq: "v6;hist", func: "JSROOT.Painter.drawHistogram2D", opt:";COL;COL0;COLZ;LCOL;LCOL0;LCOLZ;LEGO;TEXT;same", expand_item: "fBins", theonly: true },
      { name: "TProfile2Poly", sameas: "TH2Poly" },
      { name: "TH2PolyBin", icon: "img_histo2d", draw_field: "fPoly" },
      { name: /^TH2/, icon: "img_histo2d", prereq: "v6;hist", func: "JSROOT.Painter.drawHistogram2D", opt:";COL;COLZ;COL0;COL1;COL0Z;COL1Z;COLA;BOX;BOX1;PROJ;PROJX1;PROJX2;PROJX3;PROJY1;PROJY2;PROJY3;SCAT;TEXT;TEXTE;TEXTE0;CONT;CONT1;CONT2;CONT3;CONT4;ARR;SURF;SURF1;SURF2;SURF4;SURF6;E;A;LEGO;LEGO0;LEGO1;LEGO2;LEGO3;LEGO4;same", ctrl: "colz" },
      { name: "TProfile2D", sameas: "TH2" },
      { name: /^TH3/, icon: 'img_histo3d', prereq: "v6;hist3d", func: "JSROOT.Painter.drawHistogram3D", opt:";SCAT;BOX;BOX2;BOX3;GLBOX1;GLBOX2;GLCOL" },
      { name: "THStack", icon: "img_histo1d", prereq: "v6;hist", func: "JSROOT.Painter.drawHStack", expand_item: "fHists", opt: "NOSTACK;HIST;E;PFC;PLC" },
      { name: "TPolyMarker3D", icon: 'img_histo3d', prereq: "v6;hist3d", func: "JSROOT.Painter.drawPolyMarker3D" },
      { name: "TPolyLine3D", icon: 'img_graph', prereq: "3d", func: "JSROOT.Painter.drawPolyLine3D", direct: true },
      { name: "TGraphStruct" },
      { name: "TGraphNode" },
      { name: "TGraphEdge" },
      { name: "TGraphTime", icon:"img_graph", prereq: "more2d", func: "JSROOT.Painter.drawGraphTime", opt: "once;repeat;first", theonly: true },
      { name: "TGraph2D", icon:"img_graph", prereq: "v6;hist3d", func: "JSROOT.Painter.drawGraph2D", opt: ";P;PCOL", theonly: true },
      { name: "TGraph2DErrors", icon:"img_graph", prereq: "v6;hist3d", func: "JSROOT.Painter.drawGraph2D", opt: ";P;PCOL;ERR", theonly: true },
      { name: "TGraphPolargram", icon:"img_graph", prereq: "more2d", func: "JSROOT.Painter.drawGraphPolargram", theonly: true },
      { name: "TGraphPolar", icon:"img_graph", prereq: "more2d", func: "JSROOT.Painter.drawGraphPolar", opt: ";F;L;P;PE", theonly: true },
      { name: /^TGraph/, icon:"img_graph", prereq: "more2d", func: "JSROOT.Painter.drawGraph", opt: ";L;P" },
      { name: "TEfficiency", icon:"img_graph", prereq: "more2d", func: "JSROOT.Painter.drawEfficiency", opt: ";AP" },
      { name: "TCutG", sameas: "TGraph" },
      { name: /^RooHist/, sameas: "TGraph" },
      { name: /^RooCurve/, sameas: "TGraph" },
      { name: "RooPlot", icon: "img_canvas", prereq: "more2d", func: "JSROOT.Painter.drawRooPlot" },
      { name: "TMultiGraph", icon: "img_mgraph", prereq: "more2d", func: "JSROOT.Painter.drawMultiGraph", expand_item: "fGraphs" },
      { name: "TStreamerInfoList", icon: 'img_question', prereq: "hierarchy",  func: "JSROOT.Painter.drawStreamerInfo" },
      { name: "TPaletteAxis", icon: "img_colz", prereq: "v6;hist", func: "JSROOT.Painter.drawPave" },
      { name: "TWebPainting", icon: "img_graph", prereq: "more2d", func: "JSROOT.Painter.drawWebPainting" },
      { name: "TCanvasWebSnapshot", icon: "img_canvas", prereq: "v6", func: "JSROOT.Painter.drawPadSnapshot" },
      { name: "TPadWebSnapshot", sameas: "TCanvasWebSnapshot" },
      { name: "kind:Text", icon: "img_text", func: JSROOT.Painter.drawRawText },
      { name: "TObjString", icon: "img_text", func: JSROOT.Painter.drawRawText },
      { name: "TF1", icon: "img_tf1", prereq: "math;more2d", func: "JSROOT.Painter.drawFunction" },
      { name: "TF2", icon: "img_tf2", prereq: "math;hist", func: "JSROOT.Painter.drawTF2" },
      { name: "TSpline3", icon: "img_tf1", prereq: "more2d", func: "JSROOT.Painter.drawSpline" },
      { name: "TSpline5", icon: "img_tf1", prereq: "more2d", func: "JSROOT.Painter.drawSpline" },
      { name: "TEllipse", icon: 'img_graph', prereq: "more2d", func: "JSROOT.Painter.drawEllipse", direct: true },
      { name: "TArc", sameas: 'TEllipse' },
      { name: "TCrown", sameas: 'TEllipse' },
      { name: "TPie", icon: 'img_graph', prereq: "more2d", func: "JSROOT.Painter.drawPie", direct: true },
      { name: "TLine", icon: 'img_graph', prereq: "more2d", func: "JSROOT.Painter.drawLine", direct: true },
      { name: "TArrow", icon: 'img_graph', prereq: "more2d", func: "JSROOT.Painter.drawArrow", direct: true },
      { name: "TPolyLine", icon: 'img_graph', prereq: "more2d", func: "JSROOT.Painter.drawPolyLine", direct: true },
      { name: "TCurlyLine", sameas: 'TPolyLine' },
      { name: "TCurlyArc", sameas: 'TPolyLine' },
      { name: "TGaxis", icon: "img_graph", prereq: "v6", func: "JSROOT.Painter.drawGaxis" },
      { name: "TLegend", icon: "img_pavelabel", prereq: "v6;hist", func: "JSROOT.Painter.drawPave" },
      { name: "TBox", icon: 'img_graph', prereq: "more2d", func: "JSROOT.Painter.drawBox", direct: true },
      { name: "TWbox", icon: 'img_graph', prereq: "more2d", func: "JSROOT.Painter.drawBox", direct: true },
      { name: "TSliderBox", icon: 'img_graph', prereq: "more2d", func: "JSROOT.Painter.drawBox", direct: true },
      { name: "TAxis3D", prereq: "v6;hist3d", func: "JSROOT.Painter.drawAxis3D" },
      { name: "TMarker", icon: 'img_graph', prereq: "more2d", func: "JSROOT.Painter.drawMarker", direct: true },
      { name: "TPolyMarker", icon: 'img_graph', prereq: "more2d", func: "JSROOT.Painter.drawPolyMarker", direct: true },
      { name: "TASImage", icon: 'img_mgraph', prereq: "more2d", func: "JSROOT.Painter.drawASImage" },
      { name: "TJSImage", icon: 'img_mgraph', prereq: "more2d", func: "JSROOT.Painter.drawJSImage", opt: ";scale;center" },
      { name: "TGeoVolume", icon: 'img_histo3d', prereq: "geom", func: "JSROOT.Painter.drawGeoObject", expand: "JSROOT.GEO.expandObject", opt:";more;all;count;projx;projz;wire;dflt", ctrl: "dflt" },
      { name: "TEveGeoShapeExtract", icon: 'img_histo3d', prereq: "geom", func: "JSROOT.Painter.drawGeoObject", expand: "JSROOT.GEO.expandObject", opt: ";more;all;count;projx;projz;wire;dflt", ctrl: "dflt"  },
      { name: "ROOT::Experimental::REveGeoShapeExtract", icon: 'img_histo3d', prereq: "geom", func: "JSROOT.Painter.drawGeoObject", expand: "JSROOT.GEO.expandObject", opt: ";more;all;count;projx;projz;wire;dflt", ctrl: "dflt" },
      { name: "TGeoOverlap", icon: 'img_histo3d', prereq: "geom", expand: "JSROOT.GEO.expandObject", func: "JSROOT.Painter.drawGeoObject", opt: ";more;all;count;projx;projz;wire;dflt", dflt: "dflt", ctrl: "expand" },
      { name: "TGeoManager", icon: 'img_histo3d', prereq: "geom", expand: "JSROOT.GEO.expandObject", func: "JSROOT.Painter.drawGeoObject", opt: ";more;all;count;projx;projz;wire;tracks;dflt", dflt: "expand", ctrl: "dflt" },
      { name: /^TGeo/, icon: 'img_histo3d', prereq: "geom", func: "JSROOT.Painter.drawGeoObject", opt: ";more;all;axis;compa;count;projx;projz;wire;dflt", ctrl: "dflt" },
      // these are not draw functions, but provide extra info about correspondent classes
      { name: "kind:Command", icon: "img_execute", execute: true },
      { name: "TFolder", icon: "img_folder", icon2: "img_folderopen", noinspect: true, prereq: "hierarchy", expand: "JSROOT.Painter.FolderHierarchy" },
      { name: "TTask", icon: "img_task", prereq: "hierarchy", expand: "JSROOT.Painter.TaskHierarchy", for_derived: true },
      { name: "TTree", icon: "img_tree", prereq: "tree;more2d", expand: 'JSROOT.Painter.TreeHierarchy', func: 'JSROOT.Painter.drawTree', dflt: "expand", opt: "player;testio", shift: "inspect" },
      { name: "TNtuple", icon: "img_tree", prereq: "tree;more2d", expand: 'JSROOT.Painter.TreeHierarchy', func: 'JSROOT.Painter.drawTree', dflt: "expand", opt: "player;testio", shift: "inspect" },
      { name: "TNtupleD", icon: "img_tree", prereq: "tree;more2d", expand: 'JSROOT.Painter.TreeHierarchy', func: 'JSROOT.Painter.drawTree', dflt: "expand", opt: "player;testio", shift: "inspect" },
      { name: "TBranchFunc", icon: "img_leaf_method", prereq: "tree;more2d", func: 'JSROOT.Painter.drawTree', opt: ";dump", noinspect: true },
      { name: /^TBranch/, icon: "img_branch", prereq: "tree;more2d", func: 'JSROOT.Painter.drawTree', dflt: "expand", opt: ";dump", ctrl: "dump", shift: "inspect", ignore_online: true },
      { name: /^TLeaf/, icon: "img_leaf", prereq: "tree;more2d", noexpand: true, func: 'JSROOT.Painter.drawTree', opt: ";dump", ctrl: "dump", ignore_online: true },
      { name: "TList", icon: "img_list", prereq: "hierarchy", func: "JSROOT.Painter.drawList", expand: "JSROOT.Painter.ListHierarchy", dflt: "expand" },
      { name: "THashList", sameas: "TList" },
      { name: "TObjArray", sameas: "TList" },
      { name: "TClonesArray", sameas: "TList" },
      { name: "TMap", sameas: "TList" },
      { name: "TColor", icon: "img_color" },
      { name: "TFile", icon: "img_file", noinspect:true },
      { name: "TMemFile", icon: "img_file", noinspect:true },
      { name: "TStyle", icon: "img_question", noexpand:true },
      { name: "Session", icon: "img_globe" },
      { name: "kind:TopFolder", icon: "img_base" },
      { name: "kind:Folder", icon: "img_folder", icon2: "img_folderopen", noinspect:true },

      { name: "ROOT::Experimental::RCanvas", icon: "img_canvas", prereq: "v7", func: "JSROOT.v7.drawCanvas", opt: "", expand_item: "fPrimitives" },
      { name: "ROOT::Experimental::RCanvasDisplayItem", icon: "img_canvas", prereq: "v7", func: "JSROOT.v7.drawPadSnapshot", opt: "", expand_item: "fPrimitives" }

   ], cache: {} };

   /** @summary Register draw function for the class
    * @desc List of supported draw options could be provided, separated  with ';'
    * Several different draw functions for the same class or kind could be specified
    * @param {object} args - arguments
    * @param {string} args.name - class name
    * @param {string} [args.prereq] - prerequicities to load before search for the draw function
    * @param {string} args.func - name of draw function for the class
    * @param {string} [args.direct=false] - if true, function is just Redraw() method of TObjectPainter
    * @param {string} args.opt - list of supported draw options (separated with semicolon) like "col;scat;"
    * @param {string} [args.icon] - icon name shown for the class in hierarchy browser
    */
   JSROOT.addDrawFunc = function(_name, _func, _opt) {
      if ((arguments.length == 1) && (typeof arguments[0] == 'object')) {
         JSROOT.DrawFuncs.lst.push(arguments[0]);
         return arguments[0];
      }
      var handle = { name:_name, func:_func, opt:_opt };
      JSROOT.DrawFuncs.lst.push(handle);
      return handle;
   }


   JSROOT.getDrawHandle = function(kind, selector) {
      // return draw handle for specified item kind
      // kind could be ROOT.TH1I for ROOT classes or just
      // kind string like "Command" or "Text"
      // selector can be used to search for draw handle with specified option (string)
      // or just sequence id

      if (typeof kind != 'string') return null;
      if (selector === "") selector = null;

      let first = null;

      if ((selector === null) && (kind in JSROOT.DrawFuncs.cache))
         return JSROOT.DrawFuncs.cache[kind];

      let search = (kind.indexOf("ROOT.") == 0) ? kind.substr(5) : "kind:" + kind, counter = 0;
      for (let i = 0; i < JSROOT.DrawFuncs.lst.length; ++i) {
         let h = JSROOT.DrawFuncs.lst[i];
         if (typeof h.name == "string") {
            if (h.name != search) continue;
         } else {
            if (!search.match(h.name)) continue;
         }

         if (h.sameas !== undefined)
            return JSROOT.getDrawHandle("ROOT." + h.sameas, selector);

         if ((selector === null) || (selector === undefined)) {
            // store found handle in cache, can reuse later
            if (!(kind in JSROOT.DrawFuncs.cache)) JSROOT.DrawFuncs.cache[kind] = h;
            return h;
         } else if (typeof selector == 'string') {
            if (!first) first = h;
            // if drawoption specified, check it present in the list

            if (selector == "::expand") {
               if (('expand' in h) || ('expand_item' in h)) return h;
            } else
               if ('opt' in h) {
                  let opts = h.opt.split(';');
                  for (let j = 0; j < opts.length; ++j) opts[j] = opts[j].toLowerCase();
                  if (opts.indexOf(selector.toLowerCase()) >= 0) return h;
               }
         } else if (selector === counter) {
            return h;
         }
         ++counter;
      }

      return first;
   }

   /** @summary Scan streamer infos for derived classes
    * @desc Assign draw functions for such derived classes
    * @private */
   JSROOT.addStreamerInfos = function(lst) {
      if (!lst) return;

      function CheckBaseClasses(si, lvl) {
         if (si.fElements == null) return null;
         if (lvl > 10) return null; // protect against recursion

         for (let j = 0; j < si.fElements.arr.length; ++j) {
            // extract streamer info for each class member
            let element = si.fElements.arr[j];
            if (element.fTypeName !== 'BASE') continue;

            let handle = JSROOT.getDrawHandle("ROOT." + element.fName);
            if (handle && !handle.for_derived) handle = null;

            // now try find that base class of base in the list
            if (handle === null)
               for (let k = 0; k < lst.arr.length; ++k)
                  if (lst.arr[k].fName === element.fName) {
                     handle = CheckBaseClasses(lst.arr[k], lvl + 1);
                     break;
                  }

            if (handle && handle.for_derived) return handle;
         }
         return null;
      }

      for (let n = 0; n < lst.arr.length; ++n) {
         let si = lst.arr[n];
         if (JSROOT.getDrawHandle("ROOT." + si.fName) !== null) continue;

         let handle = CheckBaseClasses(si, 0);

         if (!handle) continue;

         let newhandle = JSROOT.extend({}, handle);
         // delete newhandle.for_derived; // should we disable?
         newhandle.name = si.fName;
         JSROOT.DrawFuncs.lst.push(newhandle);
      }
   }

   /** @summary Provide draw settings for specified class or kind
    * @private
    */
   JSROOT.getDrawSettings = function(kind, selector) {
      let res = { opts: null, inspect: false, expand: false, draw: false, handle: null };
      if (typeof kind != 'string') return res;
      let isany = false, noinspect = false, canexpand = false;
      if (typeof selector !== 'string') selector = "";

      for (let cnt = 0; cnt < 1000; ++cnt) {
         let h = JSROOT.getDrawHandle(kind, cnt);
         if (!h) break;
         if (!res.handle) res.handle = h;
         if (h.noinspect) noinspect = true;
         if (h.expand || h.expand_item || h.can_expand) canexpand = true;
         if (!('func' in h)) break;
         isany = true;
         if (!('opt' in h)) continue;
         let opts = h.opt.split(';');
         for (let i = 0; i < opts.length; ++i) {
            opts[i] = opts[i].toLowerCase();
            if ((selector.indexOf('nosame') >= 0) && (opts[i].indexOf('same') == 0)) continue;

            if (res.opts === null) res.opts = [];
            if (res.opts.indexOf(opts[i]) < 0) res.opts.push(opts[i]);
         }
         if (h.theonly) break;
      }

      if (selector.indexOf('noinspect') >= 0) noinspect = true;

      if (isany && (res.opts === null)) res.opts = [""];

      // if no any handle found, let inspect ROOT-based objects
      if (!isany && (kind.indexOf("ROOT.") == 0) && !noinspect) res.opts = [];

      if (!noinspect && res.opts)
         res.opts.push("inspect");

      res.inspect = !noinspect;
      res.expand = canexpand;
      res.draw = res.opts && (res.opts.length > 0);

      return res;
   }

   /** Returns array with supported draw options for the specified kind
    * @private */
   JSROOT.getDrawOptions = function(kind /*, selector*/) {
      return JSROOT.getDrawSettings(kind).opts;
   }

   /** @summary Returns true if provided object class can be drawn
    * @private */
   JSROOT.canDraw = function(classname) {
      return JSROOT.getDrawSettings("ROOT." + classname).opts !== null;
   }

   /** @summary Returns true if provided object looks like a promise
    * @private */
   JSROOT.isPromise = function(obj) {
      return obj && (typeof obj == 'object') && (typeof obj.then == 'function');
   }

   /**
    * @summary Draw object in specified HTML element with given draw options.
    *
    * @param {string|object} divid - id of div element to draw or directly DOMElement
    * @param {object} obj - object to draw, object type should be registered before in JSROOT
    * @param {string} opt - draw options separated by space, comma or semicolon
    * @param {function} drawcallback - function called when drawing is completed, first argument is object painter instance
    *
    * @desc
    * A complete list of options can be found depending of the object's ROOT class to draw: {@link https://root.cern/js/latest/examples.htm}
    *
    * @example
    * let filename = "https://root.cern/js/files/hsimple.root";
    * JSROOT.OpenFile(filename).then(file => {
    *    file.ReadObject("hpxpy;1").then(obj => {
    *       JSROOT.draw("drawing", obj, "colz;logx;gridx;gridy");
    *    });
    * });
    *
    */

   JSROOT.draw = function(divid, obj, opt) {

      if (!obj || (typeof obj !== 'object'))
         return Promise.reject(new Error('not an object in JSROOT.draw'));

      if (opt == 'inspect') {
         if (Painter.drawInspector) return Painter.drawInspector(divid, obj);
         return JSROOT.require("hierarchy").then(() => JSROOT.Painter.drawInspector(divid, obj));
      }

      let handle = null;
      if ('_typename' in obj) handle = JSROOT.getDrawHandle("ROOT." + obj._typename, opt);
      else if ('_kind' in obj) handle = JSROOT.getDrawHandle(obj._kind, opt);

      // this is case of unsupported class, close it normally
      if (!handle) return Promise.resolve(null);

      if (handle.draw_field && obj[handle.draw_field])
         return JSROOT.draw(divid, obj[handle.draw_field], opt);

      if (!handle.func) {
         if (opt && (opt.indexOf("same") >= 0)) {
            let main_painter = JSROOT.GetMainPainter(divid);
            if (main_painter && (typeof main_painter.PerformDrop === 'function'))
               return main_painter.PerformDrop(obj, "", null, opt);
         }

         return Promise.reject(Error('Function not specified'));
      }

      return new Promise(function(resolveFunc, rejectFunc) {

         function completeDraw(painter) {
            if (JSROOT.isPromise(painter)) {
               painter.then(resolveFunc, rejectFunc);
            } else if (painter && (typeof painter == 'object') && (typeof painter.WhenReady == 'function'))
               painter.WhenReady(resolveFunc, rejectFunc);
            else if (painter)
               resolveFunc(painter);
            else
               rejectFunc(Error("fail to draw"));
         }

         let painter = null;

         function performDraw() {
            let promise;
            if (handle.direct) {
               painter = new ObjectPainter(obj, opt);
               painter.csstype = handle.csstype;
               painter.SetDivId(divid, 2);
               painter.Redraw = handle.func;
               let promise = painter.Redraw();
               if (!JSROOT.isPromise(promise)) {
                  painter.DrawingReady();
                  promise = undefined;
               }
            } else {
               painter = handle.func(divid, obj, opt);

               if (!JSROOT.isPromise(painter) && painter && !painter.options)
                  painter.options = { original: opt || "" };
            }

            completeDraw(promise || painter);
         }

         if (typeof handle.func == 'function')
            return performDraw();

         let funcname = "", prereq = "";
         if (typeof handle.func == 'object') {
            if ('func' in handle.func) funcname = handle.func.func;
            if ('script' in handle.func) prereq = "user:" + handle.func.script;
         } else if (typeof handle.func == 'string') {
            funcname = handle.func;
            if (('prereq' in handle) && (typeof handle.prereq == 'string')) prereq = handle.prereq;
            if (('script' in handle) && (typeof handle.script == 'string')) prereq += ";user:" + handle.script;
         }

         if (!funcname.length) return completeDraw(null);

         // try to find function without prerequisites
         let func = JSROOT.findFunction(funcname);
         if (func) {
            handle.func = func; // remember function once it is found
            return performDraw();
         }

         if (!prereq.length)
            return completeDraw(null);

         JSROOT.require(prereq).then(() => {
            let func = JSROOT.findFunction(funcname);
            if (!func) {
               alert('Fail to find function ' + funcname + ' after loading ' + prereq);
               return completeDraw(null);
            }

            handle.func = func; // remember function once it found

            performDraw();
         });
      }); // Promise
   }

   /**
    * @summary Redraw object in specified HTML element with given draw options.
    *
    * @desc If drawing was not drawn before, it will be performed with {@link JSROOT.draw}.
    * If drawing was already done, that content will be updated
    * @param {string|object} divid - id of div element to draw or directly DOMElement
    * @param {object} obj - object to draw, object type should be registered before in JSROOT
    * @param {string} opt - draw options
    * @param {function} callback - function called when drawing is completed, first argument will be object painter instance
    */
   JSROOT.redraw = function(divid, obj, opt) {

      if (!obj || (typeof obj !== 'object'))
         return Promise.reject(new Error('not an object in JSROOT.draw'));

      let dummy = new ObjectPainter();
      dummy.SetDivId(divid, -1);
      let can_painter = dummy.canv_painter();

      let handle = null;
      if (obj._typename) handle = JSROOT.getDrawHandle("ROOT." + obj._typename);
      if (handle && handle.draw_field && obj[handle.draw_field])
         obj = obj[handle.draw_field];

      if (can_painter) {
         if (obj._typename === "TCanvas") {
            can_painter.RedrawObject(obj);
            return Promise.resolve(can_painter);
         }

         for (let i = 0; i < can_painter.painters.length; ++i) {
            let painter = can_painter.painters[i];
            if (painter.MatchObjectType(obj._typename))
               if (painter.UpdateObject(obj, opt)) {
                  can_painter.RedrawPad();
                  return Promise.resolve(painter);
               }
         }
      }

      if (can_painter)
         JSROOT.console("Cannot find painter to update object of type " + obj._typename);

      JSROOT.cleanup(divid);

      return JSROOT.draw(divid, obj, opt);
   }

   /** @summary Save object, drawn in specified element, as JSON.
    *
    * @desc Normally it is TCanvas object with list of primitives
    * @param {string|object} divid - id of top div element or directly DOMElement
    * @returns {string} produced JSON string
    */

   JSROOT.StoreJSON = function(divid) {
      let p = new ObjectPainter;
      p.SetDivId(divid, -1);

      let canp = p.canv_painter();
      return canp ? canp.ProduceJSON() : "";
   }


   /** @summary Create SVG image for provided object.
    *
    * @desc Function especially useful in Node.js environment to generate images for
    * supported ROOT classes
    *
    * @param {object} args - contains different settings
    * @param {object} args.object - object for the drawing
    * @param {string} [args.option] - draw options
    * @param {number} [args.width = 1200] - image width
    * @param {number} [args.height = 800] - image height
    * @returns {Promise} with svg code
    */
   JSROOT.MakeSVG = function(args) {

      if (!args) args = {};

      if (!args.object) return Promise.reject(Error("No object specified to generate SVG"));

      if (!args.width) args.width = 1200;
      if (!args.height) args.height = 800;

      function build(main) {

         main.attr("width", args.width).attr("height", args.height);

         main.style("width", args.width + "px").style("height", args.height + "px");

         JSROOT.svg_workaround = undefined;

         return JSROOT.draw(main.node(), args.object, args.option || "").then(() => {

            let has_workarounds = JSROOT.Painter.ProcessSVGWorkarounds && JSROOT.svg_workaround;

            main.select('svg').attr("xmlns", "http://www.w3.org/2000/svg")
               .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
               .attr("width", args.width)
               .attr("height", args.height)
               .attr("style", null).attr("class", null).attr("x", null).attr("y", null);

            let svg = main.html();

            if (has_workarounds)
               svg = JSROOT.Painter.ProcessSVGWorkarounds(svg);

            svg = svg.replace(/url\(\&quot\;\#(\w+)\&quot\;\)/g, "url(#$1)")  // decode all URL
               .replace(/ class=\"\w*\"/g, "")                                // remove all classes
               .replace(/<g transform=\"translate\(\d+\,\d+\)\"><\/g>/g, "")  // remove all empty groups with transform
               .replace(/<g><\/g>/g, "");                                     // remove all empty groups

            // remove all empty frame svgs, typically appears in 3D drawings, maybe should be improved in frame painter itself
            svg = svg.replace(/<svg x=\"0\" y=\"0\" overflow=\"hidden\" width=\"\d+\" height=\"\d+\" viewBox=\"0 0 \d+ \d+\"><\/svg>/g, "")

            if (svg.indexOf("xlink:href") < 0)
               svg = svg.replace(/ xmlns:xlink=\"http:\/\/www.w3.org\/1999\/xlink\"/g, "");

            main.remove();

            return svg;
         });
      }

      if (!JSROOT.nodejs)
         return build(d3.select('body').append("div").style("visible", "hidden"));

      if (!JSROOT.nodejs_document) {
         // use eval while old minifier is not able to parse newest Node.js syntax
         const { JSDOM } = require("jsdom");
         JSROOT.nodejs_window = (new JSDOM("<!DOCTYPE html>hello")).window;
         JSROOT.nodejs_document = JSROOT.nodejs_window.document; // used with three.js
         JSROOT.nodejs_window.d3 = d3.select(JSROOT.nodejs_document); //get d3 into the dom
      }

      return build(JSROOT.nodejs_window.d3.select('body').append('div'));
   }

   /**
    * @summary Check resize of drawn element
    *
    * @desc As first argument divid one should use same argument as for the drawing
    * As second argument, one could specify "true" value to force redrawing of
    * the element even after minimal resize of the element
    * Or one just supply object with exact sizes like { width:300, height:200, force:true };
    * @param {string|object} divid - id or DOM element
    * @param {boolean|object} arg - options on how to resize
    *
    * @example
    * JSROOT.resize("drawing", { width: 500, height: 200 } );
    * JSROOT.resize(document.querySelector("#drawing"), true);
    */
   JSROOT.resize = function(divid, arg) {
      if (arg === true) arg = { force: true }; else
         if (typeof arg !== 'object') arg = null;
      let done = false, dummy = new ObjectPainter();
      dummy.SetDivId(divid, -1);
      dummy.ForEachPainter(function(painter) {
         if (!done && (typeof painter.CheckResize == 'function'))
            done = painter.CheckResize(arg);
      });
      return done;
   }

   /**
    * For compatibility, see {@link JSROOT.resize}
    * @private
    */
   JSROOT.CheckElementResize = JSROOT.resize;

   /** @summary Returns main painter object for specified HTML element
     * @param {string|object} divid - id or DOM element */
   JSROOT.GetMainPainter = function(divid) {
      let dummy = new JSROOT.ObjectPainter();
      dummy.SetDivId(divid, -1);
      return dummy.main_painter(true);
   }

   /** @summary Safely remove all JSROOT objects from specified element
     * @param {string|object} divid - id or DOM element
     * @example
     * JSROOT.cleanup("drawing");
     * JSROOT.cleanup(document.querySelector("#drawing")); */
   JSROOT.cleanup = function(divid) {
      let dummy = new ObjectPainter(), lst = [];
      dummy.SetDivId(divid, -1);
      dummy.ForEachPainter(function(painter) {
         if (lst.indexOf(painter) < 0) lst.push(painter);
      });
      for (let n = 0; n < lst.length; ++n) lst[n].Cleanup();
      dummy.select_main().html("");
      return lst;
   }

   /** @summary Display progress message in the left bottom corner.
    *  @desc Previous message will be overwritten
    * if no argument specified, any shown messages will be removed
    * @param {string} msg - message to display
    * @param {number} tmout - optional timeout in milliseconds, after message will disappear
    * @private
    */
   JSROOT.progress = function(msg, tmout) {
      if (JSROOT.BatchMode || (typeof document === 'undefined')) return;
      let id = "jsroot_progressbox",
         box = d3.select("#" + id);

      if (!JSROOT.gStyle.ProgressBox) return box.remove();

      if ((arguments.length == 0) || !msg) {
         if ((tmout !== -1) || (!box.empty() && box.property("with_timeout"))) box.remove();
         return;
      }

      if (box.empty()) {
         box = d3.select(document.body)
            .append("div")
            .attr("id", id);
         box.append("p");
      }

      box.property("with_timeout", false);

      if (typeof msg === "string") {
         box.select("p").html(msg);
      } else {
         box.html("");
         box.node().appendChild(msg);
      }

      if (!isNaN(tmout) && (tmout > 0)) {
         box.property("with_timeout", true);
         setTimeout(JSROOT.progress.bind(JSROOT, '', -1), tmout);
      }
   }

   /** @summary Tries to close current browser tab
     *
     * @desc Many browsers do not allow simple window.close() call,
     * therefore try several workarounds */

   JSROOT.CloseCurrentWindow = function() {
      if (!window) return;
      window.close();
      window.open('', '_self').close();
   }

   Painter.createRootColors();

   JSROOT.DrawOptions = DrawOptions;
   JSROOT.ColorPalette = ColorPalette;
   JSROOT.TAttLineHandler = TAttLineHandler;
   JSROOT.TAttFillHandler = TAttFillHandler;
   JSROOT.TAttMarkerHandler = TAttMarkerHandler;
   JSROOT.TooltipHandler = TooltipHandler;
   JSROOT.BasePainter = BasePainter;
   JSROOT.ObjectPainter = ObjectPainter;

   if (JSROOT.nodejs) JSROOT.Painter.readStyleFromURL("?interactive=0&tooltip=0&nomenu&noprogress&notouch&toolbar=0&webgl=0");


   // FIXME: for backward compatibility with v5, will be removed in JSROOT v7
   function TBasePainter() {
      // redu constructor
      this.divid = null;
      return this;
   }
   TBasePainter.prototype = Object.create(new BasePainter);

   function TObjectPainter(obj, opt) {
      // redo BasePainter and ObjectPainter
      this.divid = null;
      this.draw_g = null; // container for all drawn objects
      this.pad_name = ""; // name of pad where object is drawn
      this.main = null;  // main painter, received from pad
      if (typeof opt == "string") this.options = { original: opt };
      this.AssignObject(obj);
      return this;
   }
   TObjectPainter.prototype = Object.create(new ObjectPainter);

   JSROOT.TBasePainter = TBasePainter;
   JSROOT.TObjectPainter = TObjectPainter;

   return JSROOT;

});
