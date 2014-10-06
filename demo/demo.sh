#!/bin/bash

# Script used to produce number of html/json/xml files, which emulates behaviour of THttpServer
# before script is running, one should run tutorials/http/httpserver.C macro on the same machine
# macro starts http server with address http://localhost:8080
# This script will create number of files, which could be later copied on the web server to demonstrate 
# functionality of THttpServer without need to run server itself. Of course, one should understand that
# objects content will not change on such static server

server=http://localhost:8080
sed 's/\/jsrootsys/../g' ../files/online.htm > index.htm
wget $server/h.json.gz? -O h.json
wget $server/h.xml -O h.xml
wget $server/h.json -O h.json
