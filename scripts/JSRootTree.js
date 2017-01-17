/// @file JSRootTree.js
/// Collect all TTree-relevant methods like reading and processing

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      // AMD. Register as an anonymous module.
      define( ['JSRootCore', 'JSRootIOEvolution', 'JSRootMath'], factory );
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
      this.directs = []; // indication if only branch without any childs should be read
      this.is_integer = []; // array of 
      this.break_execution = 0;
      this.tgtobj = {};
   }
   
   JSROOT.TSelector.prototype.AddBranch = function(branch, name, direct) {
      // Add branch to the selector
      // Either branch name or branch itself should be specified
      // Second parameter defines member name in the tgtobj
      // If selector.AddBranch("px", "read_px") is called, 
      // branch will be read into selector.tgtobj.read_px member  
      
      if (!name) 
         name = (typeof branch === 'string') ? branch : ("br" + this.branches.length);
      this.branches.push(branch);
      this.names.push(name);
      this.directs.push(direct);
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
               case "$last$": this.indx[cnt] = obj.length-1; break;
               case "$size$":
                  this.value = obj.length;
                  this.fastindx = this.fastlimit = 0;
                  this.cnt = cnt;
                  return true;
                  break;
               case "$self$":
                  this.value = obj;
                  this.fastindx = this.fastlimit = 0;
                  this.cnt = cnt;
                  return true;
                  break;
               default: 
                  if (!isNaN(this.select[cnt])) {
                     this.indx[cnt] = this.select[cnt];
                     if (this.indx[cnt] < 0) this.indx[cnt] = obj.length-1;
                  } else {
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
   
   JSROOT.TDrawVariable = function(globals) {
      // object with single variable in TTree::Draw expression
      this.globals = globals;
      
      this.code = "";
      this.brindex = []; // index of used branches from selector
      this.branches = []; // names of bracnhes in target object
      this.brarray = []; // array specifier for each branch
      this.func = null; // generic function for variable calculation
      
      this.kind = undefined;
      this.buf = []; // buffer accumulates temporary values
   }
   
   JSROOT.TDrawVariable.prototype.Parse = function(tree,selector,code,only_branch,branch_mode) {
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
            
            if (code[pos2]=="$") {
               var repl = "";
               switch (code.substr(pos, pos2-pos)) {
                  case "LocalEntry":
                  case "Entry": repl = "arg.$globals.entry"; break;
                  case "Entries": repl = "arg.$globals.entries"; break;
               }
               if (repl) {
                  console.log('Replace ', code.substr(pos, pos2-pos), 'with', repl); 
                  code = code.substr(0, pos) + repl + code.substr(pos2+1);
                  pos = pos + repl.length;
                  continue;
               }
            }

            br = tree.FindBranch(code.substr(pos, pos2-pos), true);
            if (!br) { pos = pos2+1; continue; }

            // when full id includes branch name, replace only part of extracted expression 
            if (br.branch && (br.rest!==undefined)) {
               pos2 -= br.rest.length;
               branch_mode = br.read_mode; // maybe selection of the sub-object done
               br = br.branch;
            } else 
            if (code[pos2-1]===".") {
               // when branch name ends with point, means object itself should be extracted
               arriter.push("$self$");
            }
         }
         
         // now extract all levels of iterators 
         while (pos2 < code.length) {
            
            if ((code[pos2]==="@") && (code.substr(pos2,5)=="@size") && (arriter.length==0)) {
               pos2+=5; 
               branch_mode = true; 
               break;
            } 

            if (code[pos2] === ".") {
               // this is object member
               var prev = ++pos2; 
               
               if (!is_start_symbol(code[prev])) {
                  arriter.push("$self$"); // last point means extraction of object itself
                  break;
               }
               
               while ((pos2 < code.length) && is_next_symbol(code[pos2])) pos2++;
               
               // this is looks like function call - do not need to extract member with 
               if (code[pos2]=="(") { pos2 = prev-1; break; }
               
               // this is selection of member, but probably we need to actiavte iterator for ROOT collection
               if ((arriter.length===0) && br) {
                  // TODO: if selected member is simple data type - no need to make other checks - just break here
                  if ((br.fType === JSROOT.BranchType.kClonesNode) || (br.fType === JSROOT.BranchType.kSTLNode)) {
                     arriter.push(undefined); 
                  } else {   
                     var objclass = JSROOT.IO.GetBranchObjectClass(br, tree, false, true);
                     if (objclass && JSROOT.IsRootCollection(null, objclass)) arriter.push(undefined); 
                  }
               }
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
               case "$all$": arriter.push(undefined); break;
               case "$last$": arriter.push("$last$"); break;
               case "$size$": arriter.push("$size$"); break;
               case "$first$": arriter.push(0); break;
               default:
                  if (!isNaN(parseInt(sub))) {
                     arriter.push(parseInt(sub)); 
                  } else {
                     // try to compile code as draw variable
                     var subvar = new JSROOT.TDrawVariable(this.globals);
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
         if (indx<0) indx = selector.AddBranch(br, undefined, branch_mode);
         
         branch_mode = undefined;
         
         this.brindex.push(indx);
         this.branches.push(selector.nameOfBranch(indx));
         this.brarray.push(arriter);
         
         // this is simple case of direct usage of the branch
         if ((pos===0) && (pos2 === code.length) && (this.branches.length===1)) {
            this.direct_branch = true; // remember that branch read as is
            return true; 
         }
         
         var replace = "arg.var" + (this.branches.length-1);
         
         code = code.substr(0, pos) + replace + code.substr(pos2);
         
         pos = pos + replace.length;
      }

      // support usage of some standard TMath functions
      code = code.replace(/ROOT__TMath__Exp\(/g, 'Math.exp(')
                 .replace(/ROOT__TMath__Abs\(/g, 'Math.abs(')
                 .replace(/ROOT__TMath__Prob\(/g, 'arg.$math.Prob(')
                 .replace(/ROOT__TMath__Gaus\(/g, 'arg.$math.Gaus(');

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
      
      var arg = { $globals: this.globals, $math: JSROOT.Math }, usearrlen = -1, arrs = [];
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
      this.histo_drawopt = "";
      this.hist_name = "$htemp";
      this.hist_title = "Result of TTree::Draw";
      this.hist_args = []; // arguments for histogram creation
      this.arr_limit = 1000;  // number of accumulated items before create histogram
      this.htype = "F";
      this.monitoring = 0;
      this.globals = {}; // object with global parameters, which could be used in any draw expression 
   }

   JSROOT.TDrawSelector.prototype = Object.create(JSROOT.TSelector.prototype);
   
   JSROOT.TDrawSelector.prototype.ParseParameters = function(tree, args, expr) {
      
      if (!expr || (typeof expr !== "string")) return "";
      
      // parse parameters which defined at the end as expression;par1name:par1value;par2name:par2value
      var pos = expr.lastIndexOf(";");
      while (pos>0) {
         var parname = expr.substr(pos+1), parvalue = undefined;
         expr = expr.substr(0,pos);
         pos = expr.lastIndexOf(";");
         
         var separ = parname.indexOf(":");
         if (separ>0) { parvalue = parname.substr(separ+1); parname = parname.substr(0, separ);  }
         
         var intvalue = parseInt(parvalue);
         if (!parvalue || isNaN(intvalue)) intvalue = undefined;
         
         switch (parname) {
            case "num": 
            case "entries": 
            case "numentries": 
               if (parvalue==="all") args.numentries = tree.fEntries; else
               if (parvalue==="half") args.numentries = Math.round(tree.fEntries/2); else
               if (intvalue !== undefined) args.numentries = intvalue;
               break;
            case "first":   
               if (intvalue !== undefined) args.firstentry = intvalue;
               break;
            case "mon":
            case "monitor":
               args.monitoring = (intvalue !== undefined) ? intvalue : 5000;
               break;
            case "maxseg":
            case "maxrange":   
               if (intvalue) tree.$file.fMaxRanges = intvalue;
               break;
            case "accum":
               if (intvalue) this.arr_limit = intvalue;
               break;
            case "htype":
               if (parvalue && (parvalue.length===1)) {
                  this.htype = parvalue.toUpperCase();
                  if ((this.htype!=="C") && (this.htype!=="S") && (this.htype!=="I") 
                       && (this.htype!=="F") && (this.htype!=="L") && (this.htype!=="D")) this.htype = "F";
               }
               break;
            case "drawopt":
               this.histo_drawopt = parvalue;
               break;
         }
      }
      
      pos = expr.lastIndexOf(">>");
      if (pos>=0) {
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

      return expr;
   }
  
   JSROOT.TDrawSelector.prototype.ParseDrawExpression = function(tree, args) {
      
      // parse complete expression
      var expr = this.ParseParameters(tree, args, args.expr);

      // parse option for histogram creation

      this.hist_title = "drawing '" + expr + "' from " + tree.fName;
      
      expr = expr.replace(/TMath::/g, 'ROOT__TMath__'); // avoid confusion due-to :: in the namespace 

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
         this.vars[n] = new JSROOT.TDrawVariable(this.globals);
         if (!this.vars[n].Parse(tree, this, names[n])) return false;
         if (!this.vars[n].direct_branch) is_direct = false; 
      }
      
      this.cut = new JSROOT.TDrawVariable(this.globals);
      if (cut) 
         if (!this.cut.Parse(tree, this, cut)) return false;
      
      if (!this.branches.length) {
         console.log('no any branch is selected');
         return false;
      }
      
      if (is_direct) this.ProcessArrays = this.ProcessArraysFunc;
      
      this.monitoring = args.monitoring;
      
      if (!this.histo_drawopt)
         this.histo_drawopt = (this.ndim===2) ? "col" : "";
      
      return true;
   }
   
   JSROOT.TDrawSelector.prototype.DrawOnlyBranch = function(tree, branch, expr, args) {
      this.ndim = 1;
      
      expr = this.ParseParameters(tree, args, expr);
      
      if (expr === "dump") {
         this.dump_values = true;
         if (args.numentries===undefined) args.numentries = 10;
         expr = "";
      }

      this.vars[0] = new JSROOT.TDrawVariable(this.globals);
      if (!this.vars[0].Parse(tree, this, expr, branch, args.direct_branch)) return false;
      this.hist_title = "drawing branch '" + branch.fName + (expr ? "' expr:'" + expr : "") + "'  from " + tree.fName;
      
      this.cut = new JSROOT.TDrawVariable(this.globals);
      
      if (this.vars[0].direct_branch) this.ProcessArrays = this.ProcessArraysFunc;
      
      this.monitoring = args.monitoring;

      return true;
   }
   
   JSROOT.TDrawSelector.prototype.Begin = function(tree) {
      this.globals.entries = tree.fEntries;
      
      if (this.monitoring)
         this.lasttm = new Date().getTime();
   } 
   
   JSROOT.TDrawSelector.prototype.ShowProgress = function(value) {
      // this function should be defined not here
      
      if ((document === undefined) || (JSROOT.progress===undefined)) return;

      if ((value===undefined) || isNaN(value)) return JSROOT.progress();

      var main_box = document.createElement("p"),
          text_node = document.createTextNode("TTree draw " + (value*100).toFixed(2) + " %  "),
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
         var typename, similar = true, maxbits = 8;
         for (var k=0;k<arr.length;++k) {
            if (!arr[k]) continue;
            if (!typename) typename = arr[k]._typename;
            if (typename !== arr[k]._typename) similar = false; // check all object types
            if (arr[k].fNbits) maxbits = Math.max(maxbits, arr[k].fNbits+1);
         }
         
         if (typename && similar) {
            if ((typename==="TBits") && (axisid===0)) {
               console.log('Provide special handling fot TBits');
               this.Fill1DHistogram = this.FillTBitsHistogram;
               if (maxbits % 8) maxbits = (maxbits & 0xfff0) + 8;
               
               if ((this.hist_name === "bits") && (this.hist_args.length == 1) && this.hist_args[0]) 
                  maxbits = this.hist_args[0];
               
               return this.GetBitsBins(maxbits);
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
      if ((axisid === 0) && (this.hist_name === "bits") && (this.hist_args.length <= 1)) {
         this.Fill1DHistogram = this.FillBitsHistogram;
         return this.GetBitsBins(this.hist_args[0] || 32);
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
         
         this.x = this.GetMinMaxBins(0, (this.ndim > 1) ? 50 : 200);

         this.y = this.GetMinMaxBins(1, 50);

         this.z = this.GetMinMaxBins(2, 50);

         switch (this.ndim) {
            case 1: this.hist = JSROOT.CreateHistogram("TH1"+this.htype, this.x.nbins); break; 
            case 2: this.hist = JSROOT.CreateHistogram("TH2"+this.htype, this.x.nbins, this.y.nbins); break;
            case 3: this.hist = JSROOT.CreateHistogram("TH3"+this.htype, this.x.nbins, this.y.nbins, this.z.nbins); break;
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
      if (!weight || !xvalue || !xvalue.fNbits || !xvalue.fAllBits) return;
      
      var sz = Math.min(xvalue.fNbits+1, xvalue.fNbytes*8);
      
      for (var bit=0,mask=1,b=0;bit<sz;++bit) {
         if (xvalue.fAllBits[b] && mask) {
            if (bit <= this.x.nbins)
               this.hist.fArray[bit+1] += weight;
            else
               this.hist.fArray[this.x.nbins+1] += weight;
         }
         
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
      
      if (!this.x.lbls) {
         this.hist.fTsumw += weight;
         this.hist.fTsumwx += weight*xvalue;
         this.hist.fTsumwx2 += weight*xvalue*xvalue;
      }
   }

   JSROOT.TDrawSelector.prototype.Fill2DHistogram = function(xvalue, yvalue, weight) {
      var xbin = this.x.GetBin(xvalue),
          ybin = this.y.GetBin(yvalue);
      
      this.hist.fArray[xbin+(this.x.nbins+2)*ybin] += weight;
      if (!this.x.lbls && !this.y.lbls) {
         this.hist.fTsumw += weight;
         this.hist.fTsumwx += weight*xvalue;
         this.hist.fTsumwy += weight*yvalue;
         this.hist.fTsumwx2 += weight*xvalue*xvalue;
         this.hist.fTsumwxy += weight*xvalue*yvalue;
         this.hist.fTsumwy2 += weight*yvalue*yvalue;
      }
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
      
      this.globals.entry = entry; // can be used in any expression
      
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
            JSROOT.CallBack(this.histo_callback, this.hist, this.histo_drawopt, true);
         }
      }
   }
   
   JSROOT.TDrawSelector.prototype.Terminate = function(res) {
      if (res && !this.hist) this.CreateHistogram();
      
      this.ShowProgress();
      
      return JSROOT.CallBack(this.histo_callback, this.hist, this.dump_values ? "inspect" : this.histo_drawopt);
   }
   
   // ======================================================================

   JSROOT.IO.GetBranchObjectClass = function(branch, tree, with_clones, with_leafs) {
      if (!branch || (branch._typename!=="TBranchElement")) return "";

      if ((branch.fType === JSROOT.BranchType.kLeafNode) && (branch.fID===-2) && (branch.fStreamerType===-1)) {
         // object where all sub-branches will be collected
         return branch.fClassName;
      }
      
      if (with_clones && branch.fClonesName && ((branch.fType === JSROOT.BranchType.kClonesNode) || (branch.fType === JSROOT.BranchType.kSTLNode)))
         return branch.fClonesName;

      var s_i = tree.$file.FindStreamerInfo(branch.fClassName, branch.fClassVersion, branch.fCheckSum),
          s_elem = s_i ? s_i.fElements.arr[branch.fID] : null;
      
      if (branch.fType === JSROOT.BranchType.kObjectNode) {
         if (s_elem && ((s_elem.fType === JSROOT.IO.kObject) || (s_elem.fType === JSROOT.IO.kAny)))
            return s_elem.fTypeName;
         return "TObject";
      }
      
      if ((branch.fType === JSROOT.BranchType.kLeafNode) && s_elem && with_leafs) {
         if ((s_elem.fType === JSROOT.IO.kObject) || (s_elem.fType === JSROOT.IO.kAny)) return s_elem.fTypeName; 
         if (s_elem.fType === JSROOT.IO.kObjectp) return s_elem.fTypeName.substr(0, s_elem.fTypeName.length-1);  
      }
         

      return "";
   }
   
   JSROOT.IO.MakeMethodsList = function(typename) {
      // create fast list to assign all methods to the object
      
      var methods = JSROOT.getMethods(typename);
      
      var res = {
         names : [],
         values : [],
         Create : function() {
            var obj = {};
            for (var n=0;n<this.names.length;++n)
               obj[this.names[n]] = this.values[n];
            return obj;
         }
      }
      
      res.names.push("_typename"); res.values.push(typename);
      for (var key in methods) {
         res.names.push(key);
         res.values.push(methods[key]);
      }
      return res;   
   }
   
   JSROOT.IO.DetectBranchMemberClass = function(brlst, prefix, start) {
      // try to define classname for the branch member, scanning list of branches 
      var clname = "";
      for (var kk=(start || 0); kk<brlst.arr.length; ++kk)
         if ((brlst.arr[kk].fName.indexOf(prefix)===0) && brlst.arr[kk].fClassName) clname = brlst.arr[kk].fClassName;
      return clname;
   }
   
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
      
      var namecnt = 0;
      
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

      function FindInHandle(branch) {
         for (var k=0;k<handle.arr.length;++k)
            if (handle.arr[k].branch === branch) return handle.arr[k];
         return null;
      }

      function AddBranchForReading(branch, target_object, target_name, read_mode) {
         // central method to add branch for reading
         // read_mode == true - read only this branch
         // read_mode == '$child$' is just member of object from for STL or clonesarray
         // read_mode == '<any class name>' is sub-object from STL or clonesarray, happens when such new object need to be created
         // read_mode == '.member_name' select only reading of member_name instead of complete object

         if (typeof branch === 'string')
            branch = handle.tree.FindBranch(branch);
         
         if (!branch) { console.error('Did not found branch'); return null; }
         
         var item = FindInHandle(branch);
         
         if (item) {
            console.error('Branch already configured for reading', branch.fName);
            if (item.tgt !== target_object) console.error('Target object differs');
            return elem;
         }
         
         if (!branch.fEntries) {
            console.log('Branch ', branch.fName, ' does not have entries');
            return null;
         } 
         
         item = {
               branch: branch,
               tgt: target_object, // used target object - can be differ for object members
               name: target_name,
               index: -1, // index in the list of read branches
               member: null, // member to read branch
               type: 0, // keep type identifier
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
               baskets: [], // array for read baskets,
               staged_prev: 0, // entry limit of previous I/O request 
               staged_now: 0, // entry limit of current I/O request
               progress_showtm: 0 // last time when progress was showed
         };

         // check all counters if we 
         var nb_branches = branch.fBranches ? branch.fBranches.arr.length : 0,
             nb_leaves = branch.fLeaves ? branch.fLeaves.arr.length : 0,
             leaf = (nb_leaves>0) ? branch.fLeaves.arr[0] : null,
             elem = null, // TStreamerElement used to create reader 
             member = null, // member for actual reading of the branch
             is_brelem = (branch._typename==="TBranchElement"),
             child_scan = 0, // scan child branches after main branch is appended
             item_cnt = null, item_cnt2 = null;
         
         
         if (branch.fBranchCount) {
            
            item_cnt = FindInHandle(branch.fBranchCount);
            
            if (!item_cnt) {
               item_cnt = AddBranchForReading(branch.fBranchCount, target_object, "$counter" + namecnt++, true); 
               console.log('Add counter brnach', branch.fBranchCount.fName, 'as', item_cnt ? item_cnt.name : "---");
            }
            
            if (!item_cnt) { console.error('Cannot add counter branch', branch.fBranchCount.fName); return null; }

            
            var BranchCount2 = branch.fBranchCount2;
            
            if (!BranchCount2 && (branch.fBranchCount.fStreamerType===JSROOT.IO.kSTL) && 
                ((branch.fStreamerType === JSROOT.IO.kStreamLoop) || (branch.fStreamerType === JSROOT.IO.kOffsetL+JSROOT.IO.kStreamLoop))) {
                 // special case when count member from kStreamLoop not assigned as fBranchCount2  
                 var s_i = handle.file.FindStreamerInfo(branch.fClassName,  branch.fClassVersion, branch.fCheckSum),
                     elem = s_i ? s_i.fElements.arr[branch.fID] : null,
                     arr = branch.fBranchCount.fBranches.arr  ;

                 if (elem && elem.fCountName && arr) 
                    for(var k=0;k<arr.length;++k) 
                       if (arr[k].fName === branch.fBranchCount.fName + "." + elem.fCountName) {
                          BranchCount2 = arr[k];
                          break;
                       }

                 if (!BranchCount2) console.error('Did not found branch for second counter of kStreamLoop element');
              }
            
            if (BranchCount2) {
               item_cnt2 = FindInHandle(BranchCount2);
               
               if (!item_cnt2) item_cnt2 = AddBranchForReading(BranchCount2, target_object, "$counter" + namecnt++, true); 
               
               if (!item_cnt2) { console.error('Cannot add counter branch2', BranchCount2.fName); return null; }
            }
         } else
         if (nb_leaves===1 && leaf && leaf.fLeafCount) {
            var br_cnt = handle.tree.FindBranch(leaf.fLeafCount.fName);
            
            if (br_cnt) {
               console.log('Find counter branch', br_cnt.fName);

               item_cnt = FindInHandle(br_cnt);
               
               if (!item_cnt) item_cnt = AddBranchForReading(br_cnt, target_object, "$counter" + namecnt++, true); 
               
               if (!item_cnt) { console.error('Cannot add counter branch', br_cnt.fName); return null; }
            }
         }
         
          function ScanBranches(lst, master_target, chld_kind) {
             if (!lst || !lst.arr.length) return true;

             var match_prefix = branch.fName;
             if ((typeof read_mode=== "string") && (read_mode[0]==".")) match_prefix += read_mode;
             match_prefix+=".";
             
             for (var k=0;k<lst.arr.length;++k) {
                var br = lst.arr[k];
                if ((chld_kind>0) && (br.fType!==chld_kind)) {
                   console.log('Child type differ from expected', br.fType, chld_kind);
                   continue;
                }
                
                if (br.fType === JSROOT.BranchType.kBaseClassNode) {
                   if (!ScanBranches(br.fBranches, master_target, chld_kind)) return false;
                   continue;
                }
                
                if (br.fName.indexOf(match_prefix)!==0) {
                   // console.warn('Not expected branch name ', br.fName, 'for prefix', match_prefix);
                   continue;
                }
                
                var subname = br.fName.substr(match_prefix.length), chld_direct = 1;
                
                var p = subname.indexOf('['); 
                if (p>0) subname = subname.substr(0,p);

                if (chld_kind > 0) {
                   chld_direct = "$child$";
                   var pp = subname.indexOf(".");
                   if (pp>0) chld_direct = JSROOT.IO.DetectBranchMemberClass(lst, branch.fName + "." + subname.substr(0,pp+1), k) || "TObject";
                }

                console.log('Add branch', br.fName, 'target', subname, chld_direct);

                if (!AddBranchForReading(br, master_target, subname, chld_direct)) return false;
             }
             return true;
          }
          
          var object_class = JSROOT.IO.GetBranchObjectClass(branch, handle.tree); 
          
          if (object_class) {
             
             if (read_mode === true) {
                console.log('Object branch ' + object_class + ' can not have data to be readed directly');
                return null;
             }
             
             console.log('object class', object_class );
             
             handle.process_arrays = false;
             
             // object where all sub-branches will be collected
             var tgt = target_object[target_name] = { _typename: object_class };
             
             JSROOT.addMethods(tgt, object_class);
             
             if (!ScanBranches(branch.fBranches, tgt,  0)) return null;
             
             return item; // this kind of branch does not have baskets and not need to be read
         }
          
         if (is_brelem && ((branch.fType === JSROOT.BranchType.kClonesNode) || (branch.fType === JSROOT.BranchType.kSTLNode))) {

            elem = JSROOT.IO.CreateStreamerElement(target_name, "int");

            if (!read_mode || ((typeof read_mode==="string") && (read_mode[0]==="."))) {
               handle.process_arrays = false;
               
               member = {
                  name: target_name,
                  conttype: branch.fClonesName || "TObject",
                  func: function(buf,obj) {
                     var size = buf.ntoi4(), n = 0;
                     if (!obj[this.name]) {
                        obj[this.name] = new Array(size); 
                     } else {
                        n = obj[this.name].length;
                        obj[this.name].length = size; // reallocate array
                     }
                     
                     while (n<size) obj[this.name][n++] = this.methods.Create(); // create new objects
                  }
               }
               
               if ((typeof read_mode==="string") && (read_mode[0]===".")) {
                  member.conttype = JSROOT.IO.DetectBranchMemberClass(branch.fBranches, branch.fName+read_mode);
                  if (!member.conttype) {
                     console.error('Cannot select object', read_mode, "in the branch", branch.fName);
                     return null;
                  }
               }
               
               member.methods = JSROOT.IO.MakeMethodsList(member.conttype);
               
               child_scan = (branch.fType === JSROOT.BranchType.kClonesNode) ? JSROOT.BranchType.kClonesMemberNode : JSROOT.BranchType.kSTLMemberNode; 
            }
          } else
       
          if (is_brelem && (nb_leaves === 1) && (leaf.fName === branch.fName) && (branch.fID==-1)) {

             elem = JSROOT.IO.CreateStreamerElement(target_name, branch.fClassName);
             
             console.log('TBranchElement with ID==-1 typename ', branch.fClassName, 'type', elem.fType);
             
             if (elem.fType === JSROOT.IO.kAny) {
                
                var streamer = handle.file.GetStreamer(branch.fClassName, { val: branch.fClassVersion, checksum: branch.fCheckSum });
                if (!streamer) { elem = null; console.warn('not found streamer!'); } else 
                   member = {
                         name: target_name,
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
             elem = CreateLeafElem(leaf, target_name);
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
                   name: target_name,
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
             return null;
          }

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

          if (item_cnt && (typeof read_mode === "string")) {
             
             member.name0 = item_cnt.name;

             if (target_name.indexOf(".") >=0) {
                // case when target is sub-object and need to be created before 
                if (read_mode === "$child$") {
                   console.error('target name contains point, but suppose to be direct child', target_name);
                   return null;
                }
                var snames = target_name.split(".");
                if (snames.length !== 2) {
                   console.log('Not yet supported more than 2 parts in the target name', target_name);
                   return null;
                }
                target_name = member.name = snames[1];
                member.name1 = snames[0];
                member.subtype1 = read_mode;
                member.methods1 = JSROOT.IO.MakeMethodsList(member.subtype1);
                member.get = function(arr,n) {
                   var obj1 = arr[n][this.name1];
                   if (!obj1) obj1 = arr[n][this.name1] = this.methods1.Create();
                   return obj1;
                }

             } else {
                member.get = function(arr,n) { return arr[n]; }
             }

             if (member.objs_branch_func) {
                // STL branch provides special function for the reading
                member.func = member.objs_branch_func;
             } else {
                member.func0 = member.func;

                member.func = function(buf,obj) {
                   var arr = obj[this.name0], n = 0; // objects array where reading is done
                   while(n<arr.length) 
                      this.func0(buf,this.get(arr,n++)); // read all individual object with standard functions
                }
             }

          } else
          if (item_cnt) {

             handle.process_arrays = false;
             
             if ((elem.fType === JSROOT.IO.kDouble32) || (elem.fType === JSROOT.IO.kFloat16)) {
                // special handling for compressed floats

                member.stl_size = item_cnt.name;
                member.func = function(buf, obj) {
                   obj[this.name] = this.readarr(buf, obj[this.stl_size]);
                }

             } else
             if (((elem.fType === JSROOT.IO.kOffsetP+JSROOT.IO.kDouble32) || (elem.fType === JSROOT.IO.kOffsetP+JSROOT.IO.kFloat16)) && branch.fBranchCount2) {
                // special handling for variable arrays of compressed floats in branch - not tested

                member.stl_size = item_cnt.name;
                member.arr_size = item_cnt2.name;
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
                      name: target_name,
                      stl_size: item_cnt.name,
                      type: elem.fType,
                      func: function(buf, obj) {
                         obj[this.name] = buf.ReadFastArray(obj[this.stl_size], this.type);
                      }
                };

                if (branch.fBranchCount2) {
                   member.type -= JSROOT.IO.kOffsetP;  
                   member.arr_size = item_cnt2.name;
                   member.func = function(buf, obj) {
                      var sz0 = obj[this.stl_size], sz1 = obj[this.arr_size], arr = new Array(sz0);
                      for (var n=0;n<sz0;++n) 
                         arr[n] = (buf.ntou1() === 1) ? buf.ReadFastArray(sz1[n], this.type) : [];
                         obj[this.name] = arr;
                   }
                }
                   
             } else
             if ((elem.fType > JSROOT.IO.kOffsetP) && (elem.fType < JSROOT.IO.kOffsetP + JSROOT.IO.kOffsetL) && member.cntname) {
                console.log('Use counter ', item_cnt.name, ' instead of ', member.cntname);
                  
                member.cntname = item_cnt.name; 
             } else
             if (elem.fType == JSROOT.IO.kStreamer) {
                // with streamers one need to extend existing array

                if (item_cnt2)
                   throw new Error('Second branch counter not supported yet with JSROOT.IO.kStreamer');

                console.log('Reading kStreamer in STL branch');

                // function provided by normal I/O
                member.func = member.branch_func;
                member.stl_size = item_cnt.name; 

                // for empty STL branch with map item read version anyway, for vector does not
                member.read_empty_stl_version = (member.readelem === JSROOT.IO.ReadMapElement); 
                   
             } else 
             if ((elem.fType === JSROOT.IO.kStreamLoop) || (elem.fType === JSROOT.IO.kOffsetL+JSROOT.IO.kStreamLoop)) {
                if (item_cnt2) {
                   // special solution for kStreamLoop
                   member.stl_size = item_cnt.name;
                   member.cntname = item_cnt2.name;
                   member.func = member.branch_func; // this is special function, provided by base I/O
                } else {
                   console.log('Use counter ', item_cnt.name, ' instead of ', member.cntname);
                   member.cntname = item_cnt.name;
                }
             } else  {
                   
                member.name = "$stl_member";

                var loop_size_name;

                if (item_cnt2) {
                   if (member.cntname) { 
                      loop_size_name = item_cnt2.name;
                      member.cntname = "$loop_size";
                   } else {
                      throw new Error('Second branch counter not used - very BAD');
                   }
                }

                var stlmember = {
                      name: target_name,
                      stl_size: item_cnt.name,
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
          }
          
          // set name used to store result
          member.name = target_name;

         item.member = member; // member for reading
         if (elem) item.type = elem.fType; 
         item.index = handle.arr.length; // index in the global list of branches
         
         if (item_cnt) { 
            item.counters = [ item_cnt.index ];
            item_cnt.ascounter.push(item.index);
            
            if (item_cnt2) {
               item.counters.push(item_cnt2.index);
               item_cnt2.ascounter.push(item.index);
            }
         }
         
         handle.arr.push(item);
         
         // now one should add all other child branches
         if (child_scan)
            if (!ScanBranches(branch.fBranches, target_object, child_scan)) return null;
         
         return item;
      }

      // main loop to add all branches from selector for reading
      for (var nn = 0; nn < selector.branches.length; ++nn) {
         
         var item = AddBranchForReading(selector.branches[nn], selector.tgtobj, selector.names[nn], selector.directs[nn]); 
         
         if (!item) {
            selector.Terminate(false);
            return false;
         }
         
         selector.is_integer[nn] = JSROOT.IO.IsInteger(item.type); 
      }

      // check if simple reading can be performed and there are direct data in branch
      
      for (var k=0;k<handle.arr.length;++k) {
         
         var item = handle.arr[k];
         
         if (item.numbaskets === 0) {
            // without normal baskets, check if temporary data is available
            
            if (item.branch.fBaskets && (item.branch.fBaskets.arr.length>0)) {
               
               for (var k=0;k<item.branch.fBaskets.arr.length;++k) {
                  var bskt = item.branch.fBaskets.arr[k];
                  if (!bskt || !bskt.fBufferRef) continue;
               
                  item.direct_data = true;
                  item.raw = bskt.fBufferRef;
                  item.raw.locate(0); // set to initial position
                  item.first_readentry = item.branch.fFirstEntry || 0; 
                  item.current_entry = item.branch.fFirstEntry || 0;
                  item.nev = item.numentries; // number of entries in raw buffer
                  break;
               }
            }
            
            if (!item.direct_data || !item.numentries) {
               // if no any data found
               console.log('No any data found for branch', item.branch.fName);
               selector.Terminate(false);
               return false;
            }
         }
         
         if (k===0) continue;
         
         var item0 = handle.arr[0];

         if ((item.direct_data !== item0.direct_data) || 
             (item.numentries !== item0.numentries) ||
             (item.numbaskets !== item0.numbaskets)) handle.simple_read = false;
            else
         for (var n=0;n<item.numbaskets;++n) 
            if (item.branch.fBasketEntry[n]!==item0.branch.fBasketEntry[n]) handle.simple_read = false;
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
      
      handle.staged_now = handle.process_min;
      
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
         
         function ReadProgress(value) {
            
            if ((handle.staged_prev === handle.staged_now) || 
               (handle.process_max <= handle.process_min)) return;
            
            var tm = new Date().getTime();
            
            if (tm - handle.progress_showtm < 500) return; // no need to show very often

            handle.progress_showtm = tm;
            
            var portion = (handle.staged_prev + value * (handle.staged_now - handle.staged_prev)) /
                          (handle.process_max - handle.process_min);
            
            handle.selector.ShowProgress(portion);
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
               handle.file.ReadBuffer(places, ProcessBlobs, filename, ReadProgress);
            else
               JSROOT.CallBack(baskets_call_back, bitems);
         }

         // extract places where to read
         if (ExtractPlaces())
            handle.file.ReadBuffer(places, ProcessBlobs, filename, ReadProgress);
         else
            JSROOT.CallBack(baskets_call_back, null); 
      }
      
      function ReadNextBaskets() {
         
         var totalsz = 0, bitems = [], isany = true, is_direct = false, min_staged = handle.process_max;
         
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
                  
                  min_staged = Math.min(min_staged, elem.staged_entry);
                  
                  break;
               }
            }
         }
         
         if ((totalsz === 0) && !is_direct) 
            return handle.selector.Terminate(true);
         
         handle.staged_prev = handle.staged_now; 
         handle.staged_now = min_staged; 
         
         var portion = 0;
         if (handle.process_max > handle.process_min)
            portion = (handle.staged_prev - handle.process_min)/ (handle.process_max - handle.process_min);
         
         // console.log('prev', handle.staged_prev, 'now', handle.staged_now, 'maximum', handle.process_max);
         
         handle.selector.ShowProgress(portion);
         
         handle.progress_showtm = new Date().getTime();
         
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
                     elem.member.func(elem.raw, elem.tgt);

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
      if (!res && complex) {
         res = { branch: br, rest: name.substr(pos) };
         var pp = res.rest.indexOf(".", 1); // ignore point in the beginning
         var prefix = (pp < 0) ? res.rest : res.rest.substr(0,pp);
         if (JSROOT.IO.DetectBranchMemberClass(res.branch.fBranches, res.branch.fName + prefix)) {
            // this looks like sub-object in the branch
            res.read_mode = prefix;
            res.rest = (pp<0) ? "" : res.rest.substr(pp); 
         }
      }

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
         
         selector.AddBranch(args.branch, "br0", args.direct_branch);
         
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
         args.nchilds = [];
         args.nbr = 0;

         function CollectBranches(obj, prntname) {
            if (!obj || !obj.fBranches) return 0;

            var cnt = 0;

            for (var n=0;n<obj.fBranches.arr.length;++n) {
               var br = obj.fBranches.arr[n],
               name = (prntname ? prntname + "/" : "") + br.fName;
               args.branches.push(br);
               args.names.push(name);
               args.nchilds.push(0);
               var pos = args.nchilds.length-1;
               cnt += br.fLeaves ? br.fLeaves.arr.length : 0;
               var nchld = CollectBranches(br, name);
               
               cnt += nchld;
               args.nchilds[pos] = nchld; 
               
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
         
         var object_class = JSROOT.IO.GetBranchObjectClass(br, tree),
             num = br.fEntries, 
             first = br.fFirstEntry || 0,
             last = br.fEntryNumber || (first+num);
         
         if ((object_class && (args.nchilds[args.nbr]>100)) || (!br.fLeaves || (br.fLeaves.arr.length === 0)) || (num<=0)) {
            // ignore empty branches or objects with too-many subbrancn
            if (object_class) console.log('Ignore branch', br.fName, 'class', object_class, 'with', args.nchilds[args.nbr],'subbrnaches');
            selector.Terminate("ignore");
         } else {
            
            var drawargs = { numentries: 10 };
            if (num<drawargs.numentries) { 
               drawargs.numentries = num; 
            } else {
               // select randomly first entry to test I/O 
               drawargs.firstentry = first + Math.round((last-first-drawargs.numentries)*Math.random()); 
            } 
            
            tree.Process(selector, drawargs);
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
            
            if (!bnode._childs) bnode._childs = [];
            
            if (bobj.fLeaves && (bobj.fLeaves.arr.length === 1) &&
                ((bobj.fType === JSROOT.BranchType.kClonesNode) || (bobj.fType === JSROOT.BranchType.kSTLNode))) {
                 bobj.fLeaves.arr[0].$branch = bobj;
                 bnode._childs.push({
                    _name: "@size",
                    _title: "container size",
                    _kind: "ROOT.TLeafElement",
                    _icon: "img_leaf",
                    _obj: bobj.fLeaves.arr[0],
                    _more : false
                 });
              }

            for (var i=0; i < bobj.fBranches.arr.length; ++i) 
               JSROOT.Painter.CreateBranchItem(bnode, bobj.fBranches.arr[i], bobj.$tree);

            var object_class = JSROOT.IO.GetBranchObjectClass(bobj, bobj.$tree, true), 
                methods = object_class ? JSROOT.getMethods(object_class) : null;
            
            if (methods && (bobj.fBranches.arr.length>0))
               for (var key in methods) {
                  if (typeof methods[key] !== 'function') continue;
                  var s = methods[key].toString();
                  if ((s.indexOf("return")>0) && (s.indexOf("function ()")==0))
                     bnode._childs.push({
                        _name: key+"()",
                        _title: "function " + key + " of class " + object_class,
                        _kind: "ROOT.TBranchFunc", // fictional class, only for drawing
                        _obj: { _typename: "TBranchFunc", branch: bobj, func: key },
                        _more : false
                     });

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

      if (obj._typename == "TBranchFunc") {
         // fictional object, created only in browser
         args = { expr: "." + obj.func + "()", branch: obj.branch };
         if (opt && opt.indexOf("dump")==0) args.expr += ">>" + opt; else
         if (opt) args.expr += opt;
         tree = obj.branch.$tree;
      } else
      if (obj.$branch) {
         // this is drawing of the single leaf from the branch 
         args = { expr: "." + obj.fName + (opt || ""), branch: obj.$branch };
         if ((args.branch.fType === JSROOT.BranchType.kClonesNode) || (args.branch.fType === JSROOT.BranchType.kSTLNode)) {
            // special case of size
            args.expr = opt;
            args.direct_branch = true;
         }
         
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

      var callback = this.DrawingReady.bind(this);
      
      tree.Draw(args, function(histo, hopt, intermediate) {
         if (args.monitoring)
            JSROOT.redraw(divid, histo, hopt, intermediate ? null : callback);
         else
            JSROOT.draw(divid, histo, hopt, callback);
      });

      return this;
   }
 

   return JSROOT;

}));
