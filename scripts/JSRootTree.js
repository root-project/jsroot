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
   
   JSROOT.BranchType = { kLeafNode: 0, kBaseClassNode: 1, kObjectNode: 2, kClonesNode: 3,
                         kSTLNode: 4, kClonesMemberNode: 31, kSTLMemberNode: 41 }; 
   
   JSROOT.TSelector = function() {
      // class to read data from TTree
      this.branches = []; // list of branches to read
      this.names = []; // list of member names for each branch in tgtobj
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
         if (this.object.length === 0) return false;
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
             typ = obj ? typeof obj : "any"; 
         
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
            res.nbins = Math.round(res.max - res.min);
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

      if ((typeof value === 'object') && !isNaN(value.length))
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
      
      return JSROOT.CallBack(this.histo_callback, this.hist, this.ndim==2 ? "col" : "");
   }

   
   // ======================================================================
   
   
   JSROOT.TTree = function(tree) {
      JSROOT.extend(this, tree);
   }
   
   
   JSROOT.TTree.prototype.Process = function(selector, args) {
      // function similar to the TTree::Process
      
      if (!selector || !this.$file || !selector.branches || (typeof args !== 'object')) {
         console.error('required parameter missing in for TTree::Process');
         return false;
      }
      
      // central handle with all information required for reading
      var handle = {
          file: this.$file, // keep file reference
          selector: selector, // reference on selector  
          arr: [], // list of branches 
          curr: -1,  // current entry ID
          numentries: isNaN(args.numentries) ? 1e9 : args.numentries,
          firstentry: isNaN(args.firstentry) ? 0 : args.firstentry,
          process_min: -1, // current entryid limit
          process_max: -1,  // current entryid limit
          current_entry: 0, // current processed entry
          simple_read: true, // all baskets in all used branches are in sync,
          process_arrays: false // one can process all branches as arrays
      };
      
      handle.process_min = handle.firstentry;
      handle.process_max = handle.firstentry + handle.numentries;
      
      // check all branches with counters and add it to list of read branches
      
      var cnt_br = [], cnt_names = [];
      
      for (var nn = 0; nn < selector.branches.length; ++nn) {
         var branch = selector.branches[nn];
         
         for (var loop = 0; loop<2; ++loop) {
         
            var brcnt = (loop === 0) ? branch.fBranchCount : branch.fBranchCount2;
            
            if ((loop === 1) && !brcnt && branch.fBranchCount && (branch.fBranchCount.fStreamerType===JSROOT.IO.kSTL) && 
                ((branch.fStreamerType === JSROOT.IO.kStreamLoop) || (branch.fStreamerType === JSROOT.IO.kOffsetL+JSROOT.IO.kStreamLoop))) {
               // special case when count member from kStreamLoop not assigned as fBranchCount2  
               var s_i = this.$file.FindStreamerInfo(branch.fClassName,  branch.fClassVersion, branch.fCheckSum),
                   elem = s_i ? s_i.fElements.arr[branch.fID] : null,
                   arr = branch.fBranchCount.fBranches.arr  ;

               if (elem && elem.fCountName && arr) 
                  for(var k=0;k<arr.length;++k) 
                     if (arr[k].fName === branch.fBranchCount.fName + "." + elem.fCountName) {
                        branch.$specialCount = brcnt = arr[k];
                        break;
                     }

               if (!brcnt) console.error('Did not found branch for second counter of kStreamLoop element');
            }  
            
            if (!brcnt) continue;

            var indx = selector.branches.indexOf(brcnt), cntname = "";
            if (indx > nn) { 
               console.log('Should not happen - count branch after depend branch');
               cntname = selector.names[indx];
               selector.branches.splice(indx, 1);
               selector.names.splice(indx, 1);
               indx = -1;
            }

            if ((indx < 0) && (cnt_br.indexOf(brcnt)<0)) {
               if (!cntname) cntname = "$counter" + cnt_br.length;
               console.log('Add counter branch ', brcnt.fName, ' with member name ', cntname);
               cnt_br.push(brcnt);
               cnt_names.push(cntname);
            }
         }
      }
      
      if (cnt_br.length>0) {
         // ensure that counters read in proper order and before normal branches
         selector.branches = cnt_br.concat(selector.branches);
         selector.names = cnt_names.concat(selector.names);
      }
      
      function CreateLeafElem(leaf, name) {
         // function creates TStreamerElement which corresponds to the elementary leaf
         var datakind = 0;
         switch (leaf._typename) {
            case 'TLeafF': datakind = JSROOT.IO.kFloat; break;
            case 'TLeafD': datakind = JSROOT.IO.kDouble; break;
            case 'TLeafO': datakind = JSROOT.IO.kBool; break;
            case 'TLeafB': datakind = leaf.fIsUnsigned ? JSROOT.IO.kUChar : JSROOT.IO.kChar; break;
            case 'TLeafS': datakind = leaf.fIsUnsigned ? JSROOT.IO.kUShort : JSROOT.IO.kShort; break;
            case 'TLeafI': datakind = leaf.fIsUnsigned ? JSROOT.IO.kUInt : JSROOT.IO.kInt; break;
            case 'TLeafL': datakind = leaf.fIsUnsigned ? JSROOT.IO.kULong64 : JSROOT.IO.kLong64; break;
            case 'TLeafC': datakind = JSROOT.IO.kTString; break;
            default: return null;
         }
         var elem = JSROOT.IO.CreateStreamerElement(name || leaf.fName, "int");
         elem.fType = datakind;
         return elem;
      }
      
      for (var nn = 0; nn < selector.branches.length; ++nn) {
      
         var branch = selector.branches[nn],
             nb_branches = branch.fBranches ? branch.fBranches.arr.length : 0,
             nb_leaves = branch.fLeaves ? branch.fLeaves.arr.length : 0,
             leaf = (nb_leaves>0) ? branch.fLeaves.arr[0] : null,
             elem = null, member = null, 
             is_brelem = (branch._typename==="TBranchElement");
          
         if (!branch.fEntries) {
            console.log('Branch ', branch.fName, ' does not have entries');
            selector.Terminate(false);
            return false;
         } else   
//         if (branch.fFileName) {
//            console.error('Branch ', branch.fName, ' stored in different file ', branch.fFileName, ' not supported');
//            selector.Terminate(false);
//            return false;
//         } else  
         if (is_brelem && (branch.fType === JSROOT.BranchType.kObjectNode)) {
             // branch with  
             console.log('Branch with kObjectNode cannot be read - has no baskets at all');
             continue;
         } else 
         if (is_brelem && ((branch.fType === JSROOT.BranchType.kClonesNode) || (branch.fType === JSROOT.BranchType.kSTLNode))) {
            // this is branch with counter 
            elem = JSROOT.IO.CreateStreamerElement(selector.names[nn], "int");
         } else
      
         if (is_brelem && (nb_leaves === 1) && (leaf.fName === branch.fName) && (branch.fID==-1)) {
            
            elem = JSROOT.IO.CreateStreamerElement(selector.names[nn], branch.fClassName);

            console.log('TBranchElement with ID==-1 typename ', branch.fClassName, elem.fType);
            
            if (elem.fType === JSROOT.IO.kAny) {
               // this is indication that object stored in the branch - need special handling
               
               var streamer = this.$file.GetStreamer(branch.fClassName, { val: branch.fClassVersion, checksum: branch.fCheckSum });
               
               if (!streamer) elem = null; else
                  member = {
                        name: selector.names[nn],
                        typename: branch.fClassName,
                        streamer: streamer, 
                        func: function(buf,obj) {
                           var res = { _typename: this.typename };
                           for (var n = 0; n < this.streamer.length; ++n)
                              this.streamer[n].func(buf, res);
                           obj[this.name] = res;
                        }
                  };
            }
            
            // elem.fType = JSROOT.IO.kAnyP;

            // only STL containers here
            // if (!elem.fSTLtype) elem = null;
         } else
         if ((nb_leaves === 1) && ((leaf.fName === branch.fName) || (branch.fName.indexOf(leaf.fName+"[")==0) || (leaf.fName.indexOf(branch.fName+"[")==0))) {
            if (leaf._typename === 'TLeafElement') {
              var s_i = this.$file.FindStreamerInfo(branch.fClassName, branch.fClassVersion, branch.fCheckSum);
                 
              if (!s_i) console.log('Not found streamer info ', branch.fClassName,  branch.fClassVersion, branch.fCheckSum); else
              if ((leaf.fID<0) || (leaf.fID>=s_i.fElements.arr.length)) console.log('Leaf with ID out of range', leaf.fID); else
              elem = s_i.fElements.arr[leaf.fID];
            } else {
               elem = CreateLeafElem(leaf, selector.names[nn]);
            }
         } else
         if ((branch._typename === "TBranch") && (nb_leaves > 1)) {
            // branch with many elementary leaves
            
            console.log('Create reader for branch with ', nb_leaves, ' leaves');
            
            var arr = new Array(nb_leaves), isok = true;
            for (var l=0;l<nb_leaves;++l) {
               arr[l] = CreateLeafElem(branch.fLeaves.arr[l]);
               arr[l] = JSROOT.IO.CreateMember(arr[l], this.$file);
               if (!arr[l]) isok = false;
            }
            
            if (isok)
               member = {
                  name: selector.names[nn],
                  leaves: arr, 
                  func: function(buf, obj) {
                     var tgt = obj[this.name] = {};
                     for (var l=0;l<this.leaves.length;++l)
                        this.leaves[l].func(buf,tgt);
                  }
              }
         } 
         
         if (!elem && !member) {
            console.log('Not supported branch kind', branch.fName, branch._typename);
            selector.Terminate(false);
            return false;
         }

         // just intermediate solution
         if (elem)
            selector.is_integer[nn] = JSROOT.IO.IsInteger(elem.fType) || JSROOT.IO.IsInteger(elem.fType-JSROOT.IO.kOffsetL);
         
         if (!member) {
            member = JSROOT.IO.CreateMember(elem, this.$file);
            if ((member.base !== undefined) && member.basename) {
               // when element represent base class, we need handling which differ from normal IO
               member.func = function(buf, obj) {
                  if (!obj[this.name]) obj[this.name] = { _typename: this.basename };
                  buf.ClassStreamer(obj[this.name], this.basename);
               };

            }
         }

         // this element used to read branch value
         if (!member || !member.func) {
            console.log('Not supported branch kinds', branch.fName);
            selector.Terminate(false);
            return false;
         }
         
         if (branch.fBranchCount) {
            var count_indx = selector.branches.indexOf(branch.fBranchCount);
            
            if (count_indx<0) {
               console.log('Not found fBranchCount in the list', branch.fBranchCount.fName);
               selector.Terminate(false);
               return false;
            }

            selector.process_arrays = false;

            if ((branch.fBranchCount.fType === JSROOT.BranchType.kClonesNode) || (branch.fBranchCount.fType === JSROOT.BranchType.kSTLNode)) {
               // console.log('introduce special handling with STL size', elem.fType);
               
               if ((elem.fType === JSROOT.IO.kDouble32) || (elem.fType === JSROOT.IO.kFloat16)) {
                  // special handling for compressed floats
                  
                  member.stl_size = selector.names[count_indx];
                  member.func = function(buf, obj) {
                     obj[this.name] = this.readarr(buf, obj[this.stl_size]);
                  }
                  
               } else
               if (((elem.fType === JSROOT.IO.kOffsetP+JSROOT.IO.kDouble32) || (elem.fType === JSROOT.IO.kOffsetP+JSROOT.IO.kFloat16)) && branch.fBranchCount2) {
                  // special handling for compressed floats - not tested 
                  var count2_indx = selector.branches.indexOf(branch.fBranchCount2);

                  member.stl_size = selector.names[count_indx];
                  member.arr_size = selector.names[count2_indx];
                  member.func = function(buf, obj) {
                     var sz0 = obj[this.stl_size], sz1 = obj[this.arr_size], arr = new Array(sz0);
                     for (var n=0;n<sz0;++n) 
                        arr[n] = (buf.ntou1() === 1) ? this.readarr(buf, sz1[n]) : [];
                     obj[this.name] = arr;
                  }
                  
               } else
               // special handling of simple arrays
               if (((elem.fType > 0) && (elem.fType < JSROOT.IO.kOffsetL)) || (elem.fType === JSROOT.IO.kTString) ||
                   (((elem.fType > JSROOT.IO.kOffsetP) && (elem.fType < JSROOT.IO.kOffsetP + JSROOT.IO.kOffsetL)) && branch.fBranchCount2)) {
                  
                  member = {
                     name: selector.names[nn],
                     stl_size: selector.names[count_indx],
                     type: elem.fType,
                     func: function(buf, obj) {
                        obj[this.name] = buf.ReadFastArray(obj[this.stl_size], this.type);
                     }
                  };
                  
                  if (branch.fBranchCount2) {
                     member.type -= JSROOT.IO.kOffsetP;  
                     var count2_indx = selector.branches.indexOf(branch.fBranchCount2);
                     member.arr_size = selector.names[count2_indx];
                     member.func = function(buf, obj) {
                        var sz0 = obj[this.stl_size], sz1 = obj[this.arr_size], arr = new Array(sz0);
                        for (var n=0;n<sz0;++n) 
                           arr[n] = (buf.ntou1() === 1) ? buf.ReadFastArray(sz1[n], this.type) : [];
                        obj[this.name] = arr;
                     }
                  }
                  
               } else 
               if (elem.fType == JSROOT.IO.kStreamer) {
                  // with streamers one need to extend existing array
                  
                  if (branch.fBranchCount2 || branch.$specialCount)
                     throw new Error('Second branch counter not supported yet with JSROOT.IO.kStreamer');

                  console.log('Reading kStreamer in STL branch');
                  
                  // function provided by normal I/O
                  member.func = member.branch_func;
                  member.stl_size = selector.names[count_indx]; 
                  
               } else 
               if ((elem.fType === JSROOT.IO.kStreamLoop) || (elem.fType === JSROOT.IO.kOffsetL+JSROOT.IO.kStreamLoop)) {
                  // special solution for kStreamLoop
                  
                  var brcnt = branch.fBranchCount2 || branch.$specialCount;
                  if (!brcnt) throw new Error('Missing second count branch for kStreamLoop ' + branch.fName);
                  
                  delete branch.$specialCount;
                  
                  member.stl_size = selector.names[count_indx];
                  member.cntname = selector.names[selector.branches.indexOf(brcnt)];
                  member.func = member.branch_func; // this is special function, provided by base I/O
                  
               } else  {
                  
                  member.name = "$stl_member";

                  var brcnt = branch.fBranchCount2 || branch.$specialCount, loop_size_name;

                  if (brcnt) {
                     delete branch.$specialCount;
                     if (member.cntname) { 
                        loop_size_name = selector.names[selector.branches.indexOf(brcnt)];
                        member.cntname = "$loop_size";
                     } else {
                        throw new Error('Second branch counter not used - very BAD');
                     }
                  }
                  
                  var stlmember = {
                        name: selector.names[nn],
                        stl_size: selector.names[count_indx],
                        loop_size: loop_size_name,
                        member0: member,
                        func: function(buf, obj) {
                           var cnt = obj[this.stl_size], arr = new Array(cnt), n = 0;
                           for (var n=0;n<cnt;++n) {
                              if (this.loop_size) obj.$loop_size = obj[this.loop_size][n]; 
                              this.member0.func(buf, obj);
                              arr[n] = obj.$stl_member;
                           }
                           delete obj.$stl_member;
                           delete obj.$loop_size;
                           obj[this.name] = arr;
                        }
                  };

                  member = stlmember;
               }
               
            } else {
               if (member.cntname === undefined) console.log('Problem with branch ', branch.fName, ' reader function not defines counter name');
               
               console.log('Use counter ', selector.names[count_indx], ' instead of ', member.cntname);
               
               member.cntname = selector.names[count_indx];
            }
         }
         
         // set name used to store result
         member.name = selector.names[nn];
         
         var elem = {
               branch: branch,
               name: selector.names[nn],
               member: member,
               type: elem ? elem.fType : 0, // keep type identifier
               curr_entry: -1, // last processed entry
               raw : null, // raw buffer for reading
               curr_basket: 0,  // number of basket used for processing
               read_entry: -1,  // last entry which is already read 
               staged_entry: -1, // entry which is staged for reading
               staged_basket: 0,  // last basket staged for reading
               numentries: branch.fEntries,
               numbaskets: branch.fWriteBasket, // number of baskets which can be read from the file
               baskets: [] // array for read baskets,
         };

         handle.arr.push(elem);
         
         if (elem.numbaskets === 0) {
            // without normal baskets, check if temporary data is available
            
            if (branch.fBaskets && (branch.fBaskets.arr.length>0)) {
               
               for (var k=0;k<branch.fBaskets.arr.length;++k) {
                  var bskt = branch.fBaskets.arr[k];
                  if (!bskt || !bskt.fBufferRef) continue;
               
                  elem.direct_data = true;
                  elem.raw = bskt.fBufferRef;
                  elem.raw.locate(0); // set to initial position
                  elem.nev = 0;
                  elem.fNevBuf = elem.numentries; // number of entries
                  break;
               }
            }
            
            if (!elem.direct_data || !elem.numentries) {
               // if no any data found
               console.log('No any data found for branch', branch.fName);
               selector.Terminate(false);
               return false;
            }
         }
         
         if (handle.arr.length > 1) {
            var elem0 = handle.arr[0];

            if ((elem.direct_data !== elem0.direct_data) || 
                (elem.numentries !== elem0.numentries) ||
                (elem.numbaskets !== elem0.numbaskets)) handle.simple_read = false;
            else
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
         
         var totalsz = 0, bitems = [], isany = true, is_direct = false;
         
         while ((totalsz < 1e6) && isany) {
            isany = false;
            for (var n=0; n<handle.arr.length; n++) {
               var elem = handle.arr[n];
               
               if (elem.direct_data && elem.raw) {
                  // branch already read raw buffer
                  is_direct = true;
                  continue;
               }

               while (elem.staged_basket < elem.numbaskets) {

                  var k = elem.staged_basket++;
                  
                  // no need to read more baskets
                  if (elem.branch.fBasketEntry[k] >= handle.process_max) break;

                  // first baskets can be skipped
                  if (elem.branch.fBasketEntry[k+1] < handle.process_min) continue;
                  
                  bitems.push({
                     id: n, // to find which element we are reading
                     branch: elem.branch,
                     basket: k,
                     raw: null // here should be result
                  });

                  totalsz += elem.branch.fBasketBytes[k];
                  isany = true;
                   
                  elem.staged_entry = elem.branch.fBasketEntry[k+1];
                  
                  break;
               }
            }
         }
         
         if ((totalsz === 0) && !is_direct) 
            return handle.selector.Terminate(true);
         
         var portion = 1.;
         if (handle.arr[0].numbaskets > 0)
            portion = handle.arr[0].staged_basket / handle.arr[0].numbaskets; 

         handle.selector.ShowProgress("TTree draw " + Math.round((portion*100)) + " %  ");
         
         if (totalsz > 0)
            handle.file.ReadBaskets(bitems, ProcessBaskets);
         else
         if (is_direct)   
            ProcessBaskets([]); // directly process baskets
      }
      
      function ProcessBaskets(bitems) {
         // this is call-back when next baskets are read

         // console.log('Process baskets');
         
         if ((handle.selector.break_execution !== 0) || (bitems===null)) 
            return handle.selector.Terminate(false);
         
         // redistribute read baskets over branches
         for(var n=0;n<bitems.length;++n)
            handle.arr[bitems[n].id].baskets[bitems[n].basket] = bitems[n];
         
         // now process baskets
         
         var isanyprocessed = false;
         
         while(true) {
         
            var loopentries = 1;
            
            // firt loop used to check if all required data exists
            for (var n=0;n<handle.arr.length;++n) {

               var elem = handle.arr[n];

               if (!elem.raw) {
                  if ((elem.curr_basket >= elem.numbaskets)) {
                     if (n==0) return handle.selector.Terminate(true);
                     continue; // ignore non-master branch
                  }

                  // this is single responce from the tree, includes branch, bakset number, raw data
                  var bitem = elem.baskets[elem.curr_basket]; 

                  // basket not read
                  if (!bitem) { 
                     // no data, but no any event processed - problem
                     if (!isanyprocessed) return handle.selector.Terminate(false);

                     // try to read next portion of tree data
                     return ReadNextBaskets();
                  }

                  elem.raw = bitem.raw;
                  elem.fNevBuf = bitem.fNevBuf;
                  elem.nev = 0;
                  
                  if (handle.simple_read) {
                     if (n==0) loopentries = elem.fNevBuf; else
                     if (loopentries != elem.fNevBuf) { console.log('missmatch entries in simple mode', loopentries, elem.fNevBuf); loopentries = 1;  }   
                  }

                  bitem.raw = null; // remove reference on raw buffer
                  bitem.branch = null; // remove reference on the branch
                  elem.baskets[elem.curr_basket++] = undefined; // remove reference on basket
               }
            }
            
            // second loop extracts all required data
            
            // do not read too much
            if (handle.current_entry + loopentries > handle.numentries) 
               loopentries = handle.numentries - handle.current_entry;
            
            if (handle.process_arrays && (loopentries>1)) {
               // special case - read all data from baskets as arrays

               for (var n=0;n<handle.arr.length;++n) {
                  var elem = handle.arr[n];
                  elem.arrmember.arrlength = loopentries;

                  elem.arrmember.func(elem.raw, handle.selector.tgtarr);

                  elem.nev += loopentries;
                  
                  elem.raw = null;
               }

               handle.selector.ProcessArrays(handle.current_entry);

               handle.current_entry += loopentries; 

               isanyprocessed = true;
            } else {
               for (var e=0;e<loopentries;++e) {
                  for (var n=0;n<handle.arr.length;++n) {
                     var elem = handle.arr[n];

                     if (!elem.raw) continue;

                     elem.member.func(elem.raw, handle.selector.tgtobj);
                     elem.nev++;

                     if (elem.nev >= elem.fNevBuf)
                        elem.raw = null;
                  }

                  handle.selector.Process(handle.current_entry++);

                  isanyprocessed = true;
               }
            }
            
            if (handle.current_entry >= handle.numentries)
                return handle.selector.Terminate(true); 
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
   
   JSROOT.TTree.prototype.Draw = function(args, result_callback) {
      // this is JSROOT implementaion of TTree::Draw
      // in callback returns histogram and draw options
      // following arguments allowed in args
      //   expr - draw expression
      //   firstentry - first entry to process
      //   numentries - number of entries to process
      //   branch - TBranch object from TTree itself for the direct drawing
      
      if (typeof args === 'string') args = { expr: args };
      
      var selector = null;
      
      if (args.branch && (args.expr === "dump")) {
         selector = new JSROOT.TSelector;

         selector.arr = []; // accumulate here
         
         selector.leaf = args.leaf;
         
         selector.AddBranch(args.branch, "br0");
         
         selector.Process = function() {
            if (this.leaf)
               this.arr.push(this.tgtobj.br0[this.leaf]);
            else   
               this.arr.push(this.tgtobj.br0);
         }
         
         selector.Terminate = function(res) {
            this.ShowProgress();
            JSROOT.CallBack(result_callback, this.arr, "inspect");
         }
         
         if (!args.numentries) args.numentries = 10;
      } else
      if (args.branch) {
         selector = new JSROOT.TDrawSelector(result_callback);
         
         if (args.leaf) args.expr = "."+args.leaf;
         
         selector.AddDrawBranch(args.branch, args.expr, args.branch.fName);
         
         selector.hist_title = "drawing '" + args.branch.fName + "' from " + this.fName;
      } else 
      if (args.expr === "testio") {
         // special debugging code
         return this.RunIOTest(args, result_callback);
      } else {
         var names = args.expr ? args.expr.split(":") : [];
         if ((names.length < 1) || (names.length > 2))
            return JSROOT.CallBack(result_callback, null);

         selector = new JSROOT.TDrawSelector(result_callback);

         for (var n=0;n<names.length;++n) {
            var br = this.FindBranch(names[n], true);
            if (!br) {
               console.log('Not found branch', names[n]);
               return JSROOT.CallBack(result_callback, null);
            }

            if (br.branch) 
               selector.AddDrawBranch(br.branch, br.rest, names[n]);
            else
               selector.AddDrawBranch(br, undefined, names[n]);
         }

         selector.hist_title = "drawing '" + args.expr + "' from " + this.fName;
      }
      
      if (!selector)
         return JSROOT.CallBack(result_callback, null);
      
      return this.Process(selector, args);
   }
   
   JSROOT.TTree.prototype.RunIOTest = function(args, result_callback) {
      // generic I/O test for all branches in the tree
      
      if (!args.names && !args.bracnhes) {
      
         args.branches = [];
         args.names = [];
         args.nbr = 0;

         function CollectBranches(obj, prntname) {
            if (!obj || !obj.fBranches) return 0;

            var cnt = 0;

            for (var n=0;n<obj.fBranches.arr.length;++n) {
               var br = obj.fBranches.arr[n],
               name = (prntname ? prntname + "/" : "") + br.fName;
               args.branches.push(br);
               args.names.push(name);
               cnt += br.fLeaves ? br.fLeaves.arr.length : 0;
               cnt += CollectBranches(br, name);
            }
            return cnt;
         }

         var numleaves = CollectBranches(this);

         console.log('Collect branches', args.branches.length, 'leaves', numleaves);

         args.names.push("Total are " + args.branches.length + " branches with " + numleaves + " leaves");
      } 
      
      var tree = this;

      args.lasttm = new Date().getTime();
      args.lastnbr = args.nbr; 

      function TestNextBranch() {
         
         var selector = new JSROOT.TSelector;
         
         selector.AddBranch(args.branches[args.nbr], "br0");
      
         selector.Process = function() {
            if (this.tgtobj.br0 === undefined) 
               this.fail = true;
         }
         
         selector.ShowProgress = function() {
            // just suppress progress
         }
      
         selector.Terminate = function(res) {
            if (typeof res !== 'string')
               res = (!res || this.fails) ? "FAIL" : "ok";
            
            args.names[args.nbr] = res + " " + args.names[args.nbr];
            args.nbr++;
            
            if (args.nbr >= args.branches.length) {
               JSROOT.progress();
               return JSROOT.CallBack(result_callback, args.names, "inspect");
            }
            
            var now = new Date().getTime();
            
            if ((now - args.lasttm > 5000) || (args.nbr - args.lastnbr > 50)) 
               setTimeout(tree.RunIOTest.bind(tree,args,result_callback), 100); // use timeout to avoid deep recursion
            else
               TestNextBranch();
         }
         
         JSROOT.progress("br " + args.nbr + "/" + args.branches.length + " " + args.names[args.nbr]);
         
         if (args.branches[args.nbr].fID === -2) {
            // this is not interesting
            selector.Terminate("ignore");
         } else {
            tree.Process(selector, { numentries: 10 });
         }
      }
      
      TestNextBranch();
   }
   
   // ===========================================================================
   
 if (JSROOT.Painter)
   JSROOT.Painter.drawTree = function(divid, obj, opt) {
      // this is function called from JSROOT.draw()
      // just envelope for real TTree::Draw method which do the main job
      // Can be also used for the branch and leaf object

      var tree = obj, args = opt;

      if (obj.$branch) {
         args = { expr: opt, branch: obj.$branch, leaf: obj.fName };
         tree = obj.$branch.$tree;
      } else
         if (obj.$tree) {
            args = { expr: opt, branch: obj };
            tree = obj.$tree;
         }

      if (!tree) {
         console.log('No TTree object available for TTree::Draw');
         return this.DrawingReady();
      }

      var t = new JSROOT.TTree(tree), 
          painter = this;

      t.Draw(args, function(histo, hopt) {
         JSROOT.draw(divid, histo, hopt, painter.DrawingReady.bind(painter));
      });

      return this;
   }

   return JSROOT;

}));
