// macro to create tree_tobject_test.root used by tree_tobject_test.js
// root -l -b -q tree_tobject_test.cxx

#include <TFile.h>
#include <TTree.h>
#include <TLorentzVector.h>
#include <TVector3.h>
#include <TGraph.h>
#include <TDatime.h>

void tree_tobject_test()
{
   TFile f("tree_tobject_test.root", "RECREATE");

   TTree t("t", "Objects with custom streamers");
   TLorentzVector *lv = new TLorentzVector;
   TVector3 *v3 = new TVector3;
   TGraph *gr = new TGraph(3);
   TDatime *dt = new TDatime;
   // classes with custom streamers are not split by ROOT
   t.Branch("lv", &lv);
   t.Branch("v3", &v3);
   t.Branch("gr", &gr);
   t.Branch("dt", &dt);
   for (Int_t i = 0; i < 100; ++i) {
      lv->SetPxPyPzE(i, 2 * i, 3 * i, 4 * i + 1);
      v3->SetXYZ(i, -i, 0.5 * i);
      for (Int_t j = 0; j < 3; ++j)
         gr->SetPoint(j, j, i + j);
      dt->Set(2026, 1, 1, 0, 0, i % 60);
      t.Fill();
   }
   t.Write();
}
