# @lp-labs/bit-buffer

Owned MSB-first or LSB-first bounded bit streams with explicit bit lengths.

## Install

```sh
npm install @lp-labs/bit-buffer
```

Node.js 18+; standalone browser-compatible ES2022 core with DOM codec types. Zero runtime or peer dependencies. ESM and CommonJS with separate declarations. No filesystem, network or environment side effects.

## Quickstart

```js
import { BitWriter, BitReader } from '@lp-labs/bit-buffer';
const writer = new BitWriter(16).write(5n, 3).align().write(42n, 8);
const reader = new BitReader(writer.toUint8Array(), writer.bitLength);
console.log(reader.read(3));
reader.align();
console.log(reader.read(8));
```

CommonJS consumers use `const api = require('@lp-labs/bit-buffer')`. The same named API is available in both module formats. No default export.

## API, behavior, errors and limits

BitWriter preallocates capacityBits (default 8192; maximum 134,217,728); write accepts unsigned bigint fields of 0..4096 bits and returns this. MSB (default) orders bits high-first both within fields and bytes; LSB does low-first for both. Zero width accepts only 0n. align pads to a bit boundary (default 8, max 4096) using fill 0 or 1. bitLength includes padding; toUint8Array returns a fresh snapshot with unused trailing bits zero. BitReader snapshots input, enforces bitLength (default all bytes), exposes position/remaining, read, and align (skips without validating fill). Invalid widths/overflow/capacity throw RangeError without changing position; invalid order/fill throw TypeError. O(field bits) per read/write; fixed writer allocation and reader snapshot space.

All exports: `BitOrder`, `BitWriter`, `BitReader`.

## Full TypeScript declarations

```ts
export type BitOrder = 'msb' | 'lsb';
export declare class BitWriter {
  readonly capacityBits: number;
  readonly bitOrder: BitOrder;
  private readonly bytes;
  private length;
  constructor(capacityBits?: number, bitOrder?: BitOrder);
  get bitLength(): number;
  write(value: bigint, count: number): this;
  align(boundary?: number, fill?: 0 | 1): this;
  toUint8Array(): Uint8Array;
}
export declare class BitReader {
  readonly bitOrder: BitOrder;
  private readonly bytes;
  private offset;
  readonly bitLength: number;
  constructor(bytes: Uint8Array, bitLength?: number, bitOrder?: BitOrder);
  get position(): number;
  get remaining(): number;
  read(count: number): bigint;
  align(boundary?: number): number;
}
```

## Development

```sh
npm ci --offline
npm run typecheck
npm test
npm run format:check
```

TypeScript ^5.9.3 and Prettier ^3.6.2 are development-only. Build emits dist/esm and dist/cjs. Tests use Node's test runner; consumer.mts and consumer.cts exercise bare package imports including negative type assertions.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
