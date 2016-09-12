# JavaScript ROOT

The JSROOT project intends to implement ROOT graphics for web browsers.
Reading of binary ROOT files is supported.
It is the successor of the JSRootIO project.


## Installing JSROOT

In most practical cases it is not necessary to install JSROOT on the local computer - it can be used directly from project web sites <https://root.cern.ch/js/> and <http://jsroot.gsi.de/>. Developers repository for JSROOT code situated on <https://github.com/linev/jsroot/>.

In rare cases one need to install JSROOT on separate web server - for such case one could use provided packages from <https://github.com/linev/jsroot/releases>. 

One could use JSROOT directly from local file system. If source code was unpacked in `/home/user/jsroot/` subfolder, one could just open it in browser with <file:///home/user/jsroot/index.htm> address.



## Drawing objects in JSROOT

[The main page](https://root.cern.ch/js/latest/) of the JSROOT project provides the possibility to interactively open ROOT files and draw objects like histogram or canvas. 

To automate files loading and objects drawing, 
one can provide number of URL parameters in address string like:

- file, files - name of the file(s), which will be automatically open with page loading
- json - name of JSON file with stored ROOT object like histogram or canvas 
- item, items - name of the item(s) to be displayed
- opt, opts - drawing option(s) for the item(s)
- layout - can be 'simple', 'flex', 'collapsible', 'tabs' or 'gridNxM' where N and M integer values
- nobrowser - do not display file browser
- load - name of extra JavaScript to load
- optimize - drawing optimization 0:off, 1:only large histograms (default), 2:always
- paltte - id of default color palette, 51..121 - new ROOT6 palette  (default 57)
- interactive - enable/disable interactive functions 0-disable all, 1-enable all
- noselect - hide file-selection part in the browser (only when file name is specified)
- mathjax - use MathJax for latex output

For instance:

- <https://root.cern.ch/js/latest/?file=../files/hsimple.root&item=hpx;1>
- <https://root.cern.ch/js/latest/?file=../files/hsimple.root&nobrowser&item=hpxpy;1&opt=colz>
- <https://root.cern.ch/js/latest/?file=../files/hsimple.root&noselect&layout=grid2x2&item=hprof;1>

When specifying `file`, `item` or `opt` parameters, one could provide array like `file=['file1.root','file2.root']`.  One could skip quotes when specifying elements names `item=[file1.root/hpx,file2.root/hpy]` or `opt=['',colz]`. 

Many examples of URL string usage can be found on [JSROOT examples](https://root.cern.ch/js/latest/api.htm) page.   

One can very easy integrate JSROOT graphic into arbitrary HTML pages using a __iframe__ tag:

    <iframe width="700" height="400" 
            src="https://root.cern.ch/js/latest/index.htm?nobrowser&file=../files/hsimple.root&item=hpxpy;1&opt=colz">
    </iframe>


## Supported ROOT classes by JSROOT

List of supported classes and draw options:

- TH1 : [hist](https://root.cern.ch/js/latest/examples.htm#th1), [p](https://root.cern.ch/js/latest/examples.htm#th1_p), [p0](https://root.cern.ch/js/latest/examples.htm#th1_p0), [e](https://root.cern.ch/js/latest/examples.htm#th1_e), [e1](https://root.cern.ch/js/latest/examples.htm#th1_e1), [lego](https://root.cern.ch/js/latest/examples.htm#th1_lego)
- TH2 : [scat](https://root.cern.ch/js/latest/examples.htm#th2), [col](https://root.cern.ch/js/latest/examples.htm#th2_col), [colz](https://root.cern.ch/js/latest/examples.htm#th2_colz), [box](https://root.cern.ch/js/latest/examples.htm#th2_box), [text](https://root.cern.ch/js/latest/examples.htm#th2_text), [lego](https://root.cern.ch/js/latest/examples.htm#th2_lego), [surf](http://jsroot.gsi.de/dev/examples.htm#th2_surf), [lego](https://root.cern.ch/js/latest/examples.htm#th2_lego), [lego0](https://root.cern.ch/js/latest/examples.htm#th2_lego0), [lego1](https://root.cern.ch/js/latest/examples.htm#th2_lego1), [lego2](https://root.cern.ch/js/latest/examples.htm#th2_lego2), [lego3](https://root.cern.ch/js/latest/examples.htm#th2_lego3), [lego4](https://root.cern.ch/js/latest/examples.htm#th2_lego4)
- TH2Poly : [col](http://jsroot.gsi.de/dev/?nobrowser&file=../files/th2poly.root&item=honeycomb;1&opt=col),
[lego](http://jsroot.gsi.de/dev/?nobrowser&file=../files/th2poly.root&item=boxes;1&opt=lego), [europe](http://jsroot.gsi.de/dev/?nobrowser&file=../files/th2poly.root&item=europe;1), [usa](http://jsroot.gsi.de/dev/?nobrowser&file=../files/th2poly.root&item=usa;1)
- TH3 :  [box](https://root.cern.ch/js/latest/?nobrowser&file=../files/glbox.root&item=h31;1&opt=box), [box1](https://root.cern.ch/js/latest/?nobrowser&file=../files/glbox.root&item=h31;1&opt=box1)
- TProfile : [dflt](https://root.cern.ch/js/latest/?nobrowser&file=../files/hsimple.root&item=hprof;1), [e](https://root.cern.ch/js/latest/?nobrowser&file=../files/hsimple.root&item=hprof;1&opt=e), [E1](https://root.cern.ch/js/latest/?nobrowser&file=../files/hsimple.root&item=hprof;1&opt=e1), [pE2](https://root.cern.ch/js/latest/?nobrowser&file=../files/hsimple.root&item=hprof;1&opt=pe2), [hist](https://root.cern.ch/js/latest/?nobrowser&file=../files/hsimple.root&item=hprof;1&opt=hist)
- THStack : [example](https://root.cern.ch/js/latest/?nobrowser&file=../files/stacks.root&item=stacks;1)   
- TF1 : [example](https://root.cern.ch/js/latest/?nobrowser&file=../files/danilo5.root&item=canvas;1)
- TGraph : [dflt](https://root.cern.ch/js/latest/?nobrowser&file=../files/graph.root&item=Graph;1), [L](https://root.cern.ch/js/latest/?nobrowser&file=../files/graph.root&item=Graph;1&opt=L), [P](https://root.cern.ch/js/latest/?nobrowser&file=../files/graph.root&item=Graph;1&opt=P), [*](https://root.cern.ch/js/latest/?nobrowser&file=../files/graph.root&item=Graph;1&opt=*), [B](https://root.cern.ch/js/latest/?nobrowser&file=../files/graph.root&item=Graph;1&opt=B)
- TGraphErrors : [dflt](https://root.cern.ch/js/latest/?nobrowser&file=../files/graph.root&item=GraphErrors;1), [0](https://root.cern.ch/js/latest/?nobrowser&file=../files/graph.root&item=GraphErrors;1&opt=0), [3](https://root.cern.ch/js/latest/?nobrowser&file=../files/graph.root&item=GraphErrors;1&opt=3), [4](https://root.cern.ch/js/latest/?nobrowser&file=../files/graph.root&item=GraphErrors;1&opt=4)
- TGraphAsymmErrors : [dflt](https://root.cern.ch/js/latest/?nobrowser&file=../files/graph.root&item=GraphAsymmErrors;1), [2](https://root.cern.ch/js/latest/?nobrowser&file=../files/graph.root&item=GraphAsymmErrors;1&opt=2)
- TMultiGraph : [example](https://root.cern.ch/js/latest/?nobrowser&file=../files/multigraph.root&item=c3;1)
- TLatex : [example](https://root.cern.ch/js/latest/?nobrowser&file=../files/latex.root&layout=grid2x2&items=[lva,ex1,ex2,ex3]&mathjax)
- TMathText : [example](https://root.cern.ch/js/latest/?nobrowser&file=../files/latex.root&item=math;1)
- TCanvas : [example](https://root.cern.ch/js/latest/?nobrowser&file=../files/rf107.root&item=rf107_plotstyles;1)
- TLegend :  [example](https://root.cern.ch/js/latest/?nobrowser&file=../files/legends.root&item=legends;1&mathjax)
- TTree : [single-branch draw](http://jsroot.gsi.de/dev/?nobrowser&file=../files/hsimple.root&item=ntuple;1/px)

More examples of supported classes can be found on: <https://root.cern.ch/js/latest/examples.htm>


## Geometry viewer

JSROOT implements display of TGeo objects like:

- <http://jsroot.gsi.de/dev/?file=../files/geom/rootgeom.root&item=simple1;1>
- <http://jsroot.gsi.de/dev/?nobrowser&file=../files/geom/building.root&item=geom;1&opt=z>  

Following classes are supported by geometry viewer:
  - TGeoVolume
  - TGeoNode
  - TGeoManager (master volume will be displayed)
  - TEveGeoShapeExtract (used in EVE)

Following draw options could be specified (separated by semicolon or ';'):
   - axis  - draw axis coordinates
   - z   - set z axis direction up (normally y axis is up and x looks in user direction)           
   - clipx/clipy/clipz - enable correspondent clipping panel
   - clip or clipxyz - enable all three clipping pannels
   - ssao - enable Smooth Lighting Shader (or Screen Space Ambient Occulsion)
   - wire - instead of filled surfaces only wireframe will be drawn
   - more  - show 2 times more volumes as usual (normally ~2000 volumes or ~100000 elementary faces are shown)
   - more3 - show 3 times more volumes as usual
   - all - try to display all geometry volumes (may lead to browser hanging)
   - highlight - force highlighting of selected volume, normally activated for moderate-size geometries
   - macro:name.C - invoke ROOT configuration macro
   - dflt_colors - set default volumes colors as TGeoManager::DefaultColors() does
   - transpXY - set global transperancy value (XY is number between 1 and 99)
   - rotate - enable automatic rotation of the geometry 
   

It is typical, that not all geometry volumes should be displayed. 
In simple case one just display only subvolume (with all its daughters) like:

  <http://jsroot.gsi.de/dev/?file=../files/geom/rootgeom.root&item=simple1;1/Nodes/REPLICA_1>

Or one can use simple selection syntax (work only with first-level volumes):
 
  <http://jsroot.gsi.de/dev/?file=../files/geom/rootgeom.root&item=simple1;1&opt=-bar1-bar2>
  
Syntax uses '+' sign to show specified volume and '-' sign to hide specified volume.
One could use wildcard sign like '+TUBE1*'.  

Or one could reuse ROOT macro, which normally invoked when display geometry in ROOT itself.
Example of such macro can be found in root tutorials. Typically it looks like:

     {
      TGeoManager::Import("http://root.cern.ch/files/alice2.root");
      gGeoManager->DefaultColors();
      //   gGeoManager->SetVisLevel(4);
      gGeoManager->GetVolume("HALL")->InvisibleAll();
      gGeoManager->GetVolume("ZDCC")->InvisibleAll();
      gGeoManager->GetVolume("ZDCA")->InvisibleAll();
      ...
      gGeoManager->GetVolume("ALIC")->Draw("ogl");
      new TBrowser;
    }
  
From provided macro only following calls will be executed in JSROOT:

   * `gGeoManager->DefaultColors()`
   * `gGeoManager->GetVolume("HALL")->InvisibleAll()` 
   * `gGeoManager->GetVolume("HALL")->SetTransparency(30)` 
   * `gGeoManager->GetVolume("HALL")->SetLineColor(5)` 
   * `gGeoManager->GetVolume("ALIC")->Draw("ogl")`
    
All other will be ignored.

  
Example of major LHC detectors:
 * ALICE: [full](http://jsroot.gsi.de/dev/?file=https://root.cern.ch/files/alice2.root&item=Geometry;1&opt=macro:http://jsroot.gsi.de/files/geom/geomAlice.C) 
 * ATLAS: [full](http://jsroot.gsi.de/dev/?file=https://root.cern.ch/files/atlas.root&item=atlas;1&opt=clipxyz), [cryo](http://jsroot.gsi.de/dev/?file=https://root.cern.ch/files/atlas.root&item=atlas;1&opt=macro:http://jsroot.gsi.de/files/geom/atlas_cryo.C), [sctt](http://jsroot.gsi.de/dev/?file=https://root.cern.ch/files/atlas.root&item=atlas;1&opt=macro:http://jsroot.gsi.de/files/geom/atlas_sctt.C)
 * CMS: [cmse](http://jsroot.gsi.de/dev/?file=https://root.cern.ch/files/cms.root&item=cms;1&opt=macro:http://jsroot.gsi.de/files/geom/cms_cmse.C;clipxyz), [calo](http://jsroot.gsi.de/dev/?file=https://root.cern.ch/files/cms.root&item=cms;1&opt=macro:http://jsroot.gsi.de/files/geom/cms_calo.C;clipxyz)
 * LHCb: [full](http://jsroot.gsi.de/dev/?file=https://root.cern.ch/files/lhcbfull.root&item=Geometry;1&opt=all;dflt_colors)
  
Other detectors examples:
 * HADES: [full](http://jsroot.gsi.de/dev/?file=https://root.cern.ch/files/hades2.root&item=CBMGeom;1&opt=all;dflt_colors), [preselected](http://jsroot.gsi.de/dev/?json=../files/geom/hades.json.gz)  
 * BABAR: [full](http://jsroot.gsi.de/dev/?file=https://root.cern.ch/files/babar.root&item=babar;1&opt=macro:http://jsroot.gsi.de/files/geom/babar_all.C), [emca](http://jsroot.gsi.de/dev/?file=https://root.cern.ch/files/babar.root&item=babar;1&opt=macro:http://jsroot.gsi.de/files/geom/babar_emca.C) 
 * STAR: [full](http://jsroot.gsi.de/dev/?file=https://root.cern.ch/files/star.root&item=star;1&opt=macro:http://jsroot.gsi.de/files/geom/star_all.C;clipxyz), [svtt](http://jsroot.gsi.de/dev/?file=https://root.cern.ch/files/star.root&item=star;1&opt=macro:http://jsroot.gsi.de/files/geom/star_svtt.C) 
 * D0: [full](http://jsroot.gsi.de/dev/?file=https://root.cern.ch/files/d0.root&item=d0;1&opt=clipxyz)
 * NA47: [full](http://jsroot.gsi.de/dev/?file=https://root.cern.ch/files/na47.root&item=na47;1&opt=dflt_colors)
 * BRAHMS: [full](http://jsroot.gsi.de/dev/?file=https://root.cern.ch/files/brahms.root&item=brahms;1&opt=dflt_colors)
 * SLD: [full](http://jsroot.gsi.de/dev/?file=https://root.cern.ch/files/sld.root&item=sld;1&opt=dflt_colors;clipxyz)
    
Together with geometry one could display tracks (TEveTrack) and hits (TEvePointSet) objects.
Either one do it interactively by drag and drop, or superimpose drawing with `+` sign like:

<http://jsroot.gsi.de/dev/?nobrowser&json=../files/geom/simple_alice.json.gz&file=../files/geom/tracks_hits.root&item=simple_alice.json.gz+tracks_hits.root/tracks;1+tracks_hits.root/hits;1>



## Reading ROOT files from other servers

In principle, one could open any ROOT file placed in the web, providing the full URL to it like:

<https://jsroot.gsi.de/latest/?file=https://root.cern.ch/js/files/hsimple.root&item=hpx>

But one should be aware of [Same-origin policy](https://en.wikipedia.org/wiki/Same-origin_policy), when the browser blocks requests to files from domains other than current web page.
To enable CORS on Apache web server, hosting ROOT files, one should add following lines to `.htaccess` file:

    <IfModule mod_headers.c>
      <FilesMatch "\.root">
         Header set Access-Control-Allow-Origin "*"
         Header set Access-Control-Allow-Headers "range"
         Header set Access-Control-Expose-Headers "content-range,content-length,accept-ranges"
         Header set Access-Control-Allow-Methods "HEAD,GET"
      </FilesMatch>
    </IfModule>

More details about configuring of CORS headers can be found [here](https://developer.mozilla.org/en/http_access_control).

Other solution - copy all JSROOT files to the same location than where the data files are located.
In such case one could use the server with its default settings.

A simple case is to copy only the top index.htm file on the server and specify the full path to JSRootCore.js script like:

    ...
    <script type="text/javascript" src="https://root.cern.ch/js/latest/scripts/JSRootCore.js?gui"></script>
    ...

In such case one can also specify a custom files list:

    ...
     <div id="simpleGUI" path="files/subdir" files="userfile1.root;subdir/usefile2.root">
       loading scripts ...
     </div>
    ...


## JSROOT with THttpServer 

THttpServer provides http access to objects from running ROOT application.
JSROOT is used to implement the user interface in the web browsers.

The layout of the main page coming from THttpServer is similar to the file I/O one.
One could browse existing items and display them. A snapshot of running
server can be seen on the [demo page](https://root.cern.ch/js/latest/httpserver.C/).

One could also specify similar URL parameters to configure the displayed items and drawing options.

It is also possible to display one single item from the THttpServer server like:

<https://root.cern.ch/js/latest/httpserver.C/Files/job1.root/hpxpy/draw.htm?opt=colz>


##  Data monitoring with JSROOT

### Monitoring with http server

The best possibility to organize the monitoring of data from a running application
is to use THttpServer. In such case the client can always access the latest
changes and request only the items currently displayed in the browser.
To enable monitoring, one should activate the appropriate checkbox or
provide __monitoring__ parameter in the URL string like:

<https://root.cern.ch/js/latest/httpserver.C/Files/job1.root/hprof/draw.htm?monitoring=1000>

The parameter value is the update interval in milliseconds.


### JSON file-based monitoring

Solid file-based monitoring (without integration of THttpServer into application) can be
implemented in JSON format. There is the TBufferJSON class, which is capable to potentially
convert any ROOT object (beside TTree) into JSON. Any ROOT application can use such class to
create JSON files for selected objects and write such files in a directory,
which can be accessed via web server. Then one can use JSROOT to read such files and display objects in a web browser.

There is a demonstration page showing such functionality: <https://root.cern.ch/js/latest/demo/demo.htm>.
This demo page reads in cycle 20 json files and displays them.

If one has a web server which already provides such JSON file, one could specify the URL to this file like:

<https://root.cern.ch/js/latest/demo/demo.htm?addr=../httpserver.C/Canvases/c1/root.json.gz>

Here the same problem with [Cross-Origin Request](https://developer.mozilla.org/en/http_access_control) can appear.
If the web server configuration cannot be changed, just copy JSROOT to the web server itself.


### Binary file-based monitoring (not recommended)

Theoretically, one could use binary ROOT files to implement monitoring.
With such approach, a ROOT-based application creates and regularly updates content of a ROOT file, which can be accessed via normal web server. From the browser side, JSROOT could regularly read the specified objects and update their drawings. But such solution has three major caveats.

First of all, one need to store the data of all objects, which only potentially could be displayed in the browser. In case of 10 objects it does not matter, but for 1000 or 100000 objects this will be a major performance penalty. With such big amount of data one will never achieve higher update rate.

The second problem is I/O. To read the first object from the ROOT file, one need to perform several (about 5) file-reading operations via http protocol.
There is no http file locking mechanism (at least not for standard web servers),
therefore there is no guarantee that the file content is not changed/replaced between consequent read operations. Therefore, one should expect frequent I/O failures while trying to monitor data from ROOT binary files. There is a workaround for the problem - one could load the file completely and exclude many partial I/O operations by this. To achieve this with JSROOT, one should add "+" sign at the end of the file name. Of course, it only could work for small files.

The third problem is the limitations of ROOT I/O in JavaScript. Although it tries to fully repeat logic of binary I/O with the streamer infos evaluation, the JavaScript ROOT I/O will never have 100% functionality of native ROOT. Especially, the custom streamers are a problem for JavaScript - one need to implement them once again and keep them synchronous with ROOT itself. And ROOT is full of custom streamers! Therefore it is just great feature that one can read binary files from a web browser, but one should never rely on the fact that such I/O works for all cases.
Let say that major classes like TH1 or TGraph or TCanvas will be supported, but one will never see full support of TTree or RooWorkspace in JavaScript.

If somebody still wants to use monitoring of data from ROOT files, could try link like:

<https://root.cern.ch/js/latest/index.htm?nobrowser&file=../files/hsimple.root+&item=hpx;1&monitoring=2000>

In this particular case, the histogram is not changing.


## Stand-alone usage of JSROOT

Even without any server-side application, JSROOT provides nice ROOT-like graphics,
which could be used in arbitrary HTML pages.
There is [example page](https://root.cern.ch/js/latest/demo/example.htm),
where a 2-D histogram is artificially generated and displayed.
Details about the JSROOT API can be found in the next chapters.


## JSROOT API

JSROOT consists of several libraries (.js files). They are all provided in the ROOT
repository and are available in the 'etc/http/scripts/' subfolder.

Only the central classes and functions will be documented here.

Many different examples of JSROOT API usage can be found on [JSROOT API](https://root.cern.ch/js/latest/api.htm) page


### Scripts loading

Before JSROOT can be used, all appropriate scripts should be loaded.
Any HTML pages where JSROOT is used should include the JSRootCore.js script.
The `<head>` section of the HTML page should have the following line:

    <script type="text/javascript" src="https://root.cern.ch/js/latest/scripts/JSRootCore.js?2d"></script>

Here, the default location of JSROOT is specified. One could have a local copy on the file system or on a private web server. When JSROOT is used with THttpServer, the address looks like:

    <script type="text/javascript" src="http://your_root_server:8080/jsrootsys/scripts/JSRootCore.js?2d"></script>

In URL string with JSRootCore.js script one should specify which JSROOT functionality will be loaded:

    + '2d' normal drawing for objects like TH1/TCanvas/TGraph
    + 'more2d' more classes for 2D drawing like TH2/TF1/TEllipse
    + '3d' 3D drawing for 2D/3D histograms
    + 'geo' 3D drawing of TGeo classes
    + 'io' binary file I/O
    + 'math' advanced mathemathical functions
    + 'mathjax' loads MathJax.js and use it for latex output
    + 'gui' default gui for offline/online applications
    + 'load' name of user script(s) to load
    + 'onload' name of function to call when scripts loading completed

For instance, to load functionality with normal 2D graphics and binary ROOT files support, one should specify:

    <script type="text/javascript" src="https://root.cern.ch/js/latest/scripts/JSRootCore.min.js?2d&io"></script>

One could use minified version of all scripts (as shown in example) - this reduce page loading time significantly. 


### Use of JSON

It is strongly recommended to use JSON when communicating with ROOT application.
THttpServer  provides a JSON representation for every registered object with an url address like:

    http://your_root_server:8080/Canvases/c1/root.json

Such JSON representation generated using the [TBufferJSON](http://root.cern.ch/root/html/TBufferJSON.html) class.

To access data from a remote web server, it is recommended to use the [XMLHttpRequest](http://en.wikipedia.org/wiki/XMLHttpRequest) class.
JSROOT provides a special method to create such class and properly handle it in different browsers.
For receiving JSON from a server one could use following code:

    var req = JSROOT.NewHttpRequest("http://your_root_server:8080/Canvases/c1/root.json", 'object', userCallback);
    req.send(null);

In the callback function, one gets JavaScript object (or null in case of failure)


### Objects drawing

After an object has been created, one can directly draw it. If somewhere in a HTML page there is a `<div>` element:

    ...
    <div id="drawing"></div>
    ...

One could use the JSROOT.draw function:

    JSROOT.draw("drawing", obj, "colz");

The first argument is the id of the HTML div element, where drawing will be performed. The second argument is the object to draw and the third one is the drawing option.
One is also able to update the drawing with a new version of the object:

    // after some interval request object again
    JSROOT.redraw("drawing", obj2, "colz");

The JSROOT.redraw() function will call JSROOT.draw if the drawing was not performed before.

In the case when changing of HTML layout leads to resize of element with JSROOT drawing,
one should call JSROOT.resize() to let JSROOT adjust drawing size. One should do:

    JSROOT.resize("drawing");

 As second argument one could specify exact size for draw elements like:

    JSROOT.resize("drawing", { width: 500, height: 200 } );

To correctly cleanup JSROOT drawings from HTML element, one should call:

    JSROOT.cleanup("drawing");

Many examples of supported ROOT classes and draw options can be found on [JSROOT examples](https://root.cern.ch/js/latest/examples.htm) page. 


### File API

JSROOT defines the JSROOT.TFile class, which can be used to access binary ROOT files.
One should always remember that all I/O operations are asynchronous in JSROOT.
Therefore, callback functions are used to react when the I/O operation completed.
For example, reading an object from a file and displaying it will look like:

    var filename = "https://root.cern.ch/js/files/hsimple.root";
    JSROOT.OpenFile(filename, function(file) {
       file.ReadObject("hpxpy;1", function(obj) {
          JSROOT.draw("drawing", obj, "colz");
       });
    });



 