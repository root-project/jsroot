/**
 * Configure application
 */
requirejs.config({
//   baseUrl: 'scripts',
   paths: {
      'd3'                    : 'scripts/d3.v3.min',
      'helvetiker_bold'       : 'scripts/helvetiker_bold.typeface',
      'helvetiker_regular'    : 'scripts/helvetiker_regular.typeface',
      'jquery'                : 'scripts/jquery.min',
      'jquery-ui'             : 'scripts/jquery-ui.min',
      'touch-punch'           : 'scripts/touch-punch.min',
      'JSRootCore'            : 'scripts/JSRootCore',
      'JSRootIO'              : 'scripts/JSRootIOEvolution',
      'JSRootPainter'         : 'scripts/JSRootPainter',
      'JSRootPainter.jquery'  : 'scripts/JSRootPainter.jquery',
      'JSRoot3DPainter'       : 'scripts/JSRoot3DPainter',
      'JSRootInterface'       : 'scripts/JSRootInterface',
      'MathJax'               : 'https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_SVG&amp;delayStartupUntil=configured',
      'rawinflate'            : 'scripts/rawinflate',
      'THREE'                 : ['https://cdnjs.cloudflare.com/ajax/libs/three.js/r68/three.min', 'scripts/three.min'],
      'three_fonts'           : 'scripts/helvetiker_regular.typeface'
   },
   shim: {
      helvetiker_bold: {
         deps: ['THREE']
      },
      three_fonts: {
         deps: ['helvetiker_bold']
      },
      MathJax: {
         exports: "MathJax",
         init: function () {
            MathJax.Hub.Config({ TeX: { extensions: ["color.js"] }});
            MathJax.Hub.Register.StartupHook("SVG Jax Ready",function () {
               var VARIANT = MathJax.OutputJax.SVG.FONTDATA.VARIANT;
               VARIANT["normal"].fonts.unshift("MathJax_SansSerif");
               VARIANT["bold"].fonts.unshift("MathJax_SansSerif-bold");
               VARIANT["italic"].fonts.unshift("MathJax_SansSerif");
               VARIANT["-tex-mathit"].fonts.unshift("MathJax_SansSerif");
            });
            MathJax.Hub.Startup.onload();
            return MathJax;
         }
      }
   }
});

require( ['jquery', 'JSRootCore'], function($, Core) {
   Core.BuildSimpleGUI();
});

