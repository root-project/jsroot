# Use of JSROOT with Node.js

JSROOT is provided as npm module and always can be installed as:

    npm install jsroot

After this JSROOT functionality can be used from Node.js scripts via:

    import { openFile } from "jsroot/io";
    import { makeSVG } from "jsroot/draw";

Provided package.json file allows to use demos directly with local jsroot installation:

    npm install

Main motivation to use JSROOT from Node.js is creation of SVG files.
Examples <makesvg.js> or <geomsvg.js> you will find in this directory. Just call them:

    node makesvg.js
    node geomsvg.js

JSROOT also provides possibility to read arbitrary TTree data without involving
any peace of native ROOT code. <tree_dump.js> demonstrate how simple dump of TTree
data can be done:

    node tree_dump.js

JSROOT also implements extensive tree-draw functionality, shown in <tree_draw.js> example:

    node tree_draw.js

Possibility to read TTree data, using `TSelector` class shown in <selector.js> example:

    node selector.js
