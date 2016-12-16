/// @file JSRootTree.js
/// Collect all TTree-relevant methods like reading and processing

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      // AMD. Register as an anonymous module.
      define( ['JSRootCore', 'JSRootIOEvolution'], factory );
   } else {

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'JSRootTree.js');

      if (typeof JSROOT.IO != 'object')
         throw new Error('JSROOT.IO not defined', 'JSRootTree.js');

      // Browser globals
      factory(JSROOT);
   }
} (function(JSROOT) {
   
   // ==========================================================================
   
   JSROOT.FindTreeBranch = function(tree, branchname) {
      if (!tree) return null;
      
      for (var n=0;n<tree.fBranches.arr.length;++n)
         if (tree.fBranches.arr[n].fName === branchname) return tree.fBranches.arr[n];
      
      return null;
   }
   
   JSROOT.TTreeDraw = function(tree, expr, cut, opt, nentries, firstentry, histo_callback) {
      // this is JSROOT implementaion of TTree::Draw
      // in callback returns histogram
      
      if (!tree || !expr) return JSROOT.CallBack(histo_callback, null);
      
      var names = expr.split(":");
      if ((names.length < 1) || (names.length > 2))
         return JSROOT.CallBack(histo_callback, null);
      
      var br = [];
      
      for (var n=0;n<names.length;++n) {
         br[n] = JSROOT.FindTreeBranch(tree, names[n]);
         if (!br[n]) {
            console.log('Not found branch', names[n]);
            return JSROOT.CallBack(histo_callback, null);
         }
      }

      tree.file = tree.fFile;
      
      var selector = new JSROOT.TSelector();
      
      selector.ndim = 1;
      selector.hist = null;
      selector.arr = [];
      selector.AddBranch(br[0], "br0");
      
      if (names.length == 2) { 
         selector.AddBranch(br[1], "br1");
         selector.ndim = 2;
         selector.arr2 = [];
      } 
      
      selector.GetMinMaxBins = function(arr, is_int, nbins) {
         
         var res = { min: 0, max: 0, nbins: nbins };
         
         if (!arr || (arr.length==0)) return res;
         
         res.min = Math.min.apply(null, arr);
         res.max = Math.max.apply(null, arr);

         if (res.min>=res.max) {
            res.max = res.min;
            if (Math.abs(res.min)<100) { res.min-=1; res.max+=1; } else
            if (res.min>0) { res.min*=0.9; res.max*=1.1; } else { res.min*=1.1; res.max*=0.9; } 
         } else
         if (is_int && (res.max-res.min >=1) && (res.max-res.min<nbins*10)) {
             res.min -= 1;
             res.max += 2;
             res.nbins = res.max - res.min;
         } else {
            res.max += (res.max-res.min)/res.nbins;
         }

         return res;
      }
      
      selector.CreateHistogram = function() {
         if (this.hist || !this.arr || this.arr.length==0) return;
         
         var x = this.GetMinMaxBins(this.arr, this.IsInteger(0), (this.ndim == 2) ? 50 : 200),
             y = this.GetMinMaxBins(this.arr2, this.IsInteger(1), 50);
         
         this.hist = (this.ndim == 2) ? JSROOT.CreateTH2(x.nbins, y.nbins) : JSROOT.CreateTH1(x.nbins);
         this.hist.fXaxis.fXmin = x.min;
         this.hist.fXaxis.fXmax = x.max;
         this.hist.fXaxis.fTitle = names[0];
         this.hist.fYaxis.fXmin = y.min;
         this.hist.fYaxis.fXmax = y.max;
         if (this.ndim == 2) this.hist.fYaxis.fTitle = names[1];
         this.hist.fName = "draw_" + names[0];
         this.hist.fTitle = "drawing '" + expr + "' from " + tree.fName;
         this.hist.fCustomStat = 111110;
         
         if (this.ndim==2)
            for (var n=0;n<this.arr.length;++n) 
               this.hist.Fill(this.arr[n], this.arr2[n]);
         else
            for (var n=0;n<this.arr.length;++n) 
               this.hist.Fill(this.arr[n]);
         
         delete this.arr;
         delete this.arr2;
      }

      selector.Process = function(entry) {
         // do something
         
         if (this.arr !== undefined) {
            this.arr.push(this.tgtobj.br0);
            if (this.ndim==2) this.arr2.push(this.tgtobj.br1);
            if (this.arr.length > 10000) this.CreateHistogram();
         } else
         if (this.hist)
            this.hist.Fill(this.tgtobj.br0, this.tgtobj.br1);
      }
      
      selector.ProcessArrays = function(entry) {
         // process all branches as arrays
         // works only for very limited number of cases, but much faster
         
         if (this.arr !== undefined) {
            for (var n=0;n<this.tgtarr.br0.length;++n)
               this.arr.push(this.tgtarr.br0[n]);
            if (this.ndim==2) 
               for (var n=0;n<this.tgtarr.br1.length;++n)
                 this.arr2.push(this.tgtarr.br1[n]);
            if (this.arr.length > 10000) this.CreateHistogram();
         } else
         if (this.hist) {
            if (this.ndim==1) {
               for (var n=0;n<this.tgtarr.br0.length;++n)
                  this.hist.Fill(this.tgtarr.br0[n]);
            } else {
               for (var n=0;n<this.tgtarr.br0.length;++n)
                  this.hist.Fill(this.tgtarr.br0[n], this.tgtarr.br1[n]);
            }
         }
      }
      
      selector.Terminate = function(res) {
         if (res && !this.hist) this.CreateHistogram();
         
         this.ShowProgress();
         
         return JSROOT.CallBack(histo_callback, this.hist);
      }
      
      return tree.Process(selector);
   }

   return JSROOT;

}));
