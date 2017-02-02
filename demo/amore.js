// custom draw function (old code, now not used).
Amore_Histo_Draw = function(divid, obj, opt) {

   // normal draw function
   var painter = JSROOT.draw(divid, obj.fVal, opt);

   // redefine update function while it expects histogram as argument
   // only required if object need to be monitored from http server
   painter.OldUpdate = painter.UpdateObject;
   painter.UpdateObject = function(amore) {
      return this.OldUpdate(amore.fVal);
   }

   return painter;
}

// special handling for the amore::core::String_t which is redifinition of TString
JSROOT.addUserStreamer("amore::core::String_t", "TString");

// register class and identify, that 'fVal' field should be used for drawing
// one could specify explicit draw function, but it is not required in such simple case
JSROOT.addDrawFunc({ name: "amore::core::MonitorObjectHisto<TH1F>", icon: "img_histo1d", draw_field: "fVal" /* , func: "Amore_Histo_Draw" */ });
