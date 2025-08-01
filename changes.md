# JSROOT changelog

## Changes in dev
1. Use ES6 modules to implement geoworker, enable node.js usage
1. Let use hex colors in histogram draw options like "fill_00ff00" or "line_77aa1166"
1. Let configure exact axis ticks position via draw option like "xticks:[-3,-1,1,3]"
1. Support gStyle.fBarOffset for `TGraph` bar drawing
1. Support "fill_<id>" and "line_<id>" draw options for `TGraph`
1. Support dark mode when store images
1. With 'Shift' key pressed whole graph is moved by dragging action
1. Support `Xall` and `Yall` as projections width #340
1. Upgrade three.js r174 -> r177
1. Upgrade lil-gui.mjs 0.19.2 -> 0.20.0
1. Remove experimental RHist classes, deprecated in ROOT
1. Internal - ws members are private, new methods has to be used
1. Fix - ticks size and labels with kMoreLogLabels axis bit
1. Fix - reading TLeafC leafs
1. Fix - support BigInt in object inspector
1. Fix - svg2pdf.js URL bounding box
1. Fix - TTree::Draw with strings


## Changes in 7.9.1
1. Fix - colz handling on `THStack`, avoid multiple palette drawings
2. Fix - bug in pad.Divide context menu command
3. Fix - drag and drop of histograms on empty sub-pads
4. Fix - add missing colors 100 - 127
5. Fix - correct online context menu for histogram title
6. Fix - copy all X axis attributes in multi-graph painter
7. Fix - if histogram WebGL drawing fails, fallback to default 2D


## Changes in 7.9.0
1. New draw options:
   - 'pol' and 'arr_colz' draw option for `TH2`
   - 'col7' uses bar offset and width for `TH2`
   - 'cont5' for `TGraph2D` using Delaunay algorithm
   - 'chord' drawing of `TH2` implements zooming
   - 'box1' for `TH3` with negative bins
   - 'same' option for first histogram on pad, draw without creating `TFrame`
   - 'rangleNN' for `TGraphPolargram`, also support fAxisAngle member
   - 'N' and 'O' for `TGraphPolargram` for angle coordinate systems
   - 'arc' for `TPave` and derived classes
   - 'allbins' for histograms to display underflow/overflow bins
   - Poisson errors for `TH1`/`TH2`, https://root-forum.cern.ch/t/62335/
   - test fSumw2 when detect empty `TH2` bin, sync with https://github.com/root-project/root/pull/17948
2. New supported classes:
   - `TF12` - projection of `TF2`
   - `TLink` and `TButton`, used in `TInspectCanvas`
3. New partameters in `TTree::Draw`:
   - '>>elist' to request entries matching cut conditions
   - 'elist' to specify entries for processing
   - 'nmatch' to process exactly the specified number of entries, break processing afterwards
   - 'staged' algorithm to first select entries and then process only these entries
4. New settings parameters:
   - `settings.FilesTimeout` global timeout for file reading operations
   - `settings.FilesRemap` fallback address for http server, used for `root.cern`
   - `settings.TreeReadBunchSize` bunch read size for `TTree` processing
   - `settings.UserSelect` to set 'user-select: none' style in drawings to exclude text selection
5. Context menus:
   - all `TPave`-derived classes
   - in 'chord' drawings of `TH2`
   - editing histogram and graph title
6. Fixes:
   - match histogram title drawing with native ROOT implementation
   - float to string conversion when 'g' is specified
   - handle `TPave` NDC position also when fInit is not set
   - properly handle image sizes in svg2pdf
   - drawing `TPaveText` with zero text size
   - correct axis range in `TScatter` drawing
   - use draw option also for graph drawing in `TTree::Draw`
7. Internals:
   - upgrade three.js r168 -> r174
   - use private members and methods
   - use `WeakRef` class for cross-referencing of painters
   - use negative indexes in arrays and Strings
   - remove support of qt5 webengine, only qt6web can be used


## Changes in 7.8.2
1. Fix - hidden canvas in Jupyter Lab, https://root-forum.cern.ch/t/63097/
2. Fix - repair small bug in `TF3` painting


## Changes in 7.8.1
1. Fix - correctly position title according to gStyle->GetTitleAlign()
2. Fix - tooltips on TGraphPolar
3. Fix - use 'portrait' orientation for PDF pages where width smaller than height
4. Fix - font corruption after PDF generation
5. Fix - support drawing of `RooEllipse` class


## Changes in 7.8.0
1. Let use custom time zone for time display, support '&utc' and '&cet' in URL parameters
2. Support gStyle.fLegendFillStyle
3. Let change histogram min/max values via context menu
4. Support Z-scale zooming with `TScatter`
5. Implement "haxis" draw option for histogram to draw only axes for hbar
6. Implement "axisg" and "haxisg" to draw axes with grids
7. Support `TH1` marker, text and line drawing superimposed with "haxis"
8. Support `TBox`, `TLatex`, `TLine`, `TMarker` drawing on "frame", support drawing on swapped axes
9. `TProfile` and `TProfile2D` projections https://github.com/root-project/root/issues/15851
10. Draw total histogram from `TEfficiency` when draw option starts with 'b'
11. Let redraw `TEfficiency`, `THStack` and `TMultiGraph` with different draw options via hist context menu
12. Support 'pads' draw options for `TMultiGraph`, support context menu for it
13. Let drop objects on sub-pads
14. Properly loads ES6 modules for web canvas
15. Improve performance of `TH3`/`RH3` drawing by using `THREE.InstancedMesh`
16. Implement batch mode with '&batch' URL parameter to create SVG/PNG images with default GUI
17. Adjust node.js implementation to produce identical output with normal browser
18. Create necessary infrastructure for testing with 'puppeteer'
19. Support injection of ES6 modules via '&inject=path.mjs'
20. Using importmap for 'jsroot' in all major HTML files and in demos
21. Implement `settings.CutAxisLabels` flag to remove labels which may exceed graphical range
22. Let disable usage of `TAxis` custom labels via context menu
23. Let configure default draw options via context menu, preserved in the local storage
24. Let save canvas as JSON file from context menu, object as JSON from inspector
25. Upgrade three.js r162 -> r168, use r162 only in node.js because of "gl" module
26. Create unified svg2pdf/jspdf ES6 modules, integrate in jsroot builds
27. Let create multi-page PDF document - in `TWebCanvas` batch mode
28. Let add in latex external links via `#url[link]{label}` syntax - including jsPDF support
29. Support `TAttMarker` style with line width bigger than 1
30. Provide link to ROOT class documentation from context menus
31. Implement axis labels and title rotations on lego plots
32. Internals - upgrade to eslint 9
33. Internals - do not select pad (aka gPad) for objects drawing, always use assigned pad painter
34. Fix - properly save zoomed ranges in drawingJSON()
35. Fix - properly redraw `TMultiGraph`
36. Fix - show empty bin in `TProfile2D` if it has entries #316
37. Fix - unzooming on log scale was extending range forever
38. Fix - display empty hist bin if fSumw2 not zero
39. Fix - geometry display on android devices


## Changes in 7.7.6
1. Fix - latex super-script without leading symbol, https://root-forum.cern.ch/t/63114/
2. Fix - correctly read std::pair<> without dictionary, https://root-forum.cern.ch/t/63114/
3. Fix - chromium in mobile device emulation mode, https://root-forum.cern.ch/t/63201/
4. Fix - files remap for root.cern site using fallback URL


## Changes in 7.7.5
1. Fix - can enable exponent only for log10 axis scale
2. Fix - proper set custom font size in latex
3. Fix - do not force style 8 for hist markers
4. Fix - ensure minimal hist title height
5. Fix - disable Bloom effect on Android
6. Fix - handle reordering of fragments in multipart reply #319
7. Fix - properly show non-zero entries #320


## Changes in 7.7.4
1. Fix - TGraph Y range selection, do not cross 0
2. Fix - correctly handle `#font[id]` in latex
3. Fix - store canvas with embed geometry drawing
4. Fix - upgrade rollup and import.meta polyfill


## Changes in 7.7.3
1. Fix - correctly handle in I/O empty std::map
2. Fix - reading of small (<1KB) ROOT files
3. Fix - race condition in zstd initialization #318
4. Fix - deployment with zstd #317


## Changes in 7.7.2
1. Fix - hide empty title on the canvas
2. Fix - properly handle zooming in THStack histogram
3. Fix - always use 0 as minimum in THStack drawings
4. Fix - always show all ticks for labeled axis
5. Fix - draw TProfile2D bins content as text, not entries
6. Fix - interactive zooming on log color palette
7. Fix - keyboard handling while input dialog active
8. Fix - legend entry with not configured fill attributes
9. Fix - prevent that color palette exceed graphical range
10. Fix - exponential log axis labels with kMoreLogLabels bit set


## Changes in 7.7.1
1. Fix - properly select TF1 range after zooming
2. Fix - TH1 y-range selection
3. Fix - add 'gl' and svg2pdf-related packages to dependencies in package.json


## Changes in 7.7.0
1. Let plot current time, file creation or modification time with `&optdate=[1,2,3]` URL parameters
2. Let plot file name, full file name or item name with `&optfile=[1,2,3]` URL parameters
3. Let define date and file name position with `&datex=0.03&datey=0.03` URL parameters
4. Improve TRatioPlot axis and lines drawing
5. Use localStorage to preserve custom settings and gStyle
6. Let configure custom storage prefix with `&storage_prefix=name` URL #290
7. Let customize URL for "Show in new tab" menu command
8. Support both new and old TRatioPlot drawings
10. Synchronize X/Y range selection with native ROOT
11. Proper handle attributes from TH2Poly bins, support "p" for markers drawing
12. Correctly scale size of axis ticks - take into account NDC axis length
13. Set name and userData in geometry `build()` function #303
14. Draw histogram title afterwards - place in front of stats box
15. Upgrade three.js r158 -> r162, last with WebGL1 support
16. Split extras into three_addons.mjs, provide jsroot geometry build without three.js
17. Fix - correctly draw only grids with AXIG draw option
18. Fix - log scales on TH3 drawings #306
19. Fix - draw geometry top node volume if all childs not visible #308
20. Fix - properly process 206 server response without Accept-Ranges header https://root-forum.cern.ch/t/59426/


