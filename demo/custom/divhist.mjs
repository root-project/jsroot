import { addDrawFunc, create, draw } from 'jsroot';

addDrawFunc({

   // this is class name
   name: 'DivHist',

   // this is icon
   icon: 'img_histo1d',

   // supported draw options
   opt: ';pads',

   // draw function which accept three arguments, same as JSROOT.draw
   func: (dom, obj, opt) => {

      // clone histogram
      const hdiv = Object.assign({}, obj.fNum);

      hdiv.fName = 'ratio';
      hdiv.fTitle = 'ratio histogram';

      const nbins = hdiv.fXaxis.fNbins;

      // create new array for hdiv
      hdiv.fArray = new Array(nbins + 2).fill(0);

      // calculate division of two histograms
      for (let i = 1; i <= nbins; i++) {
         const v1 = obj.fNum.fArray[i], v2 = obj.fDen.fArray[i];
         hdiv.fArray[i] = (v2 !== 0) ? v1 / v2 : 0;
      }

      // draw new histogram
      if (opt !== 'pads')
         return draw(dom, hdiv, opt);

      const canv = create('TCanvas');

      canv.Divide(1, 3);
      canv.GetPad(1).fPrimitives.Add(obj.fNum);
      canv.GetPad(2).fPrimitives.Add(obj.fDen);
      canv.GetPad(3).fPrimitives.Add(hdiv);
      return draw(dom, canv);

   },

   // expand user object, provide elements which should be seen
   expand: (parent, obj) => {
      parent._childs = [{
         _kind: `ROOT.${obj.fNum._typename}`,
         _name: 'Num',
         _title: 'Title for fNum',
         _obj: obj.fNum
      }, {
         _kind: `ROOT.${obj.fDen._typename}`,
         _name: 'Den',
         _title: 'Title for fDen',
         _obj: obj.fDen
      }];
      return true;
   }

});
