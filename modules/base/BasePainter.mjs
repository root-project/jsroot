
import { select as d3_select } from '../d3.mjs';

import { settings, isNodeJs } from '../core.mjs';

/** @summary Returns visible rect of element
  * @param {object} elem - d3.select object with element
  * @param {string} [kind] - which size method is used
  * @desc kind = 'bbox' use getBBox, works only with SVG
  * kind = 'full' - full size of element, using getBoundingClientRect function
  * kind = 'nopadding' - excludes padding area
  * With node.js can use "width" and "height" attributes when provided in element
  * @private */
function getElementRect(elem, sizearg) {
   if (isNodeJs() && (sizearg != 'bbox'))
      return { x: 0, y: 0, width: parseInt(elem.attr("width")), height: parseInt(elem.attr("height")) };

   const styleValue = name => {
      let value = elem.style(name);
      if (!value || (typeof value !== 'string')) return 0;
      value = parseFloat(value.replace("px", ""));
      return !Number.isFinite(value) ? 0 : Math.round(value);
   };

   let rect = elem.node().getBoundingClientRect();
   if ((sizearg == 'bbox') && (parseFloat(rect.width) > 0))
      rect = elem.node().getBBox();

   let res = { x: 0, y: 0, width: parseInt(rect.width), height: parseInt(rect.height) };
   if (rect.left !== undefined) {
      res.x = parseInt(rect.left);
      res.y = parseInt(rect.top);
   } else if (rect.x !== undefined) {
      res.x = parseInt(rect.x);
      res.y = parseInt(rect.y);
   }

   if ((sizearg === undefined) || (sizearg == 'nopadding')) {
      // this is size exclude padding area
      res.width -= styleValue('padding-left') + styleValue('padding-right');
      res.height -= styleValue('padding-top') + styleValue('padding-bottom');
   }

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




/**
 * @summary Base painter class
 *
 */

class BasePainter {

   /** @summary constructor
     * @param {object|string} [dom] - dom element or id of dom element */
   constructor(dom) {
      this.divid = null; // either id of DOM element or element itself
      if (dom) this.setDom(dom);
   }

   /** @summary Assign painter to specified DOM element
     * @param {string|object} elem - element ID or DOM Element
     * @desc Normally DOM element should be already assigned in constructor
     * @protected */
   setDom(elem) {
      if (elem !== undefined) {
         this.divid = elem;
         delete this._selected_main;
      }
   }

   /** @summary Returns assigned dom element */
   getDom() {
      return this.divid;
   }

   /** @summary Selects main HTML element assigned for drawing
     * @desc if main element was layouted, returns main element inside layout
     * @param {string} [is_direct] - if 'origin' specified, returns original element even if actual drawing moved to some other place
     * @returns {object} d3.select object for main element for drawing */
   selectDom(is_direct) {

      if (!this.divid) return d3_select(null);

      let res = this._selected_main;
      if (!res) {
         if (typeof this.divid == "string") {
            let id = this.divid;
            if (id[0] != '#') id = "#" + id;
            res = d3_select(id);
            if (!res.empty()) this.divid = res.node();
         } else {
            res = d3_select(this.divid);
         }
         this._selected_main = res;
      }

      if (!res || res.empty() || (is_direct === 'origin')) return res;

      let use_enlarge = res.property('use_enlarge'),
         layout = res.property('layout') || 'simple',
         layout_selector = (layout == 'simple') ? "" : res.property('layout_selector');

      if (layout_selector) res = res.select(layout_selector);

      // one could redirect here
      if (!is_direct && !res.empty() && use_enlarge) res = d3_select("#jsroot_enlarge_div");

      return res;
   }

   /** @summary Access/change top painter
     * @private */
   _accessTopPainter(on) {
      let main = this.selectDom().node(),
          chld = main ? main.firstChild : null;
      if (!chld) return null;
      if (on === true) {
         chld.painter = this;
      } else if (on === false)
         delete chld.painter;
      return chld.painter;
   }

   /** @summary Set painter, stored in first child element
     * @desc Only make sense after first drawing is completed and any child element add to configured DOM
     * @protected */
   setTopPainter() {
      this._accessTopPainter(true);
   }

   /** @summary Return top painter set for the selected dom element
     * @protected */
   getTopPainter() {
      return this._accessTopPainter();
   }

   /** @summary Clear reference on top painter
     * @protected */
   clearTopPainter() {
      this._accessTopPainter(false);
   }

   /** @summary Generic method to cleanup painter
     * @desc Removes all visible elements and all internal data */
   cleanup(keep_origin) {
      this.clearTopPainter();
      let origin = this.selectDom('origin');
      if (!origin.empty() && !keep_origin) origin.html("");
      this.divid = null;
      delete this._selected_main;

      if (this._hpainter && typeof this._hpainter.removePainter === 'function')
         this._hpainter.removePainter(this);

      delete this._hitemname;
      delete this._hdrawopt;
      delete this._hpainter;
   }

   /** @summary Checks if draw elements were resized and drawing should be updated
     * @returns {boolean} true if resize was detected
     * @protected
     * @abstract */
   checkResize(/* arg */) {}

   /** @summary Function checks if geometry of main div was changed.
     * @desc take into account enlarge state, used only in PadPainter class
     * @returns size of area when main div is drawn
     * @private */
   testMainResize(check_level, new_size, height_factor) {

      let enlarge = this.enlargeMain('state'),
         main_origin = this.selectDom('origin'),
         main = this.selectDom(),
         lmt = 5; // minimal size

      if (enlarge !== 'on') {
         if (new_size && new_size.width && new_size.height)
            main_origin.style('width', new_size.width + "px")
               .style('height', new_size.height + "px");
      }

      let rect_origin = getElementRect(main_origin, true),
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

      let rect = getElementRect(main),
         old_h = main.property('draw_height'),
         old_w = main.property('draw_width');

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
     * @param {string|boolean} action  - defines that should be done
     * @desc Possible values for action parameter:
     *    - true - try to enlarge
     *    - false - revert enlarge state
     *    - 'toggle' - toggle enlarge state
     *    - 'state' - only returns current enlarge state
     *    - 'verify' - check if element can be enlarged
     * if action not specified, just return possibility to enlarge main div
     * @protected */
   enlargeMain(action, skip_warning) {

      let main = this.selectDom(true),
         origin = this.selectDom('origin');

      if (main.empty() || !settings.CanEnlarge || (origin.property('can_enlarge') === false)) return false;

      if (action === undefined) return true;

      if (action === 'verify') return true;

      let state = origin.property('use_enlarge') ? "on" : "off";

      if (action === 'state') return state;

      if (action === 'toggle') action = (state === "off");

      let enlarge = d3_select("#jsroot_enlarge_div");

      if ((action === true) && (state !== "on")) {
         if (!enlarge.empty()) return false;

         enlarge = d3_select(document.body)
            .append("div")
            .attr("id", "jsroot_enlarge_div")
            .attr("style", "position: fixed; margin: 0px; border: 0px; padding: 0px; left: 1px; right: 1px; top: 1px; bottom: 1px; background: white; opacity: 0.95; z-index: 100; overflow: hidden;");

         let rect1 = getElementRect(main),
             rect2 = getElementRect(enlarge);

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

   /** @summary Set item name, associated with the painter
     * @desc Used by {@link HierarchyPainter}
     * @private */
   setItemName(name, opt, hpainter) {
      if (typeof name === 'string')
         this._hitemname = name;
      else
         delete this._hitemname;
      // only upate draw option, never delete.
      if (typeof opt === 'string') this._hdrawopt = opt;

      this._hpainter = hpainter;
   }

   /** @summary Returns assigned item name
     * @desc Used with {@link HierarchyPainter} to identify drawn item name */
   getItemName() { return ('_hitemname' in this) ? this._hitemname : null; }

   /** @summary Returns assigned item draw option
     * @desc Used with {@link HierarchyPainter} to identify drawn item option */
   getItemDrawOpt() { return this._hdrawopt || ""; }

} // class BasePainter


export { getElementRect, getAbsPosInCanvas, BasePainter };
