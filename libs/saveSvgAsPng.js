(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      define( ['JSRootPainter'], factory );
   } else {
      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'saveSvgAsPng.js');

      factory(JSROOT);
   }
} (function(JSROOT) {

  "use strict";

  JSROOT.sources.push("savepng");

  var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

  function isExternal(url) {
    return url && url.lastIndexOf('http',0) == 0 && url.lastIndexOf(window.location.host) == -1;
  }

  function inlineImages(el, callback) {
    var images = el.querySelectorAll('image'),
        left = images.length;
    if (left == 0) return callback();
    for (var i = 0; i < images.length; i++) {
      (function(image) {
        var href = image.getAttributeNS("http://www.w3.org/1999/xlink", "href");
        if (href) {
          if (isExternal(href.value)) {
            console.warn("Cannot render embedded images linking to external hosts: "+href.value);
            return;
          }
        }
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            img = new Image();
        href = href || image.getAttribute('href');
        img.src = href;
        img.onload = function() {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          image.setAttributeNS("http://www.w3.org/1999/xlink", "href", canvas.toDataURL('image/png'));
          left--;
          if (left == 0) {
            callback();
          }
        }
        img.onerror = function() {
          console.log("Could not load "+href);
          left--;
          if (left == 0) {
            callback();
          }
        }
      })(images[i]);
    }
  }

  function styles(el, selectorRemap) {
    var css = "", sheets = document.styleSheets;
    for (var i = 0; i < sheets.length; i++) {
      try {
        var rules = sheets[i].cssRules;
      } catch (e) {
        console.warn("Stylesheet could not be loaded: "+sheets[i].href);
        continue;
      }

      if (rules != null) {
        for (var j = 0; j < rules.length; j++) {
          var rule = rules[j];
          if (typeof(rule.style) != "undefined") {
            var match = null;
            try {
              match = el.querySelector(rule.selectorText);
            } catch(err) {
              console.warn('Invalid CSS selector "' + rule.selectorText + '"', err);
            }
            if (match) {
              var selector = selectorRemap ? selectorRemap(rule.selectorText) : rule.selectorText;
              css += selector + " { " + rule.style.cssText + " }\n";
            } else if(rule.cssText.match(/^@font-face/)) {
              css += rule.cssText + '\n';
            }
          }
        }
      }
    }
    return css;
  }

  function getDimension(el, clone, dim) {
    var v = (el.viewBox.baseVal && el.viewBox.baseVal[dim]) ||
      (clone.getAttribute(dim) !== null && !clone.getAttribute(dim).match(/%$/) && parseInt(clone.getAttribute(dim))) ||
      el.getBoundingClientRect()[dim] ||
      parseInt(clone.style[dim]) ||
      parseInt(window.getComputedStyle(el).getPropertyValue(dim));
    return (typeof v === 'undefined' || v === null || isNaN(parseFloat(v))) ? 0 : v;
  }

  function reEncode(data) {
    data = encodeURIComponent(data);
    data = data.replace(/%([0-9A-F]{2})/g, function(match, p1) {
      var c = String.fromCharCode('0x'+p1);
      return c === '%' ? '%25' : c;
    });
    return decodeURIComponent(data);
  }

  function svgAsDataSVG(el, options, cb) {
    options.scale = options.scale || 1;
    var xmlns = "http://www.w3.org/2000/xmlns/";

    inlineImages(el, function() {
      var outer = document.createElement("div"),
          clone = el.cloneNode(true),
          width, height;
      if(el.tagName == 'svg') {
        width = options.width || getDimension(el, clone, 'width');
        height = options.height || getDimension(el, clone, 'height');
      } else if (el.getBBox) {
        var box = el.getBBox();

        // SL - use other coordinates if single element is cloned
        width = box.width;
        height = box.height;
        clone.setAttribute('transform','translate(' + (-box.x) + "," + (-box.y)  + ')');

        //width = box.x + box.width;
        //height = box.y + box.height;
        //clone.setAttribute('transform', clone.getAttribute('transform').replace(/translate\(.*?\)/, ''));

        var svg = document.createElementNS('http://www.w3.org/2000/svg','svg')
        svg.appendChild(clone)
        clone = svg;
      } else {
        console.error('Attempted to render non-SVG element', el);
        return;
      }

      clone.setAttribute("version", "1.1");
      clone.setAttributeNS(xmlns, "xmlns", "http://www.w3.org/2000/svg");
      clone.setAttributeNS(xmlns, "xmlns:xlink", "http://www.w3.org/1999/xlink");
      clone.setAttribute("width", width * options.scale);
      clone.setAttribute("height", height * options.scale);
      clone.setAttribute("viewBox", [options.left || 0, options.top || 0, width, height].join(" "));

      if (options.removeClass) {
         var lst = clone.querySelectorAll("." + options.removeClass);
         for (var k=0; k < (lst ? lst.length : 0); ++k)
            lst[k].parentNode.removeChild(lst[k]);
      }

      outer.appendChild(clone);

      if (options.useGlobalStyle) {
         // SL: make it optional, JSROOT graphics does not uses global document styles
         var css = styles(el, options.selectorRemap),
             s = document.createElement('style'),
             defs = document.createElement('defs');
         s.setAttribute('type', 'text/css');
         s.innerHTML = "<![CDATA[\n" + css + "\n]]>";
         defs.appendChild(s);
         clone.insertBefore(defs, clone.firstChild);
      }

      cb(outer.innerHTML);

    });
  }

  JSROOT.saveSvgAsPng = function(el, options, call_back) {
     options = options || {};

     svgAsDataSVG(el, options, function(svg) {

        // replace string like url(&quot;#jsroot_marker_1&quot;) with url(#jsroot_marker_1)
        // second variant is the only one, supported in SVG files
        svg = svg.replace(/url\(\&quot\;\#(\w+)\&quot\;\)/g,"url(#$1)");

        if (options.result==="svg") return JSROOT.CallBack(call_back, svg);

        var image = new Image();
        image.onload = function() {
           if (options.result==="image") return JSROOT.CallBack(call_back, image);

           var canvas = document.createElement('canvas');
           canvas.width = image.width;
           canvas.height = image.height;
           var context = canvas.getContext('2d');
           if(options && options.backgroundColor){
              context.fillStyle = options.backgroundColor;
              context.fillRect(0, 0, canvas.width, canvas.height);
           }
           context.drawImage(image, 0, 0);

           if (options.result==="canvas") return JSROOT.CallBack(call_back, canvas);

           var a = document.createElement('a');
           a.download = options.name || "file.png";
           a.href = canvas.toDataURL('image/png');
           document.body.appendChild(a);
           a.addEventListener("click", function(e) {
              a.parentNode.removeChild(a);
              JSROOT.CallBack(call_back, true);
           });
           a.click();
        }

        image.onerror = function(arg) {
           JSROOT.CallBack(call_back, null);
        }

        image.src = 'data:image/svg+xml;base64,' + window.btoa(reEncode(doctype + svg));
    });
  }

   return JSROOT.Painter;

}));
