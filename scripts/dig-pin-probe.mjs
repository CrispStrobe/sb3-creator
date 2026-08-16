#!/usr/bin/env node
/**
 * dig-pin-probe — empirical harness for the .dig wire-resolution work.
 *
 * FACTS already established (from hneemann/Digital's GPL source, read
 * run-local for interop; formulas re-stated here as facts, no code
 * copied):
 *   - Grid SIZE = 20; DIL pin spacing = 40 (SIZE * SPACING, SPACING=2).
 *   - DIL pin n (n <= N/2):  offset (0,          (n-1)*40) from anchor
 *         pin n (n >  N/2):  offset (width*20,   (N-n)*40)
 *     where width = (circuit's Width attribute) + 1.
 *   - Pin numbers + labels come from the LIBRARY circuit's In/Out
 *     elements (pinNumber attr) — Digital/lib/DIL Chips/74xx/...
 *     (fetch the release zip run-local; GPL, never vendored).
 *   - Wires connect at endpoints AND when a pin touches a wire's
 *     middle (axis-aligned point-on-segment).
 *
 * OPEN QUESTION this harness exists to settle: the element ANCHOR
 * (pos → pin-1 offset). Brute force over candidate offsets scored by
 * pins-on-wires across SEVERAL modules; the right anchor maxes hits on
 * all of them simultaneously (PC.dig alone was ambiguous: 13/20).
 * Candidates to try beyond pure offsets: rotation handling, and the
 * possibility that 8bitsim was drawn with an older Digital whose DIL
 * spacing differed (check by diffing hit patterns at spacing 20 vs 40).
 *
 * Usage: node scripts/dig-pin-probe.mjs <module.dig> [N width]
 */
import { readFileSync } from 'node:fs';

const src = readFileSync(process.argv[2], 'utf8');
const wires = [...src.matchAll(/<wire>\s*<p1 x="(-?\d+)" y="(-?\d+)"\/>\s*<p2 x="(-?\d+)" y="(-?\d+)"\/>\s*<\/wire>/g)]
    .map((m) => m.slice(1).map(Number));
const onWire = (x, y) => wires.some(([x1, y1, x2, y2]) =>
    (x1 === x2 && x1 === x && Math.min(y1, y2) <= y && y <= Math.max(y1, y2)) ||
    (y1 === y2 && y1 === y && Math.min(x1, x2) <= x && x <= Math.max(x1, x2)));

const elements = [...src.matchAll(/<visualElement>([\s\S]*?)<\/visualElement>/g)].map((m) => {
    const t = m[1];
    return {
        name: /<elementName>([^<]+)<\/elementName>/.exec(t)?.[1],
        x: Number(/<pos x="(-?\d+)"/.exec(t)?.[1]),
        y: Number(/y="(-?\d+)"\/>/.exec(t)?.[1]),
    };
}).filter((e) => e.name?.endsWith('.dig'));

for (const e of elements) {
    const N = Number(process.argv[3] || 16), width = Number(process.argv[4] || 6);
    const scores = [];
    for (let spacing of [40, 20]) {
        for (let ox = -60; ox <= 60; ox += 20) {
            for (let oy = -60; oy <= 60; oy += 20) {
                let hits = 0;
                for (let n = 1; n <= N; n++) {
                    const [px, py] = n <= N / 2
                        ? [e.x + ox, e.y + oy + (n - 1) * spacing]
                        : [e.x + ox + width * 20, e.y + oy + (N - n) * spacing];
                    if (onWire(px, py)) hits++;
                }
                scores.push([hits, spacing, ox, oy]);
            }
        }
    }
    scores.sort((a, b) => b[0] - a[0]);
    console.log(e.name, `@(${e.x},${e.y})`, 'top:', JSON.stringify(scores.slice(0, 4)), `of ${N}`);
}
