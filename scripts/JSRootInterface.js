// JSRootInterface.js
//
// default user interface for JavaScript ROOT Web Page.
//

var hpainter = null;

function ResetUI() {
   if (hpainter) hpainter.clear(true);
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

function CreateHPainter(nobrowser, rightdivid) {

   if (hpainter!=null) return;

   var layout = JSROOT.GetUrlOption("layout");
   if (layout=="") layout = null;

   hpainter = new JSROOT.HierarchyPainter('root', nobrowser ? null : 'browser');

   JSROOT.RegisterForResize(hpainter);

   if (nobrowser) {
      if (layout==null) layout= "simple";
   } else {
      if (layout==null)
         layout = guiLayout();
      else
         setGuiLayout(layout);
   
      JSROOT.ConfigureVSeparator(hpainter);

      // specify display kind every time selection done
      // will be actually used only for first drawing or after reset
      $("#layout").change(function() {
         if (hpainter) hpainter.SetDisplay(guiLayout(), rightdivid);
      });

   }
   
   hpainter.SetDisplay(layout, rightdivid);
}


function BuildNoBrowserGUI(online) {
   var running_request = {};

   var filesarr = [];
   if (!online) {
      filesarr = JSROOT.GetUrlOptionAsArray("file;files");
      var filesdir = JSROOT.GetUrlOption("path");
      if (filesdir!=null) 
         for (var i in filesarr) filesarr[i] = filesdir + filesarr[i];
   }

   var itemsarr = JSROOT.GetUrlOptionAsArray("item;items");
   
   var optionsarr = JSROOT.GetUrlOptionAsArray("opt;opts");

   var layout = JSROOT.GetUrlOption("layout");
   if (layout=="") layout = null;

   var monitor = JSROOT.GetUrlOption("monitoring");
   if (monitor == "") monitor = 3000; else
   if (monitor != null) monitor = parseInt(monitor);

   var divid = online ? "onlineGUI" : "simpleGUI";

   $('#'+divid).empty();

   $('html').css('height','100%');
   $('body').css('min-height','100%').css('margin','0px').css("overflow", "hidden");

   $('#'+divid).css("position", "absolute")
               .css("left", "1px")
               .css("top", "1px")
               .css("bottom", "1px")
               .css("right", "1px");

   var objpainter = null;
   var mdi = null;

   function file_error(str) {
      if ((objpainter == null) && (mdi==null))
         $('#'+divid).append("<h4>" + str + "</h4>");
   }

   if ((filesarr.length == null) && !online) {
      return file_error('filename not specified');
   }

   if (itemsarr.length == 0) {
      return file_error('itemname not specified');
   }

   var title = online ? "Online"  : ("File: " + filesarr.length>1 ? filesarr.toString : filesarr[0]);
   if (itemsarr.length == 1) title += " item: " + itemsarr[0];
                        else title += " items: " + itemsarr.toString();
   document.title = title;

   function draw_object(indx, obj) {
      document.body.style.cursor = 'wait';
      if (obj==null)  {
         file_error("object " + itemsarr[indx] + " not found");
      } else
      if (mdi) {
         var frame = mdi.FindFrame(itemsarr[indx], true);
         mdi.ActivateFrame(frame);
         JSROOT.redraw($(frame).attr('id'), obj, optionsarr[indx]);
      } else {
         objpainter = JSROOT.redraw(divid, obj, optionsarr[indx]);
      }
      document.body.style.cursor = 'auto';
      running_request[indx] = false;
   }

   function read_object(file, indx) {

      if (itemsarr[indx]=="StreamerInfo") {
         draw_object(indx, file.fStreamerInfos);
      } else {
         file.ReadObject(itemsarr[indx], function(obj) {
            draw_object(indx, obj);
         });
      }
   }

   function request_object(indx) {

      if (running_request[indx]) return;

      running_request[indx] = true;

      var url = itemsarr[indx] + "/root.json.gz?compact=3";

      var itemreq = JSROOT.NewHttpRequest(url, 'object', function(obj) {
         if ((obj != null) &&  (itemsarr[indx] === "StreamerInfo")
               && (obj['_typename'] === 'TList'))
            obj['_typename'] = 'TStreamerInfoList';

         draw_object(indx, obj);
      });

      itemreq.send(null);
   }

   function read_all_objects() {

      if (online) {
         for (var i in itemsarr)
            request_object(i);
         return;
      }

      for (var i in itemsarr)
         if (running_request[i]) {
            console.log("Request for item " + itemsarr[i] + " still running");
            return;
         }

      new JSROOT.TFile(filesarr[0], function(file) {
         if (file==null) return file_error("file " + filesarr[0] + " cannot be opened");

         for (var i in itemsarr) {
            running_request[i] = true;
            read_object(file, i);
         }
      });
   }

   if (itemsarr.length > 1) {
      if ((layout==null) || (layout=='collapsible') || (layout == "")) {
         var divx = 2; divy = 1;
         while (divx*divy < itemsarr.length) {
            if (divy<divx) divy++; else divx++;
         }
         layout = 'grid' + divx + 'x' + divy;
      }

      if (layout=='tabs')
         mdi = new JSROOT.TabsDisplay(divid);
      else
         mdi = new JSROOT.GridDisplay(divid, layout);

      // Than create empty frames for each item
      for (var i in itemsarr)
         mdi.CreateFrame(itemsarr[i]);
   }

   read_all_objects();

   if (monitor>0)
      setInterval(read_all_objects, monitor);

   JSROOT.RegisterForResize(function() { if (objpainter) objpainter.CheckResize(); if (mdi) mdi.CheckResize(); });
}




function ReadFile() {
   var navigator_version = navigator.appVersion;
   if (typeof ActiveXObject == "function") { // Windows
      // detect obsolete browsers
      if ((navigator_version.indexOf("MSIE 8") != -1) ||
          (navigator_version.indexOf("MSIE 7") != -1))  {
         alert("You need at least MS Internet Explorer version 9.0. Note you can also use any other web browser");
         return;
      }
   }
   else {
      // Safari 5.1.7 on MacOS X doesn't work properly
      if ((navigator_version.indexOf("Windows NT") == -1) &&
          (navigator_version.indexOf("Safari") != -1) &&
          (navigator_version.indexOf("Version/5.1.7") != -1)) {
         alert("There are know issues with Safari 5.1.7 on MacOS X. It may become unresponsive or even hangs. You can use any other web browser");
         return;
      }
   }

   var filename = $("#urlToLoad").val();
   filename.trim();
   if (filename.length == 0) return;
   
   if (hpainter==null) alert("Hierarchy painter not initialized");
                  else hpainter.OpenRootFile(filename);
}

function ProcessResize(direct)
{
   if (hpainter==null) return;

   if (direct) document.body.style.cursor = 'wait';

   hpainter.CheckResize();

   if (direct) document.body.style.cursor = 'auto';
}


function BuildOnlineGUI() {
   var myDiv = $('#onlineGUI');
   if (!myDiv) {
      alert("You have to define a div with id='onlineGUI'!");
      return;
   }

   JSROOT.Painter.readStyleFromURL();

   if (JSROOT.GetUrlOption("nobrowser")!=null)
      return BuildNoBrowserGUI(true);

   var guiCode = '<div id="left-div" class="column">'
            + '<h1><font face="Verdana" size="4">ROOT online server</font></h1>'
            + "<p><font face='Verdana' size='1px'><a href='http://root.cern.ch/js/jsroot.html'>JSROOT</a> version <span style='color:green'><b>" + JSROOT.version + "</b></span></font></p>"
            + '<p> Hierarchy in <a href="h.json">json</a> and <a href="h.xml">xml</a> format</p>'
            + ' <input type="checkbox" name="monitoring" id="monitoring"/> Monitoring '
            + ' <select style="padding:2px; margin-left:10px; margin-top:5px;" id="layout">'
            + '   <option>collapsible</option><option>simple</option><option>grid 2x2</option><option>grid 3x3</option><option>grid 4x4</option><option>tabs</option>'
            + ' </select>'
            + ' <div id="browser"></div>'
            + '</div>'
            + '<div id="separator-div" class="column"></div>'
            + '<div id="right-div" class="column"></div>';

   $('#onlineGUI').empty().append(guiCode);

   var monitor = JSROOT.GetUrlOption("monitoring");

   var itemsarr = JSROOT.GetUrlOptionAsArray("item;items");
   
   var optionsarr = JSROOT.GetUrlOptionAsArray("opt;opts");
   
   CreateHPainter(false, "right-div");

   hpainter.EnableMonitoring(monitor!=null);
   $("#monitoring")
      .prop('checked', monitor!=null)
      .click(function() {
         hpainter.EnableMonitoring(this.checked);
         if (this.checked) hpainter.updateAll();
      });

   var h0 = null;
   if (typeof GetCashedHierarchy == 'function') h0 = GetCashedHierarchy();
   if (typeof h0 != 'object') h0 = "";

   hpainter.OpenOnline(h0, function() {
       hpainter.displayAll(itemsarr, optionsarr);
   });

   setInterval(function() { if (hpainter.IsMonitoring()) hpainter.updateAll(); }, hpainter.MonitoringInterval());
}

function BuildSimpleGUI() {

   if (document.getElementById('onlineGUI')) return BuildOnlineGUI();

   var myDiv = $('#simpleGUI');
   if (!myDiv) return;

   JSROOT.Painter.readStyleFromURL();

   var nobrowser = JSROOT.GetUrlOption("nobrowser") != null;
   
   // if (nobrowser) return BuildNoBrowserGUI(false);

   var files = myDiv.attr("files");
   var path = myDiv.attr("path");

   if (files==null) files = "../files/hsimple.root";
   if (path==null) path = "";
   var arrFiles = files.split(';');

   var guiCode = "<div id='left-div' class='column'>"
      +"<h1><font face='Verdana' size='4'>Read a ROOT file</font></h1>"
      +"<p><font face='Verdana' size='1px'><a href='http://root.cern.ch/js/jsroot.html'>JSROOT</a> version <span style='color:green'><b>" + JSROOT.version + "</b></span></font></p>";

   if ((JSROOT.GetUrlOption("noselect")==null) || (filename==null)) {
     guiCode += '<form name="ex">'
      +'<input type="text" name="state" value="" style="width:95%; margin-top:5px;" id="urlToLoad"/>'
      +'<select name="s" style="width:65%; margin-top:5px;" '
      +'onchange="document.ex.state.value = document.ex.s.options[document.ex.s.selectedIndex].value;document.ex.s.selectedIndex=0;document.ex.s.value=\'\'">'
      +'<option value=" " selected="selected">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</option>';
      for (var i in arrFiles)
         guiCode += '<option value = "' + path + arrFiles[i] + '">' + arrFiles[i] + '</option>';
      guiCode += '</select><br/>'
        +'<p><small>Other file URLs might not work because of <a href="http://en.wikipedia.org/wiki/Same-origin_policy">same-origin security policy</a>, '
        +'see e.g. <a href="https://developer.mozilla.org/en/http_access_control">developer.mozilla.org</a> on how to avoid it.</small></p>'
        +'<input style="padding:2px; margin-top:5px;"'
        +'       onclick="ReadFile()" type="button" title="Read the Selected File" value="Load"/>'
        +'<input style="padding:2px; margin-left:10px;"'
        +'       onclick="ResetUI()" type="button" title="Clear All" value="Reset"/>'
        +'<select style="padding:2px; margin-left:10px; margin-top:5px;" title="layout kind" id="layout">'
        +'  <option>collapsible</option><option>simple</option><option>grid 2x2</option><option>grid 3x3</option><option>grid 4x4</option><option>tabs</option>'
        +'</select><br/>'
        +'</form>';
   }
   guiCode += '<div id="browser"></div>'
      +'</div>'
      +'<div id="separator-div"></div>'
      +'<div id="right-div" class="column"></div>';
   
   var drawDivId = 'right-div';
   
   if (nobrowser) {
      guiCode = "";
      $('html').css('height','100%');
      $('body').css('min-height','100%').css('margin','0px').css("overflow", "hidden");
      
      drawDivId = 'simpleGUI';

      myDiv.css("position", "absolute")
           .css("left", "1px")
           .css("top", "1px")
           .css("bottom", "1px")
           .css("right", "1px");
   }

   myDiv.empty().append(guiCode);

   var filesarr = JSROOT.GetUrlOptionAsArray("file;files");
   var filesdir = JSROOT.GetUrlOption("path");
   if (filesdir!=null) 
      for (var i in filesarr) filesarr[i] = filesdir + filesarr[i];
   
   if (filesarr.length==0) return;
   
   $("#urlToLoad").val(filesarr[0]);
   
   var itemsarr = JSROOT.GetUrlOptionAsArray("item;items");
   
   var optionsarr = JSROOT.GetUrlOptionAsArray("opt;opts");
      
   CreateHPainter(nobrowser, drawDivId);
   
   function OpenFiles() {
      if (filesarr.length==0) 
         hpainter.displayAll(itemsarr, optionsarr);
      else
         hpainter.OpenRootFile(filesarr.shift(), OpenFiles); 
   }
   
   OpenFiles();
}
