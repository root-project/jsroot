// JSRootInterface.js
//
// user interface for JavaScript ROOT Web Page.
//

function closeCollapsible(e, el) {
   var sel = $(el)[0].textContent;
   if (typeof(sel) == 'undefined') return;
   sel.replace(' x', '');
   sel.replace(';', '');
   sel.replace(' ', '');
   $(el).next().andSelf().remove();
   e.stopPropagation();
};

function addCollapsible(element) {
   $(element)
       .addClass("ui-accordion-header ui-helper-reset ui-state-default ui-corner-top ui-corner-bottom")
       .hover(function() { $(this).toggleClass("ui-state-hover"); })
       .prepend('<span class="ui-icon ui-icon-triangle-1-e"></span>')
       .append('<button type="button" class="closeButton" title="close canvas" onclick="closeCollapsible(event, \''+element+'\')"><img src="'+JSROOT.source_dir+'/img/remove.gif"/></button>')
       .click(function() {
          $(this)
             .toggleClass("ui-accordion-header-active ui-state-active ui-state-default ui-corner-bottom")
             .find("> .ui-icon").toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s").end()
             .next().toggleClass("ui-accordion-content-active").slideToggle(0);
          return false;
       })
       .next()
          .addClass("ui-accordion-content  ui-helper-reset ui-widget-content ui-corner-bottom")
             .hide();
   $(element)
      .toggleClass("ui-accordion-header-active ui-state-active ui-state-default ui-corner-bottom")
      .find("> .ui-icon").toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s").end()
      .next().toggleClass("ui-accordion-content-active").slideToggle(0);

};

function showElement(element) {
   if ($(element).next().is(":hidden")) {
      $(element)
         .toggleClass("ui-accordion-header-active ui-state-active ui-state-default ui-corner-bottom")
         .find("> .ui-icon").toggleClass("ui-icon-triangle-1-e ui-icon-triangle-1-s").end()
         .next().toggleClass("ui-accordion-content-active").slideDown(0);
   }
   $(element)[0].scrollIntoView();
}

function CollapsibleDisplay(itemname, obj) {
   
   // console.log("CollapsibleDisplay " + itemname + "  type " + (obj ? obj['_typename'] : "null"));
   if (!obj) return;
   
   var issinfo = itemname.lastIndexOf("StreamerInfo") >= 0;
   
   if (!issinfo && !JSROOT.Painter.canDrawObject(obj['_typename'])) return;
   
   var id = itemname.replace(/[^a-zA-Z0-9]/g,'_');
   
   var uid = "uid_accordion_"+id;
   var hid = "histogram_"+id;
   
   if (document.getElementById(uid)!=null) {
      showElement('#'+uid);
      return;
   }
   
   var entryInfo = "<h5 id=\""+uid+"\"><a> " + itemname + "</a>&nbsp; </h5>\n";
   entryInfo += "<div id='" + hid + "'></div>\n";
   $("#report").append(entryInfo);
   
   if (typeof($('#'+hid)[0]) == 'undefined') return;
   
   $('#'+hid).empty();

   if (issinfo) {
      var painter = new JSROOT.THierarchyPainter('sinfo', hid);
      painter.ShowStreamerInfo(obj);
   } else {
      
      // d3.select('#'+hid).attr("height",$('#'+hid).width()*0.66);

      $('#'+uid).attr("drawnitem", itemname);   
      
      // set aspect ratio for the place, where object will be drawn
      var height = $('#'+hid).width() * 0.66;
      
      document.getElementById(hid).setAttribute("style", "height:"+height+"px");
      document.getElementById(hid).style.height=""+height+'px';
      
      var hpainter = JSROOT.draw(hid, obj);
      
      document.getElementById(uid)['hpainter'] = hpainter;
   }
   
   addCollapsible('#'+uid);
   
   $('#'+uid)[0].scrollIntoView();
}

function ResetReport() {
   $("#report").get(0).innerHTML = '';
   $("#report").innerHTML = '';
   delete $("#report").get(0);
   //window.location.reload(true);
   JSROOT.DelHList('sinfo');
   $('#report').get(0).innerHTML = '';
}


function ResetUI() {
   ResetReport();
   $('#status').get(0).innerHTML = '';
   JSROOT.DelHList('root');
   $(window).unbind('resize');
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
   
   var painter = new JSROOT.THierarchyPainter("root", "status");
   
   painter['ondisplay'] = CollapsibleDisplay;
   painter['clear'] = ResetReport;
   
   painter.OpenRootFile(filename);
}

function UpdateOnline() {
   var chkbox = document.getElementById("monitoring");
   if (!chkbox || !chkbox.checked) return;

   // console.log("One could monitor all elements");
   $('#report').children().each(function() {
      
      var itemname = $(this).attr('drawnitem');
      if (typeof itemname=='undefined') return;

      // update only visible histograms
      if ($(this).next().is(":hidden")) return;
      var uid = $(this).attr('id');
      
      var hpainter = document.getElementById(uid)['hpainter'];
      if (hpainter == null) return;
      
      JSROOT.H('root').get(itemname, function(item, obj) {
         if (hpainter.UpdateObject(obj))
            hpainter.RedrawFrame(); 
      });
   });
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
   
   $('#report').children().each(function() {
      
      if (! ('hpainter' in this)) return;

      var hpainter = this['hpainter'];
      if (hpainter == null) return;

      // update only visible histograms
      if ($(this).is(":hidden")) return;

      hpainter.CheckResize();
   });

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
   
   // console.log('process resize');   
}

