# jsPDF

## Original code

https://github.com/parallax/jsPDF

## Modiufication in original version

https://github.com/linev/jsPDF/commits/jsroot/

1. Do not create exception when unicode map missing in font - used for symbols
2. Provide directly atob/btoa for node and browser
3. Do not expose build date
4. Comment out svg.js, html.js, fileloading.js - not used with svg2pdf
5. Remove API.save
6. Remove 'fflate' from externals - include into build

## How to build

    npm install
    npm run build
    sed '$ d' ./dist/jspdf.es.min.js > ~/git/jsroot/modules/jspdf.mjs

Last line remove reference on map

