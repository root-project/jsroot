/** @summary Very preliminary function to read header/footer from RNTuple
  * @private */
async function readHeaderFooter(tuple) {
   if (!tuple.$file)
      return false;

   console.log('reading from RNtuple ', tuple.fSeekHeader, tuple.fNBytesHeader, tuple.fSeekFooter, tuple.fNBytesFooter);

   // request two blobs from file
   return tuple.$file.readBuffer([tuple.fSeekHeader, tuple.fNBytesHeader, tuple.fSeekFooter, tuple.fNBytesFooter]).then(blobs => {

      if (blobs?.length !== 2)
         return false;

      const header_blob = blobs[0],
            footer_blob = blobs[1];

      return header_blob && footer_blob;
   });
}


/** @summary Create hierarchy of ROOT::RNTuple object
  * @desc Used by hierarchy painter to explore sub-elements
  * @private */
async function tupleHierarchy(tuple_node, tuple) {

   tuple_node._childs = [];
   tuple_node._tuple = tuple;  // set reference, will be used later by TTree::Draw

   return readHeaderFooter(tuple).then(res => {
      if (!res)
         return res;

      // just show which objects belongs to hierarchy
      for (let k = 0; k < 3; ++k) {
         tuple_node._childs.push({
            _name: `dummy${k}`,
            _kind: 'ROOT::SomeBranchName',
            _title: `Any title for dummy${k}`,
            _obj: null
         });
      }

      return true;
   })
}

export { tupleHierarchy };