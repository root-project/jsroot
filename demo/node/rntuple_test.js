import { version, openFile } from 'jsroot';

import { readHeaderFooter } from 'jsroot/rntuple';


console.log(`JSROOT version ${version}`);


let file = await openFile('https://jsroot.gsi.de/files/tmp/ntpl001_staff.root');
let rntuple = await file.readObject('Staff');

await readHeaderFooter(rntuple);

console.log('some debug info', {
  version: rntuple.builder?.version,
  name: rntuple.builder?.name,
  description: rntuple.builder?.description,
  xxhash3: rntuple.builder?.xxhash3?.toString(16),
  headerFeatureFlags: rntuple.builder?.headerFeatureFlags,
  footerFeatureFlags: rntuple.builder?.footerFeatureFlags
});


