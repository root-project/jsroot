import { addUserStreamer, addDrawFunc } from 'jsroot';

// special handling for the amore::core::String_t which is redefinition of TString
addUserStreamer('amore::core::String_t', 'TString');

// register class and identify, that 'fVal' field should be used for drawing
// one could specify explicit draw function, but it is not required in such simple case
addDrawFunc({ name: 'amore::core::MonitorObjectHisto<TH1F>', icon: 'img_histo1d', draw_field: 'fVal' });
