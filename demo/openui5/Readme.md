# JSROOT with OpenUI5 demo

This example shows how JSROOT graphics can be used inside OpenUI5

JSROOT provides method to load openui5 functionality. Just do:

      import { loadOpenui5 } from '../../modules/openui5.mjs';
      let sap = await loadOpenui5();

To embed JSROOT graphics into openui5-beased webpage, use provided `Drawing` control:

     <example:Drawing file="https://root.cern/js/files/hsimple.root" item="hpx" drawopt="">
     </example:Drawing>

If can has following parameters:

    file - name of root file
    item - item name in root file
    drawopt - drawing option
    jsonfile - name of JSON file
