// uf2 — the USB Flashing Format, reimplemented from Microsoft's spec
// (github.com/microsoft/uf2, MIT). The format IS the deploy story we
// took from MakeCode: 512-byte self-describing blocks a bootloader's
// fake USB drive accepts by plain file copy — no driver, no cable
// protocol, no browser API, and it works on Safari, which WebSerial
// and WebUSB never will.
//
// The RP2040's BOOTSEL drive (RPI-RP2) speaks exactly this. Its bootrom
// accepts blocks targeting XIP flash (0x10000000+) or main SRAM
// (0x20000000+); an SRAM-targeted image boots straight from RAM after
// the copy — which is why `bw compile --uf2` needs no boot2 stage and
// no flash linkage.

export const UF2_MAGIC_START0 = 0x0a324655; // "UF2\n"
export const UF2_MAGIC_START1 = 0x9e5d5157;
export const UF2_MAGIC_END = 0x0ab16f30;
export const UF2_FLAG_FAMILY_ID = 0x00002000;
export const RP2040_FAMILY_ID = 0xe48bff56;

const PAYLOAD = 256;
const BLOCK = 512;

/**
 * Wrap a flat binary into UF2 blocks.
 * @param {Uint8Array} data
 * @param {number} targetAddr — where the first byte lands (e.g. 0x20000000)
 * @param {number} [familyID]
 * @returns {Uint8Array} the .uf2 file contents
 */
export function uf2FromBinary(data, targetAddr, familyID = RP2040_FAMILY_ID) {
  const numBlocks = Math.max(1, Math.ceil(data.length / PAYLOAD));
  const out = new Uint8Array(numBlocks * BLOCK);
  const view = new DataView(out.buffer);
  for (let i = 0; i < numBlocks; i++) {
    const off = i * BLOCK;
    view.setUint32(off + 0x00, UF2_MAGIC_START0, true);
    view.setUint32(off + 0x04, UF2_MAGIC_START1, true);
    view.setUint32(off + 0x08, UF2_FLAG_FAMILY_ID, true);
    view.setUint32(off + 0x0c, targetAddr + i * PAYLOAD, true);
    view.setUint32(off + 0x10, PAYLOAD, true);
    view.setUint32(off + 0x14, i, true);
    view.setUint32(off + 0x18, numBlocks, true);
    view.setUint32(off + 0x1c, familyID, true);
    out.set(data.subarray(i * PAYLOAD, (i + 1) * PAYLOAD), off + 0x20);
    view.setUint32(off + 0x1fc, UF2_MAGIC_END, true);
  }
  return out;
}

/**
 * Read a .uf2 back into {targetAddr, data} spans — the tests' inverse,
 * and what a baker needs to splice extra blocks into an existing
 * firmware UF2 (the MicroPython + littlefs story).
 * @param {Uint8Array} uf2
 * @returns {Array<{targetAddr: number, data: Uint8Array, familyID: number|null}>}
 */
export function uf2Blocks(uf2) {
  const blocks = [];
  const view = new DataView(uf2.buffer, uf2.byteOffset, uf2.byteLength);
  for (let off = 0; off + BLOCK <= uf2.length; off += BLOCK) {
    if (view.getUint32(off, true) !== UF2_MAGIC_START0) continue;
    if (view.getUint32(off + 4, true) !== UF2_MAGIC_START1) continue;
    if (view.getUint32(off + 0x1fc, true) !== UF2_MAGIC_END) continue;
    const flags = view.getUint32(off + 8, true);
    const size = view.getUint32(off + 0x10, true);
    blocks.push({
      targetAddr: view.getUint32(off + 0x0c, true),
      data: uf2.subarray(off + 0x20, off + 0x20 + size),
      familyID: (flags & UF2_FLAG_FAMILY_ID) ? view.getUint32(off + 0x1c, true) : null,
    });
  }
  return blocks;
}

/** Concatenate UF2 files, renumbering blockNo/numBlocks so bootloaders
 *  that check the count accept the whole. */
export function uf2Concat(...files) {
  const spans = files.flatMap((f) => uf2Blocks(f));
  const total = spans.length;
  const out = new Uint8Array(total * BLOCK);
  const view = new DataView(out.buffer);
  spans.forEach((b, i) => {
    const off = i * BLOCK;
    view.setUint32(off + 0x00, UF2_MAGIC_START0, true);
    view.setUint32(off + 0x04, UF2_MAGIC_START1, true);
    view.setUint32(off + 0x08, b.familyID != null ? UF2_FLAG_FAMILY_ID : 0, true);
    view.setUint32(off + 0x0c, b.targetAddr, true);
    view.setUint32(off + 0x10, b.data.length, true);
    view.setUint32(off + 0x14, i, true);
    view.setUint32(off + 0x18, total, true);
    if (b.familyID != null) view.setUint32(off + 0x1c, b.familyID, true);
    out.set(b.data, off + 0x20);
    view.setUint32(off + 0x1fc, UF2_MAGIC_END, true);
  });
  return out;
}
