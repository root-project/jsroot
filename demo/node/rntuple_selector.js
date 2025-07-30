import { rntupleProcess } from '../../modules/rntuple.mjs';
import { openFile } from '../../modules/io.mjs';
import { TSelector } from '../../modules/tree.mjs';

const selector = new TSelector();
selector.sum = 0;
selector.count = 0;
selector.addBranch('Nation');
selector.addBranch('Step');
selector.Begin = function() {
  console.log('Begin processing');
};

selector.Process = function() {
  console.log('Entry : ', this.tgtobj);
  this.count++;
};


selector.Terminate = function() {
  if (this.count === 0)
    console.error('No entries processed');
};

if (typeof window === 'undefined') {
  openFile('./ntpl001_staff.root')
    .then(file => file.readObject('Staff'))
    .then(rntuple => {
      if (!rntuple) throw new Error('myNtuple not found');
      return rntupleProcess(rntuple, selector);
    })
    .then(() => console.log('RNTuple::Process finished'))
    .catch(err => console.error(err));
}


// if (typeof window === 'undefined') {
//   openFile('./simple.root')
//     .then(file => file.readObject('myNtuple'))
//     .then(rntuple => {
//       if (!rntuple) throw new Error('myNtuple not found');
//       return rntupleProcess(rntuple, selector);
//     })
//     .then(() => console.log('RNTuple::Process finished'))
//     .catch(err => console.error(err));
// }
