import { require, openFile }  from "jsroot";

let handle = await require('tree');

let selector = new handle.TSelector();

selector.addBranch("px");
selector.addBranch("py");

let cnt = 0, sumpx = 0, sumpy = 0;

selector.Begin = function() {
   // function called before reading of TTree starts
}

selector.Process = function() {
   // function called for every entry
   sumpx += this.tgtobj.px;
   sumpy += this.tgtobj.py;
   cnt++;
}

selector.Terminate = function(res) {
   // function called when processing finishes
   if (!res || (cnt===0)) {
      console.error("Fail to process TTree");
   } else {
      let meanpx = sumpx/cnt, meanpy = sumpy/cnt;
      console.log('MeanPX = ' + meanpx.toFixed(4) + '  MeanPY = ' + meanpy.toFixed(4));
   }
}


let file = await openFile("https://root.cern/js/files/hsimple.root");

let tree = await file.readObject("ntuple;1");

await tree.Process(selector);

console.log("TTree::Process finished");
