import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BitWriter, BitReader } from '../dist/esm/index.js';

test('MSB cross bytes', () => {
  const w = new BitWriter(12);
  w.write(5n, 3).write(257n, 9);
  assert.deepEqual(w.toUint8Array(), new Uint8Array([176, 16]));
  const r = new BitReader(w.toUint8Array(), 12);
  assert.equal(r.read(3), 5n);
  assert.equal(r.read(9), 257n);
  assert.equal(r.remaining, 0);
});
test('LSB roundtrip', () => {
  const w = new BitWriter(20, 'lsb');
  w.write(5n, 3).write(257n, 9);
  const r = new BitReader(w.toUint8Array(), w.bitLength, 'lsb');
  assert.equal(r.read(3), 5n);
  assert.equal(r.read(9), 257n);
  assert.equal(w.toUint8Array()[0], 13);
});
test('alignment fill', () => {
  const w = new BitWriter(8);
  w.write(1n, 1).align(8, 1);
  assert.equal(w.toUint8Array()[0], 255);
  const r = new BitReader(w.toUint8Array());
  r.read(1);
  assert.equal(r.align(), 7);
});
test('capacity atomic', () => {
  const w = new BitWriter(3);
  assert.throws(() => w.write(8n, 3), RangeError);
  assert.equal(w.bitLength, 0);
  w.write(7n, 3);
  assert.throws(() => w.write(1n, 1), RangeError);
  assert.equal(w.bitLength, 3);
});
test('reader bounds atomic', () => {
  const r = new BitReader(new Uint8Array([255]), 3);
  assert.throws(() => r.read(4), RangeError);
  assert.equal(r.position, 0);
  r.read(1);
  assert.throws(() => r.align(), RangeError);
  assert.equal(r.position, 1);
});
test('ownership and zero', () => {
  const b = new Uint8Array([128]),
    r = new BitReader(b);
  b[0] = 0;
  assert.equal(r.read(1), 1n);
  const w = new BitWriter(1);
  w.write(1n, 1);
  w.toUint8Array()[0] = 0;
  assert.equal(w.toUint8Array()[0], 128);
  assert.equal(new BitReader(new Uint8Array()).read(0), 0n);
});
test('reference bit string for both orders', () => {
  for (const order of ['msb', 'lsb']) {
    const writer = new BitWriter(512, order);
    const fields = [],
      bits = [];
    for (let i = 1; i < 30; i++) {
      const count = i % 13,
        value = BigInt((i * 7919) % 2 ** count);
      fields.push([value, count]);
      writer.write(value, count);
      const binary = value.toString(2).padStart(count, '0');
      if (count) bits.push(...(order === 'msb' ? binary : [...binary].reverse().join('')));
    }
    const expected = new Uint8Array(Math.ceil(bits.length / 8));
    for (let i = 0; i < bits.length; i++)
      expected[i >>> 3] |= Number(bits[i]) << (order === 'msb' ? 7 - (i % 8) : i % 8);
    assert.deepEqual(writer.toUint8Array(), expected);
    const reader = new BitReader(expected, writer.bitLength, order);
    for (const [value, count] of fields) assert.equal(reader.read(count), value);
  }
});
test('invalid widths, align bounds and zero capacity', () => {
  assert.throws(() => new BitWriter(-1), RangeError);
  const writer = new BitWriter(0);
  writer.write(0n, 0).align();
  assert.deepEqual(writer.toUint8Array(), new Uint8Array());
  assert.throws(() => writer.write(1n, 0), RangeError);
  assert.throws(() => writer.align(0), RangeError);
  assert.throws(() => new BitReader(new Uint8Array(1), 9), RangeError);
  assert.throws(() => new BitReader(new Uint8Array(1)).read(0.5), RangeError);
});
