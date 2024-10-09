# jsPDF

## Original code

https://github.com/parallax/jsPDF

## Modification in original version

https://github.com/linev/jsPDF/commits/jsroot/

1. Do not create exception when unicode map missing in font - used for symbols
2. Provide directly atob/btoa for node and browser
3. Do not expose build date
4. Comment out svg.js, html.js, fileloading.js - not used with svg2pdf
5. Remove API.save
6. Remove 'fflate' from externals - include into build
7. Remove several outpus - code with </script> confuses browser when loaded directly

## How to build

    npm install
    npm run build
    sed '$ d' ./dist/jspdf.es.min.js > ~/git/jsroot/libs/jspdf.mjs
    sed '$ d' ./dist/jspdf.es.js > ~/git/jsroot/modules/base/jspdf.mjs

Command `sed '$ d'` removes last line in the script which referencing map

