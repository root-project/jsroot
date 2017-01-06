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

   // ============================================================================
   
   JSROOT.TDrawVariable = function() {
      // object with single variable in TTree::Draw expression
      this.code = "";
      this.branches = []; // names of bracnhes in target object
      this.brarray = []; // array specifier for each branch
      this.func = null; // generic function for variable calculation
      
      this.kind = "";
      this.buf = []; // buffer accumulates temporary values
   }
   
   JSROOT.TDrawVariable.prototype.Parse = function(tree,selector,code) {
      function is_start_symbol(symb) {
         if ((symb >= "A") && (symb <= "Z")) return true; 
         if ((symb >= "a") && (symb <= "z")) return true;
         return (symb === "_");
      }
      
      function is_next_symbol(symb) {
         if (is_start_symbol(symb)) return true;
         if ((symb >= "0") && (symb <= "9")) return true;
         return (symb=== ".");
      }
      
      // first check that this is just a branch 
      /* 
      var br = tree.FindBranch(code);
      if (br) {
         var indx = selector.indexOfBranch(br);
         if (indx<0) indx = selector.AddBranch(br);
         this.direct_branch = selector.nameOfBranch(indx); 
         return res;
      }
      */
      
      this.code = code;

      var pos = 0;
      while (pos < code.length) {
      
         while ((pos < code.length) && !is_start_symbol(code[pos])) pos++;
         var pos2 = pos;
         while ((pos2 < code.length) && is_next_symbol(code[pos2])) pos2++;
      
         var br = tree.FindBranch(code.substr(pos, pos2-pos));
         if (!br) { pos = pos2+1; continue; }
         
         // check array specifier
         var isarr = undefined;
         if ((code[pos2]=="[") && (code[pos2+1]=="]")) { isarr = true; pos2+=2; }
         
         var indx = selector.indexOfBranch(br);
         if (indx<0) indx = selector.AddBranch(br);
         
         this.branches.push(selector.nameOfBranch(indx));
         this.brarray.push(isarr);
         
         // this is simple case of direct usage of the branch
         if ((pos===0) && (pos2 === code.length) && (this.branches.length===1)) {
            this.direct_branch = true;
            return; 
         }
         
         var replace = "arg.var" + (this.branches.length-1);
         
         code = code.substr(0, pos) + replace + code.substr(pos2);
         
         pos = pos + replace.length;
      }
      
      this.func = new Function("arg", "return (" + code + ")");
   }
   
   JSROOT.TDrawVariable.prototype.Produce = function(obj) {
      // after reading tree braches into the object, calculate variable value
      
      if (this.branches.length === 0) {
         this.length = 1;
         this.isarray = false;
         this.value = 1.;
         return;
      }
      
      if (this.direct_branch) {
         // extract value directly 
         this.value = obj[this.branches[0]];
      } else {
         var arg = {};
         for (var n=0;n<this.branches.length;++n) {
            var name = "var" + n;
            arg[name] = obj[this.branches[n]];
         }
         this.value = this.func(arg);
      }

      this.length = 1;
      this.isarray = false;
      if (this.kind===undefined)
         this.kind = typeof this.value; 
   }
   
   JSROOT.TDrawVariable.prototype.get = function(indx) {
      return this.isarray ? this.value[indx] : this.value; 
   } 

   // =============================================================================

   JSROOT.TNewSelector = function(callback) {
      JSROOT.TSelector.call(this);   
      
      this.ndim = 0;
      this.vars = []; // array of expression varibles 
      this.cut = null; // cut variable
      this.hist = null;
      this.histo_callback = callback;
      this.hist_name = "$htemp";
      this.hist_title = "Result of TTree::Draw";
      this.hist_args = []; // arguments for histogram creation
      this.doarr = true;
   }

   JSROOT.TNewSelector.prototype = Object.create(JSROOT.TSelector.prototype);
  
   JSROOT.TNewSelector.prototype.ParseDrawExpression = function(tree, expr) {
      
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
      
      for (var n=0;n<this.ndim;++n) {
         this.vars[n] = new JSROOT.TDrawVariable();
         this.vars[n].Parse(tree, this, names[n]);
      }
      
      this.cut = new JSROOT.TDrawVariable();
      if (cut) this.cut.Parse(tree, this, cut);

      return true;
   }

   
   JSROOT.TNewSelector.prototype.ShowProgress = function(value) {
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

   JSROOT.TNewSelector.prototype.GetMinMaxBins = function(axisid, nbins) {
      
      var res = { min: 0, max: 0, nbins: nbins };
      
      if (axisid>=this.ndim) return res;
      
      var arr = this.vars[axisid].buf, 
          is_int = false; // TODO: correctly detect integer fields
      
      if (this.vars[axisid].kind === "string") {
         res.lbls = []; // all labels
         
         for (var k=0;k<arr.length;++k) 
            if (res.lbls.indexOf(arr[k])<0) 
               res.lbls.push(arr[k]);
         
         res.lbls.sort();
         res.max = res.nbins = res.lbls.length;
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
   
   JSROOT.TNewSelector.prototype.CreateHistogram = function() {
      if (this.hist || !this.vars[0].buf) return;
      
      this.x = this.GetMinMaxBins(0, (this.ndim > 1) ? 50 : 200);
      
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
      
      if (this.ndim > 1) this.hist.fYaxis.fTitle = this.vars[1].code;
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

      if (this.ndim > 2) this.hist.fZaxis.fTitle = this.vars[2].code;
      this.hist.fZaxis.fXmin = this.z.min;
      this.hist.fZaxis.fXmax = this.z.max;
      if (this.z.lbls) {
         this.hist.fZaxis.fLabels = JSROOT.Create("THashList");
         for (var k=0;k<this.z.lbls.length;++k) {
            var s = JSROOT.Create("TObjString");
            s.fString = this.z.lbls[k];
            s.fUniqueID = k+1;
            if (s.fString === "") s.fString = "<empty>";
            this.hist.fZaxis.fLabels.Add(s);
         }
      }
      
      this.hist.fName = this.hist_name;
      this.hist.fTitle = this.hist_title;
      this.hist.$custom_stat = (this.hist_name == "$htemp") ? 111110 : 111111;
      
      var var0 = this.vars[0].buf, cut = this.cut.buf, len = var0.length; 
         
      switch (this.ndim) {
         case 1:
            for (var n=0;n<len;++n) 
               this.Fill1DHistogram(var0[n], cut[n]);
            break;
         case 2: 
            var var1 = this.vars[1].buf;
            for (var n=0;n<len;++n) 
               this.Fill2DHistogram(var0[n], var1[n], cut[n]);
            delete this.vars[1].buf;
            break;
         case 3:
            var var1 = this.vars[1].buf, var2 = this.vars[2].buf; 
            for (var n=0;n<len;++n) 
               this.Fill2DHistogram(var0[n], var1[n], var2[n], cut[n]);
            delete this.vars[1].buf;
            delete this.vars[2].buf;
            break;
      }
      
      delete this.vars[0].buf;
      delete this.cut.buf;
   }
   
   JSROOT.TNewSelector.prototype.Fill1DHistogram = function(xvalue, weight) {
      var bin = this.x.GetBin(xvalue);
      this.hist.fArray[bin] += weight;
   }

   JSROOT.TNewSelector.prototype.Fill2DHistogram = function(xvalue, yvalue, weight) {
      var xbin = this.x.GetBin(xvalue),
          ybin = this.y.GetBin(yvalue);
      
      this.hist.fArray[xbin+(this.x.nbins+2)*ybin] += weight;
   }

   JSROOT.TNewSelector.prototype.Fill3DHistogram = function(xvalue, yvalue, zvalue, weight) {
      var xbin = this.x.GetBin(xvalue),
          ybin = this.y.GetBin(yvalue),
          zbin = this.z.GetBin(zvalue);
      
      this.hist.fArray[xbin + (this.x.nbins+2) * (ybin + (this.y.nbins+2)*zbin) ] += weight;
   }

   JSROOT.TNewSelector.prototype.Process = function(entry) {

      for (var n=0;n<this.ndim;++n)
         this.vars[n].Produce(this.tgtobj);
      
      this.cut.Produce(this.tgtobj);

      var var0 = this.vars[0], var1 = this.vars[1], var2 = this.vars[2], cut = this.cut;   

      if (this.doarr) {
         switch(this.ndim) {
            case 1:
              for (var n0=0;n0<var0.length;++n0) {
                 var0.buf.push(var0.get(n0));
                 cut.buf.push(cut.value);
              }
              break;
            case 2:
              for (var n0=0;n0<var0.length;++n0) {
                 for (var n1=0;n1<var1.length;++n1) {
                    var0.buf.push(var0.get(n0));
                    var1.buf.push(var1.get(n1));
                    cut.buf.push(cut.value);
                 }
              }
              break;
            case 3:
               for (var n0=0;n0<var0.length;++n0) {
                  for (var n1=0;n1<var1.length;++n1) {
                     for (var n2=0;n2<var2.length;++n2) {
                        var0.buf.push(var0.get(n0));
                        var1.buf.push(var1.get(n1));
                        var2.buf.push(var2.get(n2));
                        cut.buf.push(cut.value);
                     }
                  }
               }
               break;
         }
         if (var0.buf.length > 10000) {
            this.CreateHistogram();
            this.doarr = false;
         }
      } else
      if (this.hist) {
         switch(this.ndim) {
            case 1:
               for (var n0=0;n0<var0.length;++n0) {
                  this.Fill1DHistogram(var0.get(n0), cut.value);
               }
               break;
            case 2:
               for (var n0=0;n0<var0.length;++n0) {
                  for (var n1=0;n1<var1.length;++n1) {
                     this.Fill2DHistogram(var0.get(n0), var1.get(n1), cut.value);
                  }
               }
               break;
            case 3:
               for (var n0=0;n0<var0.length;++n0) {
                  for (var n1=0;n1<var1.length;++n1) {
                     for (var n2=0;n2<var2.length;++n2) {
                        this.Fill3DHistogram(var0.get(n0), var1.get(n1), var2.get(n2), cut.value);
                     }
                  }
               }
               break;
         } 
      }
   }
   
   JSROOT.TNewSelector.prototype.Terminate = function(res) {
      if (res && !this.hist) this.CreateHistogram();
      
      this.ShowProgress();
      
      return JSROOT.CallBack(this.histo_callback, this.hist, (this.ndim==2) ? "col" : "");
   }
   
   // =============================================================================
   
   JSROOT.TDrawSelector = function(callback) {
      JSROOT.TSelector.call(this);   
      
      this.ndim = 0;
      this.hist = null;
      this.expr = [];
      this.plain = []; // is branches values can be used directly or need iterator or any other transformation
      this.kind = []; // is final value (after all iterators) is float, int or string
      this.axislbls = ["", "", ""];
      this.histo_callback = callback;
      this.hist_name = "$htemp";
      this.hist_title = "Result of TTree::Draw";
      this.hist_args = []; // arguments for histogram creation
   }

   JSROOT.TDrawSelector.prototype = Object.create(JSROOT.TSelector.prototype);
   
   JSROOT.TDrawSelector.prototype.AddDrawBranch = function(branch, branch_expr, axislbl) {
      
      var id = this.ndim++;
      
      this.AddBranch(branch, "br" + id);
      
      switch(id) {
         case 0: this.arr1 = []; this.arrcut = []; break; // array to accumulate first dimension and cut expression
         case 1: this.arr2 = []; break; // array to accumulate second dimension
         case 2: this.arr3 = []; break; // array to accumulate third dimension
         default: console.log('more than 3 dimensions not supported'); return false;
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
   
   JSROOT.TDrawSelector.prototype.AddCutBranch = function(branch, branch_expr) {
      
      this.AddBranch(branch, "brcut");
      
      this.hascut = true;
       
      if (branch_expr) {
      
         console.log('Add cut branch ', branch.fName, ' with expression', branch_expr);

         this.cutexpr = { arr: false, func: null, code: branch_expr };

         if (branch_expr.indexOf("[]")==0) { this.cutexpr.arr = true; branch_expr = branch_expr.substr(2); }

         // ending [] has no meaning - iterator over all array elements done automatically
         if (branch_expr.indexOf("[]") === branch_expr.length-2) 
            branch_expr = branch_expr.substr(0,branch_expr.length-2); 

         if (branch_expr.length>0)
            this.cutexpr.func = new Function("func_var", "return func_var" + branch_expr);
         else
            this.cutexpr = undefined; // without func no need to create special handling
      }
      
      return true;
   }
  
   JSROOT.TDrawSelector.prototype.ParseDrawExpression = function(tree, expr) {
      
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

      var pos = expr.lastIndexOf("::");
      if (pos>0) {
         var cut = expr.substr(pos+2).trim();
         expr = expr.substr(0,pos).trim();
         
         var br = tree.FindBranch(cut, true);
         if (!br) {
            console.log('Not found cut branch', cut);
            return false;
         }

         if (br.branch) 
            this.AddCutBranch(br.branch, br.rest);
         else
            this.AddCutBranch(br, undefined);
      }

      var names = expr.split(":");
      if ((names.length < 1) || (names.length > 3)) return false;

      for (var n=0;n<names.length;++n) {
         var br = tree.FindBranch(names[n], true);
         if (!br) {
            console.log('Not found branch', names[n]);
            return false;
         }

         if (br.branch) 
            this.AddDrawBranch(br.branch, br.rest, names[n]);
         else
            this.AddDrawBranch(br, undefined, names[n]);
      }

      return true;
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

   JSROOT.TDrawSelector.prototype.GetMinMaxBins = function(axisid, kind, arr, is_int, nbins) {
      
      var res = { min: 0, max: 0, nbins: nbins };
      
      if ((axisid>=this.ndim) || !kind || !arr || (arr.length==0)) return res;
      
      if (kind === "string") {
         res.lbls = []; // all labels
         
         for (var k=0;k<arr.length;++k) 
            if (res.lbls.indexOf(arr[k])<0) 
               res.lbls.push(arr[k]);
         
         res.lbls.sort();
         res.max = res.nbins = res.lbls.length;
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
      if (this.hist || !this.arr1 || this.arr1.length==0) return;
      
      this.x = this.GetMinMaxBins(0, this.kind[0], this.arr1, this.IsInteger(0), (this.ndim > 1) ? 50 : 200);
      
      this.y = this.GetMinMaxBins(1, this.kind[1], this.arr2, this.IsInteger(1), 50);

      this.z = this.GetMinMaxBins(2, this.kind[2], this.arr3, this.IsInteger(2), 50);
      
      switch (this.ndim) {
         case 1: this.hist = JSROOT.CreateHistogram("TH1F", this.x.nbins); break; 
         case 2: this.hist = JSROOT.CreateHistogram("TH2F", this.x.nbins, this.y.nbins); break;
         case 3: this.hist = JSROOT.CreateHistogram("TH3F", this.x.nbins, this.y.nbins, this.z.nbins); break;
      }
      
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
      
      if (this.ndim > 1) this.hist.fYaxis.fTitle = this.axislbls[1];
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

      if (this.ndim > 2) this.hist.fZaxis.fTitle = this.axislbls[2];
      this.hist.fZaxis.fXmin = this.z.min;
      this.hist.fZaxis.fXmax = this.z.max;
      if (this.z.lbls) {
         this.hist.fZaxis.fLabels = JSROOT.Create("THashList");
         for (var k=0;k<this.z.lbls.length;++k) {
            var s = JSROOT.Create("TObjString");
            s.fString = this.z.lbls[k];
            s.fUniqueID = k+1;
            if (s.fString === "") s.fString = "<empty>";
            this.hist.fZaxis.fLabels.Add(s);
         }
      }
      
      this.hist.fName = this.hist_name;
      this.hist.fTitle = this.hist_title;
      this.hist.$custom_stat = (this.hist_name == "$htemp") ? 111110 : 111111;
      
      switch (this.ndim) {
         case 1:
            for (var n=0;n<this.arr1.length;++n) 
               this.Fill1DHistogram(this.arr1[n], this.arrcut[n]);
            break;
         case 2: 
            for (var n=0;n<this.arr1.length;++n) 
               this.Fill2DHistogram(this.arr1[n], this.arr2[n], this.arrcut[n]);
            break;
         case 3:
            for (var n=0;n<this.arr1.length;++n) 
               this.Fill2DHistogram(this.arr1[n], this.arr2[n], this.arr3[n], this.arrcut[n]);
            break;
      }
      
      delete this.arr1;
      delete this.arr2;
      delete this.arr3;
      delete this.arrcut;
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
      
      var weight = 1.;
      if (this.hascut) {
          if (this.plaincut===undefined)
             this.plaincut = !this.cutexpr && (typeof this.tgtobj.brcut == 'number');
          if (this.plaincut) {
             weight = this.tgtobj.brcut;
          } else {
             var iter = this.CreateIterator(this.tgtobj.brcut, this.cutexpr);
             while (iter.next()) weight = iter.value;
          }
          if (weight === false) weight = 0; else
          if (weight === true) weight = 1; else
          if (weight < 0) weight = 0;
      }
      
      if (this.arr1 !== undefined) {
         var firsttime = false;
         
         if (this.plain.length === 0) {
            this.kind[0] = typeof this.tgtobj.br0;
            this.plain[0] = !this.expr[0] && ((this.kind[0] == 'number') || (this.kind[0] == 'string'));
            if (this.ndim > 1) {
               this.kind[1] = typeof this.tgtobj.br1;
               this.plain[1] = !this.expr[1] && ((this.kind[1] == 'number') || (this.kind[1] == 'string'));
            }
            if (this.ndim > 2) {
               this.kind[2] = typeof this.tgtobj.br2;
               this.plain[2] = !this.expr[2] && ((this.kind[2] == 'number') || (this.kind[2] == 'string'));
            }
            firsttime = true;
         }
         
         if (this.ndim==1) {
            if (this.plain[0]) {
               this.arr1.push(this.tgtobj.br0);
               this.arrcut.push(weight);
            } else {
               var iter = this.CreateIterator(this.tgtobj.br0, this.expr[0]);
               
               while (iter.next()) {  
                  this.arr1.push(iter.value);
                  this.arrcut.push(weight);
               }
               
               if (firsttime) this.kind[0] = typeof iter.value;
            }
            
         } else 
         if (this.ndim==2) {
            if (this.plain[0] && this.plain[1]) {
               this.arr1.push(this.tgtobj.br0);
               this.arr2.push(this.tgtobj.br1);
               this.arrcut.push(weight);
            } else {
               var iter0 = this.CreateIterator(this.tgtobj.br0, this.expr[0]),
                   iter1 = this.CreateIterator(this.tgtobj.br1, this.expr[1]);
               
               while (iter0.next()) {
                  iter1.reset();
                  while (iter1.next()) {
                     this.arr1.push(iter0.value);
                     this.arr2.push(iter1.value);
                     this.arrcut.push(weight);
                  }
               }
               
               if (firsttime) {
                  this.kind[0] = typeof iter0.value;
                  this.kind[1] = typeof iter1.value;
               }
            }
         } else 
         if (this.ndim==3) {
            if (this.plain[0] && this.plain[1] && this.plain[2]) {
               this.arr1.push(this.tgtobj.br0);
               this.arr2.push(this.tgtobj.br1);
               this.arr3.push(this.tgtobj.br2);
               this.arrcut.push(weight);
            } else {
               var iter0 = this.CreateIterator(this.tgtobj.br0, this.expr[0]),
                   iter1 = this.CreateIterator(this.tgtobj.br1, this.expr[1]),
                   iter2 = this.CreateIterator(this.tgtobj.br2, this.expr[2]);
               
               while (iter0.next()) {
                  iter1.reset();
                  while (iter1.next()) {
                     iter2.reset();
                     while(iter2.next()) {
                        this.arr1.push(iter0.value);
                        this.arr2.push(iter1.value);
                        this.arr3.push(iter2.value);
                        this.arrcut.push(weight);
                     }
                  }
               }
               
               if (firsttime) {
                  this.kind[0] = typeof iter0.value;
                  this.kind[1] = typeof iter1.value;
                  this.kind[2] = typeof iter2.value;
               }
            }
         }
         
         if (this.arr1.length > 10000) this.CreateHistogram();
      } else
      if (this.hist) {
         if (this.ndim===1) {
            if (this.plain[0]) {
               this.Fill1DHistogram(this.tgtobj.br0, weight);
            } else {
               var iter = this.CreateIterator(this.tgtobj.br0, this.expr[0]);
               while (iter.next()) 
                  this.Fill1DHistogram(iter.value, weight);
            }
         } else
         if (this.ndim===2) {
            if (this.plain[0] && this.plain[1]) {
               this.Fill2DHistogram(this.tgtobj.br0, this.tgtobj.br1, weight);
            } else {
               var iter0 = this.CreateIterator(this.tgtobj.br0, this.expr[0]),
                   iter1 = this.CreateIterator(this.tgtobj.br1, this.expr[1]);
           
               while (iter0.next()) {
                  iter1.reset();
                  while (iter1.next()) 
                     this.Fill2DHistogram(iter0.value, iter1.value, weight);
               }
            }
         } else 
         if (this.ndim===3) {
            if (this.plain[0] && this.plain[1] && this.plain[2]) {
               this.Fill3DHistogram(this.tgtobj.br0, this.tgtobj.br1, this.tgtobj.br2, weight);
            } else {
               var iter0 = this.CreateIterator(this.tgtobj.br0, this.expr[0]),
                   iter1 = this.CreateIterator(this.tgtobj.br1, this.expr[1]),
                   iter2 = this.CreateIterator(this.tgtobj.br2, this.expr[2]);
           
               while (iter0.next()) {
                  iter1.reset();
                  while (iter1.next()) {
                     iter2.reset();
                     while (iter2.next()) 
                        this.Fill3DHistogram(iter0.value, iter1.value, iter2.value, weight);
                  }
               }
            }
         } 
      }
   }
   
   JSROOT.TDrawSelector.prototype.ProcessArrays = function(entry) {
      // process all branches as arrays
      // works only for very limited number of cases with plain branches, but much faster
      
      if (this.arr1 !== undefined) {
         for (var n=0;n<this.tgtarr.br0.length;++n) {
            this.arr1.push(this.tgtarr.br0[n]);
            this.arrcut.push(this.hascut ? this.tgtarr.brcut[n] : 1.);
         }
         if (this.ndim>1) 
            for (var n=0;n<this.tgtarr.br1.length;++n)
              this.arr2.push(this.tgtarr.br1[n]);
         if (this.ndim>2) 
            for (var n=0;n<this.tgtarr.br2.length;++n)
              this.arr3.push(this.tgtarr.br2[n]);
         
         if (this.arr1.length > 10000) this.CreateHistogram();
      } else
      if (this.hist) {
         switch (this.ndim) {
            case 1:
               for (var n=0;n<this.tgtarr.br0.length;++n)
                  this.hist.Fill(this.tgtarr.br0[n], this.hascut ? this.tgtarr.brcut[n] : 1.);
               break;
            case 2:
               for (var n=0;n<this.tgtarr.br0.length;++n)
                  this.hist.Fill(this.tgtarr.br0[n], this.tgtarr.br1[n], this.hascut ? this.tgtarr.brcut[n] : 1.);
               break;
            case 3:
               for (var n=0;n<this.tgtarr.br0.length;++n)
                  this.hist.Fill(this.tgtarr.br0[n], this.tgtarr.br1[n], this.tgtarr.br2[n], this.hascut ? this.tgtarr.brcut[n] : 1.);
               break;
         }
      }
   }
   
   JSROOT.TDrawSelector.prototype.Terminate = function(res) {
      if (res && !this.hist) this.CreateHistogram();
      
      this.ShowProgress();
      
      return JSROOT.CallBack(this.histo_callback, this.hist, this.ndim==2 ? "col" : "");
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
          process_arrays: false // one can process all branches as arrays
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
         } else
      
         if (is_brelem && (nb_leaves === 1) && (leaf.fName === branch.fName) && (branch.fID==-1)) {
            
            elem = JSROOT.IO.CreateStreamerElement(selector.names[nn], branch.fClassName);

            // console.log('TBranchElement with ID==-1 typename ', branch.fClassName, elem.fType);
            
            if (elem.fType === JSROOT.IO.kAny) {
               // this is indication that object stored in the branch - need special handling
               
               var streamer = handle.file.GetStreamer(branch.fClassName, { val: branch.fClassVersion, checksum: branch.fCheckSum });
               
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
            selector.is_integer[nn] = JSROOT.IO.IsInteger(elem.fType) || JSROOT.IO.IsInteger(elem.fType-JSROOT.IO.kOffsetL);
         
         if (!member) {
            member = JSROOT.IO.CreateMember(elem, handle.file);
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
            count_indx = selector.branches.indexOf(branch.fBranchCount);
            
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
            
            for (var k=0;k<bitems.length;++k) {
               if (!bitems[k].selected) continue;
               
               bitems[k].selected = false;
               bitems[k].done = true;

               var blob = (places.length > 2) ? blobs[n++] : blobs,
                   buf = JSROOT.CreateTBuffer(blob, 0, handle.file),
                   basket = buf.ReadTBasket({ _typename: "TBasket" });

               if (basket.fNbytes !== bitems[k].branch.fBasketBytes[bitems[k].basket]) 
                  console.error('mismatch in read basket sizes', bitems[k].branch.fBasketBytes[bitems[k].basket]);
               
               // items[k].obj = basket; // keep basket object itself if necessary
               
               bitems[k].fNevBuf = basket.fNevBuf; // only number of entries in the basket are relevant for the moment
               
               if (basket.fKeylen + basket.fObjlen === basket.fNbytes) {
                  // use data from original blob
                  bitems[k].raw = buf;
                  
               } else {
                  // unpack data and create new blob
                  var objblob = JSROOT.R__unzip(blob, basket.fObjlen, false, buf.o);

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
            portion = (handle.current_entry - handle.process_max)/ (handle.process_max - handle.process_min);
         
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
         
         if (args.leaf) args.expr = "."+args.leaf;
         
         selector.AddDrawBranch(args.branch, args.expr, args.branch.fName);
         
         selector.hist_title = "drawing '" + args.branch.fName + "' from " + this.fName;
      } else 
      if (args.expr === "testio") {
         // special debugging code
         return this.IOTest(args, result_callback);
      } else {
         // selector = new JSROOT.TDrawSelector(result_callback);
         selector = new JSROOT.TNewSelector(result_callback);
         
         if (!selector.ParseDrawExpression(this, args.expr))
            return JSROOT.CallBack(result_callback, null);
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

      var painter = this;

      tree.Draw(args, function(histo, hopt) {
         JSROOT.draw(divid, histo, hopt, painter.DrawingReady.bind(painter));
      });

      return this;
   }
 

   return JSROOT;

}));
