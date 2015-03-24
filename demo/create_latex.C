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
   pt.AddText("#frac{2s}{#pi#alpha^{2}}  #frac{d#sigma}{dcos#theta} (e^{+}e^{-} #rightarrow f#bar{f} ) = #left| #frac{1}{1 - #Delta#alpha} #right|^{2} (1+cos^{2}#theta)");
   pt.AddText("+ 4 Re #left{ #frac{2}{1 - #Delta#alpha} #chi(s) #left[#hat{g}_{#nu}^{e}#hat{g}_{#nu}^{f} (1 + cos^{2}#theta) + 2 #hat{g}_{a}^{e}#hat{g}_{a}^{f} cos#theta) #right] #right}");
   pt.AddText("+ 16 #left| #chi(s) #right|^{2} #left[( #hat{g}_{a}^{{e}^{2}} + #hat{g}_{v}^{{e}^{2}} ) ( #hat{g}_{a}^{{f}^{2}} + #hat{g}_{v}^{{f}^{2}})(1+cos^{2}#theta) + 8 #hat{g}_{a}^{e} #hat{g}_{a}^{f} #hat{g}_{v}^{e} #hat{g}_{v}^{f}cos#theta #right]");
   pt.SetLabel("Born equation");
   pt.Draw();
   ex3.Write("ex3");
}


void math_text() {
   TCanvas math("math","MathText", 500, 300);

   TMathText l;
   l.SetTextAlign(23);
   l.SetTextSize(0.06);
   l.DrawMathText(0.50, 1.000, "\\prod_{j\\ge0} \\left(\\sum_{k\\ge0} a_{jk}z^k\\right) = \\sum_{n\\ge0} z^n \\left(\\sum_{k_0,k_1,\\ldots\\ge0\\atop k_0+k_1+\\cdots=n} a_{0k_0}a_{1k_1} \\cdots \\right)");
   l.DrawMathText(0.50, 0.800, "W_{\\delta_1\\rho_1\\sigma_2}^{3\\beta} = U_{\\delta_1\\rho_1\\sigma_2}^{3\\beta} + {1\\over 8\\pi^2} \\int_{\\alpha_1}^{\\alpha_2} d\\alpha_2^\\prime \\left[ {U_{\\delta_1\\rho_1}^{2\\beta} - \\alpha_2^\\prime U_{\\rho_1\\sigma_2}^{1\\beta} \\over U_{\\rho_1\\sigma_2}^{0\\beta}} \\right]");
   l.DrawMathText(0.50, 0.600, "d\\Gamma = {1\\over 2m_A} \\left( \\prod_f {d^3p_f\\over (2\\pi)^3} {1\\over 2E_f} \\right) \\left| \\mathscr{M} \\left(m_A - \\left\\{p_f\\right\\} \\right) \\right|^2 (2\\pi)^4 \\delta^{(4)} \\left(p_A - \\sum p_f \\right)");
   l.DrawMathText(0.50, 0.425, "4\\mathrm{Re}\\left\\{{2\\over 1-\\Delta\\alpha} \\chi(s) \\left[ \\^{g}_\\nu^e \\^{g}_\\nu^f (1 + \\cos^2\\theta) + \\^{g}_a^e \\^{g}_a^f \\cos\\theta \\right] \\right\\}");
   l.DrawMathText(0.50, 0.330, "p(n) = {1\\over\\pi\\sqrt{2}} \\sum_{k = 1}^\\infty \\sqrt{k} A_k(n) {d\\over dn} {\\sinh \\left\\{ {\\pi\\over k} \\sqrt{2\\over 3} \\sqrt{n - {1\\over 24}} \\right\\} \\over \\sqrt{n - {1\\over 24}}}");
   l.DrawMathText(0.13, 0.150, "{(\\ell+1)C_{\\ell}^{TE} \\over 2\\pi}");
   l.DrawMathText(0.27, 0.110, "\\mathbb{N} \\subset \\mathbb{R}");
   l.DrawMathText(0.63, 0.100, "\\hbox{RHIC}");

   math.Write("math");
}

void create_latex() {

   TFile* f = TFile::Open("files/latex.root", "recreate");

   lva();
   ex1();
   ex2();
   ex3();
   math_text();

   delete f;
}
