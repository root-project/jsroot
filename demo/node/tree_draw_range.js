import { version, openFile } from 'jsroot';
import { rntupleDraw } from 'jsroot/rntuple';

// check that automatic histogram range of draw expression includes all values

console.log(`JSROOT version ${version}`);

let filename = './rntuple_test.root',
    any_error = false;

if (process?.argv && process.argv[2])
   filename = process.argv[2];

const file = await openFile(filename),
      rntuple = await file.readObject('Data');

// first value of DoubleField is 0, which is minimal value, in second expression it is maximal value
for (const expr of ['DoubleField', '5 - DoubleField']) {
   const hist = await rntupleDraw(rntuple, expr),
         underflow = hist.fArray[0],
         overflow = hist.fArray[hist.fXaxis.fNbins + 1];
   if (underflow || overflow) {
      any_error = true;
      console.error(`FAILURE: drawing '${expr}' has range [${hist.fXaxis.fXmin}, ${hist.fXaxis.fXmax}], underflow ${underflow}, overflow ${overflow}`);
   } else
      console.log(`OK: drawing '${expr}' has range [${hist.fXaxis.fXmin}, ${hist.fXaxis.fXmax}]`);
}

if (any_error) {
   console.error('\nFAILURE when checking histogram range');
   process.exit(1);
} else
   console.log('\nTest OK');
