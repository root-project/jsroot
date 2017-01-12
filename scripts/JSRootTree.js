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
      // Add branch to the selector
      // Either branch name or branch itself should be specified
      // Second parameter defines member name in the tgtobj
      // If selector.AddBranch("px", "read_px") is called, 
      // branch will be read into selector.tgtobj.read_px member  
      
      if (!name) 
         name = (typeof branch === 'string') ? branch : ("br" + this.branches.length);
      this.branches.push(branch);
      this.names.push(name);
      return this.branches.length-1;
   }
   
   JSROOT.TSelector.prototype.indexOfBranch = function(branch) {
      return this.branches.indexOf(branch);
   }
   
   JSROOT.TSelector.prototype.nameOfBranch = function(indx) {
      return this.names[indx];
   }
   
   JSROOT.TSelector.prototype.IsInteger = function(nbranch) {
      return this.is_integer[nbranch];
   }
   
   JSROOT.TSelector.prototype.ShowProgress = function(value) {
      // this function can be used to check current TTree progress
   }
   
   JSROOT.TSelector.prototype.Abort = function() {
      // call this function to abort processing
      this.break_execution = -1111;
   }

   JSROOT.TSelector.prototype.Begin = function(tree) {
      // function called before start processing
   }

   JSROOT.TSelector.prototype.Process = function(entry) {
      // function called when next entry extracted from the tree
   }
   
   JSROOT.TSelector.prototype.Terminate = function(res) {
      // function called at the very end of processing
   }

   // =================================================================
   
   JSROOT.CheckArrayPrototype = function(arr, check_content) {
      // return 0 when not array
      // 1 - when arbitrary array
      // 2 - when plain (1-dim) array with same-type content 
      if (typeof arr !== 'object') return 0;
      var proto = Object.prototype.toString.apply(arr);
      if (proto.indexOf('[object')!==0) return 0;
      var pos = proto.indexOf('Array]');
      if (pos < 0) return 0;
      if (pos > 8) return 2; // this is typed array like Int32Array
      
      if (!check_content) return 1; //  
      var typ, plain = true;
      for (var k=0;k<arr.length;++k) {
         var sub = typeof arr[k];
         if (!typ) typ = sub;
         if (sub!==typ) { plain = false; break; }
         if ((sub=="object") && JSROOT.CheckArrayPrototype(arr[k])) { plain = false; break; } 
      }
      
      return plain ? 2 : 1;
   }
   
   JSROOT.IsRootCollection = function(obj) {
      if (!obj || (typeof obj !== 'object')) return false;
      
      var kind = obj.$kind || obj._typename;
      
      return ((obj.arr !== undefined) && (kind === 'TList') || (kind === 'TObjArray') || (kind === 'TClonesArray')); 
   }
   
   JSROOT.ArrayIterator = function(arr, select, tgtobj) {
      // class used to iterate over all array indexes until number value
      this.object = arr;
      this.value = 0; // value always used in iterator
      this.arr = []; // all arrays
      this.indx = []; // all indexes
      this.cnt = -1; // current index counter
      this.tgtobj = tgtobj;

      if (typeof select === 'object')
         this.select = select; // remember indexes for selection
      else
         this.select = []; // empty array, undefined for each dimension means iterate over all indexes
   }
   
   JSROOT.ArrayIterator.prototype.next = function() {
      var obj, typ, cnt = this.cnt, seltyp;
      
      if (cnt >= 0) {
        
         if (++this.fastindx < this.fastlimit) {
            this.value = this.fastarr[this.fastindx];
            return true;
         } 

         while (--cnt >= 0) {
            if ((this.select[cnt]===undefined) && (++this.indx[cnt] < this.arr[cnt].length)) break;
         }
         if (cnt < 0) return false;
      }
      
      while (true) {
         
         if (cnt < 0) {
            obj = this.object;
         } else {
            obj = (this.arr[cnt])[this.indx[cnt]];
         }
      
         typ = obj ? typeof obj : "any";
         
         if ((typ === "object") && obj._typename) {
            if (JSROOT.IsRootCollection(obj)) obj = obj.arr;
                                         else typ = "any";
         } 
         
         if ((typ=="any") && (typeof this.select[cnt+1] ==="string")) {
            // this is extraction of the member from arbitrary class
            this.arr[++cnt] = obj;
            this.indx[cnt] = this.select[cnt]; // use member name as index
            continue;
         }
         
         if ((typ === "object") && !isNaN(obj.length) && (obj.length > 0) && (JSROOT.CheckArrayPrototype(obj)>0)) {
            this.arr[++cnt] = obj;
            switch (this.select[cnt]) {
               case undefined: this.indx[cnt] = 0; break;
               case "%last%": this.indx[cnt] = obj.length-1; break;
               default: 
                  if (!isNaN(this.select[cnt])) this.indx[cnt] = this.select[cnt]; else {
                     // this is compile variable as array index - can be any expression
                     this.select[cnt].Produce(this.tgtobj);
                     this.indx[cnt] = Math.round(this.select[cnt].get(0)); 
                  }
            }
         } else {
            if (cnt<0) return false;
            
            this.value = obj;
            if (this.select[cnt]===undefined) {
               this.fastarr = this.arr[cnt];
               this.fastindx = this.indx[cnt];
               this.fastlimit = this.fastarr.length;
            } else {
               this.fastindx = this.fastlimit = 0; // no any iteration on that level
            }
            
            this.cnt = cnt;
            return true;
         } 
      }
      
      return false;
   }
   
   JSROOT.ArrayIterator.prototype.reset = function() {
      this.arr = [];
      this.indx = [];
      delete this.fastarr;
      this.cnt = -1;
      this.value = 0;
   }

   // ============================================================================
   
   JSROOT.TDrawVariable = function() {
      // object with single variable in TTree::Draw expression
      this.code = "";
      this.brindex = []; // index of used branches from selector
      this.branches = []; // names of bracnhes in target object
      this.brarray = []; // array specifier for each branch
      this.func = null; // generic function for variable calculation
      
      this.kind = undefined;
      this.buf = []; // buffer accumulates temporary values
   }
   
   JSROOT.TDrawVariable.prototype.Parse = function(tree,selector,code,only_branch) {
      // when only_branch specified, its placed in the front of the expression 
      
      function is_start_symbol(symb) {
         if ((symb >= "A") && (symb <= "Z")) return true; 
         if ((symb >= "a") && (symb <= "z")) return true;
         return (symb === "_");
      }
      
      function is_next_symbol(symb) {
         if (is_start_symbol(symb)) return true;
         if ((symb >= "0") && (symb <= "9")) return true;
         return false;
      }
      
      if (!code) code = ""; // should be empty string at least
      
      this.code = (only_branch ? only_branch.fName : "") + code;

      var pos = 0, pos2 = 0, br = null;
      while ((pos < code.length) || only_branch) {

         var arriter = [];
         
         if (only_branch) {
            br = only_branch;
            only_branch = undefined;
         } else {
            // first try to find branch
            while ((pos < code.length) && !is_start_symbol(code[pos])) pos++;
            pos2 = pos;
            while ((pos2 < code.length) && (is_next_symbol(code[pos2]) || code[pos2]===".")) pos2++;

            br = tree.FindBranch(code.substr(pos, pos2-pos), true);
            if (!br) { pos = pos2+1; continue; }

            // when full id includes branch name, replace only part of extracted expression 
            if (br.branch && br.rest) {
               pos2 -= br.rest.length;
               br = br.branch;
            }
         }
         
         // now extract all levels of iterators 
         while (pos2 < code.length) {
            if (code[pos2] === ".") {
               // this is object member
               var prev = ++pos2; 
               if (!is_start_symbol(code[prev])) {
                  console.error("Problem to parse ", code, "at", prev);
                  return false;
               }
               
               while ((pos2 < code.length) && is_next_symbol(code[pos2])) pos2++;
               
               arriter.push(code.substr(prev, pos2-prev));
               continue;
            }

            if (code[pos2]!=="[") break;
            
            // simple [] 
            if (code[pos2+1]=="]") { arriter.push(undefined); pos2+=2; continue; }

            var prev = pos2++, cnt = 0;
            while ((pos2 < code.length) && ((code[pos2]!="]") || (cnt>0))) {
               if (code[pos2]=='[') cnt++; else if (code[pos2]==']') cnt--; 
               pos2++;
            }
            var sub = code.substr(prev+1, pos2-prev-1);
            switch(sub) {
               case "": 
               case "%all%": arriter.push(undefined); break;
               case "%last%": arriter.push("%last%"); break;
               case "%first%": arriter.push(0); break;
               default:
                  var arrindx = parseInt(sub);
                  if (!isNaN(arrindx)) arriter.push((arrindx>=0) ? arrindx : undefined); else {
                     // try to compile code as draw variable
                     var subvar = new JSROOT.TDrawVariable();
                     // console.log("produce subvar with code", sub);
                     if (!subvar.Parse(tree,selector, sub)) return false;
                     arriter.push(subvar);
                  }
            }
            pos2++;
         }
         
         if (arriter.length===0) arriter = undefined; else
         if ((arriter.length===1) && (arriter[0]===undefined)) arriter = true;
         
         console.log('arriter', arriter);
         
         var indx = selector.indexOfBranch(br);
         if (indx<0) indx = selector.AddBranch(br);
         
         this.brindex.push(indx);
         this.branches.push(selector.nameOfBranch(indx));
         this.brarray.push(arriter);
         
         // this is simple case of direct usage of the branch
         if ((pos===0) && (pos2 === code.length) && (this.branches.length===1)) {
            this.direct_branch = true;
            return true; 
         }
         
         var replace = "arg.var" + (this.branches.length-1);
         
         code = code.substr(0, pos) + replace + code.substr(pos2);
         
         pos = pos + replace.length;
      }
      
      this.func = new Function("arg", "return (" + code + ")");
      
      return true;
   }
   
   JSROOT.TDrawVariable.prototype.IsInteger = function(selector) {
      // check if draw variable produces integer values
      // derived from type of data in the branch
      if ((this.kind !== "number") || !this.direct_branch) return false;
      
      return selector.IsInteger(this.brindex[0]);
   }
   
   JSROOT.TDrawVariable.prototype.is_dummy = function() {
      return this.branches.length === 0;
   }
   
   
   JSROOT.TDrawVariable.prototype.Produce = function(obj) {
      // after reading tree braches into the object, calculate variable value

      this.length = 1;
      this.isarray = false;
      
      if (this.is_dummy()) {
         this.value = 1.; // used as dummy weight variable
         this.kind = "number";
         return;
      }
      
      var arg = {}, usearrlen = -1, arrs = [];
      for (var n=0;n<this.branches.length;++n) {
         var name = "var" + n;
         arg[name] = obj[this.branches[n]];

         // try to check if branch is array and need to be iterated
         if (this.brarray[n]===undefined) 
            this.brarray[n] = (JSROOT.CheckArrayPrototype(arg[name]) > 0) || JSROOT.IsRootCollection(arg[name]);   
         
         // no array - no pain
         if (this.brarray[n]===false) continue; 
         
         // check if array can be used as is - one dimension and normal values
         if ((this.brarray[n]===true) && (JSROOT.CheckArrayPrototype(arg[name], true) === 2)) {
            // plain array, can be used as is
            arrs[n] = arg[name]; 
         } else {
            var iter = new JSROOT.ArrayIterator(arg[name], this.brarray[n], obj);
            arrs[n] = [];
            while (iter.next()) arrs[n].push(iter.value);
         }
         if ((usearrlen < 0) || (usearrlen < arrs[n].length)) usearrlen = arrs[n].length;  
      }
      
      if (usearrlen < 0) {
         this.value = this.direct_branch ? arg.var0 : this.func(arg);
         if (!this.kind) this.kind = typeof this.value;
         return;
      }
      
      if (usearrlen == 0) {
         // empty array - no any histogram should be fillied
         this.length = 0; 
         this.value = 0;
         return;
      }
      
      this.length = usearrlen;
      this.isarray = true;

      if (this.direct_branch) {
         this.value = arrs[0]; // just use array         
      } else {
         this.value = new Array(usearrlen);

         for (var k=0;k<usearrlen;++k) {
            for (var n=0;n<this.branches.length;++n) {
               if (arrs[n]) arg["var"+n] = arrs[n][k];
            }
            this.value[k] = this.func(arg);
         }
      }

      if (!this.kind) this.kind = typeof this.value[0];
   }
   
   JSROOT.TDrawVariable.prototype.get = function(indx) {
      return this.isarray ? this.value[indx] : this.value; 
   } 
   
   JSROOT.TDrawVariable.prototype.AppendArray = function(tgtarr) {
      // appeand array to the buffer
      
      this.buf = this.buf.concat(tgtarr[this.branches[0]]);
   }

   // =============================================================================

   JSROOT.TDrawSelector = function(callback) {
      JSROOT.TSelector.call(this);   
      
      this.ndim = 0;
      this.vars = []; // array of expression varibles 
      this.cut = null; // cut variable
      this.hist = null;
      this.histo_callback = callback;
      this.hist_name = "$htemp";
      this.hist_title = "Result of TTree::Draw";
      this.hist_args = []; // arguments for histogram creation
      this.arr_limit = 3000;  // number of accumulated items before create histogram
      this.monitoring = 0;
   }

   JSROOT.TDrawSelector.prototype = Object.create(JSROOT.TSelector.prototype);
  
   JSROOT.TDrawSelector.prototype.ParseDrawExpression = function(tree, args) {
      
      var expr = args.expr;
      
      // parse complete expression
      if (!expr || (typeof expr !== 'string')) return false;

      // parse option for histogram creation
      var pos = expr.lastIndexOf(">>");
      if (pos>0) {
         var harg = expr.substr(pos+2).trim();
         expr = expr.substr(0,pos).trim();
         pos = harg.indexOf("(");
         if (pos>0) {
            this.hist_name = harg.substr(0, pos);
            harg = harg.substr(pos);
         }  
         if (harg === "dump") {
            this.dump_values = true;
            if (args.numentries===undefined) args.numentries = 10;
         } else
         if (pos<0) {
            this.hist_name = harg; 
         } else  
         if ((harg[0]=="(") && (harg[harg.length-1]==")"))  {
            harg = harg.substr(1,harg.length-2).split(",");
            var isok = true;
            for (var n=0;n<harg.length;++n) {
               harg[n] = (n%3===0) ? parseInt(harg[n]) : parseFloat(harg[n]);
               if (isNaN(harg[n])) isok = false;
            }
            if (isok) this.hist_args = harg; 
         }
      }

      this.hist_title = "drawing '" + expr + "' from " + tree.fName;

      var pos = expr.lastIndexOf("::"), cut = "";
      if (pos>0) {
         cut = expr.substr(pos+2).trim();
         expr = expr.substr(0,pos).trim();
      }
      
      var names = expr.split(":");
      if ((names.length < 1) || (names.length > 3)) return false;

      this.ndim = names.length;

      var is_direct = !cut;

      for (var n=0;n<this.ndim;++n) {
         this.vars[n] = new JSROOT.TDrawVariable();
         if (!this.vars[n].Parse(tree, this, names[n])) return false;
         if (!this.vars[n].direct_branch) is_direct = false; 
      }
      
      this.cut = new JSROOT.TDrawVariable();
      if (cut) 
         if (!this.cut.Parse(tree, this, cut)) return false;
      
      if (!this.branches.length) {
         console.log('no any branch is selected');
         return false;
      }
      
      if (is_direct) this.ProcessArrays = this.ProcessArraysFunc;
      
      this.monitoring = args.monitoring;
      
      return true;
   }
   
   JSROOT.TDrawSelector.prototype.DrawOnlyBranch = function(tree, branch, expr, args) {
      this.ndim = 1;
      
      this.vars[0] = new JSROOT.TDrawVariable();
      if (!this.vars[0].Parse(tree, this, expr, branch)) return false;
      this.hist_title = "drawing branch '" + branch.fName + (expr ? "' expr:'" + expr : "") + "'  from " + tree.fName;
      
      this.cut = new JSROOT.TDrawVariable();
      
      if (this.vars[0].direct_branch) this.ProcessArrays = this.ProcessArraysFunc;
      
      this.monitoring = args.monitoring;

      return true;
   }
   
   JSROOT.TDrawSelector.prototype.Begin = function(tree) {
      if (this.monitoring)
         this.lasttm = new Date().getTime();
   } 
   
   JSROOT.TDrawSelector.prototype.ShowProgress = function(value) {
      // this function should be defined not here
      
      if ((document === undefined) || (JSROOT.progress===undefined)) return;

      if ((value===undefined) || isNaN(value)) return JSROOT.progress();

      var main_box = document.createElement("p"),
          text_node = document.createTextNode("TTree draw " + Math.round((value*100)) + " %  "),
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
   
   JSROOT.TDrawSelector.prototype.GetBitsBins = function(nbits) {
      
      var res = { nbins: nbits, min: 0, max: nbits, k: 1., fLabels: JSROOT.Create("THashList") };
      
      for (var k=0;k<nbits;++k) {
         var s = JSROOT.Create("TObjString");
         s.fString = k.toString();
         s.fUniqueID = k+1;
         res.fLabels.Add(s);
      }
      return res;
   }

   JSROOT.TDrawSelector.prototype.GetMinMaxBins = function(axisid, nbins) {
      
      var res = { min: 0, max: 0, nbins: nbins, fLabels: null };
      
      if (axisid >= this.ndim) return res;
      
      var arr = this.vars[axisid].buf;
      
      if (this.vars[axisid].kind === "object") {
         // this is any object type
         var typename, similar = true, maxbits = 0;
         for (var k=0;k<arr.length;++k) {
            if (!arr[k]) continue;
            if (!typename) typename = arr[k]._typename;
            if (typename !== arr[k]._typename) similar = false; // check all object types
            if (arr[k].fNbytes) maxbits = Math.max(maxbits, arr[k].fNbytes*8);
         }
         
         if (typename && similar) {
            if ((typename==="TBits") && (axisid===0)) {
               console.log('Provide special handling fot TBits');
               this.Fill1DHistogram = this.FillTBitsHistogram;
               return this.GetBitsBins(Math.max(8,maxbits));
            }
         }
         
         console.log('See object typename', typename, 'similar', similar);
      }
      
      
      if (this.vars[axisid].kind === "string") {
         res.lbls = []; // all labels
         
         for (var k=0;k<arr.length;++k) 
            if (res.lbls.indexOf(arr[k])<0) 
               res.lbls.push(arr[k]);
         
         res.lbls.sort();
         res.max = res.nbins = res.lbls.length;
         
         res.fLabels = JSROOT.Create("THashList");
         for (var k=0;k<res.lbls.length;++k) {
            var s = JSROOT.Create("TObjString");
            s.fString = res.lbls[k];
            s.fUniqueID = k+1;
            if (s.fString === "") s.fString = "<empty>";
            res.fLabels.Add(s);
         }
      } else 
      if (axisid*3 + 2 < this.hist_args.length) {
         res.nbins = this.hist_args[axisid*3];
         res.min = this.hist_args[axisid*3+1];
         res.max = this.hist_args[axisid*3+2];
      } else {
      
         res.min = Math.min.apply(null, arr);
         res.max = Math.max.apply(null, arr);
         
         if (res.min>=res.max) {
            res.max = res.min;
            if (Math.abs(res.min)<100) { res.min-=1; res.max+=1; } else
               if (res.min>0) { res.min*=0.9; res.max*=1.1; } else { res.min*=1.1; res.max*=0.9; } 
         } else
         if (this.vars[axisid].IsInteger(this) && (res.max-res.min >=1) && (res.max-res.min<nbins*10)) {
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
      if (this.hist || !this.vars[0].buf) return;
      
      if (this.dump_values) {
         // just create array where dumped valus will be collected  
         this.hist = [];
         
         // reassign fill method
         this.Fill1DHistogram = this.Fill2DHistogram = this.Fill3DHistogram = this.DumpValue;  
      } else {
         
         if ((this.hist_name === "bits") && (this.hist_args.length <= 1)) {
            this.x = this.GetBitsBins(this.hist_args[0] || 32);
            this.Fill1DHistogram = this.FillBitsHistogram;
         } else {
            this.x = this.GetMinMaxBins(0, (this.ndim > 1) ? 50 : 200);
         }

         this.y = this.GetMinMaxBins(1, 50);

         this.z = this.GetMinMaxBins(2, 50);

         switch (this.ndim) {
            case 1: this.hist = JSROOT.CreateHistogram("TH1F", this.x.nbins); break; 
            case 2: this.hist = JSROOT.CreateHistogram("TH2F", this.x.nbins, this.y.nbins); break;
            case 3: this.hist = JSROOT.CreateHistogram("TH3F", this.x.nbins, this.y.nbins, this.z.nbins); break;
         }

         this.hist.fXaxis.fTitle = this.vars[0].code;
         this.hist.fXaxis.fXmin = this.x.min;
         this.hist.fXaxis.fXmax = this.x.max;
         this.hist.fXaxis.fLabels = this.x.fLabels;

         if (this.ndim > 1) this.hist.fYaxis.fTitle = this.vars[1].code;
         this.hist.fYaxis.fXmin = this.y.min;
         this.hist.fYaxis.fXmax = this.y.max;
         this.hist.fYaxis.fLabels = this.y.fLabels;

         if (this.ndim > 2) this.hist.fZaxis.fTitle = this.vars[2].code;
         this.hist.fZaxis.fXmin = this.z.min;
         this.hist.fZaxis.fXmax = this.z.max;
         this.hist.fZaxis.fLabels = this.z.fLabels;

         this.hist.fName = this.hist_name;
         this.hist.fTitle = this.hist_title;
         this.hist.$custom_stat = (this.hist_name == "$htemp") ? 111110 : 111111;
      }
      
      var var0 = this.vars[0].buf, cut = this.cut.buf, len = var0.length; 
         
      switch (this.ndim) {
         case 1:
            for (var n=0;n<len;++n) 
               this.Fill1DHistogram(var0[n], cut ? cut[n] : 1.);
            break;
         case 2: 
            var var1 = this.vars[1].buf;
            for (var n=0;n<len;++n) 
               this.Fill2DHistogram(var0[n], var1[n], cut ? cut[n] : 1.);
            delete this.vars[1].buf;
            break;
         case 3:
            var var1 = this.vars[1].buf, var2 = this.vars[2].buf; 
            for (var n=0;n<len;++n) 
               this.Fill2DHistogram(var0[n], var1[n], var2[n], cut ? cut[n] : 1.);
            delete this.vars[1].buf;
            delete this.vars[2].buf;
            break;
      }
      
      delete this.vars[0].buf;
      delete this.cut.buf;
   }

   JSROOT.TDrawSelector.prototype.FillTBitsHistogram = function(xvalue, weight) {
      if (!weight || !xvalue || !xvalue.fNbytes || !xvalue.fAllBits) return;
      
      for (var bit=0,mask=1,b=0;(bit<this.x.nbins) && (b<xvalue.fNbytes);++bit) {
         if (xvalue.fAllBits[b] && mask) this.hist.fArray[bit+1] += weight;
         mask*=2;
         if (mask>=0x100) { mask = 1; ++b; }
      }
   }
   
   JSROOT.TDrawSelector.prototype.FillBitsHistogram = function(xvalue, weight) {
      if (!weight) return;
      
      for (var bit=0,mask=1;bit<this.x.nbins;++bit) {
         if (xvalue & mask) this.hist.fArray[bit+1] += weight;
         mask*=2;
      }
   }
   
   JSROOT.TDrawSelector.prototype.Fill1DHistogram = function(xvalue, weight) {
      var bin = this.x.GetBin(xvalue);
      this.hist.fArray[bin] += weight;
   }

   JSROOT.TDrawSelector.prototype.Fill2DHistogram = function(xvalue, yvalue, weight) {
      var xbin = this.x.GetBin(xvalue),
          ybin = this.y.GetBin(yvalue);
      
      this.hist.fArray[xbin+(this.x.nbins+2)*ybin] += weight;
   }

   JSROOT.TDrawSelector.prototype.Fill3DHistogram = function(xvalue, yvalue, zvalue, weight) {
      var xbin = this.x.GetBin(xvalue),
          ybin = this.y.GetBin(yvalue),
          zbin = this.z.GetBin(zvalue);
      
      this.hist.fArray[xbin + (this.x.nbins+2) * (ybin + (this.y.nbins+2)*zbin) ] += weight;
   }
   
   JSROOT.TDrawSelector.prototype.DumpValue = function(v1, v2, v3, v4) {
      var obj; 
      switch (this.ndim) {
         case 1: obj = { x: v1, weight: v2 }; break;
         case 2: obj = { x: v1, y: v2, weight: v3 }; break;
         case 3: obj = { x: v1, y: v2, z: v3, weight: v4 }; break;
      }
      
      if (this.cut.is_dummy()) {
         if (this.ndim===1) obj = v1; else delete obj.weight;
      }
      
      this.hist.push(obj);
   }
   
   JSROOT.TDrawSelector.prototype.ProcessArraysFunc = function(entry) {
      // function used when all bracnhes can be read as array
      // most typical usage - histogramming of single branch 
      
      
      if (this.arr_limit) {
         var var0 = this.vars[0], len = this.tgtarr.br0.length,
             var1 = this.vars[1], var2 = this.vars[2];
         if ((var0.buf.length===0) && (len>=this.arr_limit)) {
            // special usecase - first arraya large enough to create histogram directly base on it 
            var0.buf = this.tgtarr.br0;
            if (var1) var1.buf = this.tgtarr.br1;
            if (var2) var2.buf = this.tgtarr.br2;
         } else
         for (var k=0;k<len;++k) {
            var0.buf.push(this.tgtarr.br0[k]);
            if (var1) var1.buf.push(this.tgtarr.br1[k]);
            if (var2) var2.buf.push(this.tgtarr.br2[k]);
         }
         var0.kind = "number";
         if (var1) var1.kind = "number";
         if (var2) var2.kind = "number";
         this.cut.buf = null; // do not create buffer for cuts
         if (var0.buf.length >= this.arr_limit) {
            this.CreateHistogram();
            this.arr_limit = 0;
         }
      } else {
         var br0 = this.tgtarr.br0, len = br0.length;
         switch(this.ndim) {
            case 1:
               for (var k=0;k<len;++k)
                  this.Fill1DHistogram(br0[k], 1.);
               break;
            case 2:
               var br1 = this.tgtarr.br1;
               for (var k=0;k<len;++k) 
                  this.Fill2DHistogram(br0[k], br1[k], 1.);
               break;
            case 3:
               var br1 = this.tgtarr.br1, br2 = this.tgtarr.br2;
               for (var k=0;k<len;++k) 
                  this.Fill3DHistogram(br0[k], br1[k], br2[k], 1.);
               break;
         } 
      }
   }


   JSROOT.TDrawSelector.prototype.Process = function(entry) {
      
      for (var n=0;n<this.ndim;++n)
         this.vars[n].Produce(this.tgtobj);
      
      this.cut.Produce(this.tgtobj);

      var var0 = this.vars[0], var1 = this.vars[1], var2 = this.vars[2], cut = this.cut;   

      if (this.arr_limit) {
         switch(this.ndim) {
            case 1:
              for (var n0=0;n0<var0.length;++n0) {
                 var0.buf.push(var0.get(n0));
                 cut.buf.push(cut.value);
              }
              break;
            case 2:
              for (var n0=0;n0<var0.length;++n0) 
                 for (var n1=0;n1<var1.length;++n1) {
                    var0.buf.push(var0.get(n0));
                    var1.buf.push(var1.get(n1));
                    cut.buf.push(cut.value);
                 }
              break;
            case 3:
               for (var n0=0;n0<var0.length;++n0)
                  for (var n1=0;n1<var1.length;++n1)
                     for (var n2=0;n2<var2.length;++n2) {
                        var0.buf.push(var0.get(n0));
                        var1.buf.push(var1.get(n1));
                        var2.buf.push(var2.get(n2));
                        cut.buf.push(cut.value);
                     }
               break;
         }
         if (var0.buf.length >= this.arr_limit) {
            this.CreateHistogram();
            this.arr_limit = 0;
         }
      } else
      if (this.hist) {
         switch(this.ndim) {
            case 1:
               for (var n0=0;n0<var0.length;++n0)
                  this.Fill1DHistogram(var0.get(n0), cut.value);
               break;
            case 2:
               for (var n0=0;n0<var0.length;++n0)
                  for (var n1=0;n1<var1.length;++n1)
                     this.Fill2DHistogram(var0.get(n0), var1.get(n1), cut.value);
               break;
            case 3:
               for (var n0=0;n0<var0.length;++n0)
                  for (var n1=0;n1<var1.length;++n1)
                     for (var n2=0;n2<var2.length;++n2)
                        this.Fill3DHistogram(var0.get(n0), var1.get(n1), var2.get(n2), cut.value);
               break;
         } 
      }
      
      if (this.monitoring && this.hist && !this.dump_values) {
         var now = new Date().getTime();
         if (now - this.lasttm > this.monitoring) { 
            this.lasttm = now;
            var drawopt = (this.ndim==2) ? "col" : "";
            JSROOT.CallBack(this.histo_callback, this.hist, drawopt, true);
         }
      }
   }
   
   JSROOT.TDrawSelector.prototype.Terminate = function(res) {
      if (res && !this.hist) this.CreateHistogram();
      
      this.ShowProgress();
      
      var drawopt = (this.ndim==2) ? "col" : "";
      if (this.dump_values) drawopt = "inspect";
      
      return JSROOT.CallBack(this.histo_callback, this.hist, drawopt);
   }
   
   // ======================================================================
   
   /** @namespace JSROOT.TreeMethods */
   JSROOT.TreeMethods = {}; // these are only TTree methods, which are automatically assigned to every TTree 

   /** @memberOf JSROOT.TreeMethods  */
   JSROOT.TreeMethods.Process = function(selector, args) {
      // function similar to the TTree::Process
      
      if (!args) args = {};
      
      if (!selector || !this.$file || !selector.branches) {
         console.error('required parameter missing for TTree::Process');
         if (selector) selector.Terminate(false);
         return false;
      }
      
      // central handle with all information required for reading
      var handle = {
          tree: this, // keep tree reference  
          file: this.$file, // keep file reference
          selector: selector, // reference on selector  
          arr: [], // list of branches 
          curr: -1,  // current entry ID
          current_entry: -1, // current processed entry
          simple_read: true, // all baskets in all used branches are in sync,
          process_arrays: true // one can process all branches as arrays
      };

      // find all branches if they specifed as names
      for (var nn = 0; nn < selector.branches.length; ++nn) {
         var branch = selector.branches[nn];
         if (typeof branch !== 'string') continue;
         
         selector.branches[nn] = this.FindBranch(branch);
         if (!selector.branches[nn]) {
            console.log("Cannot find branch", branch);
            selector.Terminate(false);
            return false;
         }
      }

      // check all branches with counters and add it to list of read branches

      var cnt_br = [], cnt_names = [];
      
      for (var nn = 0; nn < selector.branches.length; ++nn) {
         var branch = selector.branches[nn];
         
         for (var loop = 0; loop<2; ++loop) {
         
            var brcnt = (loop === 0) ? branch.fBranchCount : branch.fBranchCount2;
            
            if ((loop === 1) && !brcnt && branch.fBranchCount && (branch.fBranchCount.fStreamerType===JSROOT.IO.kSTL) && 
                ((branch.fStreamerType === JSROOT.IO.kStreamLoop) || (branch.fStreamerType === JSROOT.IO.kOffsetL+JSROOT.IO.kStreamLoop))) {
               // special case when count member from kStreamLoop not assigned as fBranchCount2  
               var s_i = handle.file.FindStreamerInfo(branch.fClassName,  branch.fClassVersion, branch.fCheckSum),
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
             is_brelem = (branch._typename==="TBranchElement"),
             count_indx = -1, count2_indx = -1;
          
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
            // handle.process_arrays = false;
         } else
      
         if (is_brelem && (nb_leaves === 1) && (leaf.fName === branch.fName) && (branch.fID==-1)) {

            elem = JSROOT.IO.CreateStreamerElement(selector.names[nn], branch.fClassName);
            
            console.log('TBranchElement with ID==-1 typename ', branch.fClassName, 'type', elem.fType);
            
            if (elem.fType === JSROOT.IO.kAny) {
               
               var streamer = handle.file.GetStreamer(branch.fClassName, { val: branch.fClassVersion, checksum: branch.fCheckSum });
               if (!streamer) { elem = null; console.warn('not found streamer!'); } else 
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
         if (is_brelem && (nb_leaves <= 1)) {
            // in some old files TBranchElement may appear without correspondent leaf 
            var s_i = handle.file.FindStreamerInfo(branch.fClassName, branch.fClassVersion, branch.fCheckSum);
            if (!s_i) console.log('Not found streamer info ', branch.fClassName,  branch.fClassVersion, branch.fCheckSum); else
            if ((branch.fID<0) || (branch.fID>=s_i.fElements.arr.length)) console.log('branch ID out of range', branch.fID); else
            elem = s_i.fElements.arr[branch.fID];
         } else  
         if (nb_leaves === 1) {
             // no special constrains for the leaf names
            elem = CreateLeafElem(leaf, selector.names[nn]);
         } else
         if ((branch._typename === "TBranch") && (nb_leaves > 1)) {
            // branch with many elementary leaves
            
            console.log('Create reader for branch with ', nb_leaves, ' leaves');
            
            var arr = new Array(nb_leaves), isok = true;
            for (var l=0;l<nb_leaves;++l) {
               arr[l] = CreateLeafElem(branch.fLeaves.arr[l]);
               arr[l] = JSROOT.IO.CreateMember(arr[l], handle.file);
               if (!arr[l]) isok = false;
            }
            
            if (isok)
               member = {
                  name: selector.names[nn],
                  leaves: arr, 
                  func: function(buf, obj) {
                     var tgt = obj[this.name], l = 0;
                     if (!tgt) obj[this.name] = tgt = {};
                     while (l<this.leaves.length)
                        this.leaves[l++].func(buf,tgt);
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
            selector.is_integer[nn] = (elem.fType < 60) && JSROOT.IO.IsInteger(elem.fType % 20);
         
         if (!member) {
            member = JSROOT.IO.CreateMember(elem, handle.file);
            if ((member.base !== undefined) && member.basename) {
               // when element represent base class, we need handling which differ from normal IO
               member.func = function(buf, obj) {
                  if (!obj[this.name]) obj[this.name] = { _typename: this.basename };
                  buf.ClassStreamer(obj[this.name], this.basename);
               };
            }
            /* keep debug code for a while
            if ((branch.fType === JSROOT.BranchType.kClonesNode) || (branch.fType === JSROOT.BranchType.kSTLNode)) {
               console.log('reading counter ', selector.names[nn], branch.fName);
               member.func = function(buf, obj) {
                  obj[this.name] = buf.ntou4();
                  console.log('counter ', this.name, obj[this.name], 'rest', buf.remain());
               }
            }
            */
            
            
         }

         // this element used to read branch value
         if (!member || !member.func) {
            console.log('Not supported branch kinds', branch.fName);
            selector.Terminate(false);
            return false;
         }
         
         if (branch.fBranchCount) {
            count_indx = selector.branches.indexOf(branch.fBranchCount);
            
            if (count_indx<0) {
               console.log('Not found fBranchCount in the list', branch.fBranchCount.fName);
               selector.Terminate(false);
               return false;
            }

            handle.process_arrays = false;

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
                  count2_indx = selector.branches.indexOf(branch.fBranchCount2);

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
                     count2_indx = selector.branches.indexOf(branch.fBranchCount2);
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
                  
                  // for empty STL branch with map item read version anyway, for vector does not
                  member.read_empty_stl_version = (member.readelem === JSROOT.IO.ReadMapElement); 
                  
               } else 
               if ((elem.fType === JSROOT.IO.kStreamLoop) || (elem.fType === JSROOT.IO.kOffsetL+JSROOT.IO.kStreamLoop)) {
                  // special solution for kStreamLoop
                  
                  var brcnt = branch.fBranchCount2 || branch.$specialCount;
                  if (!brcnt) throw new Error('Missing second count branch for kStreamLoop ' + branch.fName);
                  
                  delete branch.$specialCount;
                  
                  count2_indx = selector.branches.indexOf(brcnt);
                  
                  member.stl_size = selector.names[count_indx];
                  member.cntname = selector.names[count2_indx];
                  member.func = member.branch_func; // this is special function, provided by base I/O
                  
               } else  {
                  
                  member.name = "$stl_member";

                  var brcnt = branch.fBranchCount2 || branch.$specialCount, loop_size_name;

                  if (brcnt) {
                     count2_indx = selector.branches.indexOf(brcnt);
                     delete branch.$specialCount;
                     if (member.cntname) { 
                        loop_size_name = selector.names[count2_indx];
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
               first_readentry: -1, // first entry to read
               staged_basket: 0,  // last basket staged for reading
               numentries: branch.fEntries,
               numbaskets: branch.fWriteBasket, // number of baskets which can be read from the file
               counters: null, // branch indexes used as counters
               ascounter: [], // list of other branches using that branch as counter 
               baskets: [] // array for read baskets,
         };
         
         if (count_indx>=0) { 
            elem.counters = [ count_indx ];
            handle.arr[count_indx].ascounter.push(nn);
            
            if (count2_indx>=0) {
               elem.counters.push(count2_indx);
               handle.arr[count2_indx].ascounter.push(nn);
            }
         }

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
                  elem.first_readentry = branch.fFirstEntry || 0; 
                  elem.current_entry = branch.fFirstEntry || 0;
                  elem.nev = elem.numentries; // number of entries in raw buffer
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
      
      // now calculate entries range
      
      handle.firstentry = handle.lastentry = 0;
      for (var nn = 0; nn < selector.branches.length; ++nn) {
         var branch = selector.branches[nn], e1 = branch.fFirstEntry;
         if (e1 === undefined) e1 = (branch.fBasketBytes[0])  ? branch.fBasketEntry[0] : 0; 
         handle.firstentry = Math.max(handle.firstentry, e1);
         handle.lastentry = (nn===0) ? (e1 + branch.fEntries) : Math.min(handle.lastentry, e1 + branch.fEntries);
      }
      
      if (handle.firstentry >= handle.lastentry) {
         console.log('No any common events for selected branches');
         selector.Terminate(false);
         return false;
      }
      
      handle.process_min = handle.firstentry;
      handle.process_max = handle.lastentry;
      
      if (!isNaN(args.firstentry) && (args.firstentry>handle.firstentry) && (args.firstentry < handle.lastentry))
         handle.process_min = args.firstentry;
      
      if (!isNaN(args.numentries) && (args.numentries>0)) {
         var max = handle.process_min + args.numentries;
         if (max<handle.process_max) handle.process_max = max;
      }
      
      if ((typeof selector.ProcessArrays === 'function') && handle.simple_read) {
         // this is indication that selector can process arrays of values
         // only streactly-matched tree structure can be used for that
         
         for (var k=0;k<handle.arr.length;++k) {
            var elem = handle.arr[k];
            if ((elem.type<=0) || (elem.type >= JSROOT.IO.kOffsetL) || (elem.type === JSROOT.IO.kCharStar)) handle.process_arrays = false;
         }
         
         if (handle.process_arrays) {
            // create other members for fast processings
            
            selector.tgtarr = {}; // object with arrays
            
            for(var nn=0;nn<handle.arr.length;++nn) {
               var item = handle.arr[nn];
               
               var elem = JSROOT.IO.CreateStreamerElement(item.name, "int");
               elem.fType = item.type + JSROOT.IO.kOffsetL;
               elem.fArrayLength = 10; elem.fArrayDim = 1; elem.fMaxIndex[0] = 10; // 10 if artificial number, will be replaced during reading
               
               item.arrmember = JSROOT.IO.CreateMember(elem, handle.file);
            }
         }
      } else {
         handle.process_arrays = false;         
      }

      function ReadBaskets(bitems, baskets_call_back) {
         // read basket with tree data, selecting different files

         var places = [], filename = "";

         function ExtractPlaces() {
            // extract places to read and define file name
            
            places = []; filename = "";
            
            for (var n=0;n<bitems.length;++n) {
               if (bitems[n].done) continue;
               
               var branch = bitems[n].branch;
               
               if (places.length===0)
                  filename = branch.fFileName;
               else
                  if (filename !== branch.fFileName) continue;
               
               bitems[n].selected = true; // mark which item was selected for reading
               
               places.push(branch.fBasketSeek[bitems[n].basket], branch.fBasketBytes[bitems[n].basket]);
            }
            
            // if ((filename.length>0) && (places.length > 0)) console.log('Reading baskets from file', filename);
            
            return places.length > 0;
         }
         
         function ProcessBlobs(blobs) {
            if (!blobs || ((places.length>2) && (blobs.length*2 !== places.length))) 
               return JSROOT.CallBack(baskets_call_back, null);

            var baskets = [], n = 0;
            
            // console.log('places', places, 'blobs', blobs.length, blobs[0].byteLength, blobs[1].byteLength);
            
            for (var k=0;k<bitems.length;++k) {
               if (!bitems[k].selected) continue;
               
               bitems[k].selected = false;
               bitems[k].done = true;

               var blob = (places.length > 2) ? blobs[n++] : blobs,
                   buf = JSROOT.CreateTBuffer(blob, 0, handle.file),
                   basket = buf.ReadTBasket({ _typename: "TBasket" });
               
               // console.log('Use blob', blob.byteLength, 'create buffer', buf.length);

               if (basket.fNbytes !== bitems[k].branch.fBasketBytes[bitems[k].basket]) 
                  console.error('mismatch in read basket sizes', bitems[k].branch.fBasketBytes[bitems[k].basket]);
               
               // items[k].obj = basket; // keep basket object itself if necessary
               
               bitems[k].fNevBuf = basket.fNevBuf; // only number of entries in the basket are relevant for the moment
               
               if (basket.fKeylen + basket.fObjlen === basket.fNbytes) {
                  // use data from original blob
                  bitems[k].raw = buf;
                  // console.log('USE BUFFER itself', buf.length, buf.remain());
                  
               } else {
                  // unpack data and create new blob
                  var objblob = JSROOT.R__unzip(blob, basket.fObjlen, false, buf.o);
                  
                  // console.log('UNPACK BLOB of length', objblob.byteLength);

                  if (objblob) bitems[k].raw = JSROOT.CreateTBuffer(objblob, 0, handle.file);
                  
                  if (bitems[k].raw) bitems[k].raw.fTagOffset = basket.fKeylen; 
               }
            }
            
            if (ExtractPlaces())
               handle.file.ReadBuffer(places, ProcessBlobs, filename);
            else
               JSROOT.CallBack(baskets_call_back, bitems);
         }

         // extract places where to read
         if (ExtractPlaces())
            handle.file.ReadBuffer(places, ProcessBlobs, filename);
         else
            JSROOT.CallBack(baskets_call_back, null); 
      }
      
      function ReadNextBaskets() {
         
         var totalsz = 0, bitems = [], isany = true, is_direct = false;
         
         while ((totalsz < 1e6) && isany) {
            isany = false;
            // very important, loop over branches in reverse order
            // let check counter branch after reading of normal branch is prepared 
            for (var n=handle.arr.length-1; n>=0; --n) {
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

                  // check which baskets need to be read
                  if (elem.first_readentry < 0) {
                     var lmt = elem.branch.fBasketEntry[k+1],
                         not_needed = (lmt < handle.process_min);
                     
                     for (var d=0;d<elem.ascounter.length;++d) {
                        var dep = handle.arr[elem.ascounter[d]]; // dependent element
                        if (dep.first_readentry < lmt) not_needed = false; // check that counter provide required data 
                     }
                     
                     if (not_needed) continue; // if that basket not required, check next
                     
                     elem.curr_basket = k; // basket where reading will start
                     
                     elem.first_readentry = elem.branch.fBasketEntry[k]; // remember which entry will be read first
                     
                     // console.log(n, 'Branch', elem.branch.fName, ' first to read', elem.first_readentry);
                  }
                  
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
         
         var portion = 0;
         if ((handle.current_entry>0) && (handle.process_max > handle.process_min))
            portion = (handle.current_entry - handle.process_min)/ (handle.process_max - handle.process_min);
         
         handle.selector.ShowProgress(portion);
         
         if (totalsz > 0)
            ReadBaskets(bitems, ProcessBaskets);
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
         
            var loopentries = 100000000, min_curr = handle.process_max, n, elem;
            
            // firt loop used to check if all required data exists
            for (n=0;n<handle.arr.length;++n) {

               elem = handle.arr[n];
               
               if (!elem.raw) {
                  if ((elem.curr_basket >= elem.numbaskets)) {
                     if (n==0) return handle.selector.Terminate(true);
                     continue; // ignore non-master branch
                  }

                  // this is single response from the tree, includes branch, bakset number, raw data
                  var bitem = elem.baskets[elem.curr_basket]; 

                  // basket not read
                  if (!bitem) { 
                     // no data, but no any event processed - problem
                     if (!isanyprocessed) { console.warn('no data?'); return handle.selector.Terminate(false); }

                     // try to read next portion of tree data
                     return ReadNextBaskets();
                  }

                  elem.raw = bitem.raw;
                  elem.nev = bitem.fNevBuf; // number of entries in raw buffer
                  elem.current_entry = elem.branch.fBasketEntry[bitem.basket];
                  
                  // console.log('Assign raw buffer', elem.branch.fName, ' first entry', elem.current_entry, ' numevents', elem.nev);
                  
                  bitem.raw = null; // remove reference on raw buffer
                  bitem.branch = null; // remove reference on the branch
                  elem.baskets[elem.curr_basket++] = undefined; // remove from array
               }
               
               min_curr = Math.min(min_curr, elem.current_entry);
               loopentries = Math.min(loopentries, elem.nev); // define how much entries can be processed before next raw buffer will be finished
            }
            
            // assign first entry which can be analyzed
            if (handle.current_entry < 0) handle.current_entry = min_curr;
            
            // second loop extracts all required data

            // do not read too much
            if (handle.current_entry + loopentries > handle.process_max) 
               loopentries = handle.process_max - handle.current_entry;
            
            if (handle.process_arrays && (loopentries>1)) {
               // special case - read all data from baskets as arrays

               for (n=0;n<handle.arr.length;++n) {
                  elem = handle.arr[n];
                  elem.arrmember.arrlength = loopentries;
                  elem.arrmember.func(elem.raw, handle.selector.tgtarr);
                  elem.current_entry += loopentries;

                  elem.raw = null;
               }

               handle.selector.ProcessArrays(handle.current_entry);

               handle.current_entry += loopentries; 

               isanyprocessed = true;
            } else

            // main processing loop   
            while(loopentries--) {
               for (n=0;n<handle.arr.length;++n) {
                  elem = handle.arr[n];

                  if (handle.current_entry === elem.current_entry) {
                     // read only element where entry id matches
                     elem.member.func(elem.raw, handle.selector.tgtobj);

                     elem.current_entry++;

                     if (--elem.nev <= 0) elem.raw = null;
                  }
               }

               if (handle.current_entry >= handle.process_min)
                  handle.selector.Process(handle.current_entry);

               handle.current_entry++;

               isanyprocessed = true;
            }
            
            if (handle.current_entry >= handle.process_max)
                return handle.selector.Terminate(true); 
         }
      }
      
      // call begin before first entry is read
      handle.selector.Begin(this);
      
      ReadNextBaskets();
       
      return true; // indicate that reading of tree will be performed
   }
   
   JSROOT.TreeMethods.FindBranch = function(name, complex, lst) {
      // search branch with specified name
      // if complex enabled, search branch and rest part
      
      if (lst === undefined) lst = this.fBranches;
      
      var search = name, br = null, 
          dot = name.indexOf("."), arr = name.indexOf("[]"), spec = name.indexOf(">"), 
          pos = (dot<0) ? arr : ((arr<0) ? dot : Math.min(dot,arr));
      
      if (pos<0) pos = spec;

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
         res = this.FindBranch(name.substr(dot+1), complex, br.fBranches);
         // special case if next-level branch has name parent_branch.next_branch 
         if (!res && (br.fName.indexOf(".")<0) && (br.fName.indexOf("[")<0))
            res = this.FindBranch(br.fName + name.substr(dot), complex, br.fBranches);
      }

      // when allowed, return find branch with rest part
      if (!res && complex) return { branch: br, rest: name.substr(pos) };

      return res;
   }
   
   JSROOT.TreeMethods.Draw = function(args, result_callback) {
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

         // branch object remains, threrefore we need to copy fields to see them all
         selector.copy_fields = !args.leaf && args.branch.fLeaves && (args.branch.fLeaves.arr.length > 1);
         
         selector.AddBranch(args.branch, "br0");
         
         selector.Process = function() {
            var res = this.leaf ? this.tgtobj.br0[this.leaf] : this.tgtobj.br0; 

            if (res && this.copy_fields)
               this.arr.push(JSROOT.extend({}, res));
            else
               this.arr.push(res);
         }
         
         selector.Terminate = function(res) {
            this.ShowProgress();
            JSROOT.CallBack(result_callback, this.arr, "inspect");
         }
         
         if (!args.numentries) args.numentries = 10;
         // if (!args.firstentry) args.firstentry = 212;
      } else
      if (args.branch) {
         selector = new JSROOT.TDrawSelector(result_callback);
         if (!selector.DrawOnlyBranch(this, args.branch, args.expr, args)) selector = null;
      } else 
      if (args.expr === "testio") {
         // special debugging code
         return this.IOTest(args, result_callback);
      } else {
         selector = new JSROOT.TDrawSelector(result_callback);
         
         if (!selector.ParseDrawExpression(this, args)) selector = null;
      }
      
      if (!selector)
         return JSROOT.CallBack(result_callback, null);
      
      return this.Process(selector, args);
   }
   
   JSROOT.TreeMethods.IOTest = function(args, result_callback) {
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
      
      args.lasttm = new Date().getTime();
      args.lastnbr = args.nbr;
      
      var tree = this;

      function TestNextBranch() {
         
         var selector = new JSROOT.TSelector;
         
         selector.AddBranch(args.branches[args.nbr], "br0");
      
         selector.Process = function() {
            if (this.tgtobj.br0 === undefined) 
               this.fail = true;
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
               setTimeout(tree.IOTest.bind(tree,args,result_callback), 100); // use timeout to avoid deep recursion
            else
               TestNextBranch();
         }
         
         JSROOT.progress("br " + args.nbr + "/" + args.branches.length + " " + args.names[args.nbr]);
         
         // console.log(args.nbr, args.names[args.nbr]);
         
         var br = args.branches[args.nbr];
         
         if ((br.fID === -2) || ((br._typename !== 'TBranchElement') && (!br.fLeaves || (br.fLeaves.arr.length === 0)))) {
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
      
   JSROOT.Painter.CreateBranchItem = function(node, branch, tree) {
      if (!node || !branch) return false;

      var nb_branches = branch.fBranches ? branch.fBranches.arr.length : 0,
          nb_leaves = branch.fLeaves ? branch.fLeaves.arr.length : 0;

      function ClearName(arg) {
         var pos = arg.indexOf("[");
         return pos<0 ? arg : arg.substr(0, pos);
      }
      
      branch.$tree = tree; // keep tree pointer, later do it more smart

      var subitem = {
            _name : ClearName(branch.fName),
            _kind : "ROOT." + branch._typename,
            _title : branch.fTitle,
            _obj : branch 
      };

      if (!node._childs) node._childs = [];

      node._childs.push(subitem);

      if (branch._typename==='TBranchElement')
         subitem._title += " from " + branch.fClassName + ";" + branch.fClassVersion;

      if (nb_branches > 0) {
         subitem._more = true;
         subitem._expand = function(bnode,bobj) {
            // really create all sub-branch items
            if (!bobj) return false;
            
            for ( var i = 0; i < bobj.fBranches.arr.length; ++i) 
               JSROOT.Painter.CreateBranchItem(bnode, bobj.fBranches.arr[i], bobj.$tree);
            
            if (!bobj.fLeaves || (bobj.fLeaves.arr.length !== 1)) return true;
            
            var leaf = bobj.fLeaves.arr[0];
            if ((leaf._typename === 'TLeafElement') && (leaf.fType === JSROOT.IO.kSTL)) {
               var szitem = {
                     _name : "@size",
                     _title : leaf.fTitle,
                     _kind : "ROOT.TBranch",
                     _icon : "img_leaf",
                     _obj : bobj,
                     _more : false
               };
               bnode._childs.push(szitem);
               
            }
            return true;
         }
         return true;
      } else
      if (nb_leaves === 1) {
         subitem._icon = "img_leaf";
         subitem._more = false;
      } else   
      if (nb_leaves > 1) {
         subitem._childs = [];
         for (var j = 0; j < nb_leaves; ++j) {
            branch.fLeaves.arr[j].$branch = branch; // keep branch pointer for drawing 
            var leafitem = {
               _name : ClearName(branch.fLeaves.arr[j].fName),
               _kind : "ROOT." + branch.fLeaves.arr[j]._typename,
               _obj: branch.fLeaves.arr[j]
            }
            subitem._childs.push(leafitem);
         }
      }

      return true;
   }
   
   if (JSROOT.Painter)
   JSROOT.Painter.TreeHierarchy = function(node, obj) {
      if (obj._typename != 'TTree' && obj._typename != 'TNtuple' && obj._typename != 'TNtupleD' ) return false;

      node._childs = [];
      node._tree = obj;  // set reference, will be used later by TTree::Draw

      for ( var i = 0; i < obj.fBranches.arr.length; ++i)
         JSROOT.Painter.CreateBranchItem(node, obj.fBranches.arr[i], obj);

      return true;
   }

   
 if (JSROOT.Painter)
   JSROOT.Painter.drawTree = function(divid, obj, opt) {
      // this is function called from JSROOT.draw()
      // just envelope for real TTree::Draw method which do the main job
      // Can be also used for the branch and leaf object

      var tree = obj, args = opt;

      if (obj.$branch) {
         // this is drawing of the single leaf from the branch 
         args = { expr: "." + obj.fName + (opt || ""), branch: obj.$branch };
         tree = obj.$branch.$tree;
      } else
      if (obj.$tree) {
         // this is drawing of the branch
         
         // if generic object tried to be drawn without specifying any options, it will be just dump
         if (!opt && obj.fStreamerType && (obj.fStreamerType !== JSROOT.IO.kTString) &&
             (obj.fStreamerType >= JSROOT.IO.kObject) && (obj.fStreamerType <= JSROOT.IO.kAnyP)) opt = "dump";  
         
         args = { expr: opt, branch: obj };
         tree = obj.$tree;
      } else
      if (typeof args === 'string') args = { expr: args };

      if (!tree) {
         console.log('No TTree object available for TTree::Draw');
         return this.DrawingReady();
      }

      var painter = this;
      
      args.monitoring = 5000;

      tree.Draw(args, function(histo, hopt, intermediate) {
         JSROOT.redraw(divid, histo, hopt, intermediate ? null : painter.DrawingReady.bind(painter));
      });

      return this;
   }
 

   return JSROOT;

}));
