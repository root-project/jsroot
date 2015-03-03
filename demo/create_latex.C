void lva() {
   TCanvas Tlva("Tlva","Tlva",500,500);
   Tlva.SetGrid();
   Tlva.DrawFrame(0,0,1,1);

   const char *longstring = "K_{S}... K^{*0}... #frac{2s}{#pi#alpha^{2}}"
                     "#frac{d#sigma}{dcos#theta} (e^{+}e^{-} #rightarrow f#bar{f} ) ="
                     "#left| #frac{1}{1 - #Delta#alpha} #right|^{2} (1+cos^{2}#theta)";

   TLatex latex;
   latex.SetTextSize(0.025);
   latex.SetTextAlign(13);  //align at top
   latex.DrawLatex(.2,.9,"K_{S}");
   latex.DrawLatex(.3,.9,"K^{*0}");
   latex.DrawLatex(.2,.8,longstring);

   latex.SetTextAlign(12);  //centered
   latex.DrawLatex(.2,.6,"K_{S}");
   latex.DrawLatex(.3,.6,"K^{*0}");
   latex.DrawLatex(.2,.5,longstring);

   latex.SetTextAlign(11);  //default bottom alignment
   latex.DrawLatex(.2,.4,"K_{S}");
   latex.DrawLatex(.3,.4,"K^{*0}");
   latex.DrawLatex(.2,.3,longstring);

   latex.SetTextAlign(10);  //special bottom alignment
   latex.DrawLatex(.2,.2,"K_{S}");
   latex.DrawLatex(.3,.2,"K^{*0}");
   latex.DrawLatex(.2,.1,longstring);

   latex.SetTextAlign(12);
   latex.SetTextFont(72);
   latex.DrawLatex(.1,.80,"13");
   latex.DrawLatex(.1,.55,"12");
   latex.DrawLatex(.1,.35,"11");
   latex.DrawLatex(.1,.18,"10");

   Tlva.Write("lva");
}

void ex1() {
   TCanvas ex1("ex1","Latex",500,600);
   TLatex Tl;
   Tl.SetTextAlign(12);
   Tl.SetTextSize(0.04);
   Tl.DrawLatex(0.1,0.8,"1)   C(x) = d #sqrt{#frac{2}{#lambda D}}  #int^{x}_{0}cos(#frac{#pi}{2}t^{2})dt");
   Tl.DrawLatex(0.1,0.6,"2)   C(x) = d #sqrt{#frac{2}{#lambda D}}  #int^{x}cos(#frac{#pi}{2}t^{2})dt");
   Tl.DrawLatex(0.1,0.4,"3)   R = |A|^{2} = #frac{1}{2}(#left[#frac{1}{2}+C(V)#right]^{2}+#left[#frac{1}{2}+S(V)#right]^{2})");
   Tl.DrawLatex(0.1,0.2,"4)   F(t) = #sum_{i=-#infty}^{#infty}A(i)cos#left[#frac{i}{t+i}#right]");
   ex1.Write("ex1");
}

void ex2() {
   TCanvas ex2("ex2","Latex",500,300);
   TLatex Tl;
   Tl.SetTextAlign(23);
   Tl.SetTextSize(0.08);
   Tl.DrawLatex(0.5,0.95,"e^{+}e^{-}#rightarrow Z^{0}#rightarrow I#bar{I}, q#bar{q}");
   Tl.DrawLatex(0.5,0.75,"|#vec{a}#bullet#vec{b}|=#Sigma a^{i}_{jk}+b^{bj}_{i}");
   Tl.DrawLatex(0.5,0.5,"i(#partial_{#mu}#bar{#psi}#gamma^{#mu}+m#bar{#psi}=0#Leftrightarrow(#Box+m^{2})#psi=0");
   Tl.DrawLatex(0.5,0.3,"L_{em}=eJ^{#mu}_{em}A_{#mu} , J^{#mu}_{em}=#bar{I}#gamma_{#mu}I , M^{j}_{i}=#Sigma A_{#alpha}#tau^{#alpha j}_{i}");
   ex2.Write("ex2");
}

void ex3() {
   TCanvas ex3("ex3","Latex",500,300);
   TPaveText pt(.1,.1,.9,.9);
   pt.AddText("#frac{2s}{#pi#alpha^{2}}  #frac{d#sigma}{dcos#theta} (e^{+}e^{-} #rightarrow f#bar{f} ) = ");
   pt.AddText("#left| #frac{1}{1 - #Delta#alpha} #right|^{2} (1+cos^{2}#theta");
   pt.AddText("+ 4 Re #left{ #frac{2}{1 - #Delta#alpha} #chi(s) #left[ #hat{g}_{#nu}^{e}#hat{g}_{#nu}^{f}"
              "(1 + cos^{2}#theta) + 2 #hat{g}_{a}^{e}#hat{g}_{a}^{f} cos#theta) #right] #right}");
   pt.SetLabel("Born equation");
   pt.Draw();
   ex3.Write("ex3");
}

void create_latex() {

   TFile* f = TFile::Open("files/latex.root", "recreate");

   lva();
   ex1();
   ex2();
   ex3();

   delete f;
}
