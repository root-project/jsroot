// macro to create tree_int64_test.root used by tree_int64_test.js
// root -l -b -q tree_int64_test.cxx

#include <TFile.h>
#include <TTree.h>

void tree_int64_test()
{
   TFile f("tree_int64_test.root", "RECREATE");
   TTree t("t", "Long64_t values");
   Long64_t v;
   t.Branch("v", &v, "v/L");
   for (Long64_t x : {0LL, 1LL, -1LL, -2LL, -2147483648LL, -4294967296LL, -4294967297LL, -5000000000LL,
                      -9007199254740991LL, -9007199254740992LL, (Long64_t) 0x8000000000000000ULL,
                      4294967296LL, 9007199254740991LL, 0x7FFFFFFFFFFFFFFFLL}) {
      v = x;
      t.Fill();
   }
   t.Write();
}
