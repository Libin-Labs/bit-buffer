import { BitWriter, BitReader } from '@lp-labs/bit-buffer';
const w = new BitWriter(8, 'lsb').write(7n, 3);
const value: bigint = new BitReader(w.toUint8Array(), w.bitLength, 'lsb').read(3);
void value;
// @ts-expect-error bigint required
w.write(7, 3);
