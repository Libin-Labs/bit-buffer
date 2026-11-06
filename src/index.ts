export type BitOrder = 'msb' | 'lsb';
function integer(n: number, max: number): void {
  if (!Number.isSafeInteger(n) || n < 0 || n > max) throw new RangeError('Invalid bit count');
}
function order(o: BitOrder): void {
  if (o !== 'msb' && o !== 'lsb') throw new TypeError('Invalid bit order');
}
export class BitWriter {
  private readonly bytes: Uint8Array;
  private length = 0;
  constructor(
    readonly capacityBits: number = 8192,
    readonly bitOrder: BitOrder = 'msb',
  ) {
    integer(capacityBits, 134_217_728);
    order(bitOrder);
    this.bytes = new Uint8Array(Math.ceil(capacityBits / 8));
  }
  get bitLength(): number {
    return this.length;
  }
  write(value: bigint, count: number): this {
    integer(count, 4096);
    if (value < 0n || value >= 1n << BigInt(count)) throw new RangeError('Value does not fit');
    if (count > this.capacityBits - this.length) throw new RangeError('Capacity exceeded');
    for (let i = 0; i < count; i++) {
      const shift = this.bitOrder === 'msb' ? count - i - 1 : i;
      const bit = Number((value >> BigInt(shift)) & 1n),
        offset = this.length % 8;
      this.bytes[this.length >>> 3]! |= bit << (this.bitOrder === 'msb' ? 7 - offset : offset);
      this.length++;
    }
    return this;
  }
  align(boundary = 8, fill: 0 | 1 = 0): this {
    integer(boundary, 4096);
    if (boundary === 0) throw new RangeError('Zero boundary');
    if (fill !== 0 && fill !== 1) throw new TypeError('Invalid fill');
    const n = (boundary - (this.length % boundary)) % boundary;
    return this.write(fill ? (1n << BigInt(n)) - 1n : 0n, n);
  }
  toUint8Array(): Uint8Array {
    return this.bytes.slice(0, Math.ceil(this.length / 8));
  }
}
export class BitReader {
  private readonly bytes: Uint8Array;
  private offset = 0;
  readonly bitLength: number;
  constructor(
    bytes: Uint8Array,
    bitLength = bytes.length * 8,
    readonly bitOrder: BitOrder = 'msb',
  ) {
    integer(bitLength, bytes.length * 8);
    order(bitOrder);
    this.bytes = bytes.slice(0, Math.ceil(bitLength / 8));
    this.bitLength = bitLength;
  }
  get position(): number {
    return this.offset;
  }
  get remaining(): number {
    return this.bitLength - this.offset;
  }
  read(count: number): bigint {
    integer(count, 4096);
    if (count > this.remaining) throw new RangeError('Read beyond bit length');
    let result = 0n;
    for (let i = 0; i < count; i++) {
      const offset = this.offset % 8,
        bit =
          (this.bytes[this.offset >>> 3]! >> (this.bitOrder === 'msb' ? 7 - offset : offset)) & 1;
      result |= BigInt(bit) << BigInt(this.bitOrder === 'msb' ? count - i - 1 : i);
      this.offset++;
    }
    return result;
  }
  align(boundary = 8): number {
    integer(boundary, 4096);
    if (!boundary) throw new RangeError('Zero boundary');
    const n = (boundary - (this.offset % boundary)) % boundary;
    if (n > this.remaining) throw new RangeError('Alignment beyond bit length');
    this.offset += n;
    return n;
  }
}
