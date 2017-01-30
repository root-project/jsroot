// provide custom streamer for pool::Token, not visisble in streamer infos
JSROOT.addUserStreamer(
      "pool::Token",
      function(buf, obj) {
         obj._typename = "pool::Token";
         obj.fVal1 = buf.ntou4();
         obj.fVal2 = buf.ntou4();
         obj.fVal3 = buf.ntou4();
      }
);
