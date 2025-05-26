/** @summary Create hierarchy of ROOT::RNTuple object
  * @desc Used by hierarchy painter to explore sub-elements
  * @private */
function tupleHierarchy(tuple_node, tuple) {

   tuple_node._childs = [];
   tuple_node._tuple = tuple;  // set reference, will be used later by TTree::Draw

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
}

export { tupleHierarchy };