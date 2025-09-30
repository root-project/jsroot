import { httpRequest, create, openFile, treeDraw, build3d } from 'jsroot';

async function test3d(obj, opt, title, json_reflength = -1) {
   if (!obj) {
      console.error(`No object provided for ${title}`);
      return null;
   }

   let obj3d = await build3d(obj, opt);

   if (!obj3d) {
      console.error(`Fail to create three.js model for ${obj._typename}`);
      return null;
   }

   if (json_reflength <= 0)
      console.log(`${title}  Ok`);
   else {
      let json = JSON.stringify(obj3d.toJSON());
      if (Math.abs(json.length - json_reflength) / json_reflength > 0.01)
         console.error(`${title}  FAILURE json ${json.length} too much differ from refernce ${json_reflength}`);
      else
         console.log(`${title}  OK json ${json.length}`);
   }

   return obj3d;
}

let server = 'https://root.cern/js/files/',
    filename = server + 'hsimple.root',
    filename2 = server + 'graph2d.root',
    filename3 = server + 'geom/simple_alice.json.gz';

let file = await openFile(filename);
let hist2 = await file.readObject('hpxpy');

await test3d(hist2, 'lego2', 'TH2 lego plot', 6916869);

let tuple = await file.readObject('ntuple');
let hist3 = await treeDraw(tuple, 'px:py:pz;hbins:15');

await test3d(hist3, 'box3', 'TH3 box plot', 4223457);

let hist1 = await file.readObject('hpx');

await test3d(hist1, 'lego2', 'TH1 lego plot', 3332953);

let geom = await httpRequest(filename3, 'object');
await test3d(geom, '', 'Geometry build', 1811230);

let file2 = await openFile(filename2);
let gr2 = await file2.readObject('Graph2D');

await test3d(gr2, 'p', 'TGraph2D drawing with p');

let latex = create('TLatex');
latex.fTitle = 'F(t) = V^{i}_{t,j}';
latex.fTextAlign = 22;
latex.fTextColor = 3;
latex.fTextSize = 10;

await test3d(latex, '', 'TLatex drawing', 457275);
