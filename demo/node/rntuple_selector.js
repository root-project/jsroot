import { rntupleProcess } from '../../modules/rntuple.mjs';
import { TSelector, openFile } from 'jsroot';

const selector = new TSelector();
selector.sum = 0;
selector.count = 0;

selector.Begin = function() {
  console.log('Begin processing');
};

selector.Process = function() {
  // console.log('Entry : ', this.tgtobj);
  this.sum += this.tgtobj.myDouble;
  this.count++;
};

selector.Terminate = function() {
  if (this.count === 0) 
    console.error('No entries processed');
   else 
    console.log(`Mean = ${(this.sum / this.count).toFixed(4)} from ${this.count} entries`); 
};

if (typeof window === 'undefined') {
  openFile('./simple.root')
    .then(file => file.readObject('myNtuple'))
    .then(rntuple => {
      if (!rntuple) throw new Error('myNtuple not found');
      return rntupleProcess(rntuple, selector);
    })
    .then(() => console.log('RNTuple::Process finished'))
    .catch(err => console.error(err));
}
