/// @file JSRootPainter.jquery.js
/// Part of JavaScript ROOT graphics, dependent from jQuery functionality

(function() {

   if (typeof JSROOT != 'object') {
      var e1 = new Error('JSROOT is not defined');
      e1.source = 'JSRootPainter.jquery.js';
      throw e1;
   }

   if (typeof d3 != 'object') {
      var e1 = new Error('This extension requires d3.v3.js');
      e1.source = 'JSRootPainter.jquery.js';
      throw e1;
   }

   if (typeof JSROOT.Painter != 'object') {
      var e1 = new Error('JSROOT.Painter not defined');
      e1.source = 'JSRootPainter.jquery.js';
      throw e1;
   }

   if (typeof jQuery == 'undefined') {
      var e1 = new Error('jQuery not defined ');
      e1.source = 'JSRootPainter.jquery.js';
      throw e1;
   }
   
   JSROOT.Painter.createMenu = function(maincallback, menuname) {
      if (!menuname) menuname = "root_ctx_menu";

      var menu = { divid: menuname, code:"", cnt: 1, funcs : {} };

      menu.add = function(name, arg, func) {
         if (name.indexOf("header:")==0) {
            this.code += "<li class='ui-widget-header'>"+name.substr(7)+"</li>";
            return;
         }

         if (name=="endsub:") { this.code += "</ul></li>"; return; }
         var close_tag = "</li>";
         if (name.indexOf("sub:")==0) { name = name.substr(4); close_tag="<ul>"; }

         if (typeof arg == 'function') { func = arg; arg = name; }

         if ((arg==null) || (typeof arg != 'string')) arg = name;
         this.code += "<li cnt='" + this.cnt + "' arg='" + arg + "'>" + name + close_tag;
         if (typeof func == 'function') this.funcs[this.cnt] = func; // keep call-back function

         this.cnt++;
      }

      menu.size = function() { return this.cnt-1; }

      menu.addDrawMenu = function(menu_name, opts, call_back) {
         if (opts==null) opts = new Array;
         if (opts.length==0) opts.push("");

         this.add((opts.length > 1) ? ("sub:" + menu_name) : menu_name, opts[0], call_back);
         if (opts.length<2) return;

         for (var i=0;i<opts.length;i++) {
            var name = opts[i];
            if (name=="") name = '&lt;dflt&gt;';
            this.add(name, opts[i], call_back);
         }
         this.add("endsub:");
      }

      menu.remove = function() { $("#"+menuname).remove(); }

      menu.show = function(event) {
         menu.remove();

         document.body.onclick = function(e) { menu.remove(); }

         $(document.body).append('<ul id="' + menuname + '">' + this.code + '</ul>');

         $("#" + menuname)
            .css('left', event.clientX + window.pageXOffset)
            .css('top', event.clientY + window.pageYOffset)
            .attr('class', 'ctxmenu')
            .menu({
               items: "> :not(.ui-widget-header)",
               select: function( event, ui ) {
                  var arg = ui.item.attr('arg');
                  var cnt = ui.item.attr('cnt');
                  var func = cnt ? menu.funcs[cnt] : null;
                  menu.remove();
                  if (typeof func == 'function') func(arg);
              }
         });
      }

      JSROOT.CallBack(maincallback, menu);
      
      return menu;
   }
   
})();
