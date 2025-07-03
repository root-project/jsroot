import { rntupleProcess } from '../../modules/rntuple.mjs';
import { openFile } from 'jsroot';

// test block (runs only in node)
if (typeof window === 'undefined') {
  // Defining the object selector
  const selector = {
    tgtobj: {},
    currentCluster: 0,
    count: 0,
    sum: 0,

    Begin() {
      console.log('Begin processing');
    },

    Process() {
      console.log('Entry : ', this.tgtobj);
      this.sum += this.tgtobj.myDouble;
      this.count++;
    },

    Terminate() {
      if (this.count === 0)
        console.error('No entries processed');
      else
        console.log(`Mean = ${(this.sum / this.count).toFixed(4)} from ${this.count} entries`);
    }
  };

  openFile('./simple.root')
    .then(file => file.readObject('myNtuple'))
    .then(rntuple => {
      if (!rntuple) throw new Error('myNtuple not found');
      return rntupleProcess(rntuple, selector);
    })
    .then(() => console.log('RNTuple::Process finished'))
    .catch(err => console.error(err));
}

export { rntupleProcess };
