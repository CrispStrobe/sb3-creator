// lfsImage — build a littlefs disk image in memory, using the REAL
// littlefs compiled to wasm (npm `littlefs`, Uri Shaked / Wokwi, and
// littlefs itself BSD-3 — see license-littlefs.txt in the package).
// Correct-by-construction: the same C code MicroPython mounts is the
// code that writes the image.
//
// This is the second half of the MakeCode lesson: ONE UF2 that carries
// MicroPython firmware AND the program, already in the filesystem —
// drag it onto RPI-RP2 and the calculator boots. No serial, no
// Chromium, no mpremote; Safari-proof by construction.
//
// RPI_PICO geometry (MicroPython rp2 port): the filesystem lives in the
// last 1408 KiB of the 2 MiB flash — base 0x100A0000, 4096-byte blocks,
// 352 of them.

export const RPI_PICO_FS = {
  flashBase: 0x100a0000,
  blockSize: 4096,
  blockCount: 352,
};

/**
 * @param {Record<string, Uint8Array>} files — name → contents
 * @param {{ blockSize?: number, blockCount?: number }} [geo]
 * @returns {Promise<Uint8Array>} the raw filesystem image
 */
export async function buildLittlefsImage(files, geo = {}) {
  const blockSize = geo.blockSize ?? RPI_PICO_FS.blockSize;
  const blockCount = geo.blockCount ?? RPI_PICO_FS.blockCount;

  const { readFileSync } = await import('fs');
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const littlefs = (await import('littlefs')).default;
  const wasmBinary = readFileSync(require.resolve('littlefs/dist/littlefs.wasm'));
  const m = await littlefs({ wasmBinary });

  // The block device: a plain JS buffer, erased state 0xFF like flash.
  const disk = new Uint8Array(blockSize * blockCount).fill(0xff);
  const read = m.addFunction((cfg, block, off, buffer, size) => {
    m.HEAPU8.set(disk.subarray(block * blockSize + off, block * blockSize + off + size), buffer);
    return 0;
  }, 'iiiiii');
  const prog = m.addFunction((cfg, block, off, buffer, size) => {
    disk.set(m.HEAPU8.subarray(buffer, buffer + size), block * blockSize + off);
    return 0;
  }, 'iiiiii');
  const erase = m.addFunction((cfg, block) => {
    disk.fill(0xff, block * blockSize, (block + 1) * blockSize);
    return 0;
  }, 'iii');
  const sync = m.addFunction(() => 0, 'ii');

  const cfg = m._new_lfs_config(read, prog, erase, sync, blockCount, blockSize);
  const lfs = m._new_lfs();
  if (m._lfs_format(lfs, cfg) !== 0) throw new Error('littlefs format failed');
  if (m._lfs_mount(lfs, cfg) !== 0) throw new Error('littlefs mount failed');

  const salloc = (bytes) => {
    const p = m.stackAlloc(bytes.length + 1);
    m.HEAPU8.set(bytes, p);
    m.HEAPU8[p + bytes.length] = 0;
    return p;
  };
  const enc = new TextEncoder();
  for (const [name, data] of Object.entries(files)) {
    const save = m.stackSave();
    const namePtr = salloc(enc.encode(name));
    const dataPtr = m.stackAlloc(data.length);
    m.HEAPU8.set(data, dataPtr);
    m._lfs_write_file(lfs, namePtr, dataPtr, data.length);
    m.stackRestore(save);
  }
  m._lfs_unmount(lfs);

  // Correctness gate: a FRESH littlefs instance must mount the image.
  const m2 = await littlefs({ wasmBinary });
  const read2 = m2.addFunction((cfg2, block, off, buffer, size) => {
    m2.HEAPU8.set(disk.subarray(block * blockSize + off, block * blockSize + off + size), buffer);
    return 0;
  }, 'iiiiii');
  const nop2 = m2.addFunction(() => 0, 'iiiiii');
  const noe2 = m2.addFunction(() => 0, 'iii');
  const nos2 = m2.addFunction(() => 0, 'ii');
  const cfg2 = m2._new_lfs_config(read2, nop2, noe2, nos2, blockCount, blockSize);
  const lfs2 = m2._new_lfs();
  if (m2._lfs_mount(lfs2, cfg2) !== 0) throw new Error('freshly built image does not mount');
  m2._lfs_unmount(lfs2);

  return disk;
}
