import { openFile, TSelector } from 'jsroot';
import { rntupleProcess } from 'jsroot/rntuple';
import { readFileSync } from 'fs';


// convert float to hex representation based on IEEE-754 and C99 standard
function floatToHex(num)
{
   if (num === 0)
      return (Object.is(num, -0) ? '-' : '') + '0x0p+0';

   const buf = new ArrayBuffer(8), // 8 Byte == 64 Bit
         view = new DataView(buf);
   view.setFloat64(0, num, false);

   const bits = view.getBigUint64(0, false),      // bitwise operations only work with integer
         sign = Number(bits >> 63n),              // sign on first bit
         rawExp = Number((bits >> 52n) & 0x7ffn), // exponent on next 11 bits
         fraction = bits & 0xfffffffffffffn;      // fraction on next 52 bits

   let exp, leading, mantBits;
   if (rawExp === 0) {
      // check for really small numbers
      if (fraction === 0n)
         return (sign ? '-' : '') + '0x0p+0';
      exp = -1022;
      leading = '0';
      mantBits = fraction;
   } else {
      exp = rawExp - 1023;
      leading = '1';
      mantBits = fraction;
   }

   const hex = mantBits.toString(16).padStart(13, '0').replace(/0+$/, ''),
         frac = hex ? '.' + hex : '',
         expStr = (exp >= 0 ? '+' : '-') + Math.abs(exp);

   return (sign ? '-' : '') + '0x' + leading + frac + 'p' + expStr;
}

async function read_file(input_root = 'rntuple_test32.root', input_ref = 'rntuple_test32.json')
{
   const file = await openFile(input_root), rntuple = await file.readObject('ntpl'),
         original = JSON.parse(readFileSync(input_ref)),
         selector = new TSelector(),
         fields = [
            'FloatReal32Quant1',
            'FloatReal32Quant8',
            'FloatReal32Quant32',
            'DoubleReal32Quant1',
            'DoubleReal32Quant20',
            'DoubleReal32Quant32',
         ];

   for (const f of fields)
      selector.addBranch(f);

   selector.Process = function(entryIndex) {
      for (const field of fields) {
         try {
            const value = floatToHex(this.tgtobj[field]), expected = original[entryIndex][field];

            if (value !== expected) {
               console.error(`FAILURE: ${field} at entry ${entryIndex} expected ${expected},`+
                             `got ${value}`);
            } else
               console.log(`OK: ${field} at entry ${entryIndex} = ${value}`);
         } catch (err) {
            console.error(`ERROR: Failed to read ${field} at entry ${entryIndex}: ${err.message}`);
         }
      }
   };

   await rntupleProcess(rntuple, selector);
}

const [input_root, input_ref] = process.argv.slice(2);

read_file(input_root, input_ref);
