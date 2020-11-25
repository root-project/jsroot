let jsroot = require("jsroot");

jsroot.openFile("https://root.cern/js/files/hsimple.root")
      .then(f => f.readObject("ntuple;1"))
      .then(tree => tree.Draw({ expr: "px:py:pz", dump: true, numentries: 100 }))
      .then(res => {
         console.log("NumEntries", res.length);
         let sumx = 0, sumy = 0, sumz = 0;
         res.forEach(entry => {
            sumx += entry.x;
            sumy += entry.y;
            sumz += entry.z;
         });
         console.log('Mean x', sumx/res.length);
         console.log('Mean y', sumy/res.length);
         console.log('Mean z', sumz/res.length);
      });
