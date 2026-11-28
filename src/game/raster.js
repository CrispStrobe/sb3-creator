// Costume rasters for the game export: what each costume actually draws, as RGBA
// pixels, so both runtimes (bwgame.js, bwgame.py) can do Scratch's pixel work the same
// way: tight bounds (fencing, edges, bounce), pixel-accurate touching and clicking, and
// `touching color` / `color is touching color`.
//
// File format "BWR1" (little-endian): 4-byte magic, u16 width, u16 height, f32 scale
// (raster pixels per costume unit), then a zlib stream of width*height*4 RGBA bytes
// (rows top to bottom, not premultiplied). zlib is available everywhere: the browser's
// DecompressionStream('deflate'), Node's zlib, Python's zlib.
//
// Rasterizing needs a real browser (SVG rendering): in the app the exporter calls
// rasterizeInPage directly; the CLI runs the same function in headless Chromium.

export const RASTER_MAGIC = 'BWR1';

export function encodeRasterHeader (width, height, scale) {
    const h = new Uint8Array(12);
    h.set([0x42, 0x57, 0x52, 0x31]);
    const dv = new DataView(h.buffer);
    dv.setUint16(4, width, true);
    dv.setUint16(6, height, true);
    dv.setFloat32(8, scale, true);
    return h;
}

export function readRasterHeader (bytes) {
    const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (String.fromCharCode(b[0], b[1], b[2], b[3]) !== RASTER_MAGIC) throw new Error('not a BWR1 raster');
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    return { width: dv.getUint16(4, true), height: dv.getUint16(6, true), scale: dv.getFloat32(8, true), body: b.subarray(12) };
}

async function streamThrough (bytes, Stream, kind) {
    const s = new Blob([bytes]).stream().pipeThrough(new Stream(kind));
    return new Uint8Array(await new Response(s).arrayBuffer());
}

// zlib helpers that work in browsers and Node 18+ (both have Compression/DecompressionStream).
export const deflate = bytes => streamThrough(bytes, globalThis.CompressionStream, 'deflate');
export const inflate = bytes => streamThrough(bytes, globalThis.DecompressionStream, 'deflate');

export async function encodeRaster ({ width, height, scale, rgba }) {
    const body = await deflate(rgba);
    const out = new Uint8Array(12 + body.length);
    out.set(encodeRasterHeader(width, height, scale));
    out.set(body, 12);
    return out;
}

export async function decodeRaster (bytes) {
    const { width, height, scale, body } = readRasterHeader(bytes);
    const rgba = await inflate(body);
    if (rgba.length !== width * height * 4) throw new Error('raster size mismatch');
    return { width, height, scale, rgba };
}

// Runs IN A PAGE (browser global scope). Self-contained on purpose: the CLI passes it
// to page.evaluate. jobs: [{ key, mime, b64, scale, width, height }] where width/height
// are the costume's size in raster pixels. Returns [{ key, width, height, b64 }]
// (b64 of raw RGBA) or { key, error }.
export async function rasterizeInPage (jobs) {
    const out = [];
    for (const job of jobs) {
        try {
            const blob = new Blob([Uint8Array.from(atob(job.b64), c => c.charCodeAt(0))], { type: job.mime });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject(new Error('image decode failed')); img.src = url; });
            const w = Math.max(1, Math.round(job.width)), h = Math.max(1, Math.round(job.height));
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(url);
            const data = ctx.getImageData(0, 0, w, h).data;
            let s = '';
            for (let i = 0; i < data.length; i += 0x8000) s += String.fromCharCode.apply(null, data.subarray(i, i + 0x8000));
            out.push({ key: job.key, width: w, height: h, b64: btoa(s) });
        } catch (e) {
            out.push({ key: job.key, error: String(e && e.message || e) });
        }
    }
    return out;
}

const MIME = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

// Raster jobs for every costume in a manifest. SVG renders at 1 pixel per costume unit
// at size 100 (as Scratch's stage does); bitmaps at their native resolution.
export function rasterJobs (manifest, files) {
    const jobs = [];
    const seen = new Set();
    for (const t of [manifest.stage, ...manifest.sprites]) {
        for (const c of t.costumes) {
            const name = c.file.replace(/^assets\//, '');
            if (seen.has(name) || !files[name] || !MIME[c.format]) continue;
            seen.add(name);
            const scale = c.format === 'svg' ? 1 : (c.resolution || 2);
            const bytes = files[name] instanceof Uint8Array ? files[name] : new TextEncoder().encode(String(files[name]));
            let b64 = '';
            for (let i = 0; i < bytes.length; i += 0x8000) b64 += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
            jobs.push({ key: name, mime: MIME[c.format], b64: btoa(b64), scale, width: c.width * scale, height: c.height * scale });
        }
    }
    return jobs;
}

// The CLI's rasterizer: the same rasterizeInPage, in headless Chromium (the shared
// browser from PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH when set). Returns null when no
// browser is available, so the export falls back to box geometry.
export async function rasterizeWithChromium (jobs) {
    let chromium;
    try { ({ chromium } = await import('playwright')); } catch { return null; }
    let browser;
    try {
        browser = await chromium.launch({ executablePath: globalThis.process?.env?.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
    } catch { return null; }
    try {
        const page = await browser.newPage();
        await page.setContent('<!doctype html><title>raster</title>');
        return await page.evaluate(`(${rasterizeInPage.toString()})(${JSON.stringify(jobs)})`);
    } finally { await browser.close(); }
}
