# Create specialized bundle for hist painters

    npm install
    npm run-script build

Should create `bundle` and `bundle.min` directories.
After that one can import TH2Painter and draw:

    import { TH1Painter } from './bundle/jsroot_hist.js`
    TH1Painter.draw(dom, obj, opt)

Size of bundle for histograms is ~1.2MiB,
if only 2d graphics is used - ~0.51MiB
