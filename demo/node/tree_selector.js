import { openFile } from 'jsroot/io';
import { TSelector, treeProcess } from 'jsroot/tree';

class TSelectorExample extends TSelector {

   constructor() {
      super();
      this.addBranch('px');
      this.addBranch('py');

      this.cnt = this.sumpx = this.sumpy = 0;
   }

   Begin() {
      // function called before reading of TTree starts
      console.log('TTree::Process started');
   }

   Process(/* entry */) {
      // function called for every entry
      this.sumpx += this.tgtobj.px;
      this.sumpy += this.tgtobj.py;
      this.cnt++;
   }

   Terminate(res) {
      // function called when processing finishes
      if (!res || !this.cnt)
         console.error('Fail to process TTree');
      else {
         const meanpx = this.sumpx / this.cnt, meanpy = this.sumpy / this.cnt;
         console.log(`MeanPX = ${meanpx.toFixed(4)}  MeanPY = ${meanpy.toFixed(4)}`);
      }
      console.log('TTree::Process finished');
   }

}

const file = await openFile('https://root.cern/js/files/hsimple.root'),
      tree = await file.readObject('ntuple;1');

await treeProcess(tree, new TSelectorExample);
