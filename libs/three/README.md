# Creating three.js for the JSROOT

## Checkout appropriate three.js version

In directory on the same level as jsroot, checkout three.js
into `threejs` subdirectory. Do not forget to checkout proper version:

    git checkout r174

## Run script

    npm install
    npm run build
    rm -rf node_modules package-lock.json


## Run tests and commit package