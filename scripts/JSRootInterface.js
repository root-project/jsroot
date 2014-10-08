// JSRootInterface.js
//
// user interface for JavaScript ROOT Web Page.
//


function ResetUI() {
   if (JSROOT.H('root') != null) {
      JSROOT.H('root').clear();
      JSROOT.DelHList('root');
   }
   $('#browser').get(0).innerHTML = '';
}

function guiLayout() {
   var res = 'collapsible';
   var selects = document.getElementById("layout");
   if (selects)
      res = selects.options[selects.selectedIndex].text;
   return res;
}

function setGuiLayout(value) {
   var selects = document.getElementById("layout");
   if (!selects) return;
   
   for (var i in selects.options) {
      var s = selects.options[i].text;
      if (typeof s == 'undefined') continue;
      if ((s == value) || (s.replace(/ /g,"") == value)) {
         selects.selectedIndex = i;
         break;
      }
   }
}


function ReadFile(filename, checkitem) {
   var navigator_version = navigator.appVersion;
   if (typeof ActiveXObject == "function") { // Windows
      // detect obsolete browsers
      if ((navigator_version.indexOf("MSIE 8") != -1) ||
          (navigator_version.indexOf("MSIE 7") != -1))  {
         alert("You need at least MS Internet Explorer version 9.0. Note you can also use any other web browser (excepted Opera)");
         return;
      }
   }
   else {
      // Safari 5.1.7 on MacOS X doesn't work properly
      if ((navigator_version.indexOf("Windows NT") == -1) &&
          (navigator_version.indexOf("Safari") != -1) &&
          (navigator_version.indexOf("Version/5.1.7") != -1)) {
         alert("There are know issues with Safari 5.1.7 on MacOS X. It may become unresponsive or even hangs. You can use any other web browser (excepted Opera)");
         return;
      }
   }

   if (filename==null) {
      filename = $("#urlToLoad").val();
      filename.trim();
   } else {
      $("#urlToLoad").val(filename);
   }
   if (filename.length == 0) return;
   
   var layout = null;
   var itemsarr = [];
   var optionsarr = [];
   if (checkitem) {
      var itemname = JSROOT.GetUrlOption("item");
      if (itemname) itemsarr.push(itemname);
      var items = JSROOT.GetUrlOption("items");
      if (items!=null) {
         items = JSON.parse(items.replace(/%27/g, "'").replace(/%22/g, '"').replace(/%20/g, ' '));
         for (var i in items) itemsarr.push(items[i]);
      }
      
      layout = JSROOT.GetUrlOption("layout");
      if (layout=="") layout = null;
      
      var opt = JSROOT.GetUrlOption("opt");
      if (opt) optionsarr.push(opt);
      var opts = JSROOT.GetUrlOption("opts");
      if (opts!=null) {
         opts = JSON.parse(opts.replace(/%27/g, "'").replace(/%22/g, '"').replace(/%20/g, ' '));
         for (var i in opts) optionsarr.push(opts[i]);
      }
   }
   
   
   if (layout==null) 
      layout = guiLayout();
   else
      setGuiLayout(layout);
   
   var painter = new JSROOT.HierarchyPainter('root', 'browser');
   
   painter.SetDisplay(layout, 'right-div');
   
   painter.OpenRootFile(filename, function() {
      painter.displayAll(itemsarr, optionsarr);
   });
}

function UpdateOnline() {
   var chkbox = document.getElementById("monitoring");
   
   var h = JSROOT.H('root');
   
   h['_monitoring_on'] = chkbox && chkbox.checked;
   
   if (h['_monitoring_on'] && ('disp' in h))
     h['disp'].ForEach(function(panel, itemname, painter) {
       if (painter==null) return;
       h.get(itemname, function(item, obj) {
         if (painter.UpdateObject(obj)) {
            document.body.style.cursor = 'wait';
            painter.RedrawFrame();
            document.body.style.cursor = 'auto';
         }
      });
     } , true); // update only visible objects
}

function ProcessResize(direct)
{  
   if (direct) document.body.style.cursor = 'wait';
   
   JSROOT.H('root').CheckResize();
   
   if (direct) document.body.style.cursor = 'auto';
}

function AddInteractions() {
   var drag_sum = 0;
   
   var drag_move = d3.behavior.drag()
      .origin(Object)
      .on("dragstart", function() {
          d3.event.sourceEvent.preventDefault();
          // console.log("start drag");
          drag_sum = 0;
       })
      .on("drag", function() {
         d3.event.sourceEvent.preventDefault();
         drag_sum += d3.event.dx;
         // console.log("dx = " + d3.event.dx);
         d3.event.sourceEvent.stopPropagation();
      })
      .on("dragend", function() {
         d3.event.sourceEvent.preventDefault();
         // console.log("stop drag " + drag_sum);
         
         var width = d3.select("#left-div").style('width');
         width = (parseInt(width.substr(0, width.length - 2)) + Number(drag_sum)).toString() + "px";
         d3.select("#left-div").style('width', width);
         
         var left = d3.select("#separator-div").style('left');
         left = parseInt(left.substr(0, left.length - 2)) + Number(drag_sum);
         d3.select("#separator-div").style('left',left.toString() + "px");
         d3.select("#right-div").style('left',(left+6).toString() + "px");
         
         ProcessResize(true);
      });
   
   d3.select("#separator-div").call(drag_move);
     
   JSROOT.RegisterForResize(ProcessResize);

   // specify display kind every time selection done
   // will be actually used only for first drawing or after reset
   document.getElementById("layout").onchange = function() {
      if (JSROOT.H('root'))
         JSROOT.H('root').SetDisplay(guiLayout(), "right-div");
   }
}


