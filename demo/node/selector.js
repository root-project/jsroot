let jsroot = require("jsroot");

// function should be called only after TTree is loaded, in this case TSelector is also there
function createSelector() {
  let selector = new jsroot.TSelector();

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

  return selector;
}

jsroot.openFile("https://root.cern/js/files/hsimple.root")
      .then(f => f.readObject("ntuple;1"))
      .then(tree => tree.Process(createSelector()))
      .then(() => console.log("TTree::Process finished"));
