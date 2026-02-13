#include <ROOT/RNTupleModel.hxx>
#include <ROOT/RNTupleWriter.hxx>


#include <cstdio>
#include <iostream>
#include <memory>
#include <vector>
#include <array>
#include <utility>
#include <string>
#include <variant>
#include <tuple>
#include <map>

#ifdef __ROOTCLING__
#pragma link C++ class std::map<std::string,float>+;
#pragma link C++ class std::map<int,double>+;
#pragma link C++ class std::map<std::string,bool>+;
#pragma link C++ class std::variant<std::string,int,bool>+;
#pragma link C++ class std::tuple<std::string,int,bool>+;
#endif


// Where to store the ntuple of this example
constexpr char const* kNTupleFileName = "rntuple_test.root";

// Number of events to generate
constexpr int kNEvents = 10;

// Generate kNEvents with vectors in kNTupleFileName
void rntuple_test()
{
   // We create a unique pointer to an empty data model
   auto model = ROOT::RNTupleModel::Create();

   // Creating fields of std::vector is the same as creating fields of simple types.  As a result, we get
   // shared pointers of the given type
   auto IntField = model->MakeField<int>("IntField");
   auto FloatField = model->MakeField<float>("FloatField");
   auto DoubleField = model->MakeField<double>("DoubleField");
   auto StringField = model->MakeField<std::string>("StringField");
   auto BoolField = model->MakeField<bool>("BoolField");
   auto VariantField = model->MakeField<std::variant<std::string,int,bool>>("VariantField");
   auto TupleField = model->MakeField<std::tuple<std::string,int,bool>>("TupleField");
   auto ArrayInt = model->MakeField<std::array<int,5>>("ArrayInt");
   auto VectString   = model->MakeField<std::vector<std::string>>("VectString");
   auto VectInt   = model->MakeField<std::vector<int>>("VectInt");
   auto VectBool   = model->MakeField<std::vector<bool>>("VectBool");
   auto Vect2Float   = model->MakeField<std::vector<std::vector<float>>>("Vect2Float");
   auto Vect2Bool   = model->MakeField<std::vector<std::vector<bool>>>("Vect2Bool");
   auto MapStringFloat  = model->MakeField<std::map<std::string,float>>("MapStringFloat");
   auto MapIntDouble   = model->MakeField<std::map<int,double>>("MapIntDouble");
   auto MapStringBool  = model->MakeField<std::map<std::string,bool>>("MapStringBool");



   // We hand-over the data model to a newly created ntuple of name "F", stored in kNTupleFileName
   // In return, we get a unique pointer to an ntuple that we can fill
   auto writer = ROOT::RNTupleWriter::Recreate(std::move(model), "Data", kNTupleFileName);

   for (int i = 0; i < kNEvents; i++) {

      *IntField = i;
      *FloatField = i*i;
      *DoubleField = 0.5 * i;
      *StringField = "entry_" + std::to_string(i);
      *BoolField = (i % 3 == 1);
      *ArrayInt = { i + 1, i + 2, i + 3, i + 4, i + 5 };
      switch (i % 3) {
         case 0: *VariantField = std::string("varint_") + std::to_string(i); break;
         case 1: *VariantField = i; break;
         case 2: *VariantField = (bool) (i % 2 == 0); break;
      }

      *TupleField = { std::string("tuple_") + std::to_string(i), i * 3, (i % 3 == 1) };

      VectString->clear();
      VectInt->clear();
      VectBool->clear();

      MapStringFloat->clear();
      MapIntDouble->clear();
      MapStringBool->clear();

      Vect2Float->clear();
      Vect2Bool->clear();

      int npx = (i + 5) % 7;
      for (int j = 0; j < npx; ++j) {
         VectString->emplace_back("str_" + std::to_string(j));
         VectInt->emplace_back(-j);
         VectBool->emplace_back(j % 2 == 1);

         MapStringFloat->emplace("key_" + std::to_string(j), j*7);
         MapIntDouble->emplace(j*11, j*0.2);
         MapStringBool->emplace("bool_" + std::to_string(j), j % 3 == 0);

         int npy = 1 + i % 3;
         std::vector<float> vf;
         std::vector<bool> vb;
         for (int k = 0; k < npy; ++k) {
            vf.emplace_back(k*1.1);
            vb.emplace_back(k % 2 == 0);
         }
         Vect2Float->emplace_back(vf);
         Vect2Bool->emplace_back(vb);


      }

      writer->Fill();
    }

   // The ntuple unique pointer goes out of scope here.  On destruction, the ntuple flushes unwritten data to disk
   // and closes the attached ROOT file.
}
