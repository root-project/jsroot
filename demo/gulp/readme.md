# Packaging of JSROOT code with gulp

This example shows how all JSROOT sources can be 
merged togther with all dependend libraries. 
This uses bower, Node.js and gulp.
Following steps are required:


## Correctly provide JSROOT location in bower.json file

In the example dev version is used. 
One also can specify stable release after "5.2.0" like:

    "dependencies": { "jsroot": "^5.2.0" }
    
For experimental purposes one can configure local checkout of jsroot

    "dependencies": { "jsroot": "file:///home/user/git/jsroot/.git#dev" }

    
## Install jsroot package with bower

    [shell] bower install jsroot


## Install gulp and all dependend packages
 
 All required packages contained in package.json file 

    [shell] npm install


## Create library with gulp

 Source code of gulp script one can find in gulpfile.js

    [shell] node node_modules/gulp/bin/gulp.js
    
Script should produce "build/js/lib.js" and "build/css/lib.css"     


## Open example web page

One can browser directly from the file system <file:///home/user/git/jsroot/demo/gulp/exampole.htm>


## Known issues

MathJax.js is not always working - LaTeX can be browken. 
It is not fully clear how to load MathJax with such scheme.  