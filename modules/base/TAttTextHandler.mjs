import { getColor } from './colors.mjs';


/**
  * @summary Handle for line attributes
  * @private
  */

class TAttTextHandler {

   /** @summary constructor
     * @param {object} attr - attributes, see {@link TAttTextHandler#setArgs} */
   constructor(args) {
      this.used = true;
      if (args._typename && (args.fTextFont !== undefined)) args = { attr: args };
      this.setArgs(args);
   }

   /** @summary Set text attributes.
     * @param {object} args - specify attributes by different ways
     * @param {object} args.attr - TAttText object with appropriate data members or
     * @param {string} args.color - color in html like rgb(255,0,0) or 'red' or '#ff0000'
     * @param {number} args.align - text align
     * @param {number} args.angle - text angle
     * @param {number} args.font  - font index
     * @param {number} args.size  - text size */
   setArgs(args) {
      if (args.attr) {
         args.font = args.attr.fTextFont;
         args.size = args.attr.fTextSize;
         this.color_index = args.attr.fTextColor;
         args.color = args.painter?.getColor(this.color_index) ?? getColor(this.color_index);
         args.align = args.attr.fTextAlign;
         args.angle = args.attr.fTextAngle;
      } else if (typeof args.color == 'number') {
         this.color_index = args.color;
         args.color = args.painter?.getColor(args.color) ?? getColor(args.color);
      }

      this.font = args.font;
      this.size = args.size;
      this.color = args.color;
      this.align = args.align;
      this.angle = args.angle;
   }

   /** @summary returns true if line attribute is empty and will not be applied. */
   empty() { return this.color == 'none'; }

   /** @summary Change text attributes */
   change(font, size, color, align, angle) {
      if (font !== undefined)
         this.font = font;
      if (size !== undefined)
         this.size = size;
      if (color !== undefined) {
         if (this.color !== color)
            delete this.color_index;
         this.color = color;
      }
      if (align !== undefined)
         this.align = align;
      if (angle !== undefined)
         this.angle = angle;
      this.changed = true;
   }

   /** @summary Method used when color or pattern were changed with OpenUi5 widgets.
     * @private */
   verifyDirectChange(/* painter */) {
      this.change(parseInt(this.font), parseFloat(this.size), this.color, parseInt(this.align), parseInt(this.angle));
   }

   /** @summary Create argument for drawText method */
   createArg(arg) {
      if (!arg) arg = {};
      arg.align = this.align;
      if (this.angle)
         arg.rotate = -this.angle; // SVG rotation angle has different sign
      arg.color = this.color || 'black';
      return arg;
   }

   /** @summary Provides pixel size depending  */
   getSize(w, h, fact, zero_size) {
      if (this.size >= 1)
         return Math.round(this.size);
      if (!w) w = 1000;
      if (!h) h = w;
      if (!fact) fact = 1.;

      return Math.round((this.size || zero_size || 0.) * Math.min(w,h) * fact);
   }

} // class TAttTextHandler


export { TAttTextHandler };
