# Example of custom class usage in JSROOT

It is `DivHist` class which contains two histograms and
drawn as division of them. See `divhist.C` macro where class is defined.


## Create ROOT file

     [shell] root -l
     root [0] .L divhist.C
     root [1] .x create.C


## Implement draw function

In this particular case division of two histograms should be drawn.
For that one have to create new histogram and fill it with new content.
Most easy way to create histogram - clone existing one and just assign
new array for bins content:

```{JavaScript}
   let hdiv = Object.assign({}, obj.fNum);
   hdiv.fName = 'ratio';
   hdiv.fTitle = 'ratio histogram';

   const nbins = hdiv.fXaxis.fNbins;

   // create new array for hdiv
   hdiv.fArray = new Array(nbins + 2).fill(0);
```

After one set new content and draw created histogram using `draw` function.


## Register draw function to the JSROOT

One should register draw function using `addDrawFunc` function provided by JSROOT. Like:

```{JavaScript}
   addDrawFunc({ name: 'DivHist', icon: 'img_histo1d', func: (dom, obj, opt) => { ... }});
```


## Load custom code

Normally one creates custom HTML page, where loads and register additional JavaScript code.

In case of such simple class one can use `&inject=<path_to_javascript_module.mjs>` URL parameter
to inject code in the normal JSROOT gui. JSROOT loads such code loads before processing other URL parameters.
In the code one can use `jsroot` handle to import functionality. In case of this example URL look like:

```
https://jsroot.gsi.de/dev/?file=demo/custom/divhist.root&inject=../demo/custom/divhist.mjs&item=DivHist
```

In the demo relative path to JSROOT modules/core.mjs is specified. One also can provide full path to such module.
