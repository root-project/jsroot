// wrapper for THREE.SVGRenderer trying to optimize creation of many small SVG elements

THREE.CreateSVGRenderer = function(as_is, precision) {


   function Create(document) {

// now include original THREE.SVGRenderer
//
