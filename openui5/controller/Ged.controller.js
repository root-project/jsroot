sap.ui.define([
   'sap/ui/core/mvc/Controller',
   'sap/ui/model/json/JSONModel',
   'sap/m/Dialog',
   'sap/m/Button',
   'sap/ui/core/HTML'
], function (Controller, JSONModel, Dialog, Button, HTML) {
   "use strict";

   return Controller.extend("sap.ui.jsroot.controller.Ged", {

      currentPainter: null,

      gedFragments : [],

      onInit : function() {
         console.log('init GED editor');
         var model = new JSONModel({ SelectedClass: "none" });
         this.getView().setModel(model);
      },

      onExit : function() {
         console.log('exit GED editor');
         this.cleanupGed();

      },

      cleanupGed : function() {
         console.log('Clenup GED editor');

         // empty fragments
         this.getView().byId("ged_page").removeAllContent();

         // set dummy model
         this.getView().setModel(new JSONModel({ SelectedClass: "none" }));

         this.currentPainter = null; // remove cross reference

         // TODO: deregsiter for all events

      },

      getFragment : function(kind, force) {
          var fragm = this.gedFragments[kind];
          if (!fragm && force)
             fragm = this.gedFragments[kind] = sap.ui.xmlfragment(this.getView().getId(), "sap.ui.jsroot.view." + kind, this);
          return fragm;
      },

      addFragment : function(page, kind, model) {
         var fragm = this.getFragment(kind, true);
         if (!fragm) return;

         var html = new HTML();
         html.setContent("<hr>");
         html.setTooltip(kind);
         page.addContent(html);

         fragm.setModel(model);
         page.addContent(fragm);
      },

      /// function called when user changes model property
      /// data object includes _kind, _painter and _handle (optionally)
      modelPropertyChange : function(evnt, data) {
         var pars = evnt.getParameters();
         console.log('Model property changes', pars.path, pars.value, data._kind);

         if (data._handle) {
            //var subname = pars.path.substr(1);
            //if (subname in data._handle) data._handle[subname] = pars.value;

            if (typeof data._handle.verifyDirectChange === 'function')
                data._handle.verifyDirectChange(data._painter);
            data._handle.changed = true;
         }

         if (data._painter && (typeof data._painter.AttributeChange === 'function'))
            data._painter.AttributeChange(data._kind, pars.path.substr(1), pars.value);

         if (this.currentPadPainter)
            this.currentPadPainter.Redraw();
      },

      processHistModelChange : function(evnt, data) {
         var pars = evnt.getParameters(), painter = data.painter;
         console.log('Hist model changes', pars.path, pars.value);

         painter.options.Mode3D = painter.ged.mode3d;

         if (painter.ged.mode3d) {
            painter.options.Lego = parseInt(painter.ged.Lego);
         } else {
            painter.options.Mark = painter.ged.markers ? (painter.ged.last_mark || 1) : 0;
            painter.options.Bar = painter.ged.bar ? 1 : 0;

            painter.options.Hist = painter.ged.bar || painter.ged.markers ? 0 : 1;
         }

         if (this.currentPadPainter)
            this.currentPadPainter.Redraw();

      },

      onObjectSelect : function(padpainter, painter, place) {

         if (this.currentPainter === painter) return;

         this.currentPadPainter = padpainter;
         this.currentPainter = painter;

         var obj = painter.GetObject();

         this.getView().getModel().setProperty("/SelectedClass", obj ? obj._typename : painter.GetTipName());

         var oPage = this.getView().byId("ged_page");
         oPage.removeAllContent();

         if (painter.lineatt && painter.lineatt.used) {
            var model = new JSONModel( { attline: painter.lineatt } );
            model.attachPropertyChange({ _kind: "TAttLine", _painter: painter, _handle: painter.lineatt }, this.modelPropertyChange, this);

            this.addFragment(oPage, "TAttLine", model);
         }

         if (painter.fillatt && painter.fillatt.used) {
            var model = new JSONModel( { attfill: painter.fillatt } );
            model.attachPropertyChange({ _kind: "TAttFill", _painter: painter, _handle: painter.fillatt }, this.modelPropertyChange, this);

            this.addFragment(oPage, "TAttFill", model);
         }

         if (painter.markeratt && painter.markeratt.used) {
            var model = new JSONModel( { attmark: painter.markeratt } );
            model.attachPropertyChange({ _kind: "TAttMarker", _painter: painter, _handle: painter.markeratt }, this.modelPropertyChange, this);

            this.addFragment(oPage, "TAttMarker", model);
         }

         if (typeof painter.processTitleChange == 'function') {
            var obj = painter.processTitleChange("check");
            if (obj) {
               var model = new JSONModel( { tnamed: obj } );
               model.attachPropertyChange({ }, painter.processTitleChange, painter);
               this.addFragment(oPage, "TNamed", model);
            }

            if (typeof painter.GetHisto == 'function') {

               // this object used to copy ged setting from options and back,
               // do not (yet) allow to change options directly
               if (painter.ged === undefined)
                  painter.ged = { ndim: painter.Dimension(), Errors: 0, Style: 0, Contor: 1, Lego: 2 };

               painter.ged.mode3d = painter.mode3d ? 1 : 0;
               painter.ged.markers = painter.options.Mark > 0;
               if (painter.ged.markers) painter.ged.last_mark = painter.options.Mark;
               painter.ged.bar = painter.options.Bar > 0;
               painter.ged.Lego = painter.options.Lego;

               var model = new JSONModel( { opts : painter.ged } );

               // model.attachPropertyChange({}, painter.processTitleChange, painter);
               this.addFragment(oPage, "Hist", model);

               model.attachPropertyChange({ painter: painter }, this.processHistModelChange, this);
            }
         }
      }

   });

});