function BuildOnlineGUI() {
   var myDiv = $('#onlineGUI');
   if (!myDiv) {
      alert("You have to define a div with id='onlineGUI'!");
      return;
   }
   
   var guiCode = "<div id='overlay'><font face='Verdana' size='1px'>&nbspJSROOT version " + JSROOT.version + "&nbsp</font></div>"

   guiCode += '<div id="left-div" class="column"><br/>'
            + '  <h1><font face="Verdana" size="4">ROOT online server</font></h1>'
            + '  Hierarchy in <a href="h.json">json</a> and <a href="h.xml">xml</a> format<br/><br/>'
            + ' <input type="checkbox" name="monitoring" id="monitoring"/> Monitoring '
            + ' <select style="padding:2px; margin-left:10px; margin-top:5px;" id="layout">' 
            + '   <option>collapsible</option><option>grid 2x2</option><option>grid 3x3</option><option>grid 4x4</option><option>tabs</option>'
            + ' </select>' 
            + ' <div id="browser"></div>'
            + '</div>'
            + '<div id="separator-div" class="column"></div>'
            + '<div id="right-div" class="column"></div>';
   
   $('#onlineGUI').empty();
   $('#onlineGUI').append(guiCode);

   var layout = JSROOT.GetUrlOption("layout");
   if ((layout=="") || (layout==null)) 
      layout = guiLayout();
   else
      setGuiLayout(layout);
   
   var monitor = JSROOT.GetUrlOption("monitoring");
   if (monitor == "") monitor = 3000; else
   if (monitor != null) {
      monitor = parseInt(monitor);
      if ((monitor == NaN) || (monitor<=0)) monitor = null;
   }
   
   if (monitor!=null)
      document.getElementById("monitoring").checked = true;
   else
      monitor = 3000;
      
   
   var itemsarr = [];
   var itemname = JSROOT.GetUrlOption("item");
   if (itemname) itemsarr.push(itemname);
   var items = JSROOT.GetUrlOption("items");
   if (items!=null) {
      items = JSON.parse(items.replace(/%27/g, "'").replace(/%22/g, '"').replace(/%20/g, ' '));
      for (var i in items) itemsarr.push(items[i]);
   }

   var h = new JSROOT.HierarchyPainter("root", "browser");

   h.SetDisplay(layout, 'right-div');
   
   h['_monitoring_interval'] = monitor;
   
   h.OpenOnline("", function() {
      h.displayAll(itemsarr);
   });
   
   setInterval(UpdateOnline, monitor);
   
   AddInteractions();
}

function BuildSimpleGUI() {
   
   if (document.getElementById('onlineGUI')) return BuildOnlineGUI();  
   
   var myDiv = $('#simpleGUI');
   if (!myDiv) return;
   
   var files = myDiv.attr("files");
   if (!files) files = "file/hsimple.root";
   var arrFiles = files.split(';');

   var guiCode = "<div id='overlay'><font face='Verdana' size='1px'>&nbspJSROOT version " + JSROOT.version + "&nbsp</font></div>"

   guiCode += "<div id='left-div' class='column'>\n"
      +"<h1><font face='Verdana' size='4'>Read a ROOT file with Javascript</font></h1>\n"
      +"<p><b>Select a ROOT file to read, or enter a url (*): </b><br/>\n"
      +'<small><sub>*: Other URLs might not work because of cross site scripting protection, see e.g. <a href="https://developer.mozilla.org/en/http_access_control">developer.mozilla.org/http_access_control</a> on how to avoid it.</sub></small></p>'
      +'<form name="ex">'
      +'<div style="margin-left:10px;">'
      +'<input type="text" name="state" value="" size="30" id="urlToLoad"/><br/>'
      +'<select name="s" size="1" '
      +'onchange="document.ex.state.value = document.ex.s.options[document.ex.s.selectedIndex].value;document.ex.s.selectedIndex=0;document.ex.s.value=\'\'">'
      +'<option value = " " selected = "selected">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</option>';
   for (var i=0; i<arrFiles.length; i++) {
      guiCode += '<option value = "' + arrFiles[i] + '">' + arrFiles[i] + '</option>';
   }
   guiCode += '</select>'
      +'</div>'
      +'<input style="padding:2px; margin-left:10px; margin-top:5px;"'
      +'       onclick="ReadFile()" type="button" title="Read the Selected File" value="Load"/>'
      +'<input style="padding:2px; margin-left:10px;"'
      +'       onclick="ResetUI()" type="button" title="Clear All" value="Reset"/>'
      +'<select style="padding:2px; margin-left:10px; margin-top:5px;" id="layout">' 
      +'  <option>collapsible</option><option>grid 2x2</option><option>grid 3x3</option><option>grid 4x4</option><option>tabs</option>'
      +'</select>' 
      +'</form>'
      +'<br/>'
      +'<div id="browser"></div>'
      +'</div>'
      +'<div id="separator-div" class="column"></div>'
      +'<div id="right-div" class="column"></div>';
   
   $('#simpleGUI').empty();
   $('#simpleGUI').append(guiCode);
   // $("#layout").selectmenu();
   
   AddInteractions();
   
   var filename = JSROOT.GetUrlOption("file");
   if ((typeof filename == 'string') && (filename.length>0)) 
      ReadFile(filename, true);
}
