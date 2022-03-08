import { openFile } from "jsroot";

let f = await openFile("https://root.cern/js/files/hsimple.root");
let tree = await f.readObject("ntuple;1");
let dump = await tree.Draw({ expr: "px:py:pz", dump: true, numentries: 1000 });

console.log("NumEntries", dump.length);
let sumx = 0, sumy = 0, sumz = 0;

dump.forEach(entry => {
   sumx += entry.x;
   sumy += entry.y;
   sumz += entry.z;
});

console.log('Mean x', sumx/dump.length);
console.log('Mean y', sumy/dump.length);
console.log('Mean z', sumz/dump.length);
