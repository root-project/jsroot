# Simple http server for JSROOT

Can be used to serve JSROOT and ROOT files on localhost httpserver.

1. Checkout jsroot in working directory like `~/work`:
```shell
    [shell] mkdir ~/work
    [shell] cd ~/work
    [shell] git clone https://github.com/root-project/jsroot.git
```
2. Copy some ROOT files to `files` sub-directory:
```shell
    [shell] mkdir ~/work/files
    [shell] cp $ROOTSYS/tutorials/hsimple.root ~/work/files/
```
3. Start server from working directory:
```shell
    [shell] cd ~/work
    [shell] python3 jsroot/server/server.py
```
4. Open ROOT file in JSROOT with the link:
```
     http://localhost:8000/jsroot/?file=../files/hsimple.root&item=hpxpy&opt=colz
```
5. Also test examples.htm and api.htm:
```
     http://localhost:8000/jsroot/examples.htm
     http://localhost:8000/jsroot/api.htm
```
