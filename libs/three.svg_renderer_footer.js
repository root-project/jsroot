
// END of SVGRenderer.js

     return new THREE.SVGRenderer();

   }

   var rndr = null;

   if (as_is) {
      rndr = Create(document);
   } else {
      var doc_wrapper = {
        createElementNS: function(ns,kind) {
           if (kind == 'svg')
              return {
                 _wrapper: doc_wrapper,
                 _attr: {},
                 setAttribute: function(name, value) {
                    this._attr[name] = value;
                 }
              };
        }


      };

      rndr = Create(doc_wrapper);

      rndr.doc_wrapper = doc_wrapper; // use it to get final SVG code
   }

   rndr.setPrecision(precision);

   return rndr;

}