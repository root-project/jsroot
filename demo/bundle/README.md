# Create specialized bundle for hist painters

    npm install
    npm run-script build

Should create `bundle` and `bundle.min` directories.
After that one can import TH2Painter and draw:

    import { TH1Painter } from './bundle/jsroot_hist.js`
    TH1Painter.draw(dom, obj, opt)

For the moment size of the bundle mostly the same as
original modules, but this should be improved
