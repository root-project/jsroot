
// END of SVGRenderer.js

     return new THREE.SVGRenderer();

   }

   var rndr = null;

   if (as_is) {
      rndr = Create(document);
   } else {
      var doc_wrapper = {
        svg_attr: {},
        svg_style: {},
        path_attr: {},
        accPath: "",
        createElementNS: function(ns,kind) {
           if (kind == 'svg')
              return {
                 _wrapper: doc_wrapper,
                 childNodes: [], // may be accessed - make dummy
                 style: {}, // maybe configured
                 setAttribute: function(name, value) {
                    this._wrapper.svg_attr[name] = value;
                 },
                 appendChild: function(node) {
                    this._wrapper.accPath += '<path style="' + this._wrapper.path_attr['style'] + '" d="' + this._wrapper.path_attr['d'] + '"/>';
                    this._wrapper.path_attr = {};
                 },
                 removeChild: function(node) {
                    this.childNodes = [];
                 }
              };
           if (kind == 'path')
              return {
                 _wrapper: doc_wrapper,
                 setAttribute: function(name, value) {
                    this._wrapper.path_attr[name] = value;
                 }
              }

        }
      };

      rndr = Create(doc_wrapper);

      rndr.doc_wrapper = doc_wrapper; // use it to get final SVG code

      rndr.makeOuterHTML = function() {

         var wrap = this.doc_wrapper;

         var _textSizeAttr = ' viewBox="' + wrap.svg_attr['viewBox'] + '" width="' + wrap.svg_attr['width'] + '" height="' + wrap.svg_attr['height'] + '"';

         var _textClearAttr = '';


         //    ' style="background:' + svg_color + '"';

         return '<svg xmlns="http://www.w3.org/2000/svg"' + _textSizeAttr + _textClearAttr + '>' + wrap.accPath + '</svg>';
      }
   }

   rndr.setPrecision(precision);

   return rndr;

}