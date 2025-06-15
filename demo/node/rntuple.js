import { RBufferReader } from '../../modules/rntuple.mjs';
// This is a test script
//TEST 1
console.log('Perform basic RBufferReader test');
{
// creating a buffer with one 32-bit unsigned integer
let buffer = new ArrayBuffer(4);
let view = new DataView(buffer);

view.setUint32(0, 0x12345678, true)

// read the buffer
let reader = new RBufferReader(buffer);
let value = reader.readU32();

if (value === 0x12345678)
   console.log('test 1 passed');
else
   console.error('FAILURE: test 1 does not match')
}

// TEST 2: Read 16-bit and 8-bit integers
{
    const buffer = new ArrayBuffer(3);
    const view = new DataView(buffer);
    view.setUint16(0, 0xABCD, true);  // First 2 bytes
    view.setUint8(2, 0xEF);           // Last byte
    const reader = new RBufferReader(buffer);
    const u16 = reader.readU16();
    const u8 = reader.readU8();
    
    if (u16 === 0xABCD)
       console.log('test - 2 - readU16 passed');
    else
       console.error('FAILURE: test - 2 - readU16 does not match')

    if (u8 === 0xEF)
       console.log('test- 2 - readU8 passed');
    else
       console.error('FAILURE: test - 2 - readU8 does not match')
  }

//Test 3: Read a string 

{
  const text = 'HELLO';
  const buffer = new ArrayBuffer(4 + text.length) // 4 bytes for length and 5 for hello

  const view = new DataView(buffer)

  // set the 32 bit length of the string
  view.setUint32(0,text.length,true);
  //set each char's ASCII code
  for(let i=0;i<text.length ;i++){
    view.setUint8(4+i,text.charCodeAt(i));
  }
  const reader = new RBufferReader(buffer);
  const result = reader.readString();

  if (result === text)
     console.log('test 3 - readString passed');
  else
     console.error('FAILURE: test 3 - readString does not match');
}
if (!rntuple.builder?.fieldDescriptors?.length)
  console.error('FAILURE: No fields deserialized');
else {
  console.log(`OK: ${rntuple.builder.fieldDescriptors.length} field(s) deserialized`);
  for (let i = 0; i < rntuple.builder.fieldDescriptors.length; ++i) {
    const field = rntuple.builder.fieldDescriptors[i];
    if (!field.fieldName || !field.typeName)
      console.error(`FAILURE: Field ${i} is missing name or type`);
    else
      console.log(`OK: Field ${i}: ${field.fieldName} (${field.typeName})`);
  }
}

if (!rntuple.builder?.columnDescriptors?.length)
  console.error('FAILURE: No columns deserialized');
else {
  console.log(`OK: ${rntuple.builder.columnDescriptors.length} column(s) deserialized`);
  for (let i = 0; i < rntuple.builder.columnDescriptors.length; ++i) {
    const col = rntuple.builder.columnDescriptors[i];
    if (typeof col.fieldId !== 'number')
      console.error(`FAILURE: Column ${i} is missing a valid fieldId`);
    else
      console.log(`OK: Column ${i}: fieldId = ${col.fieldId}, type = ${col.coltype}`);
  }
}
