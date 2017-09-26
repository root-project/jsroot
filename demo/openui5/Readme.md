# JSROOT with OpenUI5 demo

This example shows how JSROOT graphics can be used inside OpenUI5

JSROOT provides method to load openui5 functionality. Just do:

      JSROOT.AssertPrerequisites('openui5', function() {
          // use JSROOT.sap variable as entry point
      });

To embed JSROOT graphics into openui5-beased webpage, use:

    <mvc:XMLView id="panelId" viewName="sap.ui.jsroot.view.Panel">
    </mvc:XMLView>

If panel should be configured before drawing, special model should be used,
which corresponds with panel id:

     var oModel = new sap.ui.model.json.JSONModel({ 
         filename: "https://root.cern/js/files/hsimple.root", 
         itemname: "hpx", 
         opt: "" 
      });
      sap.ui.getCore().setModel(oModel, "PanelId");

If panel already exists, one can use drawModel() method to display it: 

    panel = sap.ui.getCore().byId("PanelId");
    panel.getController().drawModel(oModel);

If JSROOT object already loaded from the file (or created by other means), 
it can be drawn directly:

    var histo = JSROOT.CreateTH1(100);
    panel.getController().drawObject(histo, "hist");

If one should access object painter, one should do:

    var panel = sap.ui.getCore().byId("PanelId");
    var object_painter = null;
    panel.getController().getPainter(funciton(painter) {
       object_painter = painter;
    });
