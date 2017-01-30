// this small macro is required to correctly read data from 
//     https://root.cern/files/markus.root
// Seems to be, pool::Token is class from Gaudi Framework
// There is no streamer information stored in the file
// Some idea that is stored there can be found 
//   http://svn.cern.ch/guest/gaudi/Gaudi/trunk/RootCnv/src/RootIOHandler.cpp, line 175
// But there are 4 bytes mismatch - just ignored here
    
JSROOT.addUserStreamer(
      "pool::Token",
      function(buf, obj) {
         obj._typename = "pool::Token";
         obj.m_oid = {
            _typename: "pair<int,int>",   
            first:  buf.ntoi4(),
            second: buf.ntoi4()
         }
         buf.ntou4(); // some other value
      }
);
