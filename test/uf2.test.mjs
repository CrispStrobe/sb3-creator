// UF2 format, from the spec (Microsoft, MIT): magics, addressing,
// renumbering on concat — the drag-drop deploy's foundation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { uf2FromBinary, uf2Blocks, uf2Concat, RP2040_FAMILY_ID } from '../src/utils/uf2.js';

test('uf2FromBinary: blocks, magics, addresses, family', () => {
    const data = new Uint8Array(600).map((_, i) => i & 0xff);
    const uf2 = uf2FromBinary(data, 0x20000000);
    assert.equal(uf2.length, 3 * 512, '600 bytes → 3 blocks');
    const blocks = uf2Blocks(uf2);
    assert.equal(blocks.length, 3);
    assert.equal(blocks[0].targetAddr, 0x20000000);
    assert.equal(blocks[1].targetAddr, 0x20000100);
    assert.equal(blocks[2].targetAddr, 0x20000200);
    assert.equal(blocks[0].familyID, RP2040_FAMILY_ID);
    assert.deepEqual([...blocks[0].data.slice(0, 4)], [0, 1, 2, 3]);
});

test('uf2Concat renumbers so count-checking bootloaders accept the whole', () => {
    const a = uf2FromBinary(new Uint8Array(256), 0x10000000);
    const b = uf2FromBinary(new Uint8Array(256), 0x20000000);
    const joined = uf2Concat(a, b);
    const view = new DataView(joined.buffer);
    assert.equal(view.getUint32(0x14, true), 0, 'first blockNo');
    assert.equal(view.getUint32(0x18, true), 2, 'total in first block');
    assert.equal(view.getUint32(512 + 0x14, true), 1, 'second blockNo');
    assert.equal(view.getUint32(512 + 0x18, true), 2, 'total in second block');
});
