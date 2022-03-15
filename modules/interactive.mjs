/// interactive functionality for different classes

import { browser, settings, isBatchMode } from './core.mjs';

import { select as d3_select, drag as d3_drag,
         pointer as d3_pointer, pointers as d3_pointers } from './d3.mjs';

import { getElementRect } from './base/BasePainter.mjs';

import { FontHandler } from './base/FontHandler.mjs';

import { createMenu, closeMenu, getActivePad, getAbsPosInCanvas } from './painter.mjs';

import { ToolbarIcons } from './utils.mjs';

function getButtonSize(handler, fact) {
   return Math.round((fact || 1) * (handler.iscan || !handler.has_canvas ? 16 : 12));
}

function toggleButtonsVisibility(handler, action) {
   let group = handler.getLayerSvg("btns_layer", handler.this_pad_name),
       btn = group.select("[name='Toggle']");

   if (btn.empty()) return;

   let state = btn.property('buttons_state');

   if (btn.property('timout_handler')) {
      if (action!=='timeout') clearTimeout(btn.property('timout_handler'));
      btn.property('timout_handler', null);
   }

   let is_visible = false;
   switch(action) {
      case 'enable': is_visible = true; break;
      case 'enterbtn': return; // do nothing, just cleanup timeout
      case 'timeout': is_visible = false; break;
      case 'toggle':
         state = !state;
         btn.property('buttons_state', state);
         is_visible = state;
         break;
      case 'disable':
      case 'leavebtn':
         if (!state) btn.property('timout_handler', setTimeout(() => toggleButtonsVisibility(handler, 'timeout'), 1200));
         return;
   }

   group.selectAll('svg').each(function() {
      if (this===btn.node()) return;
      d3_select(this).style('display', is_visible ? "" : "none");
   });
}

let PadButtonsHandler = {

   alignButtons(btns, width, height) {
      let sz0 = getButtonSize(this, 1.25), nextx = (btns.property('nextx') || 0) + sz0, btns_x, btns_y;

      if (btns.property('vertical')) {
         btns_x = btns.property('leftside') ? 2 : (width - sz0);
         btns_y = height - nextx;
      } else {
         btns_x = btns.property('leftside') ? 2 : (width - nextx);
         btns_y = height - sz0;
      }

      btns.attr("transform","translate("+btns_x+","+btns_y+")");
   },

   findPadButton(keyname) {
      let group = this.getLayerSvg("btns_layer", this.this_pad_name), found_func = "";
      if (!group.empty())
         group.selectAll("svg").each(function() {
            if (d3_select(this).attr("key") === keyname)
               found_func = d3_select(this).attr("name");
         });

      return found_func;
   },

   removePadButtons() {
      let group = this.getLayerSvg("btns_layer", this.this_pad_name);
      if (!group.empty()) {
         group.selectAll("*").remove();
         group.property("nextx", null);
      }
   },

   showPadButtons() {
      let group = this.getLayerSvg("btns_layer", this.this_pad_name);
      if (group.empty()) return;

      // clean all previous buttons
      group.selectAll("*").remove();
      if (!this._buttons) return;

      let iscan = this.iscan || !this.has_canvas, ctrl,
          x = group.property('leftside') ? getButtonSize(this, 1.25) : 0, y = 0;

      if (this._fast_drawing) {
         ctrl = ToolbarIcons.createSVG(group, ToolbarIcons.circle, getButtonSize(this), "enlargePad");
         ctrl.attr("name", "Enlarge").attr("x", 0).attr("y", 0)
             .on("click", evnt => this.clickPadButton("enlargePad", evnt));
      } else {
         ctrl = ToolbarIcons.createSVG(group, ToolbarIcons.rect, getButtonSize(this), "Toggle tool buttons");

         ctrl.attr("name", "Toggle").attr("x", 0).attr("y", 0)
             .property("buttons_state", (settings.ToolBar!=='popup'))
             .on("click", () => toggleButtonsVisibility(this, 'toggle'))
             .on("mouseenter", () => toggleButtonsVisibility(this, 'enable'))
             .on("mouseleave", () => toggleButtonsVisibility(this, 'disable'));

         for (let k = 0; k < this._buttons.length; ++k) {
            let item = this._buttons[k];

            let btn = item.btn;
            if (typeof btn == 'string') btn = ToolbarIcons[btn];
            if (!btn) btn = ToolbarIcons.circle;

            let svg = ToolbarIcons.createSVG(group, btn, getButtonSize(this),
                        item.tooltip + (iscan ? "" : (" on pad " + this.this_pad_name)) + (item.keyname ? " (keyshortcut " + item.keyname + ")" : ""));

            if (group.property('vertical'))
                svg.attr("x", y).attr("y", x);
            else
               svg.attr("x", x).attr("y", y);

            svg.attr("name", item.funcname)
               .style('display', (ctrl.property("buttons_state") ? '' : 'none'))
               .on("mouseenter", () => toggleButtonsVisibility(this, 'enterbtn'))
               .on("mouseleave", () => toggleButtonsVisibility(this, 'leavebtn'));

            if (item.keyname) svg.attr("key", item.keyname);

            svg.on("click", evnt => this.clickPadButton(item.funcname, evnt));

            x += getButtonSize(this, 1.25);
         }
      }

      group.property("nextx", x);

      this.alignButtons(group, this.getPadWidth(), this.getPadHeight());

      if (group.property('vertical'))
         ctrl.attr("y", x);
      else if (!group.property('leftside'))
         ctrl.attr("x", x);
   },

   assign(painter) {
      painter.alignButtons = this.alignButtons;
      painter.findPadButton = this.findPadButton;
      painter.removePadButtons = this.removePadButtons;
      painter.showPadButtons = this.showPadButtons;

   }
} // class PadButtonsHandler

export { PadButtonsHandler };