## Changes in 7.6.1
1. Remove source_dir output in node.js #296
2. Fully integrate svg2pdf.js into jsroot repo
3. Fix - support plain TRI option for TGraph2D
4. Fix - let read object from ROOT file with empty name
5. Fix - graph drawing fix custom labels on X axis #297
6. Fix - draw at least line for TGraphErrors ROOT-8131
7. Fix - preserve attributes and draw options when call drawingJSON() #307
8. Fix - menu for text align selection typo


## Changes in 7.6.0
1. Implement "tickz" draw option, used for color palette ticks
2. Implement skewness and kurtosis calculations for histogram stats box
3. Introduce "logv" draw option for `TH3`, configures logarithmic scale for box volume
4. Implement color palette drawing for `TH3`
5. Implement cutg draw option for `TH2`/`TF2` surface plots
6. Implement `TMath::Sq()` function and several others like SinH, ASinH, ...
7. Implement histogram drawing build from `TGraph2D` using Delaunay interpolation
8. Provide preliminary `TF3` support
9. Support `TLinearGradient` and `TRadialGradient` colors
10. Support LZMA decompression of ROOT files #272
11. Include ZSTD decompression to repository #274
12. Support opacity transfer function for `TH3`, see tutorials/gl/glvox2.C
13. Upgrade three.js r155 -> r158
14. Handle TCanvas IsEdiatable flag to disable some interactive features
15. Support PDF creation using jsPDF and svg2pdf.js - in browser and node.js
16. Implement custom fonts support in TWebCanvas
17. List of ROOT/JSON files on server with `&dir=<path>` URL parameter #283
18. Load TGaxis function from the file #282
19. Let display progress messages in modal element #285
20. Fix - do not add `THStack` and `TMultiGraph` to legend
21. Fix - correctly use margin in `TPaveText` class
22. Fix - correctly draw endcaps in legend errors
23. Fix - vertical position of up elements like {M}^{2} in TLatex
24. Fix - let draw THStack with diff binning hists
25. Fix - better tooltip name for the items
26. Fix - better logy scale selection


## Changes in 7.5.5
1. Fix - abort tree draw operation faster
2. Fix - support plain TRI option for TGraph2D
3. Fix - use latest npm "gl" module


## Changes in 7.5.4
1. Fix - catch exception when parsing TF1 formula
2. Fix - properly check THStack histograms axes when doing sum
3. Fix - correctly handle negative offset on time axis
4. Fix - do not use `inset` because of old Chrome browsers
5. Fix - properly provide object hints


## Changes in 7.5.3
1. Fix - draw histograms with negative bins #276
2. Fix - correctly read TLeaf with fixed-size array
3. Fix - bug in options handling in startGUI
4. Fix - greyscale support in TLegend drawing
5. Fix - correctly use text font for TGaxis title
6. Fix - preserve auto colors in THStack #277
7. Fix - correctly set pave name #278


## Changes in 7.5.2
1. Fix - proper fit pars display in stats, proper #chi^{2}
2. Fix - several bugs in TFormula parsing
3. Fix - correctly use saved buffer in TF1/TF2
4. Fix - properly adjust size of stats box
5. Fix - support pol0..pol9 functions
6. Fix - TGraph bar width should be at least 1 pixel
7. Fix - prevent drawing of empty TGraph


## Changes in 7.5.1
1. Fix - expand item in hierarchy painter
2. Fix - correctly use saved TF1 values for non-equidistant bins #270
3. Fix - in log scales replace 10^1 label by 10
4. Fix - vertical align of log labels on X axis
5. Fix - second click of the same item in hierarchy painter


## Changes in 7.5.0
1. Correctly implement `TH2` projections like MERCATOR or PARABOLIC, add MOLLWEIDE
2. Support "pol", "cyl", "sph" and "psr" coordinates systems for lego and surf plots
3. Support orthographic camera for lego and surface plots
4. Implement "tri1", "tri2", "triw" draw options for `TGraph2D` with Delaunay algorithm
5. Add support of `TProfile3D` and `TPaveClass` classes
6. Use "col" as default draw option for `TH2`, "box2" for `TH3`
7. Draw axes grids in front of objects - making it equivalent to original ROOT
8. Change `TF1` and `TF2` drawing - always convert into histogram, support TWebCanvas, handle log scales
9. Provide "Bring to front" menu command for different objects like pave, box, marker, ...
10. Provide "Build legend" context menu command for the pad
11. Let toggle vertical/horizontal flag for color palette via context menu
12. Support canvas grayscale, let toggle via context menu
13. Basic latex support when drawing axes labels and titles in 3D
14. Handle "dark mode" in geom painter - automatically adjust background
15. Let configure material and scene properties in geom control gui
16. Reset pad enlarge state when pressing "Escape" key #265
17. Scale special fill patterns like 3244 to pad size
18. Add "Superimpose" menu command in hierarchy - let select draw option when append item to pad
19. Support `inspectN` draw option, allows automatically expand object content to specified level
20. Implement `allfunc` draw option for histograms, force drawing disregard of TF1::kNotDraw bit
21. Use `eslint` for static code checking, add testing of interactive features
22. Upgrade three.js r151 -> r155
23. Use https://github.com/georgealways/lil-gui/ instead of dat.GUI in geom painter
24. Put `gl` in "devDependencies" of package.json; one can skip it installation with `npm i --production`
25. Fix - correct scaling of axis labels when tilt them by 25 degree, make this angle configurable
26. Fix - legend multi-columns drawing and labels scaling
27. Fix - graph "B" bar widths as in native ROOT
28. Fix - use pad and not frame size for `TText` / `TLatex` scaling
29. Fix - properly handle "NB" (no border) draw option for `TPave` classes
30. Fix - do not draw histogram title with AXIS draw option
31. Fix - correct scaling of custom axis labels
32. Fix - shrink axis labels like 0.20 -> 0.2 or 10^0 -> 1
33. Fix - copy axis attributes from histogram z scale to palette
34. Fix - let handle derived from TH1/TH2 classes as histograms #269


## Changes in 7.4.3
1. Fix - correctly use GMT specifier in time format
2. Fix - logical error in `decodeUrl`
3. Fix - member-wise streaming of std::map   #262


## Changes in 7.4.2
1. Fix - unzoom z on lego2 plots
2. Fix - browsing TLists with nullptr inside
3. Fix - check NaN values when performing TTree::Draw()
4. Fix - support standard log function in TF1/TF2


## Changes in 7.4.1
1. Fix - context menu position on lego plots
2. Fix - add missing math functions Chebyshev0 and normalized Gaus
3. Fix - correctly render TPolyLine3D
4. Fix - properly add interactive resize elements for paves and frame
5. Fix - drag and drop handling on tabs layout