function BuildDrawGUI()
{
//   guiCode = "here will be single element draw " + document.URL; 
   
//   $('#drawGUI').append(guiCode);
   
   var pos = document.URL.indexOf("?");
   var drawopt = "", monitor = -1;
   if (pos>0) {
      var p1 = document.URL.indexOf("opt=", pos);
      if (p1>0) {
         p1+=4;
         var p2 = document.URL.indexOf("&", p1);
         if (p2<0) p2 = document.URL.length;
         drawopt = document.URL.substr(p1, p2-p1);
         console.log("draw opt = " + drawopt);
      }
      p1 = document.URL.indexOf("monitor");
      if (p1>0) {
         monitor = 3000;
         p1+=7;
         if (document.URL.charAt(p1) == "=") {
            p1++;
            var p2 = document.URL.indexOf("&", p1);
            if (p2<0) p2 = document.URL.length;
            monitor = parseInt(document.URL.substr(p1, p2-p1));
            if (typeof monitor== 'undefined') monitor = 3000; 
         }
         console.log("monitor = " + monitor);

      }
   }
   
   var hpainter = new JSROOT.THierarchyPainter("single");
   
   hpainter.CreateSingleOnlineElement();
   
   var objpainter = null;
   
   var drawfunction = function() {
      hpainter.get("", function(item, obj) {
         if (!obj) return;
         
         if (!objpainter) {
            objpainter = JSROOT.draw('drawGUI', obj, drawopt); 
         } else {
            objpainter.UpdateObject(obj);   
            objpainter.RedrawFrame();
         }
      });
   }
   
   drawfunction();
   
   if (monitor>0)
      setInterval(drawfunction, monitor);
}

function BuildOnlineGUI() {
   var myDiv = $('#onlineGUI');
   if (!myDiv) {
      alert("You have to define a div with id='onlineGUI'!");
      return;
   }
   
   var guiCode = "<div id='overlay'><font face='Verdana' size='1px'>&nbspJSROOT version:" + JSROOT.version + "&nbsp</font></div>"

   guiCode += '<div id="main" class="column"><br/>'
            + '  <h1><font face="Verdana" size="4">ROOT online server</font></h1>'
            + '  Hierarchy in <a href="h.json">json</a> and <a href="h.xml">xml</a> format<br/><br/>'
            + '  <input type="checkbox" name="monitoring" id="monitoring"/> Monitoring<br/>'
            + '<div id="status"></div>'
            + '</div>'
            + '<div id="reportHolder" class="column">'
            + '  <div id="report" class="ui-accordion ui-accordion-icons ui-widget ui-helper-reset"> </div>'
            + '</div>';
   
   $('#onlineGUI').append(guiCode);

   var hpainter = new JSROOT.THierarchyPainter("root", "status");
   
   hpainter['ondisplay'] = CollapsibleDisplay;
   hpainter['clear'] = ResetReport;
   
   hpainter.OpenOnline("h.json?compact=3");
   
   setInterval(UpdateOnline, 3000);
}

function BuildSimpleGUI() {
   
   if (document.getElementById('onlineGUI')) return BuildOnlineGUI();  
   if (document.getElementById('drawGUI')) return BuildDrawGUI();  
   
   var myDiv = $('#simpleGUI');
   if (!myDiv) return;
   
   var files = myDiv.attr("files");
   if (!files) files = "file/hsimple.root";
   var arrFiles = files.split(';');

   var guiCode = "<div id='overlay'><font face='Verdana' size='1px'>&nbspJSROOT version:" + JSROOT.version + "&nbsp</font></div>"

   guiCode += "<div id='main' class='column'>\n"
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
      +'</form>'
      +'<br/>'
      +'<div id="status"></div>'
      +'</div>'
      +'<div id="separator" class="column"></div>'
      +'<div id="reportHolder" class="column">'
      +'<div id="report" class="ui-accordion ui-accordion-icons ui-widget ui-helper-reset"> </div>'
      +'</div>';
   $('#simpleGUI').append(guiCode);
   
   
   var render_to = "#separator";

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
         
         var width = d3.select("#main").style('width');
         width = (parseInt(width.substr(0, width.length - 2)) + Number(drag_sum)).toString() + "px";
         d3.select("#main").style('width', width);
         
         var left = d3.select("#separator").style('left');
         left = parseInt(left.substr(0, left.length - 2)) + Number(drag_sum);
         d3.select("#separator").style('left',left.toString() + "px");
         d3.select("#reportHolder").style('left',(left+6).toString() + "px");
         
         left = d3.select("#separator").style('right');
         
         ProcessResize(true);
      });
   
     d3.select(render_to).call(drag_move);
     
     window.addEventListener('resize', ProcessResize);
}
