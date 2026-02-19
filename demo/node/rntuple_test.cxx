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
#include <set>
#include <bitset>

class TestClass {
   public:
      std::string fName;
      std::string fTitle;
      double fValue{0.};

};

#ifdef __ROOTCLING__
#pragma link C++ class std::map<std::string,float>+;
#pragma link C++ class std::map<int,double>+;
#pragma link C++ class std::map<std::string,bool>+;
#pragma link C++ class std::multiset<std::string>+;
#pragma link C++ class std::variant<std::string,int,bool>+;
#pragma link C++ class std::tuple<std::string,int,bool>+;
#pragma link C++ class std::bitset<25>+;
#pragma link C++ class std::bitset<117>+;
#pragma link C++ class TestClass+;
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
   auto Float16Field = model->MakeField<float>("Float16Field");
   model->GetMutableField("Float16Field").SetColumnRepresentatives({{ROOT::ENTupleColumnType::kReal16}});

   auto Real32Trunc = model->MakeField<float>("Real32Trunc");
   dynamic_cast<ROOT::RRealField<float> &>(model->GetMutableField("Real32Trunc")).SetTruncated(20);

   auto Real32Quant = model->MakeField<float>("Real32Quant");
   dynamic_cast<ROOT::RRealField<float> &>(model->GetMutableField("Real32Quant")).SetQuantized(0., 1., 14);

   auto DoubleField = model->MakeField<double>("DoubleField");
   auto StringField = model->MakeField<std::string>("StringField");
   auto BoolField = model->MakeField<bool>("BoolField");
   auto VariantField = model->MakeField<std::variant<std::string,int,bool>>("VariantField");
   auto TupleField = model->MakeField<std::tuple<std::string,int,bool>>("TupleField");
   auto ArrayInt = model->MakeField<std::array<int,5>>("ArrayInt");
   auto BitsetField = model->MakeField<std::bitset<25>>("BitsetField");
   auto LargeBitsetField = model->MakeField<std::bitset<117>>("LargeBitsetField");
   auto AtomicDoubleField = model->MakeField<std::atomic<double>>("AtomicDoubleField");
   auto TestClassField = model->MakeField<TestClass>("TestClassField");
   auto VectString   = model->MakeField<std::vector<std::string>>("VectString");
   auto VectInt   = model->MakeField<std::vector<int>>("VectInt");
   auto VectBool   = model->MakeField<std::vector<bool>>("VectBool");
   auto MultisetField = model->MakeField<std::multiset<std::string>>("MultisetField");
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

      *Float16Field = 0.1987333 * i;  // stored as 16 bits float
      *Real32Trunc = 123.45 * i; // here only 20 bits preserved
      *Real32Quant = 0.03 * (i % 30); // value should be inside [0..1]

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

      TestClassField->fName = "name_" + std::to_string(i);
      TestClassField->fTitle = "title_" + std::to_string(i);
      TestClassField->fValue = i;

      VectString->clear();
      VectInt->clear();
      VectBool->clear();

      MultisetField->clear();

      MapStringFloat->clear();
      MapIntDouble->clear();
      MapStringBool->clear();

      Vect2Float->clear();
      Vect2Bool->clear();

      BitsetField->reset();
      LargeBitsetField->reset();

      BitsetField->set(i * 3 % 25, true);

      LargeBitsetField->set((i + 7) % 117, true);
      LargeBitsetField->set((i + 35) % 117, true);

      *AtomicDoubleField = 111.444 * i;

      int npx = (i + 5) % 7;
      for (int j = 0; j < npx; ++j) {
         VectString->emplace_back("str_" + std::to_string(j));
         VectInt->emplace_back(-j);
         VectBool->emplace_back(j % 2 == 1);

         MapStringFloat->emplace("key_" + std::to_string(j), j*7);
         MapIntDouble->emplace(j*11, j*0.2);
         MapStringBool->emplace("bool_" + std::to_string(j), j % 3 == 0);

         MultisetField->insert("multiset_" + std::to_string(j % 3));

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