## Changes in 7.4.0
1. Upgrade d3.js v7.6.1 -> v7.8.4
2. Upgrade three.js r146 -> r151
3. Support `[cutg]` draw option for TH2
4. Correctly handle `same0` draw option for TH2
5. Fix several issues with axis reverse order, support on lego plots
6. Support more kinds of log scales - ln and logN where N is any positive integer
7. Adjust TAxis title positioning to native ROOT behavior
8. Add interactivity (moving, context menu) for TLine, TBox, TText, TLatex, TDiamond, TGaxis, TASImage
9. Use new gStyle attributes for candle and violin plots
10. Implement autoplace for TLegend, also via context menu
11. Change algorithm of building smooth (bezier) curves
12. Let change physical node visibility in TGeo drawings
13. Use TGaxis attributes from gStyle - fAxisMaxDigits, fStripDecimals and exponent offset
14. Implement "projxy" draw option for TH2 - like projxy3 or projx1_y5
15. Support custom function in TGaxis - when drawn in TWebCanvas
16. Introduce settings.WithCredentials, set xhr.withCredentials = true when submitting HTTP requests
17. Let superimpose TH3 and geo drawings
18. Apply pad draw options like 'gridx' or 'logy' to all subpads
19. Support new TScatter and TAnnotation classes
20. Implement moving and resizing of subpads
21. Implement zooming in the TASImage
22. Let configure position and direction of camera for TGeo, let create URL for that
23. Support labels rotation for simple axis in geometry
24. Support many orthographic cameras with overlayed grid/labels
25. Support InstancedMesh for TGeo drawing, let show really large geometries
26. Implement 'inject=path/script_name.js' url option to inject scripts without emulating of v6
27. Exclude 'HEAD' http request when reading ROOT file, all necessary info can be get from first real HTTP request
28. Provide makeImage function for generation of svg, png and jpeg images in batch and interactively (#257)
29. Implement interactive zoom shifting when middle-mouse button down or single-touch moving
30. Several improvements for touch devices or devices with small displays
31. Remove settings.FrameNDC, use Style.fPadLeft/Right/Top/BottomMargin values instead
32. Fix - rescan sumw2 when update TH1
33. Fix - correct placing for TLegend header
34. Fix - correctly align sub/super scripts in complex TLatex
35. Fix - correctly set visibility level for geo drawing (#258)
36. Fix - use more factor for number of nodes in geo drawing (#258)


## Changes in 7.3.4
1. Fix - failure in normal_cdf calculation
2. Fix - check in TTree::Draw for null buffer
3. Fix - do not rise exception in treeProcess
4. Fix - RH1 zero line drawing only when required
5. Fix - do not allow move float browser too far left/top


## Changes in 7.3.2
1. Fix - undefined graph in TGraphPainter
2. Fix - error in showing info in the geo painter
3. Fix - stack limitation with Math.min.apply in tree draw


## Changes in 7.3.1
1. Fix - TGeo update in the TWebCanvas
2. Fix - several tutorials with three.js modules loading
3. Fix - redraw pad when change text align attributes
4. Fix - pad ranges for TWebCanvas, handle log2 scales
5. Fix - support candle and violin options when creating string draw option
6. Fix - labels and tooltips on reversed axes
7. Fix - zooming on TRatioPlot
8. Fix - pad ranges calculations for TWebCanvas
9. Fix - set proper background for geo drawing


## Changes in 7.3.0
1. Mark methods returning `Promise` as **async**
2. Upgrade three.js to r146
3. Fix several bugs in `csg.mjs`, improve geometry clipping
4. Provide `settings.PreferSavedPoints` to exclude function evaluation when there are saved points
5. Add more interactive features with `TWebCanvas`
6. 3-dimensional `TTree::Draw()` now produces `TPolyMarker3D` by default
7. Force MathJax rendering when `\` symbol is found (#243)
8. Support `TButton` class
9. Remove `localfile` url option, only interactively one can open file selection dialog
10. Fix - show correct bin index in `TH2` tooltips
11. Fix - interactive move/resize on touch devices
12. Fix - correctly handle axis zooming on lego plots
13. Fix - histogram statistics calculation with negative bins
14. Base version for ROOT 6.28 release


## Changes in 7.2.1
1. Fix - prevent glitch when enabling projection via context menu
2. Fix - `multi.json` request parsing
3. Fix - decoding of multipart message (#250)
4. Fix - use alpha channel for TColor when intended
5. Backport `settings.PreferSavedPoints` only for `TF1`


## Changes in 7.2.0
1. Use TAxis attributes in lego plots - ticks/labels/title colors, sizes, offsets
2. Correctly resize stats box when number of lines changes
3. Support JSROOT usage with yarn and webpack
4. Provide `FileProxy` class to let read ROOT files from arbitrary place
5. Let 'hook' save file functionality to use alternative method to store image files
6. Implement 'tabs' layout for objects display (#238)
7. Upgrade d3.js to version 7.6.1
8. Fix - adjust pad margins when moving palette and frame


## Changes in 7.1.1
1. Fix - let modify node visibility bits via context menu
2. Fix - menu position adjusting
3. Fix - tree_draw.js example, export treeDraw function from main.mjs
4. Fix - TH3 scatter plot with large number of bins converted to box2
5. Fix - create geo css entries also when expand object in hierarchy (#240)


## Changes in 7.1.0
1. Let change `settings` and `gStyle` parameters via "Settings" menu of the top hierarchy item
2. Settings and gStyle can be stored as cookies, automatically read when next time loading webpage
3. `settings.OnlyLastCycle` defines if only last object version shown in TFile (also as `&lastcycle` URL parameter)
4. `settings.DarkMode` configures dark mode for GUI and drawings (also as `&dark` URL parameter)
5. Support new `TGraph2DAsymmErrors` class
6. Support `gStyle.fOptDate` and `gStyle.fOptFile` (also as `&optdate` and `&optfile` URL parameter)
7. Support `gStyle.fDateX` and `gStyle.fDateY` used for positioning date and file on canvas
8. Support `gStyle.fHistTopMargin` (also as `&histmargin=value` URL parameter)
9. Let save frame, title and stats properties to `gStyle` via correspondent context menus
10. Support majority of special symbols in TMathText
11. Fix several issues with TPaveText


## Changes in 7.0.2
1. Fix - TH2 arrow drawing
2. Fix - interactive change of fonts attributes
3. Fix - proper draw results of TTree::Draw
4. Fix - draw new histogram on same canvas


## Changes in 7.0.1
1. Fix problem with irregular axis labels
2. Correctly scale and tilt large number of axes labels


## Changes in 7.0.0
1. Use ES6 modules for code organization
2. Rewrite code with ES6 classes; one have to use class syntax to derive from it
3. Upgrade d3.js to 7.3.0, three.js to r138
4. Fully remove jQuery and jQueryUI, replace by plain HTML/JavaScript
5. Remove "collapsible" and "tabs" layouts which were implemented with jQuery - use "flex" instead
6. Improve flexible layout, provide context menu with cascading, tiling, selecting frames
7. Use `BigInt` in I/O with 64bit integer which can not be stored as plain `Number`
8. Starting from Chrome 96, allow embedding WebGL into SVG - solving problem with lego plots in canvas
9. Implement all variants of CANDLE and VIOLIN draw options (#194)
10. Implement "circular" and "chord" draw options for TH2
11. Implement "cjust" draw option when drawing color palette
12. Implement "colhz" draw option to plot horizontal color palette
13. Implement "pads" draw option for THStack
14. In TF1/TF2 always try to use formula, only when fail - apply saved buffer
15. Add many standard functions to math like "crystalball_pdf", "gaussian_pdf", "tdistribution_pdf"
16. Improve drawing of TEfficiency, support 2D case
17. Support new TGraphMultiErrors class
18. Let disable TGraph dragging via `settings.DragGraphs` flag (#224)
19. Correctly display extra data from TGraphQQ
20. Implement "3d" draw options for TMultiGraph
21. Support "A" hist option (do not draw axis) in lego/surf plots
22. Support drawing of TGeo and TAxis3D objects inside TPad
23. Implement proper drawing of TEllipse
24. Add proper support of "Symbols" and "Wingdings" fonts
25. Make "col" default draw option for TH2 in JSROOT gui


## Changes in 6.3.4
1. Fix bug in handling superimposing items via URL syntax
2. Enable geometry clipping in node.js
3. Upgrade node.js packages
4. Let draw TGeo object inside TCanvas
5. Let superimpose TPolyLine3D and TPolyMarker3D with TGeo drawing
6. Fix plain #sum and #int parsing in TLatex
7. Fix ticks position for axes with labels


## Changes in 6.3.3
1. Fix TEfficiency drawing
2. Provide TPadPainter.divide method
3. Fix browsing remote file via THttpServer
4. Fix lego draw update while zooming


## Changes in 6.3.2
1. Fix bug in TH1 drawing when minimum or/and maximum was configured for histogram


## Changes in 6.3.1
1. Fix bug with col draw option in TH2/RH2


## Changes in 6.3.0
1. Fully rewrite TLatex parsing, use svg elements instead of plain text/tspan
2. Make TLatex reliably working in node.js, does not depend from availability of canvas component
3. Many optimizations to produce smaller (and faster) SVG output
4. Provide x3dscNNN and y3dscNNN draw option for histogram to resize x/y axis in 3D plots
5. Provide "Find label" command in TAxis context menu to zoom into bin region
6. Allows to use JSROOT.define() in external scripts
7. Provide JSROOT.Painter.setDefaultDrawOpt() to change class default draw option
8. Provide example of custom entries in histogram context menu
9. Provide alternative external location for zstd-codec, let use zstd even when not found locally
10. Let skip HEAD requests when reading files, adding "^" symbol to file name (#223)
11. Show long histogram names in stats box when possible
12. Fix logic how "ndiv" parameter of TAxis is handled, showing really the configured number of ticks
13. Fix problem with curved TGraph drawings (#218)
14. Fix problems with TGraph drawing updates
15. Base version for ROOT 6.26 release


## Changes in 6.2.2
1. Fix - proper fill TH1 which drawn with line option
2. Fix - object drawing from inspector
3. Fix - error with filling data of TGeoTrack in "extract tracks" example
4. Fix - error in pad items context menu
5. Fix - assigned dropped item name only when new painter created


## Changes in 6.2.1
1. Fix logy and logz handling on lego plots
2. Fix error in statistic calculations for projections
3. Fix zstd-codec loading with minified jsroot scripts


## Changes in 6.2.0
1. Support fully interactive second X/Y axis for histograms, graphs, functions and spline
2. Support X+, Y+, RX, RY draw options for TF1
3. Remove deprecated JSRootCore.js script, one have to use JSRoot.core.js
4. Upgrade three.js to r127
5. Upgrade d3.js to 6.7.0
6. Implement "nozoomx" and "nozoomy" draw options for TPad
7. Implement "frame" draw option for TGaxis - fix position of axis relative to the frame
8. Preserve position of TPaletteAxis, if provided with histogram; make default position like in ROOT
9. Support basic TLatex symbols in lego plos axis title
10. Use frame margins when create 3D lego drawings
11. Implement "nomargins" draw option for pad/canvas
12. Support custom mouse click/dblcklick handlers in lego plots
13. Implement marker styles 35 - 49
14. Let switch orthographic camera in geometry via control gui (#217)
15. Fix drawing of custom markers on 3D, also in node.js (#205)


## Changes in 6.1.1
1. Fix bug in TFrame drawing, some interactive features was not properly working


## Changes in 6.1.0
1. Support drawing produced by TRatioPlot, including interactive zooming
2. Fix problem with TF1 drawing from histogram list of primitives
3. Let disable showing of StreamerInfo in the GUI by adding &skipsi to URL
4. Provide tooltips when TH1 drawn with "E" or "P" option
5. Fix problem with zooming of many overlayed histograms
6. API change -> PadPainter.zoom function returns Promise now
7. Support gridx/y, tickx/y, logx/y options for (multi) graphs painter
8. Provide simple Rebin functionality for TH1 (#210)
9. Use jQuery dialog to input values, avoid prompt() which not always supported (#216)


## Changes in 6.0.2
1. Fix ZSTD size limitation, use streaming API (#214)
2. Prevent endless recursion in JSROOT.parse() function


## Changes in 6.0.1
1. Fix problem with matrix calculations in Eve classes (#206)
2. Fix errors in TNodejsFile (#208)
3. Fix TGraph tooltips handling
4. Fix TH2Poly tooltips handling


## Changes in 6.0.0
1. Major release with:
   - incompatible changes in API
   - heavy use of Promise class
   - upgrade all used packages
2. Use generic naming convention - all class names always starts from
   capital letter like "ObjectPainter", all function names starts from small
   letter like "painter.getObjectHint()"
3. Rename JSRootCore.js -> JSRoot.core.js, eliminate all URL parameters.
   Loading of extra JSROOT functionality should be done via JSROOT.require() method
   All other scripts uses similar naming convention.
4. JSROOT.draw()/JSROOT.redraw() functions returns Promise, deprecate callback parameter
5. Introduce JSROOT.httpRequest() function which returns Promise instance, deprecate
   JSROOT.NewHttpRequest() function
6. JSROOT.openFile() returns Promise with file instance, deprecate callback parameter
7. Provide new code loader via JSROOT.require()
   - introduces clean dependencies in JSROOT code
   - by default uses plain script loading emulating require.js behavior
   - can use require.js when available
   - uses require() method when running inside node.js
   - supports openui5 sap.ui.require loader if available before JSRoot.core.js
   - deprecates old JSROOT.AssertPrerequisites() function
8. Upgrade d3.js to v6.1.1, skip support of older versions
9. Upgrade three.js to r121:
   - SoftwareRenderer deprecated and removed
   - let use WebGL for browser, batch and node.js (via headless-gl)
   - support r3d_gl, r3d_img, r3d_svg rendering options for TGeo and histograms
   - keep support of SVGRendered as backup solution
10. Upgrade MathJax.js to version 3.1.1
   - reliably works in browser and node.js!
   - all latex/mathjax related methods moved to special JSRoot.latex.js script, loaded on demand
11. Update jquery to 3.5.1, openui5 to 1.82.2
12. Use JS classes only in few places - performance is not good enough compared to Object.prototype
13. Deprecate IE support
14. Deprecate bower package manager
15. Add support of ZSTD compression - works only on https://root.cern/js/ website
16. Add support of log2 scale for axes drawing, v7 can have arbitrary log base
17. Improve TH2 col drawings for large number of bins - up to factor 5 faster
18. Allow to move axis title to opposite position
19. Fix zooming in color palette
20. Implement monitoring of object inspector


## Changes in 5.9.1
1. Fix zooming in color palette
2. Fix interactive update of TGraph painting on time scale
3. Fix I/O error in reading std::map (#204)
4. Fix functionality of "open all" / "close all" GUI buttons


## Changes in 5.9.0
1. Support RX and RY drawing option together with COL of TH2
2. Add support of #overline, #underline, #strike into TLatex parsing (#196)
3. Add support of TGeoTessellated shape
4. Major changes in v7 drawing: RFrame, RPalette, RColor, RStatBox, ...
5. Fix in reading std::map member-wise
6. Better handling of context menu position
7. Support TASImage class - both PNG and binary content, including palette
8. Let change TH2 values range via context menu
9. Fix problem with TH2 col drawing when bins size too small


## Changes in 5.8.2
1. Fix - tooltip handling for TH2 Error draw
2. Fix - use proper "fixed" position for enlarged drawing
3. Fix - correctly extract TF1 parameter names
4. Fix - keep stat box when update histogram drawing
5. Fix - context menu for axes in 3D drawings


## Changes in 5.8.1
1. Fix - use Math.floor when search for bin label
2. Fix - renable correct highlight of TGraphErrors
3. Fix - adjust TH1/TH2/TAxis values to let stream them in ROOT
4. Fix - adjust TH[1,2,3].Fill() method to update entries count


## Changes in 5.8.0
1. Many TGeo-related changes:
   - use TGeoManager::fVisLevel in geometry painter
   - "showtop" draw option for TGeoManager (equivalent to gGeoManager->SetTopVisible())
   - "no_screen" draw option to let ignore kVisOnScreen bits for display, checked first by default
   - radial and z-axis interactive transformation for TGeo drawings
   - improve "comp" and "compx" option to show TGeoCompositeShape components
   - support of TGeo objects embed in TCanvas
   - monitoring of TGeoManager with THttpServer
   - "rotyNN" and "rotzNN" options to TGeo painter - let customize camera position
   - context menu command to show current camera position
2. New and simpler TArrow drawing without use of svg markers, interactive movement of TArrow class
3. Support different marker styles in 3D drawings
4. Support "texte" and "texte0" draw options for TH2/TProfile2D classes
5. Provide wrong_http_response workaround (#189)
6. Update objects from list of histogram functions (#190)


## Changes in 5.7.2
1. Fix - add missing factor in TGeoPgon shape
2. Fix - correctly handle "sync" specifier in JSROOT.NewHttpRequest
3. Fix - verify that TH1/TH2 superimposing in 3D works properly
4. Fix - use provided options in JSROOT.redraw function
5. Fix - arb8 shape, used in composite


## Changes in 5.7.1
1. Fix - cover for WebVR API inconsistencies in Android devices (#184)
2. Fix - add more checks in TF1 GetParName/GetParValue methods (#185)
3. Fix - bins highlight in lego drawing with "zero" option
4. Fix - drawing tracks with geometry from TObjArray
5. Fix - interactive TGraph point move on time scale
6. Fix - arb8 shapes faces building


## Changes in 5.7.0
1. Add support of TProfile2Poly class
2. Add support of TGeoOverlap class, provide access from TGeoManager
3. Add support of TGeoHalfSpace for composites
4. Implement TF2 drawings update, see tutorials/graphics/anim.C
5. Improve windows handling in flex(ible) layout
6. Better position for text in TH2Poly drawings
7. Enable projections drawing also with TH2 lego plots
8. Use gStyle attributes to draw histogram title
9. Use requestAnimationFrame when do monitoring, improves performance
10. Support eve7 geometry viewer - render data generated in ROOT itself
11. Many adjustment with new TWebCanvas - interactivity, attributes/position updates
12. Provide initial WebVR support (#176), thanks to Diego Marcos (@dmarcos)
13. Upgrade three.js 86 -> 102, use SoftwareRenderer instead of CanvasRenderer
14. Upgrade d3.js 4.4.4 -> 5.7.0
15. Use d3.js and three.js from npm when running with node.js
16. Fix - support clipping for tracks and points in geo painter
17. Fix - drawing of TGeoNode with finder
18. Fix - key press events processed only in active pad (ROOT-9128)
19. Fix - use X0/Y0 in xtru shape (#182), thanks to @altavir
20. Move most of ui5-specific code into ROOT repository, where it will be maintained
21. Provide special widget for object inspector


## Changes in 5.6.4
1. Fix - try workaround corrupted data in TTree
2. Fix - support min0 draw option like ROOT does
3. Fix - correctly handle TH2Poly draw options
4. Fix - seldom error in JSROOT.cleanup
5. Fix - repair TTree player UI
6. Fix - error in TH3 filling
7. Fix - correctly access top element in simple layout
8. Fix - exclude duplicated points when drawing TH2 with SURF3 options


## Changes in 5.6.3
1. Fix - support clipping for tracks and points in geo painter
2. Fix - geometry with TGeoNodeOffset was not correctly drawn
3. Fix - use proper formatting for entries and integral (#179)
4. Fix - TTree::Draw for 3d histogram was not properly performed


## Changes in 5.6.2
1. Fix - correctly handle negative parameter values in TF1/TF2


## Changes in 5.6.1
1. Add TMath.BreitWigner function
2. Support custom streamers for TMaterial and TMixture (very old examples)
3. Fix Y-scale drawing of THStack (https://root-forum.cern.ch/t/31266)
4. Fix - select palette from colz element
5. Fix - LZ4 uncompression of large buffers


## Changes in 5.6.0
1. By drawing outline speed up (factor 10) canvas with many small sub-pads
2. Let configure user click and double-click handlers, extend tooltip.htm example
3. Implement workaround for standard THREE.SVGRenderer - no need for patched version
4. When producing 3D graphical images in batch, use normal THREE.CanvasRenderer
5. Use WebGL renderer in Chrome headless mode for 3D images generation
6. Provide possibility to create SVG files for canvas or frame (#172)
7. Support text drawing with TH1 bar option
8. Fix - when drawing text, reserve extra y range to show it correctly
9. Migrate to Node.js 8, do not support older versions


## Changes in 5.5.2
1. Fix - draw TH2Poly bins outline when no content specified
2. Fix - always set axis interactive handlers (#170)
3. Fix - take into account zaxis properties when drawing color palette (#171)


## Changes in 5.5.1
1. Fix - adjust v7 part to new class naming convention, started with R
2. Fix - show RCanvas title
3. New - implement 'nocache' option for JSROOT scripts loading. When specified in URL with
   JSRootCore.js script, tries to avoid scripts caching problem by adding stamp parameter to all URLs
4. New - provide simple drawing for TObjString (#164)


## Changes in 5.5.0
1. Introduce JSROOT.StoreJSON() function. It creates JSON code for the
   TCanvas with all drawn objects inside. Allows to store current canvas state
2. Support "item=img:file.png" parameter to insert images in existing layout (#151)
3. Support TTree drawing into TGraph (#153), thanks @cozzyd
4. Let configure "&toolbar=right" in URL to change position of tool buttons
5. Let configure "&divsize=500x400" in URL of size of main div element (default - full browser)
6. Implement "optstat1001" and "optfit101" draw options for histograms
7. Remove "autocol" options - standard "plc" should be used instead
8. Provide drawing of artificial "$legend" item - it creates TLegend for all primitives in pad
   Can be used when several histograms or several graphs superimposed
9. Let configure "&toolbar=vert" in URL to change orientation of tool buttons
10. Improve markers and error bars drawing for TH1/TProfile


## Changes in 5.4.3
1. Fix - draw functions also when histogram "same" option used (#159)
2. Fix - when draw histogram as markers improve optimization algorithm
3. Fix - correct histogram Y-axis range selection in logarithmic scale
4. Fix - for TH2 draw options allow combination "colztext" (#162)
5. Fix - PNG file generation with 3D drawings inside


## Changes in 5.4.2
1. Fix - take into account extra quotes in multipart http reply (#157)
2. Fix - display of labels on X axis with TProfile
3. Fix - support time display in TMultiGraph
4. Fix - correctly parse "optstat" and "optfit" in URL
5. Fix - correctly update TGraph drawing when X range is changing
6. Fix - return only TF1/TF2 object when searching function (#158)


## Changes in 5.4.1
1. Fix - monitoring mode in draw.htm page
2. Fix - zooming in colz palette
3. Fix - support both 9.x and 10.x jsdom version in Node.js (#149)
4. Fix - draw axis main line with appropriate attributes (#150)
5. Fix - use axis color when drawing grids lines (#150)
6. Fix - when set pad logx/logy, reset existing user ranges in pad
7. Fix - avoid too deep calling stack when drawing many graphs or histos (#154)
8. Fix - correctly (re)draw tooltips on canvas with many subpads


## Changes in 5.4.0
1. New supported classes:
   - TDiamond
   - TArc
   - TCurlyLine
   - TCurlyArc
   - TCrown
2. New draw options:
   - "RX" and "RY" for TGraph to reverse axis
   - "noopt" for TGraph to disable drawing optimization
   - "CPN" for TCanvas to create color palette from N last colors
   - "line" for TGraph2D
3. New features:
   - support LZ4 compression
   - tooltips and zooming in TGraphPolar drawings
   - TPavesText with multiple underlying paves
   - implement all fill styles
   - draw borders for TWbox
   - draw all objects from TList/TObjArray as they appear in list of primitives
   - let enable/disable highlight of extra objects in geometry viewer
   - draw axis labels on both sides when pad.fTick[x/y] > 1
   - make drawing of TCanvas with many primitives smoother
   - add fOptTitle, fOptLogx/y/z fields in JSROOT.gStyle
4. Behavior changes:
   - disable automatic frame adjustment, can be enabled with "&adjframe" parameter in URL
   - when drawing TH2/TH3 scatter plots, always generate same "random" pattern
   - use barwidth/baroffset parameters in lego plots
5. Bug fixes:
   - use same number of points to draw lines and markers on the TGraph
   - correctly draw filled TArrow endings
   - let combine "L" or "C" TGraph draw option with others
   - correct positioning of custom axis labels
   - correctly toggle lin/log axes in lego plot
   - let correctly change marker attributes interactively


## Changes in 5.3.5
1. Fix - correctly show histogram with negative bins and fill attributes (#143)
2. Fix - correct animation for status line (when visible)
3. Fix - correctly set lin/log settings back top TPad object
4. Fix - correctly use preloaded d3.js in notebooks/require.js environment
5. Cached Latex regex to improve drawing speed (#145)


## Changes in 5.3.4
1. Fix - several problem in TLatex preprocessing for MathJax.js
2. Fix - use "E" draw options for THStack only when no any other specified


## Changes in 5.3.3
1. Use latest jsdom and mathjax-node packages (Node.js only)


## Changes in 5.3.2
1. Fix - use FontSize when draw TLegend entries
2. Fix - correctly show TH2 overflow stats
3. Fix - tooltips handling for TH1 hbar drawings
4. Implement JSROOT.toJSON() function to produce ROOT JSON string


## Changes in 5.3.1
1. Fix - show TH2 projections also when tooltip is disabled
2. Fix - use z_handle to format Z-axis labels
3. Fix - support labels on TH3 Z axis
4. Fix - TH1 zooming in 3D mode
5. Fix - suppress empty {} in TLatex
6. Add several math symbols for TLatex
7. Fix - font kind 1 is italic times roman
8. Fix - do not let expand parent item in hierarchy
9. Fix - use correct painter to check range
10. Fix - change proper axis attributes in context menu
11. Fix - correctly show axis labels on 3D plot
12. Fix - correctly handle circle (marker style 24) as marker kind
13. Fix - correct circle drawing with coordinates rounding
14. Fix - TLatex #frac and #splitline, adjust vertical position
15. Fix - workaround for y range when fMinimum==fMaximum!=-1111
16. Fix - correct tooltips for graph with marker drawing


## Changes in 5.3.0
1. New supported classes:
    - TGraphPolar
    - TGraphTime
    - TSpline3
    - TSpline5
    - TPolyLine3D
    - TPolyMarker
    - TEfficiency
    - TH1K
2. New supported options:
     "PFC" - auto fill color (histograms and graphs)
     "PLC" - auto line color
     "PMC" - auto marker color
     "A"  - fully disables axes drawing for histograms painters
     "TEXT" - for TH2Poly
     "SAMES" - draw stat box for superimposed histograms
     "NOCOL" - ignore stored in the TCanvas colors list
     "NOPAL" - ignore stored in the TCanvas color palette
3. Improvements in existing painters:
     - use color palette stored in the TCanvas
     - draw stats box when really required
     - let resize frames and paves in all eight directions
     - support lines, boxes and arbitrary text positions in TPaveText
     - automatic title positioning of vertical axis when fTitleOffset==0
     - when pad.fTickx/y==2 draw axes labels on opposite side
     - editing of TGraph objects - moving of the graph bins
     - draw X/Y/Z axis titles in lego plots
     - use canvas Theta/Phi angles to set initial camera position in 3D plots
4. New TLatex processor supports most ROOT features, still MathJax can be used
5. New X/Y projections display for TH2 histograms (aka TH2::SetShowProjectionX/Y)
6. New in geometry viewer:
    - provide shape parameters in TGeo tooltips
    - let inspect selected TGeoNode
    - provide text info when geometry drawing takes too long
7. Change in JSROOT.draw functionality. Now valid painter instance can be only
   obtained via call-back - forth argument of JSROOT.draw() function.
8. Use latest three.js r86 with improved Projector and CanvasRenderer
   Still use own SVGRenderer which supported direct SVG text dump
9. Introduce openui5 components for webgui functionality
10. In all sources specify "use strict" directive


## Changes in 5.2.4
1. Fix - support pow(x,n) function in formula
2. Fix - use pad.fFillColor for frame when fFrameFillColor==0
3. Fix - correctly identify horizontal TGaxis with reverse scale
4. Fix - correctly handle negative line width in exclusion
5. Fix - tooltips handling for TF1


## Changes in 5.2.3
1. Fix - potential mix-up in marker attributes handling
2. Fix - unzomming of log scale https://root-forum.cern.ch/t/25889
3. Fix - ignore not-supported options in TMultiGraph https://root-forum.cern.ch/t/25888
4. Fix - correctly use fGridColor from TStyle
5. Fix - prevent error when TPaveText includes TLine or TBox in list of lines
6. Fix - bin errors calculations in TProfile


## Changes in 5.2.2
1. Fix several problems, discovered with "use strict" directive


## Changes in 5.2.1
1. Fix - correctly handle new TF1 parameter coding convention (#132)
2. Fix - Check if pad name can be used as element id (#133)
3. Fix - adjust title position for vertical axis with fTitleOffset==0


## Changes in 5.2.0
1. Basic JSROOT functionality can be used in Node.js:
       var jsroot = require("path/to/JSRootCore.js");
   One could parse ROOT JSON, read binary ROOT files (local and remote) and produce SVG.
2. Implement dropping of TTree object on the geometry drawing.
   This automatically invokes extract_geo_tracks() function, which
   should extract TGeoTracks from provided TTree.
   Example can be found in demo/alice_esd.js and in api.htm.
3. Implement projection of geometry on given plane.
   One could reuse drawing of geometry in other div (should be drawn with main option).
   In control GUI one could change position of the projection plane
4. One of the TGeo drawing can be assigned as main. When same object drawn next time,
   its drawing will be derived from the main. Useful for geometry projections.
   Also all tracks and hits will be imported from main drawing.
5. Let change background color of geo drawing.
6. One can change web browser title, providing &title="any string" in URL.
7. Introduce event status line, which is similar to ROOT TCanvas.
   Shown information similar to output in tooltip.
   One can enable both tooltips and status line at the same time.
8. Introduce JSROOT.GEO.build function to create three.js model for
   any supported TGeo class. Such model can be inserted in any three.js scene
   independent from normal JSROOT drawings.
9. Improve rendering of geometries with transparency. Use EVE approach, when transparent
   objects rendered after opaque and without writing depth buffer. Provide different
   methods to produce render order for transparent objects.
10. Let specify initial zoom factor for geometry like opt=zoom50.
11. Support also TPolyMarker3D class in geo painter.
12. Implement TGeoScaledShape.
13. Limit complexity of composite shape. If it has too many components, only most left is used.
14. When produce canvas or pad screenshot, render 3D objects with SVGRenderer.
    Allows to combine 2D and 3D objects in same PNG image
15. Improve MathJax.js output. It scales correctly in Firefox, makes correct alignment
    and works significantly faster.
16. When creating image in SVG format, correctly convert url("#id") references
17. Use latest three.js r85
18. Fix 'transpXY' URL parameter handling - it was used as opacity, but opacity=1-transparency


## Changes in 5.1.2
1. Fix - support newest TFormula in TF1 (#127)
2. Fix - ignore NaN value in saved TF1 buffer
3. Fix - correctly treat transparency in geo painter
4. Fix - disable useFontCache for SVG mathjax output
5. Fix - produce PNG image for objects with special symbols in names


## Changes in 5.1.1
1. Fix - invoke callback in JSROOT.draw() at proper time
2. Fix - support TGeoHMatrix, produced after GDML conversion
3. Fix - support also TGeoScale and TGeoGenTrans matrices
4. Fix - update histograms with all provided functions (#125)


## Changes in 5.1.0
1. New 'float' browser kind overlays with objects drawing
2. Browser can be enabled after drawing with 'nobrowser' mode
3. One can hide browser or switch browser kind at any time
4. New 'horizontal' and 'vertical' layouts for object display.
   One could configure several frames, each divided on sub-frames.
   Like display=horiz231 will create three horizontal frames,
   divided on 2,3 and 1 sub-frames.
5. One could enable status line where current tooltip info will be shown
6. Improve enlarge functionality - now works with all layouts
7. Do not display all canvas tool buttons by default - provide toggle button instead
8. Let move TAxis title, its position now similar to ROOT graphics
9. Support 'col0' option for TH2Poly class to suppress empty bins
10. Implement for TH3 'box2', 'box3', 'glbox2', 'glcol' draw options
11. Support more superscript/subscript letters in normal text output
12. Correctly handle unzoom with logx/logy scales
13. Let disable stamp parameter in file url with "-" sign at the end of file name
14. Let use quotes in the URL parameters to protect complex arguments with special symbols
15. Introduce direct streamers - like TBasket or TRef
    Benefit - one can add custom streamers of such kind or reuse existing
16. Handle TMatrixTSym classes in I/O
17. Correctly count TH3 statistic in TTree::Draw
18. Recognize bower installation when "bower_components/jsroot/scripts" string
    appears in the script path (#120)


## Changes in 5.0.3
1. Fix - prevent exception when discover HTML element position (#121)
2. Fix - prevent I/O failure when server automatically gzip response (#119)
3. Fix - lego drawing for stacked TH1 histograms
4. Fix - when change global tooltips settings, also change for each sub-pad


## Changes in 5.0.2
1. Fix - read branch entries as arrays
2. Fix - command submission to THttpServer
3. Fix - let refill statbox also for empty histogram
4. Fix - problem with online TTree::Draw and ROOT6


## Changes in 5.0.1
1. Support older ROOT files, created before 2010
2. Support TBranchObject - appears in old files
3. Correctly set TBasket buffer position for the entry
4. Fix - problem with empty STL containers
5. Fix - empty baskets at the end of branch store
6. Fix - problem with zooming in THStack


## Changes in 5.0.0
1. Reading TTree data
    - all kinds of branches, including split STL containers
    - branches with several elementary leaves
    - branches from different ROOT files
    - JSROOT.TSelector class to access TTree data
    - simple access to branch data with "dump" draw option
2. TTree::Draw support
    - simple 1D/2D/3D histograms
    - simple cut conditions
    - configurable histogram like "px:py>>hist(50,-5,5,50,-5,5)"
    - strings support
    - iterate over arrays indexes, let use another branch as index values
    - support "Entry$" and "Entries$" variables in expressions
    - bits histogram like "event.fTracks.fBits>>bits(16)"
    - special handling of TBits
    - arbitrary math function from JavaScript Math class, some TMath:: function from ROOT
    - if branch is object, one could use methods "TMath::Abs(lep1_p4.X()+lep1_p4.Y())"
    - interactive player to configure and execute draw expression
3. Full support of Float16_t and Double32_t types in I/O
4. Drawing of RooPlot objects, I/O support for RooFit classes
5. Many improvements in object inspector
    - support of large lists; only first part is shown
    - support of large arrays; values group in decades
    - allow to call draw function for sub-elements in inspector
6. Canvas or selected sub-pad can be enlarged when double-clicked outside frame (#116)
   Complete drawing will be expanded to the visible space.
   Not available for flex, tabs and collapsible layouts.
7. Support reading of local ROOT files with HTML5 FileReader.
   Files can be selected only with interactive dialog.
8. Combine "Ctrl" and "Shift" keys with mouse click on the items:
     - with Shift key typically object inspector will be activated
     - with Ctrl key alternative draw options will be used (like colz for TH2)
9. Update libraries
      - d3.js     - 4.4.4
      - three.js  - 84
      - jquery    - 3.3.1
      - jquery-ui - 1.12.1


## Changes in 4.8.2
1. Support compressed array, produced with newest TBufferJSON
   - $arr field identify such array and contains data type
   - native arrays are used when decoding such array
   - zero values are not stored
   - many similar values stored as one with repetition factor
   - position stored only when differ from produced with previous block
   - array [3,3,3,3,3,3,1,2,2,2,2,2,2,2] compressed as {$arr:"Int",len:14,v:3,n:6,v1:1,v2:2,n2:7}


## Changes in 4.8.1
1. Support new JSON format, produced with newest TBufferJSON
   - object references stored as {"$ref":12}
   - pair objects for std::map marked with "$pair" : "pair<type1,type2>" data member
   - old JSON format will be recognized automatically and supported as well
2. Fix - better selection of Y range for log scale
3. Provide JSROOT.parse_multi function to correctly parse response of multi.json request,
   support it in the JSROOT.NewHttpRequest method as well.
4. Fix - correctly calculate integral for TH1
5. Partially support new TFormula with complex C code inside


## Changes in 4.8.0
1. Many improvements in the I/O part
   - support most of STL containers
   - support TMap and TClonesArray containers
   - all kind of multidimensional arrays
   - correct treatment of foreign classes
   - supports different versions of class in the same file
   - support members like ClassName* fField; //[fCnt]
   - support const char*
   - support fixed-size array of TString, TObject and TNamed
2. Many new draw options for different classes are supported:
    - TGraph  - 'z', 'x', '||', '[]', '>', '|>', '5', 'X+', 'Y+'
    - TH1     - '*', 'L', 'LF2', 'B', 'B1', 'TEXT', 'E0', 'E3', 'E4', 'EX0', 'X+', 'Y+'
    - TH2     - 'E', 'col1', 'box', 'box1', 'surf3', 'surf7', 'base0'
    - TH2     - 'same' with 'box', 'col', 'cont', 'lego', 'surf'
    - TH3     - 'scat', use by default
    - TF1/TF2 - 'nosave' to ignore saved buffer
    - TCanvas - logx/y/z, gridx/y, tickx/y
    - THStack - 'lego' and other 3D draw options
3. Implement drawing of TProfile2D, TF2, TGraph2D, TGraph2DErrors and TMarker
4. Fix - correctly place TGAxis relative to frame (when exists)
5. When superimpose items, one can specify individual options
     ...&item=histo1+histo2&opt=hist+e1
     ...&item=[histo1,histo2]&opt=[hist,e1]
6. Support loading of TStyle object, providing in URL
     ...&style=item_name  or ...&style=json_file_name
   All values are copied directly to JSROOT.gStyle object.
7. Add callback argument into JSROOT.draw() function.
   Function will be called after drawing of object is completed.
   Painter for drawn object will be provided as first argument (or null in case of error).
8. Improve cleanup of JSROOT objects


## Changes in 4.7.1
1. Workaround for MathJax output - scaling not always works in Firefox
2. Fix - bin scaling for box draw option for TH2 and TH3 histograms
3. Fix - increase points limits for contour plots
4. Fix - position of 3D canvas in WebKit browsers
5. Fix - use abs bin content in RMS calculations
6. Fix - support char star* and object arrays in I/O
7. Fix - correct decoding of TAxis time offset
8. Fix - checksum reading for foreign classes


## Changes in 4.7.0
1. Implement simple TTree::Draw over single leaf (#80)
   Support basic types, fixed-size arrays and several vector types
2. Display of TEveTrack(s) and TEvePointSet(s) over drawn geometry (drag and drop)
   Also browsing, toggling, highlight of tracks and hits are done.
3. Let set default geo colors as TGeoManager::DefaultColors() does
4. Let use original ROOT macros to configure visibility of geometry volumes. Like:
     &file=files/alice2.root&item=Geometry;1&opt=macro:macros/geomAlice.C
   One can set default colors or colors/transparency for selected volumes.
   Also volume, selected for drawing in the macro, will be used in the JSROOT
5. Support drawing of TH2Poly class with 'col' and 'lego' options
6. Implement 'CONT', 'ARR' and 'SURF' draw options for TH2 class
7. Support basic drawing of TPolyLine class
8. Interactive axis zooming in 3D with mouse, very much like to 2D
9. Zooming and tool buttons via keyboards


## Changes in 4.6.0
1. Improvements in TGeo drawings
   - support of large (~10M volumes) models, only most significant volumes are shown
   - one could activate several clip planes (only with WebGL)
   - interaction with object browser to change visibility flags or focus on selected volume
   - support of floating browser for TGeo objects
   - intensive use of HTML Worker to offload computation tasks and keep interactivity
   - enable more details when changing camera position/zoom
   - better and faster build of composite shapes
2. Improvements in histograms 3D drawing
   - all lego options: lego1..lego4, combined with 'fb', 'bb', '0' or 'z'
   - support axis labels on lego plots
   - support lego plots for TH1
3. Improvements in all 3D graphics
   - upgrade three.js to r79
   - use of THREE.BufferGeometry for all components
   - significant (up to factor 10) performance improvement
4. Implement box and hbox draw options for TH1 class
5. Implement drawing of axes ticks on opposite side (when fTickx/y specified)
6. Preliminary support of candle plot (many options to be implemented)
7. Update draw attributes (fill/line/position) when monitor objects


## Changes in 4.5.3
1. Fix - position of TFrame in canvas/pad
2. Fix - use histogram fMinimum/fMaximum when creating color palette
3. Fix - correctly draw empty th2 bins when zmin<0 is specified
4. Fix - limit th2 text output size
5. Fix - use histogram fMinimum/fMaximum when drawing z axis in lego plot
6. Fix - error in TGeoCtub shape creation
7. Fix - error in pcon/pgon shapes when Rmin===0


## Changes in 4.5.1
1. Fix - correctly handle ^2..^9 in TFormula equations
2. Fix - support TMath::Gaus in TFormula
3. Fix - correctly display ^2 and ^3 in SVG text output
4. Fix - do not show tooltips for empty TProfile bins
5. Fix - statbox toggling was not working on subpads
6. Fix - positioning of 3D objects in Webkit browsers in complex layouts
7. Fix - difference in TF1 between ROOT5/6 (#54)


## Changes in 4.5.0
1. Zooming with mouse wheel
2. Context menus for many different objects attributes are provided
3. Context menu for every drawn object can be activated via toolbar button
4. Support browsing of TTask and derived classes (#40)
5. Apply user range for drawing TH1/TH2 histograms, also when superimposed (#44)
6. Implement scaling factor like x10^3 on the vertical axes
7. Provide shortcut buttons for each subpad
8. Implement simple drawing for TBox, TWbox, TSliderBox classes


## Changes in 4.4.4
1. Fix - toggling of statbox was not working in all situations
2. Fix - for mouse rect zooming use only left mouse button
3. Fix - correctly draw TH2 with lego option, when histogram has negative bin content
4. Fix - log axis drawing with no visible ticks


## Changes in 4.4.3
1. Fix - wrong selection of TH1 Y axis range when errors are displayed (#44)
2. Fix - apply user range for TH1 X-axis zooming (#44)
3. Fix - protect against pathological case of 1-bin histogram
4. Fix - use error plot by default in TH1 only when positive sumw2 entry exists
5. Fix - for TH2 box draw option draw at least 1px rect for non-empty bin
6. Fix - support transparency (alpha) in TColor (#45)
7. Fix - correct tooltip handling for graphs with lines and markers
8. Fix - interactive zooming in TH2 when doing histogram update


## Changes in 4.4.2
1. Fix - statistic collection for TH2
2. Fix - correct handling of empty TList in browser/inspector
3. Fix - support TFolder in browser/inspector (#40)


## Changes in 4.4.1
1. Fix - colz palette resize when drawing histogram second time
2. Fix - use embedded in TCanvas color for background color of canvas itself
3. Fix - rotate too long X axis text labels
4. Fix - draw histogram bins on frame boundary
5. Fix - use alternative color for shapes with default black color
6. Fix - correctly handle pcon/pgon shape with rmin==rmax on top or bottom side


## Changes in 4.4
1. Fix faces orientation for all TGeo shapes.
2. Improve TGeoTorus creation - handle all parameters combinations
3. Implement TGeoCompositeShape, using ThreeCSG.js
4. Fix problem with color palette when switch to 3D mode (#28)
5. Use nested CSS classes to avoid conflicts with other libraries (#29)
6. Let move and resize TFrame
7. Improve TH1/TH2 drawings
   - draw all histograms points in the range (no any skipped bins)
   - minimize SVG code for drawing (up to factor 100)
   - gives significant speedup in drawings
8. SVG code improvement for TGraph, TF1, TAxis drawings
9. Provide new tooltip kind
   - created only when needed (minimizing SVG code)
   - tooltip can be drawn for every object in the frame
   - touch devices are supported
10. Fix - let draw same object on the canvas with different options
11. Create cached list of known class methods. It can be extended by users.
12. Use of cached methods improves binary I/O performance by 20%
13. Support TGaxis
14. Project now can be obtained via 'bower install jsroot'
15. Support 'scat' and 'text' draw options for TH2
16. Support in binary I/O zipped buffer bigger than 16M
17. Correctly handle in binary I/O pointer on TArray object (like in THnSparseArrayChunk)


## Changes in 4.3
1. Implement TGeoCtub, TGeoParaboloid and TGeoHype shapes
2. Support TGeoTube with Rmin==0
3. Exclude empty faces in TGeoArb8
4. Improve TGeoSphere creation - handle all parameters combinations
5. Introduce JSROOT.cleanup() function to safely clear all drawn objects
6. Fix wrong resize method in 'tabs' and 'collapsible' layouts
7. Fix canvas resize problem (issue #27)
8. Fix zero-height canvas when draw TGeo in collapsible layout
9. Fix problem of simultaneous move TGeo drawings and canvas in flexible layout


## Changes in 4.2
1. Significant performance improvements in 3D drawings - TGeo/TH2/TH3
2. Implement TGeoPara, TGeoGtra, TGeoXtru and TGeoEltu shapes
3. Optimize (reduce vertices number) for others TGeo shapes
4. Correct rotation/translation/scaling of TGeo nodes
5. Workaround for axis reflection (not directly supported in three.js)
6. Support array of objects in I/O (like in TAxis3D)
7. Correct reading of multi-dim arrays like Double_t fXY[8][2];
8. Provide canvas toolbar for actions like savepng or unzoom
9. Implement JSROOT.resize() function to let resize drawing after changes in page layout
10. Fix error with title display/update


## Changes in 4.1
1. Introduce object inspector - one could browse object members of any class
2. Let draw sub-items from TCanvas list of primitives like sub-pad or TLatex
3. Provide possibility to save drawn SVG canvas as PNG
4. TGraph drawing optimization - limit number of drawn points
5. Implement painter for TPolyMarker3D
6. Improve drawing and update of TMultiGraph
7. Reorganize 3D drawing of TH2/TH3 histograms, allow to mix 2D and 3D display together
8. Support overlay of 3D graphic over SVG canvas (used for IE)
9. Fix problems and improve flex(ible) layout


## Changes in 4.0
1. New TGeo classes support:
   - browsing  through volumes hierarchy
   - changing visibility flags
   - drawing of selected volumes
2. New 'flex' layout:
   - create frames like in Multi Document Interface
   - one could move/resize/minimize/maximize such frames
3. Significant (factor 4) I/O performance improvement:
   - use ArrayBuffer class in HTTP requests instead of String
   - use native arrays (like Int32Array) for array data members
   - highly optimize streamer infos handling
4. TH2 drawing optimization:
   - if there are too many non-empty bins, combine them together
   - when zoom-in, all original bins will be displayed separately
   - let draw big TH2 histogram faster than in 1 sec
   - optimization can be disabled by providing '&optimize=0' in URL
5. TF1 drawing optimization:
   - function 'compiled' only once
6. Reorganize scripts structure:
   - move all math functions to JSRootMath.js
   - TH2, TF1, THStack and TMultiGraph painters moved into JSRootPainter.more.js script
   - reduce size of scripts required for default functionality
7. Update all basic libraries:
    - d3.js - v3.5.9,
    - jquery.js - v2.1.4,
    - jquery-ui.js - v1.11.4,
    - three.js - r73
8. Implement ROOT6-like color palettes:
    - all palettes in range 51...112 are implemented
    - by default palette 57 is used
    - one could change default palette with '&palette=111' in URL
    - or palette can be specified in draw option like '&opt=colz,pal77'


## Changes in 3.9
1. Support non-equidistant bins for TH1/TH2 objects.
2. Display entries count from histo.fEntries member, only when not set use computed value
3. Support italic and bold text when used with MathJax
4. Improve TF1 drawing - support exp function in TFormula, fix errors with logx scale, enable zoom-in, (re)calculate function points when zooming
5. Support several columns in TLegend
6. Introduce context menus for x/y axis, add some items similar to native ROOT menus
7. Introduce context menu for TPaveStats, let switch single elements in the box
8. Enable usage of all context menus on touch devices
9. Implement JSROOT.Math.Prob function, provides probability value in stat box
10. Introduce context menu for color palette (z axis)
11. Implement col0 and col0z draw option for TH2 histograms, similar to ROOT6


## Changes in 3.8
1. Let use HTML element pointer in JSROOT.draw function like:
       JSROOT.draw(document.getElementsByTagName("div")[0], obj, "hist");
   Normally unique identifier was used before, which is not required any longer.
   Of course, old functionality with element identifier will work as well.
2. TreePlayer can also be used for trees, which not yet read from the file.
   Requires appropriate changes in TRootSniffer class.
3. Fix error in I/O with members like:   `Double_t *fArr; //[fN]`
4. Introduce JSROOT.OpenFile function. It loads I/O functionality automatically,
   therefore can be used directly after loading JSRootCore.js script
5. Same is done with JSROOT.draw function. It is defined in the JSRootCore.js
   and can be used directly. Makes usage of JSROOT easier
6. Introduce JSRootPainter.more.js script, where painters for auxiliary classes
   will be implemented.
7. Implement painter for TEllipse, TLine, TArrow classes
8. Fix several problems with markers drawing; implement plus, asterisk, mult symbols.
9. Implement custom layout, which allows to configure user-defined layout for displayed objects
10. Fix errors with scaling of axis labels.
11. Support also Y axis with custom labels like: http://jsroot.gsi.de/dev/?nobrowser&file=../files/atlas.root&item=LEDShapeHeightCorr_Gain0;1&opt=col


## Changes in 3.7
1. Support of X axis with custom labels like: http://jsroot.gsi.de/dev/?nobrowser&json=../files/hist_xlabels.json
2. Extend functionality of JSROOT.addDrawFunc() function. One could register type-specific
   `make_request` and `after_request` functions; `icon`, `prereq`, `script`, `monitor` properties.
   This let add more custom elements to the generic gui, implemented with JSROOT.HierarchyPainter
3. Provide full support of require.js. One could load now JSRootCore.js script like:

      <script type="text/javascript" src="require.js" data-main="scripts/JSRootCore.js"></script>

   After this several modules are defined and can be used with syntax like:

      require(['JSRootPainter'], function(jsroot) { /*any user code*/});

   Also inside JSROOT require.js used to load all dependencies.


## Changes in 3.6
1. Try to provide workaround for websites where require.js already loaded.
   This makes problem by direct loading of jquery and jquery-ui
2. Provide workaround for older version of jquery-ui
3. Prompt for input of command arguments
4. After command execution one could automatically reload hierarchy (_hreload property) or
   update view of displayed object (_update_item property)
5. Use HierarchyPainter for implementing draw.htm. This let us handle
   all different kinds of extra attributes in central place
6. Fix problem in tabs layout - new tab should be add to direct child
7. When drawing several tabs, activate frame before drawing - only then
   real frame size will be set
8. Fix problem with GetBBox - it only can be used for visible elements in mozilla.
9. Support drawing of fit parameters in stat box, use (as far as possible) stat and
   fit format for statistic display
10. Implement 'g' formatting kind for stat box output - one need to checks
    significant digits when producing output.
11. Support new draw options for TGraph: 'C', 'B1', '0', '2', '3', '4', '[]'
12. Primary support for STL containers in IO part. Allows to read ROOT6 TF1.
13. Full support of TGraphBentErrors
14. Support objects drawing from JSON files in default user interface, including
    monitoring. One could open file from link like: https://root.cern.ch/js/dev/?json=demo/canvas_tf1.json
15. Introduce JSROOT.FFormat function to convert numeric values into string according
    format like 6.4g or 5.7e. Used for statistic display.


## Changes in 3.5
1. Fix error in vertical text alignment
2. Many improvements in TPaletteAxis drawing - draw label, avoid too large ticks.
3. Fix error with col drawing - bin with maximum value got wrong color
4. Test for existing jquery.js, jquery-ui.js and d3.js libraries, reuse when provided
5. Fix several I/O problems; now one could read files, produced in Geant4
6. Implement 'e2' drawing option for TH1 class,
   use by default 'e' option when TH1 has non-empty fSumw2
7. Reuse statistic from histogram itself, when no axis selection done
8. Support log/lin z scale for color drawing
9. Implement interactive z-scale selection on TPaletteAxis
10. Allow to redraw item with other draw options (before one should clear drawings)
11. Several improvements in THttpServer user interface - repair hierarchy reload,
    hide unsupported context menu entries, status line update


## Changes in 3.4
1. Support usage of minimized versions of .js and .css files.
   Minimized scripts used by default on web servers.
2. Implement JSROOT.extend instead of jQuery.extend, reduce
   usage of jquery.js in core JSROOT classes
3. Implement main graphics without jquery at all,
   such mode used in `nobrowser` mode.
4. Provide optional latex drawing with MathJax SVG.
   TMathText always drawn with MathJax,
   other classes require `mathjax` option in URL
5. Improve drawing of different text classes, correctly handle
   their alignment and scaling, special handling for IE
6. Fix error with time axes - time offset was not correctly interpreted


## Changes in 3.3
1. Use d3.time.scale for display of time scales
2. Within JSRootCore.js script URL one could specify JSROOT
   functionality to be loaded: '2d', '3d', 'io', 'load', 'onload'.
   Old method with JSROOT.AssertPrerequisites will also work.
3. With THttpServer JSROOT now provides simple control functionality.
   One could publish commands and execute them from the browser
4. One could open several ROOT files simultaneously
5. Add 'simple' layout - drawing uses full space on the right side
6. Allow to open ROOT files in online session (via url parameter)
7. One could monitor simultaneously objects from server and root files
8. Implement 'autocol' draw option  - when superimposing histograms,
   their line colors will be automatically assigned
9. Implement 'nostat' draw option - disabled stat drawing
10. Using '_same_' identifier in item name, one can easily draw or superimpose
    similar items from different files. Could be used in URL like:
      `...&files=[file1.root,file2.root]&items=[file1.root/hpx, file2.root/_same_]`
      `...&files=[file1.root,file2.root]&item=file1.root/hpx+file2.root/_same_`
    Main limitation - file names should have similar length.
11. When 'autozoom' specified in draw options, histogram zoomed into
    non-empty content. Same command available via context menu.
12. Item of 'Text' kind can be created. It is displayed as
    plain text in the browser. If property 'mathjax' specified,
    MathJax.js library will be loaded and used for rendering.
    See httpcontrol.C macro for example.
13. When using foreignObject, provide workaround for absolute positioning
    problem in Chrome/Safari, see <http://bit.ly/1wjqCQ9>


## Changes in 3.2
1. Support JSON objects embedding in html pages, produced by THttpServer
2. For small resize of canvas use autoscale functionality of SVG. Only when
   relative changes too large, redraw complete canvas again.
3. Use touch-punch.min.js to process touch events with jquery-ui
4. Even when several TH1/TGraph/TF1 objects with fill attribute overlap each other,
   one able to get tooltip for underlying objects
5. Use jquery-ui menu for context menu
6. From context menu one could select several options for drawing
7. Provide user interface for executing TTree::Draw on THttpServer
8. 3D graphic (three.js) works only with IE11


## Changes in 3.1
1. Correctly show tooltips in case of overlapped objects
2. Implement JSROOT.create() method to create supported
   in JavaScript ROOT classes like TH1 or TGraph
3. Fix problem with JSROOT.draw in HTML element with zero width (display:none)
4. Provide possibility to load user scripts with JSROOT.BuildSimpleGUI
   and JSROOT.AssertPrerequisites, also with main index.htm
5. Support of TCutG drawing
6. Implement hierarchy display (former dtree) with jQuery
7. Fix several problems in drawing optimization
8. Implement dragging objects from hierarchy browser into existing canvas
   to superimpose several objects
9. Implement col2 and col3 draw options, using html5 canvas
10. Support 'p' and 'p0' draw options for TH1 class


## Development of version 3.0

### November 2014
1. Better font size and position in pave stats
2. Resize/move of element only inside correspondent pad
3. Adjust of frame size when Y-axis exceed pad limits
4. Correct values in tooltip for THStack
5. Exclude drawing of markers from TGraph outside visible range
6. Drawing of canvas without TFrame object
7. Many other small bug fixes and improvements, thanks to Maximilian Dietrich

### October 2014
1.  Add "shortcut icon"
2.  Add demo of online THttpServer - shell script copies data from
    running httpserver.C macro on Apache webserver
3.  Evaluate 'monitoring' parameter for online server like:
      <http://localhost:8080/?monitoring=1000>
    Parameter defines how often displayed objects should be updated.
4.  Implement 'opt' and 'opts' URL parameters for main page.
5.  Show progress with scripts loading in the browser window
6.  When one appends "+" to the filename, its content read completely with first I/O operation.
7.  Implement JS custom streamer for TCanvas, restore aspect ratio when drawing
8.  Major redesign of drawing classes. Resize and update of TCanvas are implemented.
    All major draw functions working with HTML element id as first argument.
9.  Extract 3D drawings into separate JSRoot3DPainter.js script
10. Use newest three.min.js (r68) for 3D drawings, solves problem with Firefox.
11. Introduce generic list of draw functions for all supported classes.
12. Add possibility to 'expand' normal objects in the hierarchy browser.
    For instance, this gives access to single elements of canvas,
    when whole canvas cannot be drawn.
13. Correct usage of colors map, provided with TCanvas.
14. Introduce JSROOT.redraw() function which is capable to create or update object drawing.
15. In main index.htm page browser can be disabled (nobrowser parameter) and
    page can be used to display only specified items from the file
16. Add support of TPolyMarker3D in binary I/O

### September 2014
1. First try to handle resize of the browser,
   for the moment works only with collapsible layout
2. Also first try to interactively move separation line between
   browser and drawing field.
3. Small fix of minor ticks drawing on the axis
4. Introduce display class for MDI drawing. Provide two implementations -
   'collapsible' for old kind and 'tabs' for new kinds.
5. Adjust size of color palette drawing when labels would take more place as provided.
6. Add correct filling of statistic for TProfile,
   fix small problem with underflow/overflow bins.
7. Provide way to select display kind ('collapsible', 'tabs') in the simple GUI.
8. Implement 'grid' display, one could specify any number of division like
   'grid 3x3' or 'grid 4x2'.
9. MDI display object created at the moment when first draw is performed.
10. Introduce painter class for TCanvas, support resize and update of canvas drawing
11. Resize almost works for all layouts and all objects kinds.
12. Implement JSROOT.GetUrlOption to extract options from document URL.
13. Provide example fileitem.htm how read and display item from ROOT file.
14. In default index.htm page one could specify 'file', 'layout',
    'item' and 'items' parameters like:
      <http://root.cern.ch/js/3.0/index.htm?file=../files/hsimple.root&layout=grid3x2&item=hpx;1>
15. Support direct reading of objects from sub-sub-directories.
16. Introduce demo.htm, which demonstrates online usage of JSROOT.
17. One could use demo.htm directly with THttpServer providing address like:
     <http://localhost:8080/jsrootsys/demo/demo.htm?addr=../../Files/job1.root/hpx/root.json.gz&layout=3x3>
18. Also for online server process url options like 'item', 'items', 'layout'
19. Possibility to generate URL, which reproduces opened page with layout and drawn items

### August 2014
1. All communication between server and browser done with JSON format.
2. Fix small error in dtree.js - one should always set
   last sibling (_ls) property while tree can be dynamically changed.
3. In JSRootCore.js provide central function, which handles different kinds
   of XMLHttpRequest.  Use only async requests, also when getting file header.
4. Fully reorganize data management in file/tree/directory/collection hierarchical
   display. Now complete description collected in HPainter class and decoupled from
   visualization, performed with dTree.js.
5. Remove all global variables from the code.
6. Automatic scripts/style loading handled via JSROOT.loadScript() function.
   One can specify arbitrary scripts list, which asynchronously loaded by browser.
7. Method to build simple GUI changed and more simplified :). The example in index.htm.
   While loadScript and AssertPrerequisites functions moved to JSROOT, one
   can easily build many different kinds of GUIs, reusing provided JSRootCore.js functions.
8. In example.htm also use AssertPrerequisites to load necessary scripts.
   This helps to keep code up-to-date even by big changes in JavaScript code.
9. Provide monitoring of online THttpServer with similar interface as for ROOT files.
10. Fix several errors in TKey Streamer, use member names as in ROOT itself.
11. Keep the only version identifier JSROOT.version for JS code
12. One can specify in JSROOT.AssertPrerequisites functionality which is required.
    One could specify '2d', 'io' (default) or '3d'.
13. Use new AssertPrerequisites functionality to load only required functionality.
14. When displaying single element, one could specify draw options and monitor property like:
        <http://localhost:8080/Files/job1.root/hpxpy/draw.htm?opt=col&monitor=2000>
     Such link is best possibility to integrate display into different HTML pages,
     using `<iframe/>` tag like:
        `<iframe src="http://localhost:8080/Files/job1.root/hpx/draw.htm"`
          `style="width: 800px; height:600px"></iframe>`
15. Remove 'JSROOTIO.' prefix from _typename. Now real class name is used.
16. Use in all scripts JSROOT as central 'namespace'
17. Introduce context menu in 3D, use it for switch between 2D/3D modes
18. Use own code to generate hierarchical structure in HTML, replace dtree.js which is
    extremely slow for complex hierarchies. Dramatically improve performance for
    structures with large (~1000) number of items.
19. Deliver to the server title of the objects, display it as hint in the browser.
20. Better handling of special characters in the hierarchies - allows to display
    symbols like ' or " in the file structure.

### July 2014
1. Migration to d3.v3.js and jQuery v2.1.1
2. Fix errors in filling of histogram statbox
3. Possibility of move and resize of statbox, title, color palete
4. Remove many (not all) global variables
5. Example with direct usage of JSRootIO graphics
6. Example of inserting ROOT graphics from THttpServer into `<iframe></iframe>`

### May 2014
1. This JSRootIO code together with THttpServer class included
   in ROOT repository

### March 2014
1. Introduce TBuffer class, which plays similar role
   as TBuffer in native ROOT I/O. Simplifies I/O logic,
   reduce duplication of code in many places, fix errors.
   Main advantage - one could try to keep code synchronous with C++.
2. Avoid objects cloning when object referenced several times.
3. Treat special cases (collection, arrays) in one place.
   This is major advantage, while any new classes need to be implemented only once.
4. Object representation, produced by JSRootIO is similar to
   objects, produced by TBufferJSON class. By this one can exchange
   I/O engine and use same JavaSctript graphic for display.
5. More clear functions to display different elements of the file.
   In the future functions should be fully separated from I/O part
   and organized in similar way as online part.
6. Eliminate usage of gFile pointer in the I/O part.
7. Provide TBufferJSON::JsonWriteMember method. It allows to stream any
   selected data member of the class. Supported are:
   basic data types, arrays of basic data types, TString, TArray classes.
   Also any object as data member can be streamed.
8. TRootSniffer do not creates sublevels for base classes
