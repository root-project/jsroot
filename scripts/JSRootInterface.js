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
};

function ReadFile(filename) {
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
   }
   if (filename.length == 0) return;
   
   var painter = new JSROOT.HierarchyPainter('root', 'browser');
   
   painter.SetDisplay(guiLayout(), 'right-div');
   
   painter.OpenRootFile(filename);
}

function UpdateOnline() {
   var chkbox = document.getElementById("monitoring");
   if (!chkbox || !chkbox.checked) return;
   
   if (! ('disp' in JSROOT.H('root'))) return;
   
   JSROOT.H('root')['disp'].ForEach(function(panel, itemname, painter) {
      if (painter==null) return;
      JSROOT.H('root').get(itemname, function(item, obj) {
         if (painter.UpdateObject(obj)) {
            document.body.style.cursor = 'wait';
            painter.RedrawFrame();
            document.body.style.cursor = 'auto';
         }
      });
   } , true); // update only visible objects
}

var myInterval = null;
var myCounter = -1;

function ResizeTimer()
{
   if (myCounter<0) return;
   myCounter += 1;
   if (myCounter < 3) return;

   if (myInterval!=null) {
      clearInterval(myInterval);
      myInterval = null;
   }
   
   myCounter = -1;

   if (!('disp' in JSROOT.H('root'))) return;
   
   document.body.style.cursor = 'wait';
   JSROOT.H('root')['disp'].CheckResize();
   document.body.style.cursor = 'auto';
}

function ProcessResize(fast)
{  
   if (fast!=null) {
      myCounter = 1000;
      ResizeTimer();
   } else {
      if (myInterval==null)
         myInterval = setInterval(ResizeTimer, 500);
      myCounter = 0;
   }
}

function guiLayout() {
   var res = 'collapsible';
   var selects = document.getElementById("display-kind");
   if (selects) {
      res = selects.options[selects.selectedIndex].text;
      // $("#display-kind").disable();
   }
   return res;
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
     
   window.addEventListener('resize', ProcessResize);

   // specify display kind every time selection done
   // will be actually used only for first drawing or after reset
   document.getElementById("display-kind").onchange = function() {
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
   
   var guiCode = "<div id='overlay'><font face='Verdana' size='1px'>&nbspJSROOT version:" + JSROOT.version + "&nbsp</font></div>"

   guiCode += '<div id="left-div" class="column"><br/>'
            + '  <h1><font face="Verdana" size="4">ROOT online server</font></h1>'
            + '  Hierarchy in <a href="h.json">json</a> and <a href="h.xml">xml</a> format<br/><br/>'
            + ' <input type="checkbox" name="monitoring" id="monitoring"/> Monitoring '
            + ' <select style="padding:2px; margin-left:10px; margin-top:5px;" id="display-kind" name="display-kind">' 
            + '   <option>collapsible</option><option>grid 2x2</option><option>grid 3x3</option><option>grid 4x4</option><option>tabs</option>'
            + ' </select>' 
            + ' <div id="browser"></div>'
            + '</div>'
            + '<div id="separator-div" class="column"></div>'
            + '<div id="right-div" class="column"></div>';
   
   $('#onlineGUI').append(guiCode);

   var hpainter = new JSROOT.HierarchyPainter("root", "browser");

   hpainter.SetDisplay(guiLayout(), 'right-div');
   
   hpainter.OpenOnline("h.json?compact=3");
   
   setInterval(UpdateOnline, 3000);
   
   AddInteractions();
}

function BuildSimpleGUI() {
   
   if (document.getElementById('onlineGUI')) return BuildOnlineGUI();  
   
   var myDiv = $('#simpleGUI');
   if (!myDiv) return;
   
   var files = myDiv.attr("files");
   if (!files) files = "file/hsimple.root";
   var arrFiles = files.split(';');

   var guiCode = "<div id='overlay'><font face='Verdana' size='1px'>&nbspJSROOT version:" + JSROOT.version + "&nbsp</font></div>"

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
      +'<select style="padding:2px; margin-left:10px; margin-top:5px;" id="display-kind" name="display-kind">' 
      +'  <option>collapsible</option><option>grid 2x2</option><option>grid 3x3</option><option>grid 4x4</option><option>tabs</option>'
      +'</select>' 
      +'</form>'
      +'<br/>'
      +'<div id="browser"></div>'
      +'</div>'
      +'<div id="separator-div" class="column"></div>'
      +'<div id="right-div" class="column"></div>';
   $('#simpleGUI').append(guiCode);
   // $("#display-kind").selectmenu();
   
   AddInteractions();
}
