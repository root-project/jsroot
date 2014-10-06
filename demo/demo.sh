#!/bin/bash

# Script used to produce number of html/json/xml files, which emulates behaviour of THttpServer
# before script is running, one should run tutorials/http/httpserver.C macro on the same machine
# macro starts http server with address http://localhost:8080
# This script will create number of files, which could be later copied on the web server to demonstrate 
# functionality of THttpServer without need to run server itself. Of course, one should understand that
# objects content will not change on such static server

server=http://localhost:8080

rm -rf index.htm h.xml h.json StreamerInfo Canvases Files

sed 's/\/jsrootsys/../g' ../files/online.htm > index.htm
wget $server/h.xml -O h.xml
wget $server/h.json -O h.json
mkdir -p StreamerInfo; wget $server/StreamerInfo/root.json.gz?compact=3 -O StreamerInfo/root.json.gz
mkdir -p Canvases/c1; wget $server/Canvases/c1/root.json.gz?compact=3 -O Canvases/c1/root.json.gz
mkdir -p Files/job1.root/hpx; wget $server/Files/job1.root/hpx/root.json.gz?compact=3 -O Files/job1.root/hpx/root.json.gz
mkdir -p Files/job1.root/hpxpy; wget $server/Files/job1.root/hpxpy/root.json.gz?compact=3 -O Files/job1.root/hpxpy/root.json.gz
mkdir -p Files/job1.root/hprof; wget $server/Files/job1.root/hprof/root.json.gz?compact=3 -O Files/job1.root/hprof/root.json.gz

# copy all files to web server
cp -rf index.htm h.xml h.json StreamerInfo Canvases Files ~/web-docs/js/3.0/demo