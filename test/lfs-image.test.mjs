// The littlefs image builder — the real littlefs (wasm) writes it, and
// a FRESH littlefs instance must mount it: correct-by-construction for
// the one consumer that matters, MicroPython's own lfs2 driver.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLittlefsImage, RPI_PICO_FS } from '../src/utils/lfsImage.js';

test('a built image carries the file and re-mounts fresh', async () => {
    const py = 'print("Taschenrechner laeuft.")\n'.repeat(200);
    const img = await buildLittlefsImage({ 'main.py': new TextEncoder().encode(py) });
    assert.equal(img.length, RPI_PICO_FS.blockSize * RPI_PICO_FS.blockCount);
    // superblock magic at block 0
    assert.equal(new TextDecoder().decode(img.slice(8, 16)), 'littlefs');
    // the name is IN the metadata (mount success is asserted inside the
    // builder — it throws if a fresh instance cannot mount)
    assert.ok(new TextDecoder().decode(img.slice(0, 8192)).includes('main.py'));
});

test('an oversized file still yields a mountable image', async () => {
    const big = new Uint8Array(64 * 1024).fill(0x41);
    const img = await buildLittlefsImage({ 'main.py': big });
    assert.equal(new TextDecoder().decode(img.slice(8, 16)), 'littlefs');
});
