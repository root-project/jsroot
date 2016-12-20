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

   JSROOT.TSelector = function() {
      // class to read data from TTree
      this.branches = []; // list of reading structures
      this.names = []; // list of names for each branch
      this.is_integer = []; // array of 
      this.break_execution = 0;
      this.tgtobj = {};
   }
   
   JSROOT.TSelector.prototype.AddBranch = function(branch, name) {
      if (!name) name = "br" + this.branches.length; 
      this.branches.push(branch);
      this.names.push(name);
   }
   
   JSROOT.TSelector.prototype.IsInteger = function(nbranch) {
      return this.is_integer[nbranch];
   }
   
   JSROOT.TSelector.prototype.ShowProgress = function(value) {
      // this function should be defined not here
      
      if ((document === undefined) || (JSROOT.progress===undefined)) return;

      if (value===undefined) return JSROOT.progress();

      var main_box = document.createElement("p"),
          text_node = document.createTextNode(value),
          selector = this;
      
      main_box.appendChild(text_node);
      main_box.title = "Click on element to break drawing";

      main_box.onclick = function() {
         if (++selector.break_execution<3) {
            main_box.title = "Tree draw will break after next I/O operation";
            return text_node.nodeValue = "Breaking ... ";
         }
         selector.Abort();
         JSROOT.progress();
      }

      JSROOT.progress(main_box);
   }
   
   JSROOT.TSelector.prototype.Abort = function() {
      // call this function to abort processing
      this.break_execution = -1111;
   }
   
   JSROOT.TSelector.prototype.Process = function(entry) {
      // function called when next entry extracted from the tree
   }
   
   JSROOT.TSelector.prototype.Terminate = function(res) {
      // function called at the very end of processing
   }

   // =================================================================
   
   JSROOT.ArrayIterator = function(arr) {
      // class used to iterate over all array indexes until number value
      this.object = arr;
      this.value = 0; // value always used in iterator
   }
   
   JSROOT.ArrayIterator.prototype.CheckArrayPrototype = function(arr) {
      var proto = Object.prototype.toString.apply(arr);
      return (proto.indexOf('[object')===0) && (proto.indexOf('Array]')>0);
   }
   
   JSROOT.ArrayIterator.prototype.next = function() {
      var cnt = 0;
      
      if (this.arr == undefined) {
         this.arr = [ this.object ];
         this.indx = [ 0 ];
      } else {
        
         if (++this.fastindx < this.fastarr.length) {
            this.value = this.fastarr[this.fastindx];
            return true;
         } 

         cnt = this.arr.length-1;

         while (--cnt >= 0) {
            if (++this.indx[cnt] < this.arr[cnt].length) break;
         }
         if (cnt < 0) return false;
      }
      
      while (true) {
      
         var obj = (this.arr[cnt])[this.indx[cnt]],
             typ = typeof obj; 
         
         if ((typ === "object") && !isNaN(obj.length) && (obj.length > 0) && this.CheckArrayPrototype(obj)) {
            cnt++;
            this.arr[cnt] = obj;
            this.indx[cnt] = 0;
         } else {
            this.value = obj;
            this.fastarr = this.arr[cnt];
            this.fastindx = this.indx[cnt];
            return true;
         } 
      }
      
      return false;
   }
   
   JSROOT.ArrayIterator.prototype.reset = function() {
      delete this.arr;
      this.value = 0;
   }

   // =================================================================
   
   JSROOT.TDrawSelector = function(callback) {
      JSROOT.TSelector.call(this);   
      
      this.ndim = 0;
      this.hist = null;
      this.expr = [];
      this.plain = []; // is branches values can be used directly or need iterator or any other transformation
      this.kind = []; // is final value (after all iterators) is float, int or string
      this.axislbls = ["", "", ""];
      this.histo_callback = callback;
      this.hist_title = "Result of TTree::Draw";
   }

   JSROOT.TDrawSelector.prototype = Object.create(JSROOT.TSelector.prototype);
   
   JSROOT.TDrawSelector.prototype.AddDrawBranch = function(branch, branch_expr, axislbl) {
      
      var id = this.ndim++;
      
      this.AddBranch(branch, "br" + id);
      
      switch(id) {
         case 0: this.arr = []; break; // array to accumulate first dimension
         case 1: this.arr2 = []; break; // array to accumulate second dimension
         default: console.log('more than 2 dimensions not supported'); return false;
      }
      
      this.axislbls[id] = axislbl || "";
      
      if (branch_expr) {
      
         console.log('Add draw branch ', branch.fName, ' with expression', branch_expr);

         this.expr[id] = { arr: false, func: null, code: branch_expr };

         if (branch_expr.indexOf("[]")==0) { this.expr[id].arr = true; branch_expr = branch_expr.substr(2); }

         // ending [] has no meaning - iterator over all array elements done automatically
         if (branch_expr.indexOf("[]") === branch_expr.length-2) 
            branch_expr = branch_expr.substr(0,branch_expr.length-2); 

         if (branch_expr.length>0)
            this.expr[id].func = new Function("func_var", "return func_var" + branch_expr);
         else
            this.expr[id] = undefined; // without func no need to create special handling
      }

      
      return true;
   }

   JSROOT.TDrawSelector.prototype.GetMinMaxBins = function(kind, arr, is_int, nbins) {
      
      var res = { min: 0, max: 0, nbins: nbins };
      
      if (!kind || !arr || (arr.length==0)) return res;
      
      if (kind === "string") {
         res.lbls = []; // all labels
         
         for (var k=0;k<arr.length;++k) 
            if (res.lbls.indexOf(arr[k])<0) 
               res.lbls.push(arr[k]);
         
         res.lbls.sort();
         res.max = res.nbins = res.lbls.length;
      } else {
      
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
      }
      
      res.k = res.nbins/(res.max-res.min);
      
      res.GetBin = function(value) {
         var bin = this.lbls ? this.lbls.indexOf(value) : Math.floor((value-this.min)*this.k);
         return (bin<0) ? 0 : ((bin>this.nbins) ? this.nbins+1 : bin+1); 
      }

      return res;
   }
   
   JSROOT.TDrawSelector.prototype.CreateHistogram = function() {
      if (this.hist || !this.arr || this.arr.length==0) return;
      
      this.x = this.GetMinMaxBins(this.kind[0], this.arr, this.IsInteger(0), (this.ndim == 2) ? 50 : 200);
      
      this.y = this.GetMinMaxBins(this.kind[1], this.arr2, this.IsInteger(1), 50);
      
      this.hist = (this.ndim == 2) ? JSROOT.CreateTH2(this.x.nbins, this.y.nbins) : JSROOT.CreateTH1(this.x.nbins);
      this.hist.fXaxis.fTitle = this.axislbls[0];
      this.hist.fXaxis.fXmin = this.x.min;
      this.hist.fXaxis.fXmax = this.x.max;
      if (this.x.lbls) {
         this.hist.fXaxis.fLabels = JSROOT.Create("THashList");
         for (var k=0;k<this.x.lbls.length;++k) {
            var s = JSROOT.Create("TObjString");
            s.fString = this.x.lbls[k];
            s.fUniqueID = k+1;
            if (s.fString === "") s.fString = "<empty>";
            this.hist.fXaxis.fLabels.Add(s);
         }
      }
      
      if (this.ndim == 2) this.hist.fYaxis.fTitle = this.axislbls[1];
      this.hist.fYaxis.fXmin = this.y.min;
      this.hist.fYaxis.fXmax = this.y.max;
      if (this.y.lbls) {
         this.hist.fYaxis.fLabels = JSROOT.Create("THashList");
         for (var k=0;k<this.y.lbls.length;++k) {
            var s = JSROOT.Create("TObjString");
            s.fString = this.y.lbls[k];
            s.fUniqueID = k+1;
            if (s.fString === "") s.fString = "<empty>";
            this.hist.fYaxis.fLabels.Add(s);
         }
      }
      
      this.hist.fName = "htemp";
      this.hist.fTitle = this.hist_title;
      this.hist.$custom_stat = 111110;
      
      if (this.ndim==2)
         for (var n=0;n<this.arr.length;++n) 
            this.Fill2DHistogram(this.arr[n], this.arr2[n]);
      else
         for (var n=0;n<this.arr.length;++n) 
            this.FillHistogram(this.arr[n]);
      
      delete this.arr;
      delete this.arr2;
   }
   
   JSROOT.TDrawSelector.prototype.FillHistogram = function(xvalue) {
      var bin = this.x.GetBin(xvalue);
      
      this.hist.fArray[bin] += 1;
   }

   JSROOT.TDrawSelector.prototype.Fill2DHistogram = function(xvalue, yvalue) {
      var xbin = this.x.GetBin(xvalue),
          ybin = this.y.GetBin(yvalue);
      
      this.hist.fArray[xbin+(this.x.nbins+2)*ybin] += 1;
   }
   
   JSROOT.TDrawSelector.prototype.CreateIterator = function(value, expr) {

      if ((value===undefined) || (value===null))
         return { next: function() { return false; }}

      var iter = null; 
      
      if (expr) {
         if (expr.arr && expr.func) {
            // special case of array before func
            
            iter = new JSROOT.ArrayIterator(value);
            
            iter.next0 = iter.next;
            iter.func = expr.func;
            
            iter.next = function() {
               if (this.iter2) {
                  if (this.iter2.next()) {
                     this.value = this.iter2.value;
                     return true;
                  }
                  delete this.iter2;
               }
               if (!this.next0()) return false;
               
               this.value = this.func(this.value);
               
               if (this.CheckArrayPrototype(this.value)) {
                  this.iter2 = new JSROOT.ArrayIterator(this.value);
                  return this.next();
               }
               
               return true;
            }
            return iter;
         } else
         if (expr.func) 
            value = expr.func(value);
      }

      if ((typeof value === 'object') && !isNaN(value.length) && (value.length>0))
         iter = new JSROOT.ArrayIterator(value);
      else
         iter = {
             value: value, // always used in iterators
             cnt: 1,
             next: function() { return --this.cnt === 0; },
             reset: function() { this.cnt = 1; }
          };
      
      return iter;
   }

   JSROOT.TDrawSelector.prototype.Process = function(entry) {
      
      if (this.arr !== undefined) {
         var firsttime = false;
         
         if (this.plain.length === 0) {
            this.kind[0] = typeof this.tgtobj.br0;
            this.plain[0] = !this.expr[0] && ((this.kind[0] == 'number') || (this.kind[0] == 'string'));
            if (this.ndim===2) {
               this.kind[1] = typeof this.tgtobj.br1;
               this.plain[1] = !this.expr[1] && ((this.kind[1] == 'number') || (this.kind[1] == 'string'));
            }
            firsttime = true;
         }
         
         if (this.ndim==1) {
            if (this.plain[0]) {
               this.arr.push(this.tgtobj.br0);
            } else {
               var iter = this.CreateIterator(this.tgtobj.br0, this.expr[0]);
               while (iter.next()) 
                  this.arr.push(iter.value);
               if (firsttime) this.kind[0] = typeof iter.value;
            }
            
         } else {
            // only elementary branches in 2d for the moment
         
            if (this.plain[0] && this.plain[1]) {
               this.arr.push(this.tgtobj.br0);
               this.arr2.push(this.tgtobj.br1);
            } else {
               var iter0 = this.CreateIterator(this.tgtobj.br0, this.expr[0]),
                   iter1 = this.CreateIterator(this.tgtobj.br1, this.expr[1]);
               
               while (iter0.next()) {
                  iter1.reset();
                  while (iter1.next()) {
                     this.arr.push(iter0.value);
                     this.arr2.push(iter1.value);
                  }
               }
               
               if (firsttime) {
                  this.kind[0] = typeof iter0.value;
                  this.kind[1] = typeof iter1.value;
               }
            }
         }
         
         if (this.arr.length > 10000) this.CreateHistogram();
      } else
      if (this.hist) {
         if (this.ndim===2) {
            if (this.plain[0] && this.plain[1]) {
               this.Fill2DHistogram(this.tgtobj.br0, this.tgtobj.br1);
            } else {
               var iter0 = this.CreateIterator(this.tgtobj.br0, this.expr[0]),
                   iter1 = this.CreateIterator(this.tgtobj.br1, this.expr[1]);
           
               while (iter0.next()) {
                  iter1.reset();
                  while (iter1.next()) 
                     this.Fill2DHistogram(iter0.value, iter1.value);
               }
            }
         } else {
            if (this.plain[0]) {
               this.FillHistogram(this.tgtobj.br0);
            } else {
               var iter = this.CreateIterator(this.tgtobj.br0, this.expr[0]);
               while (iter.next()) 
                  this.FillHistogram(iter.value);
            }
         }
      }
   }
   
   JSROOT.TDrawSelector.prototype.ProcessArrays = function(entry) {
      // process all branches as arrays
      // works only for very limited number of cases with plain branches, but much faster
      
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
   
   JSROOT.TDrawSelector.prototype.Terminate = function(res) {
      if (res && !this.hist) this.CreateHistogram();
      
      this.ShowProgress();
      
      return JSROOT.CallBack(this.histo_callback, this.hist);
   }

   
   // ======================================================================
   
   
   JSROOT.TTree = function(tree) {
      JSROOT.extend(this, tree);
   }
   
   
   JSROOT.TTree.prototype.Process = function(selector, option, numentries, firstentry) {
      // function similar to the TTree::Process
      
      if (!selector || !this.$file || !selector.branches) {
         console.error('required parameter missing in for TTree::Select');
         return false;
      }
      
      // central handle with all information required for reading
      var handle = {
          file: this.$file, // keep file reference
          selector: selector, // reference on selector  
          arr: [], // list of branches 
          curr: -1,  // current entry ID
          option: option || "",
          numentries: isNaN(numentries) ? 1e9 : numentries,
          firstentry: isNaN(firstentry) ? 0 : firstentry,
          stage_min: -1, // current entryid limit
          stage_max: -1,  // current entryid limit
          staged: [], // list of requested baskets for next I/O operation
          current_entry: 0, // current processed entry
          simple_read: true, // all baskets in all used branches are in sync,
          process_arrays: false // one can process all branches as arrays
      };
      
      handle.stage_min = handle.firstentry;
      handle.stage_max = handle.firstentry + handle.numentries;
      
      // check all branches with counters and add it to list of read branches
      
      for (var nn = 0; nn < selector.branches.length; ++nn) {
         var branch = selector.branches[nn],
             brcnt = branch.fBranchCount;
         
         if (!brcnt) continue;
         
         var indx = selector.branches.indexOf(brcnt), cntname = "";
         if (indx > nn) { 
            console.log('Should not happen - count branch after depend branch');
            cntname = selector.names[indx];
            selector.branches.splice(indx, 1);
            selector.names.splice(indx, 1);
            indx = -1;
         }
         
         if (indx < 0) {
            if (cntname.length===0)
               for (var d=0;d<selector.branches.length*10;++d) {
                  cntname = "counter" + d;
                  if (selector.names.indexOf(cntname) < 0) break;
               }
            
            console.log('Add counter branch with name ', cntname);
            selector.branches.unshift(brcnt);
            selector.names.unshift(cntname);
         }
      }
      
      for (var nn = 0; nn < selector.branches.length; ++nn) {
      
         var branch = selector.branches[nn],
             nb_branches = branch.fBranches ? branch.fBranches.arr.length : 0,
             nb_leaves = branch.fLeaves ? branch.fLeaves.arr.length : 0,
             leaf = (nb_leaves>0) ? branch.fLeaves.arr[0] : null,
             datakind = 0, arrsize = 1, elem = null;
      
         if ((nb_leaves === 1) && ((leaf.fName === branch.fName) || (branch.fName.indexOf(leaf.fName)===0)) )
            switch (leaf._typename) {
              case 'TLeafF' : datakind = JSROOT.IO.kFloat; break;
              case 'TLeafD' : datakind = JSROOT.IO.kDouble; break;
              case 'TLeafO' : datakind = JSROOT.IO.kBool; break;
              case 'TLeafB' : datakind = leaf.fIsUnsigned ? JSROOT.IO.kUChar : JSROOT.IO.kChar; break;
              case 'TLeafS' : datakind = leaf.fIsUnsigned ? JSROOT.IO.kUShort : JSROOT.IO.kShort; break;
              case 'TLeafI' : datakind = leaf.fIsUnsigned ? JSROOT.IO.kUInt : JSROOT.IO.kInt; break;
              case 'TLeafL' : datakind = leaf.fIsUnsigned ? JSROOT.IO.kULong64 : JSROOT.IO.kLong64; break;
              case 'TLeafElement' : {
                 var s_i = this.$file.FindStreamerInfo(branch.fClassName,  branch.fClassVersion, branch.fCheckSum);
                 
                 if (!s_i) console.log('Not found streamer info ', branch.fClassName,  branch.fClassVersion, branch.fCheckSum); else
                 if ((leaf.fID<0) || (leaf.fID>=s_i.fElements.arr.length)) console.log('Leaf with ID out of range', leaf.fID); else
                 elem = s_i.fElements.arr[leaf.fID];
                 
                 break;
              }
            }
    
         if (datakind > 0) {
            elem = JSROOT.IO.CreateStreamerElement("temporary", "int");
            elem.fType = datakind;
            if (arrsize > 1) {
               elem.fArrayLength = arrsize; elem.fArrayDim = 1, elem.fMaxIndex[0] = arrsize; 
            }
         }
         
         if (!elem) {
            console.log('Not supported branch kinds', branch.fName);
            selector.Terminate(false);
            return false;
         }

         // just intermediate solution
         selector.is_integer[nn] = JSROOT.IO.IsInteger(elem.fType) || JSROOT.IO.IsInteger(elem.fType-JSROOT.IO.kOffsetL);

         // this element used to read branch value
         var member = JSROOT.IO.CreateMember(elem, this.$file);
         if (!member || !member.func) {
            console.log('Not supported branch kinds', branch.fName);
            selector.Terminate(false);
            return false;
         }
         
         if (branch.fBranchCount) {
            
            var indx = selector.branches.indexOf(branch.fBranchCount);
            
            if (indx<0) {
               console.log('Not found fBranchCount', branch.fBranchCount.fName);
               selector.Terminate(false);
               return false;
            }
            
            // we specify that counter read as additional data member of target object 
            member.cntname = selector.names[indx];
            
            selector.process_arrays = false;
         }
         
         // set name used to store result
         member.name = selector.names[nn];

         handle.arr.push({
            branch: branch,
            name: selector.names[nn],
            member: member,
            type: elem.fType, // keep type identifier
            curr_entry: -1, // last processed entry
            raw : null, // raw buffer for reading
            curr_basket: 0,  // number of basket used for processing
            read_entry: -1,  // last entry which is already read 
            staged_entry: -1, // entry which is staged for reading
            staged_basket: 0,  // last basket staged for reading
            numbaskets: branch.fWriteBasket || branch.fMaxBaskets,
            baskets: [] // array for read baskets,
         });
         
         if (handle.arr.length>1) {
            var elem0 = handle.arr[0], elem = handle.arr[nn];

            if (elem.numbaskets !== elem0.numbaskets) handle.simple_read = false;
            
            for (var n=0;n<elem.numbaskets;++n) 
               if (elem.branch.fBasketEntry[n]!==elem0.branch.fBasketEntry[n]) handle.simple_read = false;

         }
      }
      
      if ((typeof selector.ProcessArrays === 'function') && handle.simple_read) {
         // this is indication that selector can process arrays of values
         // only streactly-matched tree structure can be used for that
         
         for (var k=0;k<handle.arr.length;++k) {
            var elem = handle.arr[k];
            if ((elem.type<=0) || (elem.type >= JSROOT.IO.kOffsetL)) handle.process_arrays = false;
         }
         
         if (handle.process_arrays) {
            // create other members for fast processings
            
            selector.tgtarr = {}; // object with arrays
            
            for(var nn=0;nn<handle.arr.length;++nn) {
               var item = handle.arr[nn];
               
               var elem = JSROOT.IO.CreateStreamerElement(item.name, "int");
               elem.fType = item.type + JSROOT.IO.kOffsetL;
               elem.fArrayLength = 10; elem.fArrayDim = 1, elem.fMaxIndex[0] = 10; // 10 if artificial number, will be replaced during reading
               
               item.arrmember = JSROOT.IO.CreateMember(elem, this.$file);
            }
         }
      } else {
         handle.process_arrays = false;         
      }
      
      function ReadNextBaskets() {
         
         var totalsz = 0, places = [], isany = true;
         
         handle.staged = [];
         
         while ((totalsz < 1e6) && isany) {
            isany = false;
            for (var n=0; n<handle.arr.length; n++) {
               var elem = handle.arr[n];

               while (elem.staged_basket < elem.numbaskets) {

                  var k = elem.staged_basket++;
                  
                  if (!handle.simple_read) {
                  
                     var entry1 = elem.branch.fBasketEntry[k],
                         entry2 = elem.branch.fBasketEntry[k+1];
                  
                     if ((entry2 < handle.stage_min) || (entry1 >= handle.stage_max)) continue;
                  }

                  places.push(elem.branch.fBasketSeek[k], elem.branch.fBasketBytes[k]);
                  
                  totalsz += elem.branch.fBasketBytes[k];
                  isany = true;
                   
                  elem.staged_entry = elem.branch.fBasketEntry[k+1];
                  
                  handle.staged.push({branch:n, basket: k}); // remember basket staged for reading
                  
                  break;
               }
            }
         }
         
         if ((totalsz === 0) && (handle.staged.length===0)) 
            return handle.selector.Terminate(true);
         
         var portion = handle.arr[0].staged_basket / (handle.arr[0].numbaskets+1e-7); 

         handle.selector.ShowProgress("TTree draw " + Math.round((portion*100)) + " %  ");
         
         handle.file.ReadBaskets(places, ProcessBaskets); 
      }
      
      function ProcessBaskets(baskets) {
         // this is call-back when next baskets are read

         if ((handle.selector.break_execution !== 0) || !baskets) 
            return handle.selector.Terminate(false);
         
         if (baskets.length !== handle.staged.length) {
            console.log('Internal TTree reading problem');
            return handle.selector.Terminate(false);
         }
         
         // redistribute read baskets over branches
         for(var n=0;n<baskets.length;++n) {
            var tgt = handle.staged[n];
            handle.arr[tgt.branch].baskets[tgt.basket] = baskets[n];
         }
         
         handle.staged = [];

         // now process baskets
         
         var isanyprocessed = false;
         
         while(true) {
         
            var numentries = 1;
            
            // firt loop used to check if all required data exists
            for (var n=0;n<handle.arr.length;++n) {

               var elem = handle.arr[n];

               if (!elem.raw) {
                  if ((elem.curr_basket >= elem.numbaskets)) {
                     if (n==0) return handle.selector.Terminate(true);
                     continue; // ignore non-master branch
                  }

                  var basket = elem.baskets[elem.curr_basket];

                  // basket not read
                  if (!basket) { 
                     // no data, but no any event processed - problem
                     if (!isanyprocessed) return handle.selector.Terminate(false);

                     // try to read next portion of tree data
                     return ReadNextBaskets();
                  }

                  elem.raw = basket.raw;
                  elem.basket = basket;
                  elem.nev = 0;
                  
                  if (handle.simple_read) {
                     if (n==0) numentries = basket.fNevBuf; else
                     if (numentries != basket.fNevBuf) { console.log('missmatch entries in simple mode', numentries, basket.fNevBuf); numentries = 1;  }   
                  }

                  elem.baskets[elem.curr_basket++] = null; // remove reference
               }
            }
            
            // numentries = 10; // only for debug
            
            // second loop extracts all required data
            
            if (handle.process_arrays && (numentries>1)) {
               // special case - read all data from baskets as arrays

               for (var n=0;n<handle.arr.length;++n) {
                  var elem = handle.arr[n];
                  elem.arrmember.arrlength = numentries;

                  elem.arrmember.func(elem.raw, handle.selector.tgtarr);

                  elem.nev += numentries;
                  
                  elem.raw = elem.basket = null;
               }

               handle.selector.ProcessArrays(handle.current_entry);

               handle.current_entry += numentries; 

               isanyprocessed = true;
            } else {
               for (var e=0;e<numentries;++e) {
                  for (var n=0;n<handle.arr.length;++n) {
                     var elem = handle.arr[n];

                     if (!elem.raw) continue;

                     elem.member.func(elem.raw, handle.selector.tgtobj);
                     elem.nev++;

                     if (elem.nev >= elem.basket.fNevBuf)
                        elem.raw = elem.basket = null;
                  }

                  handle.selector.Process(handle.current_entry++);

                  isanyprocessed = true;
               }
            }
            
            // return handle.selector.Terminate(true); // only for debug to process single basket
         }
      }
      
      ReadNextBaskets();
       
      return true; // indicate that reading of tree will be performed
   }
   
   JSROOT.TTree.prototype.FindBranch = function(branchname, complex) {
      // search branch with specified name
      // if complex enabled, search branch and rest part
      
      function Find(lst, name) {
         var search = name, br = null, 
             dot = name.indexOf("."), arr = name.indexOf("[]"),
             pos = (dot<0) ? arr : ((arr<0) ? dot : Math.min(dot,arr));
         
         for (var loop=0;loop<2;++loop) {
         
            for (var n=0;n<lst.arr.length;++n) {
               var brname = lst.arr[n].fName;
               if (brname[brname.length-1] == "]") 
                  brname = brname.substr(0, brname.indexOf("["));
               if (brname === search) { 
                  br = lst.arr[n];
                  if (loop===0) return br; // when search full name, return found branchs
                  break;
               }
            }
            
            if (br || (pos<=0)) break; 
            
            // first loop search complete name, second loop - only first part
            search = name.substr(0, pos);
         }
         
         if (!br || (pos <= 0) || (pos === name.length-1)) return br;
         
         var res = null;
         
         if (dot>0) {
            res = Find(br.fBranches, name.substr(dot+1));
            // special case if next-level branch has name parent_branch.next_branch 
            if (!res && (br.fName.indexOf(".")<0) && (br.fName.indexOf("[")<0))
               res = Find(br.fBranches, br.fName + name.substr(dot));
         }
         

         // when allowed, return find branch with rest part
         if (!res && complex) return { branch: br, rest: name.substr(pos) };
         
         return res;
      }
      
      return Find(this.fBranches, branchname);
   }
   
   JSROOT.TTree.prototype.Draw = function(expression, cut, opt, nentries, firstentry, histo_callback) {
      // this is JSROOT implementaion of TTree::Draw
      // in callback returns histogram
      
      var names = expression ? expression.split(":") : [];
      if ((names.length < 1) || (names.length > 2))
         return JSROOT.CallBack(histo_callback, null);

      var selector = new JSROOT.TDrawSelector(histo_callback);
      
      for (var n=0;n<names.length;++n) {
         var br = this.FindBranch(names[n], true);
         if (!br) {
            console.log('Not found branch', names[n]);
            return JSROOT.CallBack(histo_callback, null);
         }
         
         if (br.branch) 
            selector.AddDrawBranch(br.branch, br.rest, names[n]);
         else
            selector.AddDrawBranch(br, undefined, names[n]);
      }
      
      selector.hist_title = "drawing '" + expression + "' from " + this.fName;
      
      return this.Process(selector, opt, nentries, firstentry);
   }

   JSROOT.TTree.prototype.DrawBranch = function(branch, expr, opt, nentries, firstentry, histo_callback) {
      // this is JSROOT implementaion of TTree::Draw
      // in callback returns histogram
      
      var selector = new JSROOT.TDrawSelector(histo_callback);
      
      selector.AddDrawBranch(branch, expr, branch.fName);
      
      selector.hist_title = "drawing '" + branch.fName + "' from " + this.fName;
      
      return this.Process(selector, opt, nentries, firstentry);
   }

   

   return JSROOT;

}));
