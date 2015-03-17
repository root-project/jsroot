#!/bin/bash

# Script used to produce number of html/json/xml files, which emulates behavior of THttpServer
# before script is running, one should run tutorials/http/httpcontrol.C macro on the same machine
# macro starts http server with address http://localhost:8080
# This script will create number of files, which could be later copied on the web server to demonstrate 
# functionality of THttpServer without need to run server itself. Of course, one should understand that
# objects content will not change on such static server

server=http://localhost:8080

tgtdir=~/web-docs/js/3.4/httpcontrol.C

# rm -rf index.htm h.xml h.json StreamerInfo Canvases Files

# par1 - source
# par2 - target
# replace 

function gethfile {
   wget -nv $1 -O file0.tmp
   sed 's/\/jsrootsys/../g' file0.tmp > file1.tmp
   sed 's/\\\/rootsys\\\/icons/icons/g' file1.tmp > $2
   rm -f file0.tmp file1.tmp
}

#  par1 - 0 - only hierarchy, 1 - only drawing, 2 - both
#  par2 - path

function grab {
   sedarg='s/\/jsrootsys/..'
   number=$(grep -o "\/" <<< "$2" | wc -l)
   for (( i=0; i<=$number; i++ ))
   do 
      sedarg+='\/..'
   done
   sedarg+='/g'

   mkdir -p $2


   if [ "$1" != "1" ]; then
      wget -nv $server/$2/?nozip -O $2/index0.htm
      sed $sedarg $2/index0.htm > $2/index.htm
      rm -f $2/index0.htm
      wget -nv $server/$2/h.json -O $2/h.json
      wget -nv $server/$2/h.xml -O $2/h.xml
   fi 

   if [ "$1" != "0" ]; then 
      wget -nv $server/$2/root.json.gz?compact=3 -O $2/root.json.gz
      wget -nv $server/$2/root.bin.gz -O $2/root.bin.gz
      wget -nv "$server/$2/root.png?w=600&h=400" -O $2/root.png
      wget -nv $server/$2/draw.htm?nozip -O $2/draw0.htm
      sed $sedarg $2/draw0.htm > $2/draw.htm
      rm -f $2/draw0.htm
   fi
   
}

mkdir temp
cd temp

gethfile $server/index.htm?nozip index.htm
gethfile $server/h.xml h.xml
gethfile $server/h.json  h.json

mkdir -p Start; echo "0" >> Start/cmd.json
mkdir -p Stop; echo "0" >> Stop/cmd.json
mkdir -p ResetHPX; echo "0" >> ResetHPX/cmd.json
mkdir -p ResetHPXPY; echo "0" >> ResetHPXPY/cmd.json

mkdir -p Debug; wget -nv $server/Debug/item.json.gz -O Debug/item.json.gz
wget -nv $server/Debug/draw.htm?nozip -O draw0.htm
sed 's/\/jsrootsys/..\/../g' $sedarg draw0.htm > Debug/draw.htm
rm -f draw0.htm

grab 2 hpx
grab 2 hpxpy

# get streamer infos at the end - only than it will have full class list  
mkdir -p StreamerInfo; wget -nv $server/StreamerInfo/root.json.gz?compact=3 -O StreamerInfo/root.json.gz

# copy all files to web server
rm -rf $tgtdir
mkdir -p $tgtdir
cp -rf * $tgtdir
mkdir -p $tgtdir/icons
cp $ROOTSYS/icons/ed_execute.png $ROOTSYS/icons/ed_interrupt.png $ROOTSYS/icons/ed_delete.png $ROOTSYS/icons/bld_delete.png $tgtdir/icons

cd ..
rm -rf temp
cp .htaccess $tgtdir
