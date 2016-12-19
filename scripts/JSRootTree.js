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
      
         var obj = this.arr[cnt][this.indx[cnt]],
             typ = typeof obj; 
         
         if ((typ === "object") && !isNaN(obj.length) && (obj.length > 0)) {
            cnt++;
            this.arr[cnt] = obj;
            this.indx[cnt] = 0;
         } else 
         if ((typ === "number") || (typ === "boolean")) {
            this.value = obj;
            this.fastarr = this.arr[cnt];
            this.fastindx = this.indx[cnt];
            return true;
         } else {
            console.log('did not found match in array iterator');
            return false; 
         }
      }
      
      return false;
   }


   // =================================================================
   
   
   
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
          simple_read: true // all baskets in all used branches are in sync
      };
      
      handle.stage_min = handle.firstentry;
      handle.stage_max = handle.firstentry + handle.numentries;
      
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
         
         handle.process_arrays = true;
         
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
         }
      }
      
      ReadNextBaskets();
       
      return true; // indicate that reading of tree will be performed
   }
   
   JSROOT.TTree.prototype.FindBranch = function(branchname) {
      
      function Find(lst, name) {
         var search = name, dot = name.indexOf("."), br = null;
         if (dot>0) search = name.substr(0, dot);

         for (var n=0;n<lst.arr.length;++n) {
            var brname = lst.arr[n].fName;
            if (brname[brname.length-1] == "]") 
               brname = brname.substr(0, brname.indexOf("["));
            if (brname === search) { br = lst.arr[n]; break; }
         }
         
         return (!br || (dot <= 0) || (dot === name.length-1)) ? br : Find(br.fBranches, name.substr(dot+1));
      }
      
      return Find(this.fBranches, branchname);
   }
   
   JSROOT.TTree.prototype.Draw = function(expr, cut, opt, nentries, firstentry, histo_callback) {
      // this is JSROOT implementaion of TTree::Draw
      // in callback returns histogram
      
      var names = expr ? expr.split(":") : [];
      if ((names.length < 1) || (names.length > 2))
         return JSROOT.CallBack(histo_callback, null);
      
      var br = [], tree = this;
      
      for (var n=0;n<names.length;++n) {
         br[n] = this.FindBranch(names[n]);
         if (!br[n]) {
            console.log('Not found branch', names[n]);
            return JSROOT.CallBack(histo_callback, null);
         }
      }

      var selector = new JSROOT.TSelector();
      
      selector.ndim = 1;
      selector.hist = null;
      selector.arr = [];
      selector.AddBranch(br[0], "br0");
      selector.plain = []; // is branches values can be used directly or need iterator or any other transformation
      
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
         this.hist.$custom_stat = 111110;
         
         if (this.ndim==2)
            for (var n=0;n<this.arr.length;++n) 
               this.hist.Fill(this.arr[n], this.arr2[n]);
         else
            for (var n=0;n<this.arr.length;++n) 
               this.hist.Fill(this.arr[n]);
         
         delete this.arr;
         delete this.arr2;
      }
      
      selector.CreateIterator = function(value) {

         if ((value===undefined) || (value===null))
            return { next: function() { return false; }}
         
         var typ = typeof value; 

         if ((typ === 'object') && !isNaN(value.length) && (value.length>0))
            return new JSROOT.ArrayIterator(value);
         
         if ((typ === 'number') || (typ === 'boolean')) {
            return {
               value: value, // always used in iterators
               cnt: 1,
               next: function() { return --this.cnt === 0; } 
            };
         }
         
         return { next: function() { return false; }}
      }

      selector.Process = function(entry) {
         // do something
         
         if (this.arr !== undefined) {
            var firsttime = false;
            
            if (selector.plain.length === 0) {
               selector.plain[0] = (typeof this.tgtobj.br0 == 'number');
               if (this.ndim===2) selector.plain[1] = (typeof this.tgtobj.br1 == 'number');
               firsttime = true;
            }
            
            if (this.ndim==1) {
               if (selector.plain[0]) {
                  this.arr.push(this.tgtobj.br0);
               } else {
                  var iter = this.CreateIterator(this.tgtobj.br0);
                  while (iter.next()) {
                     this.arr.push(iter.value);
                  }
               }
               
            } else {
               // only elementary branches in 2d
            
               this.arr.push(this.tgtobj.br0);
               this.arr2.push(this.tgtobj.br1);
            }
            
            
            if (this.arr.length > 10000) this.CreateHistogram();
         } else
         if (this.hist) {
            if (this.ndim===2)
               this.hist.Fill(this.tgtobj.br0, this.tgtobj.br1);
            else
               this.hist.Fill(this.tgtobj.br0);
         }
      }
      
      selector.ProcessArrays = function(entry) {
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
      
      selector.Terminate = function(res) {
         if (res && !this.hist) this.CreateHistogram();
         
         this.ShowProgress();
         
         return JSROOT.CallBack(histo_callback, this.hist);
      }
      
      return this.Process(selector, opt, nentries, firstentry);
   }

   return JSROOT;

}));
