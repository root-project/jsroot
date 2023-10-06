/*
 * divhist.C
 *
 *  Created on: 5 paź 2023
 *      Author: Daniel Wielanek
 *		E-mail: daniel.wielanek@gmail.com
 *		Warsaw University of Technology, Faculty of Physics
 */


#include <TBrowser.h>
#include <TH1D.h>
#include <TVirtualPad.h>

class DivHist : public TObject {
  TH1D* fNum = {nullptr};
  TH1D* fDen = {nullptr};

public:
  DivHist() {};
  DivHist(Int_t bins, Double_t min, Double_t max) {
    fNum = new TH1D("num", "num", bins, min, max);
    fDen = new TH1D("den", "den", bins, min, max);
  }
  TH1D* GetNum() const { return fNum; }
  TH1D* GetDen() const { return fDen; }
  void Browse(TBrowser* b) {
    gPad->Clear();
    TVirtualPad* c1 = gPad;
    Draw();
    gPad = c1;
    b->Add(fNum);
    b->Add(fDen);
  }
  void Draw(Option_t* option = "") {
    TH1D* ratio = (TH1D*) fNum->Clone();
    ratio->SetName("ratio");
    ratio->Divide(fDen);
    TVirtualPad* c1 = gPad;
    c1->Divide(2, 1);
    c1->cd(1);
    ratio->Draw();
    c1->cd(2);
    fNum->SetLineColor(kGreen);
    fDen->SetLineColor(kRed);
    fDen->Draw();
    fNum->Draw("SAME");
  }
  virtual ~DivHist() {
    if (fNum) delete fNum;
    if (fDen) delete fDen;
  };
  ClassDef(DivHist, 1)
};
