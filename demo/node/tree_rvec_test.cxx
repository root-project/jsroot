// macro to create tree_rvec_test.root used by tree_rvec_test.js
// root -l -b -q tree_rvec_test.cxx

#include <ROOT/RDataFrame.hxx>
#include <ROOT/RVec.hxx>

void tree_rvec_test()
{
   ROOT::RDataFrame df(100);
   // RDataFrame::Snapshot writes ROOT::VecOps::RVec<T> branches
   df.Define("n", "int(rdfentry_ % 5)")
     .Define("vf", "ROOT::RVecF v(n); for (int k = 0; k < n; ++k) v[k] = rdfentry_ + 0.5 * k; return v;")
     .Define("vd", "ROOT::RVecD v(n); for (int k = 0; k < n; ++k) v[k] = -1. * rdfentry_ - k; return v;")
     .Define("vi", "ROOT::RVecI v(n); for (int k = 0; k < n; ++k) v[k] = rdfentry_ * 10 + k; return v;")
     .Define("vl", "ROOT::RVecL v(n); for (int k = 0; k < n; ++k) v[k] = -5000000000LL * (k + 1) - rdfentry_; return v;")
     .Define("vb", "ROOT::RVecB v(n); for (int k = 0; k < n; ++k) v[k] = (rdfentry_ + k) % 2; return v;")
     .Define("vs", "ROOT::RVec<std::string> v(n); for (int k = 0; k < n; ++k) v[k] = std::string(k + 1, 'a' + rdfentry_ % 26); return v;")
     .Snapshot("t", "tree_rvec_test.root", {"n", "vf", "vd", "vi", "vl", "vb", "vs"});
}
