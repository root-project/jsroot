// macro to create rntuple_bitset_test.root used by rntuple_bitset_test.js
// root -l -b -q rntuple_bitset_test.cxx

#include <ROOT/RNTupleModel.hxx>
#include <ROOT/RNTupleWriter.hxx>

#include <bitset>

void rntuple_bitset_test()
{
   auto model = ROOT::RNTupleModel::Create();

   auto Bitset32 = model->MakeField<std::bitset<32>>("Bitset32");
   auto Bitset48 = model->MakeField<std::bitset<48>>("Bitset48");

   auto writer = ROOT::RNTupleWriter::Recreate(std::move(model), "Data", "rntuple_bitset_test.root");

   for (int i = 0; i < 10; i++) {
      Bitset32->reset();
      Bitset32->set(i);
      Bitset32->set(31 - i);

      Bitset48->reset();
      Bitset48->set(i);
      Bitset48->set(30 + i);
      Bitset48->set(47);

      writer->Fill();
   }
}
