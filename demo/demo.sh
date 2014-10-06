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
wget -nv $server/h.xml -O h.xml
wget -nv $server/h.json -O h.json
mkdir -p StreamerInfo; wget -nv $server/StreamerInfo/root.json.gz?compact=3 -O StreamerInfo/root.json.gz
mkdir -p Canvases 
sed 's/\/jsrootsys/..\/../g' ../files/online.htm > Canvases/index.htm
wget -nv $server/Canvases/h.json -O Canvases/h.json
wget -nv $server/Canvases/h.xml -O Canvases/h.xml
mkdir -p Canvases/c1 
wget -nv $server/Canvases/c1/root.json.gz?compact=3 -O Canvases/c1/root.json.gz
wget -nv -O Canvases/c1/root.png $server/Canvases/c1/root.png?w=400&h=300
sed 's/\/jsrootsys/..\/..\/../g' ../files/draw.htm > Canvases/c1/draw.htm
mkdir -p Files
sed 's/\/jsrootsys/..\/../g' ../files/online.htm > Files/index.htm
wget -nv $server/Files/h.json -O Files/h.json
wget -nv $server/Files/h.xml -O Files/h.xml
mkdir -p Files/job1.root
sed 's/\/jsrootsys/..\/..\/../g' ../files/online.htm > Files/job1.root/index.htm
wget -nv $server/Files/job1.root/h.json -O Files/job1.root/h.json
wget -nv $server/Files/job1.root/h.xml -O Files/job1.root/h.xml
mkdir -p Files/job1.root/hpx
wget -nv $server/Files/job1.root/hpx/root.json.gz?compact=3 -O Files/job1.root/hpx/root.json.gz
wget -nv -O Files/job1.root/hpx/root.png $server/Files/job1.root/hpx/root.png?w=400&h=300
sed 's/\/jsrootsys/..\/..\/..\/../g' ../files/draw.htm > Files/job1.root/hpx/draw.htm
mkdir -p Files/job1.root/hpxpy 
wget -nv $server/Files/job1.root/hpxpy/root.json.gz?compact=3 -O Files/job1.root/hpxpy/root.json.gz
wget -nv -O Files/job1.root/hpxpy/root.png $server/Files/job1.root/hpxpy/root.png?w=400&h=300
sed 's/\/jsrootsys/..\/..\/..\/../g' ../files/draw.htm > Files/job1.root/hpxpy/draw.htm
mkdir -p Files/job1.root/hprof 
wget -nv $server/Files/job1.root/hprof/root.json.gz?compact=3 -O Files/job1.root/hprof/root.json.gz
wget -nv -O Files/job1.root/hprof/root.png $server/Files/job1.root/hprof/root.png?w=400&h=300 
sed 's/\/jsrootsys/..\/..\/..\/../g' ../files/draw.htm > Files/job1.root/hprof/draw.htm

# copy all files to web server
cp -rf index.htm h.xml h.json StreamerInfo Canvases Files ~/web-docs/js/3.0/demo