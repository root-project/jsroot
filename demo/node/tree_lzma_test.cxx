// macro to create tree_lzma_test.root used by tree_lzma_test.js
// root -l -b -q tree_lzma_test.cxx

#include <TFile.h>
#include <TTree.h>
#include <TH2D.h>
#include <Compression.h>

void tree_lzma_test()
{
   TFile f("tree_lzma_test.root", "RECREATE", "LZMA test", ROOT::CompressionSettings(ROOT::RCompressionSetting::EAlgorithm::kLZMA, 9));

   TTree t("t", "Int_t values in big basket");
   Int_t v;
   t.Branch("v", &v, "v/I", 4000000);
   t.SetAutoFlush(0);
   for (Int_t i = 0; i < 600000; ++i) {
      v = i % 1000;
      t.Fill();
   }
   t.Write();

   TH2D h("h2", "Sparse 2d histogram", 1000, 0., 1000., 1000, 0., 1000.);
   for (Int_t k = 0; k < 1000; ++k)
      h.Fill(k + 0.5, (k * 7) % 1000 + 0.5, k + 1.);
   h.Fill(-5., 5.5, 3.);
   h.Write();
}
