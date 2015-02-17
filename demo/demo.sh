#!/bin/bash

# Script produce json files for demo

tgtdir=~/web-docs/js/3.3/demo

rm -f *.json $tgtdir/*.json

root -b demo.C -q

cp .htaccess *.htm *.json $tgtdir

rm -f *.json
