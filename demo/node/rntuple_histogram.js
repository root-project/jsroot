import { rntupleProcess } from '../../modules/rntuple.mjs';
import { openFile, TSelector, createHistogram, makeSVG } from 'jsroot';
import { writeFileSync } from 'fs';

const selector = new TSelector();
selector.hist = null;
selector.minpy = null;
selector.maxpy = null;
selector.sum = 0;
selector.count = 0;

selector.Begin = function() {
  this.hist = createHistogram('TH1F', 10, -5, 5);
  this.hist.fXaxis.fXmin = -5;
  this.hist.fXaxis.fXmax = 5;
  this.hist.fFillColor = 2;         // Red fill
  this.hist.fFillStyle = 1001;      // Solid
  this.hist.fName = 'h1';
  this.hist.fTitle = 'myDouble Distribution';
  this.hist.fXaxis.fTitle = 'myDouble';
  this.hist.fYaxis.fTitle = 'Entries';
  this.hist.fXaxis.fLabelSize = 0.02;
  this.hist.fYaxis.fLabelSize = 0.02;
};

selector.Process = function() {
  const val = this.tgtobj.myDouble;

  if (typeof val === 'number') {
      this.hist.Fill(val);   // Fill histogram
      this.sum += val;       // Sum for mean
      this.count++;          // Count    
  } else 
    console.warn('Invalid myDouble:', val);
};

selector.Terminate = async function() {
  if (this.count === 0) 
    console.error('No valid entries processed');

  const mean = this.sum / this.count;
  console.log(`Mean = ${mean.toFixed(4)} from ${this.count} entries`);

  const svg = await makeSVG({
    object: this.hist,
    width: 800,
    height: 600
  });

  writeFileSync('myDouble_histogram.svg', svg);
  console.log('Histogram written to myDouble_histogram.svg');
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
