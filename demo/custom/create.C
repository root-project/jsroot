
{
   // execute following ligROOT->ProcessLine(".L divhist.C");

   auto divhist = new DivHist(100, -5., 5);

   divhist->GetNum()->FillRandom("gaus", 1000);

   divhist->GetDen()->FillRandom("gaus", 500);

   divhist->SaveAs("divhist.root");

   divhist->SaveAs("divhist.json");

   new TCanvas();

   divhist->Draw();
}
