JSROOT.addDrawFunc({ name: 'DivHist', icon: 'img_histo1d', func: (dom, obj, opt) => {

   // clone histogram
   let hdiv = Object.assign({}, obj.fNum);

   hdiv.fName = 'ratio';
   hdiv.fTitle = 'ratio histogram';

   const nbins = hdiv.fXaxis.fNbins;

   // create new array for hdiv
   hdiv.fArray = new Array(nbins + 2).fill(0);

   // calculate division of two histograms
   for (let i = 1; i <= nbins; i++) {
      let v1 = obj.fNum.fArray[i], v2 = obj.fDen.fArray[i];
      hdiv.fArray[i] = (v2 !== 0) ? v1/v2 : 0;
   }

   // draw new histogram
   return JSROOT.draw(dom, hdiv, opt);
} });
